import { db } from '@/utils';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/jwtMiddleware';
import { eq, and, sum, count, lte } from 'drizzle-orm';
import { STAR_PERCENT, TEST_PROGRESS, TEST_QUESTIONS, USER_TESTS } from '@/utils/schema'; // Import relevant tables


export async function POST(req) {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const userData = authResult.decoded_Data;
    const userId = userData.id;
    const { testId } = await req.json();

    try {
         // 1. Get the sum of marks from TEST_PROGRESS table for the given user and test
        const quizResults = await db
            .select({
                totalMarks: sum(TEST_PROGRESS.marks)
            })
            .from(TEST_PROGRESS)
            .where(
                and(
                    eq(TEST_PROGRESS.user_id, userId),
                    eq(TEST_PROGRESS.test_id, testId)
                )
            );

        const totalMarks = quizResults[0]?.totalMarks || 0;

        // 2. Get the number of questions for the given testId from TEST_QUESTIONS
        const questionCountResults = await db
                                    .select({
                                        questionCount: count(TEST_QUESTIONS.id)  // Count the number of questions
                                    })
                                    .from(TEST_QUESTIONS)
                                    .where(eq(TEST_QUESTIONS.test_id, testId));
                                    
        const questionCount = questionCountResults[0]?.questionCount || 0;

        // 3. Multiply the number of questions by 1000 to get the total possible marks
        const totalPossibleMarks = questionCount * 1000;

        // 4. Calculate the percentage
        const percentage = totalPossibleMarks > 0 ? (totalMarks / totalPossibleMarks) * 100 : 0;

        const result = await db
                    .select({
                        stars: STAR_PERCENT.stars
                    })
                    .from(STAR_PERCENT)
                    .where(
                        and(
                            lte(STAR_PERCENT.min_percentage, percentage)
                        )
                    )
                    .orderBy(STAR_PERCENT.min_percentage, 'desc') // Sort descending to get the highest applicable stars
                    .limit(1); // Only get the top result

        let stars;
        if (result.length > 0) {
            stars = result[0].stars;
            console.log(`Stars for percentage ${percentage}: ${stars}`);
            
        } else {
            console.log('No matching stars found.');
            stars = 0
        }


        // Update the existing record with the new sequence
        await db.update(USER_TESTS)
        .set({
            score: Math.round(percentage),
            stars_awarded: stars,
            completed: 'yes', // Update the type_sequence field
        })
        .where(
            and(
                eq(USER_TESTS.user_id, userId),
                eq(USER_TESTS.test_id, testId)
            )
        );
        
        return NextResponse.json({ message: 'Test Data Completed' }, { status: 201 });

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ message: 'Error processing request' }, { status: 500 });
    }
}
