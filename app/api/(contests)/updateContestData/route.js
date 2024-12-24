import { db } from '@/utils';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/jwtMiddleware';
import { and, eq, sum } from 'drizzle-orm';
import { QUIZ_PROGRESS, TEMP_LEADER, USER_TASKS } from '@/utils/schema';


export async function POST(req) {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const userData = authResult.decoded_Data;
    const userId = userData.id;
    console.log("userId", userId)
    const { taskId } = await req.json();
    console.log("taskId", taskId)
    try {
        // Sum all the marks from the QUIZ_PROGRESS table for this userId and taskId
        const quizResults = await db
        .select({
            totalMarks: sum(QUIZ_PROGRESS.marks),  // Sum the marks
            challengeId: QUIZ_PROGRESS.challenge_id
        })
        .from(QUIZ_PROGRESS)
        .where(
            and(
                eq(QUIZ_PROGRESS.user_id, userId),
                eq(QUIZ_PROGRESS.task_id, taskId)
            )
        )
   console.log("quizResults", quizResults);
   
        const totalMarks = quizResults[0]?.totalMarks || 0;
        const challengeId = quizResults[0]?.challengeId;

        // Insert the total marks into the TEMP_LEADER table
        await db.insert(TEMP_LEADER).values({
            marks: totalMarks,
            userId: userId,
            challengeId: challengeId,  // Pass the challengeId from the request
            taskId: taskId
        });

        // Update the existing record with the new sequence
        await db.update(USER_TASKS)
        .set({
            completed: 'yes', // Update the type_sequence field
        })
        .where(
            and(
                eq(USER_TASKS.user_id, userId),
                eq(USER_TASKS.task_id, taskId)
            )
        );
        
        return NextResponse.json({ message: 'Test Data Completed' }, { status: 201 });

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ message: 'Error processing request' }, { status: 500 });
    }
}
