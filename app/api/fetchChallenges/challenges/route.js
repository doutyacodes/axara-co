import { NextResponse } from "next/server";
import { db } from "@/utils";
import {
  CHALLENGES,
  CHALLENGE_PROGRESS,
  CHALLENGE_QUESTIONS,
  CHALLENGE_OPTIONS,
  CHALLENGE_USER_QUIZ,
  USER_POINTS,
} from "@/utils/schema";
import { and, eq, not, inArray } from "drizzle-orm";
import { authenticate } from "@/lib/jwtMiddleware";

export async function POST(req) {
  try {
    // Authenticate the user
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const userId = authResult.decoded_Data.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    // Parse request body
    const { slug, childId, show = null } = await req.json();

    if (!slug || !childId) {
      return NextResponse.json(
        { error: "Challenge slug and child ID are required." },
        { status: 400 }
      );
    }

    // Fetch challenge details
    const challenge = await db
      .select()
      .from(CHALLENGES)
      .where(eq(CHALLENGES.slug, slug))
      .execute();

    if (challenge.length === 0) {
      return NextResponse.json(
        { error: "Challenge not found." },
        { status: 404 }
      );
    }

    const challengeData = challenge[0];

    let permission = false;

    if (show && challengeData.entry_type == "points") {
      const user_points = await db
        .select()
        .from(USER_POINTS)
        .where(eq(USER_POINTS.child_id, childId))
        .execute();
      if (user_points.length > 0) {
        const required_points = challengeData.entry_fee;
        const user_points = user_points[0].points;
        if (user_points >= required_points) {
          permission = true;
        }
      }
    }

    // Fetch user's progress
    const challengeProgress = await db
      .select()
      .from(CHALLENGE_PROGRESS)
      .where(
        and(
          eq(CHALLENGE_PROGRESS.user_id, userId),
          eq(CHALLENGE_PROGRESS.child_id, childId),
          eq(CHALLENGE_PROGRESS.challenge_id, challengeData.id)
        )
      )
      .execute();

    const isCompleted =
      challengeProgress.length > 0 ? challengeProgress[0].is_completed : false;

    if (challengeData.challenge_type === "quiz") {
      // Fetch answered questions
      const answeredQuestions = await db
        .select({
          question_id: CHALLENGE_USER_QUIZ.question_id,
          option_id: CHALLENGE_USER_QUIZ.option_id,
        })
        .from(CHALLENGE_USER_QUIZ)
        .where(
          and(
            eq(CHALLENGE_USER_QUIZ.challenge_id, challengeData.id),
            eq(CHALLENGE_USER_QUIZ.user_id, userId),
            eq(CHALLENGE_USER_QUIZ.child_id, childId)
          )
        )
        .execute();

      const answeredQuestionIds = answeredQuestions.map((q) => q.question_id);

      // Fetch remaining questions
      const remainingQuestionsQuery = db
        .select({
          id: CHALLENGE_QUESTIONS.id,
          question: CHALLENGE_QUESTIONS.question,
          timer:CHALLENGE_QUESTIONS.timer
        })
        .from(CHALLENGE_QUESTIONS)
        .where(eq(CHALLENGE_QUESTIONS.challenge_id, challengeData.id));

      if (answeredQuestionIds.length > 0) {
        remainingQuestionsQuery.where(
          not(inArray(CHALLENGE_QUESTIONS.id, answeredQuestionIds))
        );
      }

      const questions = await remainingQuestionsQuery.execute();

      // Fetch options for all remaining questions
      const questionIds = questions.map((q) => q.id);
      const options = questionIds.length
        ? await db
            .select({
              id: CHALLENGE_OPTIONS.id,
              question_id: CHALLENGE_OPTIONS.question_id,
              option: CHALLENGE_OPTIONS.option,
            })
            .from(CHALLENGE_OPTIONS)
            .where(inArray(CHALLENGE_OPTIONS.question_id, questionIds))
            .execute()
        : [];

      // Combine questions and options
      const remainingQuestions = questions.map((q) => ({
        ...q,
        options: options.filter((opt) => opt.question_id === q.id),
      }));

      // Return response for quiz challenges
      return NextResponse.json({
        challenge: {
          ...challengeData,
          isCompleted,
          permission
        },
        answeredQuestions: answeredQuestions || [],
        remainingQuestions: remainingQuestions || [],
      });
    }

    // Return response for non-quiz challenges
    return NextResponse.json({
      challenge: {
        ...challengeData,
        isCompleted,
        permission
      },
    });
  } catch (error) {
    console.error("Error in processing the request:", error);
    return NextResponse.json(
      { error: "Failed to process the request. Please try again later." },
      { status: 500 }
    );
  }
}
