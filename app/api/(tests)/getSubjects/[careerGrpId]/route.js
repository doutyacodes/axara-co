import { db } from '@/utils';
import { USER_DETAILS, SUBJECTS, CAREER_SUBJECTS, TESTS, USER_TESTS, USER_CAREER, CAREER_GROUP  } from '@/utils/schema';
import { NextResponse } from 'next/server';
import { and, eq, gte, inArray, isNull, lte } from 'drizzle-orm'; // Adjust based on your ORM version
import { authenticate } from '@/lib/jwtMiddleware';
import { calculateAge } from '@/lib/ageCalculate';
import { processCareerSubjects } from '@/app/api/utils/fetchAndSaveSubjects';

export async function GET(req, { params }) {
     // Authenticate user
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
      }

    const userData = authResult.decoded_Data;
    const userId = userData.id;

    const { careerGrpId } = params;

    try {

        // Check if any subjects exist for the career group
        const careerSubjectsExist = await db
            .select({ subjectId: CAREER_SUBJECTS.subject_id })
            .from(CAREER_SUBJECTS)
            .where(eq(CAREER_SUBJECTS.career_id, careerGrpId));
        
        // If no subjects are found for the career group, generate them
        if (!careerSubjectsExist.length) {
            console.log('No subjects found, generating subjects...');

            // Fetch the user's career information including career name
            const userCareerData = await db
            .select({
                careerGroupId: USER_CAREER.career_group_id,
                country: USER_CAREER.country,
                careerName: CAREER_GROUP.career_name // Add career name from CAREER_GROUP
            })
            .from(USER_CAREER)
            .innerJoin(CAREER_GROUP, eq(USER_CAREER.career_group_id, CAREER_GROUP.id)) // Join with CAREER_GROUP
            .where(
                and(
                    eq(USER_CAREER.user_id, userId),
                    eq(USER_CAREER.career_group_id, careerGrpId)
                )
            );

            if (!userCareerData.length) {
                return NextResponse.json({ message: 'No career information found for this user.' }, { status: 404 });
            }

            const { country, careerName } = userCareerData[0];

            await processCareerSubjects(careerName, careerGrpId, country); /* Generating Subjects */
        }

        const birth_date=await db
            .select({birth_date:USER_DETAILS.birth_date})
            .from(USER_DETAILS)
            .where(eq(USER_DETAILS.id, userId))
        const age = calculateAge(birth_date[0].birth_date)
        console.log(age)

        // Step 3: Fetch subjects for the career and filter by user age
        const subjectsForCareer = await db
            .select({
                subjectId: SUBJECTS.subject_id,
                subjectName: SUBJECTS.subject_name,
                testId: TESTS.test_id,
                testAdded: TESTS.test_id, // Check if test exists
                completed: USER_TESTS.completed,
            })
            .from(CAREER_SUBJECTS)
            .innerJoin(SUBJECTS, eq(CAREER_SUBJECTS.subject_id, SUBJECTS.subject_id))
            .leftJoin(TESTS, and(eq(TESTS.subject_id, SUBJECTS.subject_id), lte(TESTS.age_group, age)))
            .leftJoin(USER_TESTS, and(eq(USER_TESTS.user_id, userId), eq(USER_TESTS.test_id, TESTS.test_id)))
            .where(
                and(
                    eq(CAREER_SUBJECTS.career_id, careerGrpId),
                    lte(SUBJECTS.min_age, age),
                    gte(SUBJECTS.max_age, age)
                )
            );

        if (!subjectsForCareer.length) {
            return NextResponse.json({ message: 'No subjects found for this career and user age.' }, { status: 400 });
        }

        // Process subjects to include test completion status and test added status
        const subjectsWithTestStatus = subjectsForCareer.map(subject => ({
            subjectId: subject.subjectId,
            subjectName: subject.subjectName,
            testAdded: subject.testAdded ? 'yes' : 'no',  // If test is added or not
            testId: subject.testAdded ? subject.testAdded : null, // sending the test id if the test is added
            completed: subject.completed === 'yes' ? 'yes' : 'no',  // If user has completed the test
        }));

        return NextResponse.json({ subjects: subjectsWithTestStatus }, { status: 200 });

        // Return the tasks with their completion status
        // return NextResponse.json({ subjects: subjectsForCareer }, { status: 200 });

    } catch (error) {
        console.error("Error fetching subjects:", error);
        return NextResponse.json({ message: 'Error fetching subjects' }, { status: 500 });
    }
}
