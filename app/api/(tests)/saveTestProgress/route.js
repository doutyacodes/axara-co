import { db } from '@/utils';
import { QUIZ_PROGRESS, QUIZ_SEQUENCES, STRENGTH_QUIZ_PROGRESS, TEST_PROGRESS, USER_CAREER_PROGRESS, USER_TASKS, USER_TESTS } from '@/utils/schema';
import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm'; // Ensure these imports match your ORM version
import { authenticate } from '@/lib/jwtMiddleware';


export async function POST(req) {

    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
      }

    const userData = authResult.decoded_Data;
    const userId = userData.id;
    const { results } = await req.json(); // Directly destructuring to get quizId and results array
    const { questionId, answerId, marks, testId } = results
    try {
        try {
            // Check if the record already exists
            const existingUserTask = await db
                .select()
                .from(USER_TESTS)
                .where(
                    and(
                        eq(USER_TESTS.user_id, userId),
                        eq(USER_TESTS.test_id, testId)
                    )
                );                
        
            if (existingUserTask.length === 0) {
                // Record doesn't exist, so insert it
                await db.insert(USER_TESTS).values({
                    user_id: userId,
                    test_id: testId,
                    completed: 'no',
                });
                console.log("Inserted successfully");
            } else {
                console.log("Already exists, skipping insert");
            }
        } catch (error) {
            console.error("Error processing quiz sequence:", error);
            throw error;  // Rethrow the error to be caught by the outer catch block
        }
        
        // questionId, optionId, personaTypeId
        const existingRecords = await db
                                .select()
                                .from(TEST_PROGRESS)
                                .where(
                                    and(
                                    eq(TEST_PROGRESS.user_id, userId),
                                    eq(TEST_PROGRESS.test_questionId, questionId),
                                    eq(TEST_PROGRESS.test_id, testId),
                                    )
                                )
                                .execute();

        if (existingRecords.length > 0) {
            return NextResponse.json({ message: 'Records already created for this question.' }, { status: 400 });
        }
        
        try {
            const insertData = {
                user_id: userId,
                test_questionId: questionId,
                test_answerId: answerId,
                marks: marks,
                test_id: testId
            };

            await db.insert(TEST_PROGRESS).values(insertData);
        } catch (error) {
            console.error("Error adding progress:", error);
            throw error;
        }
        
        return NextResponse.json({ message: 'Progress added successfully' }, { status: 201 });

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ message: 'Error processing request' }, { status: 500 });
    }
    
}