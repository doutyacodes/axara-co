import { NextResponse } from "next/server";
import { db } from "@/utils";
import {
  CHALLENGE_USER_QUIZ,
  CHALLENGE_PROGRESS,
  CHALLENGE_OPTIONS,
  QUIZ_SCORE,
  USER_POINTS,
  USER_CHALLENGE_POINTS,
  CHALLENGES,
} from "@/utils/schema";
import { eq, and } from "drizzle-orm";
import { authenticate } from "@/lib/jwtMiddleware";

export async function POST(req) {
  try {
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

    const {
      challengeId,
      questionId,
      optionId,
      childId,
      isCompleted,
      isFirstQuestion,
      score
    } = await req.json();

    if (
      !challengeId ||
      !questionId ||
      !optionId ||
      !childId ||
      typeof isCompleted !== "boolean" ||
      typeof isFirstQuestion !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid data. All fields are required." },
        { status: 400 }
      );
    }

    // Insert or update the user's quiz answer
    await db.insert(CHALLENGE_USER_QUIZ).values({
      challenge_id: challengeId,
      question_id: questionId,
      option_id: optionId,
      child_id: childId,
      user_id: userId,
      score:((score || 0)).toFixed(5)
    });

    // Check if the selected option is the correct answer
    const correctOption = await db
      .select()
      .from(CHALLENGE_OPTIONS)
      .where(
        and(
          eq(CHALLENGE_OPTIONS.id, optionId),
          eq(CHALLENGE_OPTIONS.is_answer, true)
        )
      )
      .limit(1)
      .execute();

    if (correctOption.length > 0) {
      // If the option is correct, update the score
      const existingScore = await db
        .select()
        .from(QUIZ_SCORE)
        .where(
          and(
            eq(QUIZ_SCORE.challenge_id, challengeId),
            eq(QUIZ_SCORE.child_id, childId),
            eq(QUIZ_SCORE.user_id, userId)
          )
        )
        .limit(1)
        .execute();
      // console.log(existingScore,existingScore[0])
      if (existingScore.length > 0) {
        // Update the score by incrementing it
        await db
          .update(QUIZ_SCORE)
          .set({ score: parseFloat(
            (parseFloat(existingScore[0].score) + (score || 0)).toFixed(5) // Ensure 5 decimal places
          ), })
          .where(eq(QUIZ_SCORE.id, existingScore[0].id));
      } else {
        // Insert a new score record
        await db.insert(QUIZ_SCORE).values({
          user_id: userId,
          child_id: childId,
          challenge_id: challengeId,
          score: score.toFixed(5)||0, // Start with a score of 1 for the first correct answer
        });
      }
    }

    // If it's the first question, insert a record in CHALLENGE_PROGRESS with is_started: true
    if (isFirstQuestion) {
      const existingProgress = await db
        .select()
        .from(CHALLENGE_PROGRESS)
        .where(
          and(
            eq(CHALLENGE_PROGRESS.challenge_id, challengeId),
            eq(CHALLENGE_PROGRESS.child_id, childId),
            eq(CHALLENGE_PROGRESS.user_id, userId)
          )
        )
        .limit(1)
        .execute();

      if (existingProgress.length === 0) {
        await db.insert(CHALLENGE_PROGRESS).values({
          challenge_id: challengeId,
          child_id: childId,
          user_id: userId,
          is_started: true,
          is_completed: false,
        });
      }
    }

    // Update challenge progress if completed
    if (isCompleted) {
      await db
        .update(CHALLENGE_PROGRESS)
        .set({ is_completed: true })
        .where(
          and(
            eq(CHALLENGE_PROGRESS.challenge_id, challengeId),
            eq(CHALLENGE_PROGRESS.child_id, childId),
            eq(CHALLENGE_PROGRESS.user_id, userId)
          )
        );

      let challengeExists;
      // Check if the challenge exists for the given ID
      const challenge = await db
        .select()
        .from(CHALLENGES)
        .where(eq(CHALLENGES.id, challengeId))
        .limit(1)
        .execute();

      if (challenge.length > 0) {
        challengeExists = challenge[0].id;
      }

      if (challengeExists.entry_type != "points") {
        const userPoints = await db
          .select()
          .from(USER_POINTS)
          .where(
            and(
              eq(USER_POINTS.user_id, userId),
              eq(USER_POINTS.child_id, childId)
            )
          )
          .limit(1)
          .execute();

        if (userPoints.length > 0) {
          // Record exists; update points
          const updatedPoints = userPoints[0].points + (challengeExists.points||0);
          await db
            .update(USER_POINTS)
            .set({ points: updatedPoints })
            .where(eq(USER_POINTS.id, userPoints[0].id));
        } else {
          // Record does not exist; create new
          await db.insert(USER_POINTS).values({
            user_id: userId,
            child_id: childId,
            points: challengeExists.points,
          });
        }
        await db.insert(USER_CHALLENGE_POINTS).values({
          user_id: userId,
          child_id: childId,
          points: challengeExists.points,
          challenge_id: challengeId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Answer submitted successfully.",
    });
  } catch (error) {
    console.error("Error submitting quiz answer:", error);
    return NextResponse.json(
      { error: "Failed to submit the answer. Please try again." },
      { status: 500 }
    );
  }
}
