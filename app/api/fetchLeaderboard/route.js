import { NextResponse } from "next/server";
import { db } from "@/utils";
import { QUIZ_SCORE, USER_DETAILS, CHILDREN } from "@/utils/schema";
import { eq, desc, sql } from "drizzle-orm";
import { authenticate } from "@/lib/jwtMiddleware";

export async function POST(req) {
  const { challengeId, childId } = await req.json();

  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  if (!challengeId) {
    return NextResponse.json(
      { error: "Challenge ID is required." },
      { status: 400 }
    );
  }

  try {
    // Fetch leaderboard: top 100 children for the specified challenge
    const leaderboard = await db
      .select({
        child_id: QUIZ_SCORE.child_id,
        user_name: CHILDREN.name,
        child_name: CHILDREN.name,
        grade: CHILDREN.grade,
        total_score: sql`SUM(${QUIZ_SCORE.score})`.as("total_score"),
      })
      .from(QUIZ_SCORE)
      .innerJoin(CHILDREN, eq(QUIZ_SCORE.child_id, CHILDREN.id))
      .innerJoin(USER_DETAILS, eq(CHILDREN.user_id, USER_DETAILS.id))
      .where(eq(QUIZ_SCORE.challenge_id, challengeId))
      .groupBy(
        QUIZ_SCORE.child_id,
        USER_DETAILS.name,
        CHILDREN.name,
        CHILDREN.grade
      )
      .orderBy(desc(sql`SUM(${QUIZ_SCORE.score})`))
      .limit(100);

    // Fetch rank for the specific child in the leaderboard
    const childRankQuery = await db
      .select({
        rank: sql`RANK() OVER (ORDER BY SUM(${QUIZ_SCORE.score}) DESC)`.as("rank"),
        child_id: QUIZ_SCORE.child_id,
        total_score: sql`SUM(${QUIZ_SCORE.score})`.as("total_score"),
      })
      .from(QUIZ_SCORE)
      .where(eq(QUIZ_SCORE.challenge_id, challengeId))
      .groupBy(QUIZ_SCORE.child_id)
      .having(eq(QUIZ_SCORE.child_id, childId));

    const childRank = childRankQuery.length > 0 ? childRankQuery[0] : null;

    // Format response
    const formattedResponse = {
      leaderboard,
      childRank: childRank || { rank: null, total_score: null },
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data." },
      { status: 500 }
    );
  }
}
