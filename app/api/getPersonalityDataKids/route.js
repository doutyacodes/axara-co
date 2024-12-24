import { db } from "@/utils";
import {
  CHILDREN,
  PERSONALITY_CHOICES,
  PERSONALITY_QUESTIONS_KIDS,
  QUIZ_SEQUENCES,
  USER_CAREER_PROGRESS,
} from "@/utils/schema";
import { NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm"; // Ensure these imports match your ORM version
import { authenticate } from "@/lib/jwtMiddleware";

export async function POST(req) {
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userData = authResult.decoded_Data;
  const userId = userData.id;
  const { childId } = await req.json();

  let finalChildId = childId;
  if (userId) {
    if (!childId) {
      const firstChild = await db
        .select()
        .from(CHILDREN)
        .where(eq(CHILDREN.user_id, userId))
        .limit(1)
        .execute();

      if (firstChild.length > 0) {
        finalChildId = firstChild[0].id; // Assuming 'id' is the identifier for CHILDREN
      } else {
        return NextResponse.json(
          { error: "No children found for the user." },
          { status: 404 }
        );
      }
    }
  }

  const quizId = 2;
  if (!quizId) {
    return NextResponse.json({ message: "Invalid QuizId" }, { status: 400 });
  }

  try {
    let totalAnswered = 0;

    // Step 1: Check if isStarted is true in the QUIZ_SEQUENCES table
    const quizSequence = await db
      .select({
        isStarted: QUIZ_SEQUENCES.isStarted,
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

    // Proceed only if a sequence exists and isStarted is true
    if (quizSequence.length > 0 && quizSequence[0].isStarted) {
      // Geting the total no of saved quiz from USER_CAREER_PROGRESS if isStarted is true
      const totalQuestionsAnswered = await db
        .select({
          countQuestionIds: sql`COUNT(${USER_CAREER_PROGRESS.question_id})`,
        })
        .from(USER_CAREER_PROGRESS)
        .where(and(
            eq(USER_CAREER_PROGRESS.user_id, userId),
            eq(USER_CAREER_PROGRESS.child_id, finalChildId)
        ))
        .execute();

      // The total number of questions answered
      totalAnswered = totalQuestionsAnswered[0]?.countQuestionIds || 0;
    }

    // Fetch questions for the given quizId
    const questions = await db
      .select({
        questionId: PERSONALITY_QUESTIONS_KIDS.id,
        questionText: PERSONALITY_QUESTIONS_KIDS.question_text,
        personaTypeId: PERSONALITY_QUESTIONS_KIDS.personality_types_id,
      })
      .from(PERSONALITY_QUESTIONS_KIDS)
      .where(eq(PERSONALITY_QUESTIONS_KIDS.quiz_id, quizId))
      .execute();

    if (questions.length === 0) {
      return NextResponse.json(
        { message: "No questions found for the given Quiz id" },
        { status: 404 }
      );
    }

    // Fetch choices only once
    const choices = await db
      .select({
        choiceId: PERSONALITY_CHOICES.id,
        choiceText: PERSONALITY_CHOICES.choice_text,
      })
      .from(PERSONALITY_CHOICES)
      .execute();

    return NextResponse.json({
      quizProgress: totalAnswered,
      questions: questions,
      choices: choices, // Send choices separately
    });
  } catch (error) {
    console.error("Error fetching questions and answers:", error);
    return NextResponse.json(
      { message: "Error fetching questions and answers" },
      { status: 500 }
    );
  }
}
