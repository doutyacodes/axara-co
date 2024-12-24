import { db } from '@/utils';
import { SUBJECTS, USER_DETAILS, USER_SUBJECT_COMPLETION  } from '@/utils/schema';
import { NextResponse } from 'next/server';
import { and, eq, gte, inArray, isNull, lte } from 'drizzle-orm'; // Adjust based on your ORM version
import { authenticate } from '@/lib/jwtMiddleware';
import { calculateAge } from '@/lib/ageCalculate';

export async function GET(req, { params }) {
     // Authenticate user
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
      }

    const userData = authResult.decoded_Data;
    const userId = userData.id;

    const { subjectId } = params;

    try {
        const birth_date=await db
        .select({birth_date:USER_DETAILS.birth_date})
        .from(USER_DETAILS)
        .where(eq(USER_DETAILS.id, userId))
        const age = calculateAge(birth_date[0].birth_date)
        console.log(age)

         // Fetch skilled_age from USER_SUBJECT_COMPLETION based on user_id and subject_id
         // Fetch skilled_age and subject_name from USER_SUBJECT_COMPLETION based on user_id and subject_id
            const completionData = await db
            .select({
            skilled_age: USER_SUBJECT_COMPLETION.skilled_age,
            subject_name: SUBJECTS.subject_name
            })
            .from(USER_SUBJECT_COMPLETION)
            .innerJoin(SUBJECTS, eq(USER_SUBJECT_COMPLETION.subject_id, SUBJECTS.subject_id))
            .where(
            and(
                eq(USER_SUBJECT_COMPLETION.user_id, userId),
                eq(USER_SUBJECT_COMPLETION.subject_id, subjectId)
            )
            );

        const skilledAge = completionData.length > 0 ? completionData[0].skilled_age : null;
        const subjectName = completionData.length > 0 ? completionData[0].subject_name : null;

        let feedback;
        if (skilledAge < age) {
        feedback = `Your performance suggests there's room to grow in ${subjectName}. For your age ${age}, revisiting the basics will help strengthen your foundation. Keep practicing and you'll improve!`;
        } else if (skilledAge === age) {
        feedback = `Well done! You've shown a good understanding of ${subjectName} for your age ${age}. Keep up the great work and continue exploring new concepts to build on your knowledge.`;
        } else if (skilledAge > age) {
        feedback = `Outstanding performance! You've demonstrated advanced knowledge in ${subjectName} for your age ${age}. Keep challenging yourself with more advanced topics and continue excelling!`;
        } else {
        feedback = `No skilled age data available for ${subjectName}.`;
        }
        return NextResponse.json({ feedback }, { status: 200 });

    } catch (error) {
        console.error("Error fetching subjects:", error);
        return NextResponse.json({ message: 'Error fetching subjects' }, { status: 500 });
    }
}
