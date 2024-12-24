import { db } from '@/utils';
import { QUIZ_SEQUENCES } from "@/utils/schema";
import { and, eq } from 'drizzle-orm';

export const createSequence = async (resultDataArray, userId, quizId, finalChildId) => {

    const styleCounts = {
        Visual: 0,
        Auditory: 0,
        Kinesthetic: 0,
        ReadingWriting: 0,
        Logical: 0,
        Social: 0
    };

    // Map each style option letter to a learning style
    const styleMap = {
        'A': 'Visual',
        'B': 'Auditory',
        'C': 'Kinesthetic',
        'D': 'ReadingWriting',
        'E': 'Logical',
        'F': 'Social'
    };

    // Count each style based on selected options
    resultDataArray.forEach(({ option_letter }) => {
        const style = styleMap[option_letter];
        if (style) {
            styleCounts[style]++;
        }
    });

    // Find primary style and secondary style based on the criteria
    let sortedStyles = Object.entries(styleCounts).sort((a, b) => b[1] - a[1]);
    let primaryStyle = sortedStyles[0][1] >= 8 ? sortedStyles[0][0] : null;
    let secondaryStyle = null;

    if (primaryStyle && sortedStyles.length > 1) {
        const primaryCount = sortedStyles[0][1];
        const secondaryCount = sortedStyles[1][1];

        // If difference is less than 2, assign secondary style
        if (primaryCount - secondaryCount < 2) {
            secondaryStyle = sortedStyles[1][0];
        }
    } else if (!primaryStyle) {
        // List all styles with counts close to the top style count
        const closeStyles = sortedStyles
            .filter(([_, count]) => count >= sortedStyles[0][1] - 2)
            .map(([style]) => style);
        primaryStyle = closeStyles.join(" & ");
    }

    const finalProfile = primaryStyle
        ? `${primaryStyle}${secondaryStyle ? ` & ${secondaryStyle}` : ''}`
        : 'No clear dominant style';
    console.log("finalProfile", finalProfile);

    try {
        // Save the final learning style profile in QUIZ_SEQUENCES
        await db.update(QUIZ_SEQUENCES)
            .set({
                type_sequence: finalProfile,
                isCompleted: true
            })
            .where(
                and(
                    eq(QUIZ_SEQUENCES.user_id, userId),
                    eq(QUIZ_SEQUENCES.quiz_id, quizId),
                    eq(QUIZ_SEQUENCES.child_id, finalChildId)
                )
            );
    } catch (error) {
        console.error("Error saving learning style profile:", error);
        throw error;
    }
};
