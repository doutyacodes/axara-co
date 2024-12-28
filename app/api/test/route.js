import { NextResponse } from "next/server";
import { db } from "@/utils";
import {
  CHALLENGES,
  CHALLENGE_USER_QUIZ,
  PRIZE_POOL_DATA,
  CHALLENGE_RANKS,
} from "@/utils/schema";
import { eq, and, desc, gte, lte, sum } from "drizzle-orm";

export async function GET(request) {
  try {
    // Step 1: Fetch eligible challenges
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const now = new Date();

    const challenges = await db
      .select()
      .from(CHALLENGES)
      .where(
        // and(
        //   eq(CHALLENGES.contest, "yes"),
        //   eq(CHALLENGES.challenge_type, "quiz"),
        //   gte(CHALLENGES.end_date, thirtyMinutesAgo),
        //   lte(CHALLENGES.end_date, now)
        // )
        eq(CHALLENGES.challenge_type, "quiz"),

      )
      .execute();

    if (challenges.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No eligible challenges found.",
      });
    }

    // Step 2: Process each challenge
    for (const challenge of challenges) {
      const challengeId = challenge.id;

      // Fetch quiz data and calculate total score
      const quizResponses = await db
        .select({
          child_id: CHALLENGE_USER_QUIZ.child_id,
          user_id: CHALLENGE_USER_QUIZ.user_id,
          total_score: sum(CHALLENGE_USER_QUIZ.score).as("total_score"), // Sum the scores
        })
        .from(CHALLENGE_USER_QUIZ)
        .where(eq(CHALLENGE_USER_QUIZ.challenge_id, challengeId))
        .groupBy(CHALLENGE_USER_QUIZ.child_id, CHALLENGE_USER_QUIZ.user_id)
        .orderBy(desc("total_score"))
        .execute();

      // Calculate rank and rewards
      let rank = 1;
      for (const response of quizResponses) {
        const { child_id, user_id, total_score } = response;

        // Fetch prize data
        const prizeData = await db
          .select()
          .from(PRIZE_POOL_DATA)
          .where(
            and(
              eq(PRIZE_POOL_DATA.pool_id, challenge.pool_id),
              lte(PRIZE_POOL_DATA.rank_from,rank),
              gte(PRIZE_POOL_DATA.rank_to,rank),
            )
          )
          .limit(1)
          .execute();

        const rewardType = prizeData.length > 0 ? "cash" : "points";
        const rewardValue = prizeData.length > 0 ? prizeData[0].prize : 0;

        // Insert rank and reward into `challenge_ranks`
        await db.insert(CHALLENGE_RANKS).values({
          challenge_id: challengeId,
          user_id,
          child_id,
          pool_id: challenge.pool_id,
          rank,
          reward_type: rewardType,
          reward_value: rewardValue,
        });

        rank += 1;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Ranks and rewards processed successfully.",
    });
  } catch (error) {
    console.error("Error processing ranks and rewards:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while processing." },
      { status: 500 }
    );
  }
}
