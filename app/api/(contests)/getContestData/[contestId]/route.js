import { db } from '@/utils';
import { ANSWERS, QUESTIONS, TASKS, USER_DETAILS, USER_TASKS } from '@/utils/schema';
import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm'; // Ensure these imports match your ORM version
import { authenticate } from '@/lib/jwtMiddleware';


export async function GET(request, { params }) {

    // Authenticate user
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const userData = authResult.decoded_Data;
    const userId = userData.id;

    const { contestId } = params;
    
    if (!contestId) {
        return NextResponse.json({ message: 'Invalid task_id' }, { status: 400 });
    }

    try {
        // Step 1: Fetch questions and their corresponding answers using JOIN
        const questionWithAnswers = await db
            .select({
                questionId: QUESTIONS.id,
                questionText: QUESTIONS.question,
                challengeId: QUESTIONS.challenge_id,
                timer: QUESTIONS.timer,
                answerId: ANSWERS.id,
                answerText: ANSWERS.answer_text,
                isCorrect: ANSWERS.answer,
            })
            .from(QUESTIONS)
            .leftJoin(ANSWERS, eq(QUESTIONS.id, ANSWERS.question_id))
            .where(eq(QUESTIONS.task_id, contestId))
            .execute();

        if (questionWithAnswers.length === 0) {
            return NextResponse.json({ message: 'No questions found for the given Task id' }, { status: 404 });
        }

        // Step 2: Extract the timer from the first question (assuming all questions share the same timer)
        const { timer, challengeId} = questionWithAnswers[0]; 

        // Grouping the answers by question
        const result = questionWithAnswers.reduce((acc, curr) => {
            const { questionId, questionText, answerId, answerText, isCorrect } = curr;
            if (!acc[questionId]) {
                acc[questionId] = {
                    id: questionId,
                    question: questionText,
                    answers: []
                };
            }
            acc[questionId].answers.push({
                id: answerId,
                text: answerText,
                isCorrect: isCorrect,
            });
            return acc;
        }, {});

        // Step 4: Return the grouped questions with answers and the separate timer
        return NextResponse.json({
            challengeId: challengeId,
            timer: timer, 
            questions: Object.values(result)  // Send the grouped questions and answers
        });

    } catch (error) {
        console.error("Error fetching questions and answers:", error);
        return NextResponse.json({ message: 'Error fetching questions and answers' }, { status: 500 });
    }
}