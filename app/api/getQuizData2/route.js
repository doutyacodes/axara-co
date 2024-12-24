import { db } from '@/utils';
import {
    COMMON_QUESTIONS,
    CHILDREN,
    COMMON_OPTIONS,
    QUIZ_SEQUENCES,
    CHILDREN_PROGRESS,
} from '@/utils/schema';
import { NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm'; // Removed inArray as it's not being used
import { authenticate } from '@/lib/jwtMiddleware';

export async function POST(req) {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const userData = authResult.decoded_Data;
    const userId = userData.id;
    const { id: quizId, childId } = await req.json();

    if (!quizId) {
        return NextResponse.json({ message: 'Invalid QuizId' }, { status: 400 });
    }

    let finalChildId = childId;

    if (userId && !finalChildId) {
        const [firstChild] = await db
            .select()
            .from(CHILDREN)
            .where(eq(CHILDREN.user_id, userId))
            .limit(1)
            .execute();

        if (!firstChild) {
            return NextResponse.json(
                { error: "No children found for the user." },
                { status: 404 }
            );
        }
        finalChildId = firstChild.id;
    }

    try {
        let totalAnswered = 0;

        // Check if `isStarted` is true in the QUIZ_SEQUENCES table
        const [quizSequence] = await db
            .select({
                isStarted: QUIZ_SEQUENCES.isStarted
            })
            .from(QUIZ_SEQUENCES)
            .where(
                and(
                    eq(QUIZ_SEQUENCES.user_id, userId),
                    eq(QUIZ_SEQUENCES.quiz_id, quizId),
                    eq(QUIZ_SEQUENCES.child_id, finalChildId)
                )
            )
            .execute();

        if (quizSequence?.isStarted) {
            // Get total number of unique questions answered in CHILDREN_PROGRESS
            const [totalQuestionsAnswered] = await db
                .select({
                    countUniqueQuestions: sql`COUNT(DISTINCT ${CHILDREN_PROGRESS.question_id})`
                })
                .from(CHILDREN_PROGRESS)
                .where(eq(CHILDREN_PROGRESS.child_id, finalChildId))
                .execute();

            totalAnswered = totalQuestionsAnswered?.countUniqueQuestions || 0;
        }

        const quizWithOptions = await db
            .select({
                questionId: COMMON_QUESTIONS.id,
                questionText: COMMON_QUESTIONS.question,
                answerId: COMMON_OPTIONS.id,
                answerText: COMMON_OPTIONS.option,
                option_letter: COMMON_OPTIONS.option_letter
            })
            .from(COMMON_QUESTIONS)
            .leftJoin(COMMON_OPTIONS, eq(COMMON_QUESTIONS.id, COMMON_OPTIONS.question_id))
            .where(eq(COMMON_QUESTIONS.quiz_id, quizId))
            .execute();

        if (quizWithOptions.length === 0) {
            return NextResponse.json({ message: 'No questions found for the given Quiz ID' }, { status: 404 });
        }

        // Group answers by question
        const groupedQuestions = quizWithOptions.reduce((acc, { questionId, questionText, answerId, answerText, option_letter }) => {
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
                option_letter: option_letter
            });
            return acc;
        }, {});

        return NextResponse.json({ questions: Object.values(groupedQuestions), quizProgress: totalAnswered });

    } catch (error) {
        console.error("Error fetching questions and answers:", error);
        return NextResponse.json({ message: 'Error fetching questions and answers' }, { status: 500 });
    }
}
