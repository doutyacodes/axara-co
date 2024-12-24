import { db } from '@/utils';
import { QUIZ_SEQUENCES } from "@/utils/schema";
import { and, eq } from 'drizzle-orm';

export const createSequence = async (resultDataArray, userId, quizId,finalChildId,age,weeks) => {

    

  
    try {

        // Update the existing record with the new personalityType
        await db.update(QUIZ_SEQUENCES)
        .set({
            type_sequence: "",
            isCompleted: true, // Update the type_sequence field
        })
        .where(
            and(
                eq(QUIZ_SEQUENCES.user_id, userId),
                eq(QUIZ_SEQUENCES.quiz_id, quizId),
                eq(QUIZ_SEQUENCES.child_id, finalChildId),
                eq(QUIZ_SEQUENCES.age, age),
                eq(QUIZ_SEQUENCES.weeks, weeks),
            )
        );
    } catch (error) {
        console.error("Error inserting personality sequence:", error);
        throw error;  // Rethrow the error to be caught by the calling function
    }
};
