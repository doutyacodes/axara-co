import { db } from '@/utils';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/jwtMiddleware';
import { eq, and, sum, count, lte } from 'drizzle-orm';
import {  SUBJECT_USER_PROGRESS, TEST_PROGRESS, USER_DETAILS, USER_SUBJECT_COMPLETION,  } from '@/utils/schema'; // Import relevant tables
import { calculateAge } from '@/lib/ageCalculate';


export async function POST(req) {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const userData = authResult.decoded_Data;
    const userId = userData.id;
    const { subjectId } = await req.json();

    try {

        // Step 1: Fetch user progress for the given subject
        const userProgress = await db
            .select({ is_answer: SUBJECT_USER_PROGRESS.is_answer })
            .from(SUBJECT_USER_PROGRESS)
            .where(
                and(
                    eq(SUBJECT_USER_PROGRESS.user_id, userId), 
                    eq(SUBJECT_USER_PROGRESS.subject_id, subjectId)
                ))
                

        // Step 2: Calculate the user's birth date and current age
        const birthDateResult = await db
            .select({ birth_date: USER_DETAILS.birth_date })
            .from(USER_DETAILS)
            .where(eq(USER_DETAILS.id, userId));

        const birth_date = birthDateResult[0]?.birth_date;
        const age = calculateAge(birth_date);
        console.log("Age:", age);

        // Step 3: Count how many answers are 'yes'
        const yesCount = userProgress.filter(progress => progress.is_answer === 'yes').length;

        // Step 4: Determine skilled_age based on yesCount
        let skilled_age;
        if (yesCount >= 0 && yesCount <= 3) {
            skilled_age = age - 1;
        } else if (yesCount >= 4 && yesCount <= 6) {
            skilled_age = age;
        } else if (yesCount >= 7 && yesCount <= 9) {
            skilled_age = age + 1;
        }

        // Step 5: Update the USER_SUBJECT_COMPLETION table
        await db
            .update(USER_SUBJECT_COMPLETION)
            .set({ skilled_age, completed: 'yes' })
            .where(
                and(
                    eq(USER_SUBJECT_COMPLETION.user_id, userId), 
                    eq(USER_SUBJECT_COMPLETION.subject_id, subjectId)
                )
            );

        return NextResponse.json({ message: 'Test Data Updated', skilled_age }, { status: 200 });

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ message: 'Error processing request' }, { status: 500 });
    }
}
