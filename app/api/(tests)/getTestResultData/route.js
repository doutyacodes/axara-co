import { db } from '@/utils';
import { SUBJECTS, TESTS, USER_TESTS } from '@/utils/schema';
import { NextResponse } from 'next/server';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { authenticate } from '@/lib/jwtMiddleware';
import { decryptText } from '@/utils/encryption';

export async function GET(request) {
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const userData = authResult.decoded_Data;
    const userId = userData.id;

    try {

       
        // Fetch completed tests with subject names
        const completedTests = await db
        .select({
            testId: USER_TESTS.test_id,
            subjectName: SUBJECTS.subject_name,
            testDate: TESTS.test_date,
            ageGroup: TESTS.age_group,
            score: USER_TESTS.score,
            starsAwarded: USER_TESTS.stars_awarded
        })
        .from(USER_TESTS)
        .innerJoin(TESTS, eq(USER_TESTS.test_id, TESTS.test_id))
        .innerJoin(SUBJECTS, eq(TESTS.subject_id, SUBJECTS.subject_id))
        .where(
            and(
                eq(USER_TESTS.user_id, userId),
                eq(USER_TESTS.completed, 'yes')
            )
        );

        if (completedTests.length === 0) {
        return NextResponse.json({ message: 'No completed tests found for the user' }, { status: 404 });
        }

        return NextResponse.json({results:completedTests}, { status: 200 });
        
    } catch (error) {
        console.error("Error fetching user results:", error);
        return NextResponse.json({ message: 'Error fetching user results' }, { status: 500 });
    }
}
