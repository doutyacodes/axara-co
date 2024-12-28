import { NextResponse } from "next/server";
import { db } from "@/utils";
import {
  CHALLENGES,
  CHALLENGE_USER_QUIZ,
  USER_RANKS,
  CHILDREN,
} from "@/utils/schema";
import { eq, inArray, desc, sum } from "drizzle-orm"; // Make sure to import `sum` from drizzle-orm
import { authenticate } from "@/lib/jwtMiddleware";

export async function POST(req) {
  try {
    // Authenticate the user
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const userId = authResult.decoded_Data.id;
    const { slug, childId } = await req.json(); // Extract data from request

    if (!slug || !childId) {
      return NextResponse.json(
        { error: "Challenge ID and Child ID are required." },
        { status: 400 }
      );
    }

    // Step 1: Fetch the challenge details using `slug`
    const challenge = await db
      .select()
      .from(CHALLENGES)
      .where(eq(CHALLENGES.slug, slug))
      .limit(1)
      .execute();

    if (challenge.length === 0) {
      return NextResponse.json(
        { error: "Challenge not found." },
        { status: 404 }
      );
    }

    const challengeData = challenge[0];
    const currentDate = new Date();  // Current date and time
    const challengeId = challengeData.id;

    // Step 2: Check if challenge is not a contest or if the challenge end_date has passed
    const challengeEndDate = new Date(challengeData.end_date);  // Challenge end datetime

    // If the challenge is not a contest or if the challenge end_date is in the past
    if (challengeData.contest !== "yes" || challengeEndDate < currentDate) {
      // Fetch quiz data and calculate rank
      const quizData = await db
        .select({
          child_id: CHALLENGE_USER_QUIZ.child_id,
          user_id: CHALLENGE_USER_QUIZ.user_id,
          total_score: sum(CHALLENGE_USER_QUIZ.score).as("total_score"), // Use `sum()` correctly here
        })
        .from(CHALLENGE_USER_QUIZ)
        .where(eq(CHALLENGE_USER_QUIZ.challenge_id, challengeId))
        .groupBy(CHALLENGE_USER_QUIZ.child_id, CHALLENGE_USER_QUIZ.user_id)
        .orderBy(desc("total_score"))
        .execute();

      // Rank users based on total score
      const ranks = quizData.map((data, index) => ({
        rank: index + 1,
        child_id: data.child_id,
        user_id: data.user_id,
        total_score: data.total_score,
        child_name: "", // Default child name placeholder
      }));

      // Fetch children names using `IN` to optimize the query
      const childIds = ranks.map((rank) => rank.child_id);
      const childrenData = await db
        .select()
        .from(CHILDREN)
        .where(inArray(CHILDREN.id, childIds)) // Use `inArray` here
        .execute();

      // Attach child names to ranks
      ranks.forEach((rank) => {
        const child = childrenData.find((c) => c.id === rank.child_id);
        if (child) {
          rank.child_name = child.name;
        }
      });

      return NextResponse.json({
        success: true,
        challenge: challengeData,
        ranks,
      });
    }

    // Step 3: If it is a contest and the challenge is completed
    if (challengeData.contest === "yes" && challengeData.is_completed === true) {
      const userRanks = await db
        .select({
          child_id: USER_RANKS.child_id,
          user_id: USER_RANKS.user_id,
          rank: USER_RANKS.rank,
          reward_type: USER_RANKS.reward_type,
          reward_value: USER_RANKS.reward_value,
        })
        .from(USER_RANKS)
        .where(eq(USER_RANKS.challenge_id, challengeId))
        .orderBy("rank")
        .execute();

      // Fetch children names using `IN` to optimize the query
      const childIds = userRanks.map((rank) => rank.child_id);
      const childrenData = await db
        .select()
        .from(CHILDREN)
        .where(inArray(CHILDREN.id, childIds)) // Use `inArray` here
        .execute();

      // Attach child names to ranks
      userRanks.forEach((rank) => {
        const child = childrenData.find((c) => c.id === rank.child_id);
        if (child) {
          rank.child_name = child.name;
        }
      });

      return NextResponse.json({
        success: true,
        challenge: challengeData,
        userRanks,
      });
    }

    return NextResponse.json({
      success: false,
      message: "Challenge is either not a contest or not completed yet.",
    });
  } catch (error) {
    console.error("Error fetching challenge data:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching challenge data." },
      { status: 500 }
    );
  }
}
