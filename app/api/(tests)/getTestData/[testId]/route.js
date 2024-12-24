import { db } from '@/utils';
import { TEST_ANSWERS, TEST_QUESTIONS } from '@/utils/schema';
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

    const { testId } = params;
    
    if (!testId) {
        return NextResponse.json({ message: 'Invalid task_id' }, { status: 400 });
    }

    try {
        // Step 1: Fetch questions and their corresponding answers using JOIN
        const questionWithAnswers = await db
            .select({
                questionId: TEST_QUESTIONS.id,
                questionText: TEST_QUESTIONS.question,
                timer: TEST_QUESTIONS.timer,
                answerId: TEST_ANSWERS.id,
                answerText: TEST_ANSWERS.answer_text,
                isCorrect: TEST_ANSWERS.answer,
            })
            .from(TEST_QUESTIONS)
            .leftJoin(TEST_ANSWERS, eq(TEST_QUESTIONS.id, TEST_ANSWERS.test_questionId)) 
            .where(eq(TEST_QUESTIONS.test_id, testId))
            .execute();


        if (questionWithAnswers.length === 0) {
            return NextResponse.json({ message: 'No questions found for the given Test id' }, { status: 404 });
        }

        // Step 2: Extract the timer from the first question (assuming all questions share the same timer)
        const { timer } = questionWithAnswers[0]; 

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
            timer: timer, 
            questions: Object.values(result)  // Send the grouped questions and answers
        });

    } catch (error) {
        console.error("Error fetching questions and answers:", error);
        return NextResponse.json({ message: 'Error fetching questions and answers' }, { status: 500 });
    }
}