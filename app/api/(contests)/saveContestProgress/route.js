import { db } from '@/utils';
import { QUIZ_PROGRESS, QUIZ_SEQUENCES, STRENGTH_QUIZ_PROGRESS, USER_CAREER_PROGRESS, USER_TASKS } from '@/utils/schema';
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
    const { quizId, results } = await req.json(); // Directly destructuring to get quizId and results array
    const { questionId, answerId, marks, taskId, challengeId } = results

    try {
        try {
            // Check if the record already exists
            const existingUserTask = await db
                .select()
                .from(USER_TASKS)
                .where(
                    and(
                        eq(USER_TASKS.user_id, userId),
                        eq(USER_TASKS.task_id, taskId)
                    )
                );                
        
            if (existingUserTask.length === 0) {
                // Record doesn't exist, so insert it
                await db.insert(USER_TASKS).values({
                    user_id: userId,
                    task_id: taskId,
                    approved: 'yes',
                    rejected: 'no',
                    completed: 'no',
                    // arena: 'no',
                    challenge_id: challengeId,
                    started: 'yes',
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
                                .from(QUIZ_PROGRESS)
                                .where(
                                    and(
                                    eq(QUIZ_PROGRESS.user_id, userId),
                                    eq(QUIZ_PROGRESS.question_id, questionId),
                                    eq(QUIZ_PROGRESS.task_id, taskId),
                                    )
                                )
                                .execute();

        if (existingRecords.length > 0) {
            return NextResponse.json({ message: 'Records already created for this question.' }, { status: 400 });
        }
        
        try {
            const insertData = {
                user_id: userId,
                question_id: questionId,
                answer_id: answerId,
                marks: marks,
                challenge_id: challengeId,
                task_id: taskId
            };

            await db.insert(QUIZ_PROGRESS).values(insertData);
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