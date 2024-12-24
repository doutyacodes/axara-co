import { db } from '@/utils';
import { SUBJECT_USER_PROGRESS, USER_SUBJECT_COMPLETION } from '@/utils/schema';
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
    const { questionId, optionId, isAnswer, subjectId } = results
    try {
        try {
            // Check if the record already exists
            const existingUserTask = await db
                .select()
                .from(USER_SUBJECT_COMPLETION)
                .where(
                    and(
                        eq(USER_SUBJECT_COMPLETION.user_id, userId),
                        eq(USER_SUBJECT_COMPLETION.subject_id, subjectId)
                    )
                );                
        
            if (existingUserTask.length === 0) {
                // Record doesn't exist, so insert it
                await db.insert(USER_SUBJECT_COMPLETION).values({
                    user_id: userId,
                    subject_id: subjectId,
                    isStarted: true,
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
                                .from(SUBJECT_USER_PROGRESS)
                                .where(
                                    and(
                                    eq(SUBJECT_USER_PROGRESS.user_id, userId),
                                    eq(SUBJECT_USER_PROGRESS.quiz_id, questionId),
                                    )
                                )
                                .execute();

        if (existingRecords.length > 0) {
            return NextResponse.json({ message: 'Records already created for this question.' }, { status: 400 });
        }
        
        try {
            const insertData = {
                user_id: userId,
                quiz_id: questionId,
                subject_id: subjectId,
                option_id: optionId,
                is_answer: isAnswer
            };

            await db.insert(SUBJECT_USER_PROGRESS).values(insertData);
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