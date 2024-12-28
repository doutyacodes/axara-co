import { NextResponse } from "next/server";
import { db } from "@/utils";
import {
  CHALLENGES,
  CHALLENGE_PROGRESS,
  USER_POINTS,
  USER_CHALLENGE_POINTS,
} from "@/utils/schema";
import { and, eq, inArray } from "drizzle-orm";
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
    const { childId } = await req.json();

    if (!childId) {
      return NextResponse.json(
        { error: "Child ID is required." },
        { status: 400 }
      );
    }

    // Fetch challenges that the user has started (using challenge progress table)
    const startedChallenges = await db
      .select()
      .from(CHALLENGE_PROGRESS)
      .where(
        and(
          eq(CHALLENGE_PROGRESS.child_id, childId),
          eq(CHALLENGE_PROGRESS.is_started, true)
        )
      )
      .execute();

    if (startedChallenges.length === 0) {
      return NextResponse.json(
        { message: "No challenges started by the user." },
        { status: 404 }
      );
    }

    // Fetch details of challenges the user started
    const challengeIds = startedChallenges.map(
      (challenge) => challenge.challenge_id
    );

    const challenges = await db
      .select()
      .from(CHALLENGES)
      .where(inArray(CHALLENGES.id, challengeIds)) // Filter challenges by IDs
      .execute();

    if (challenges.length === 0) {
      return NextResponse.json(
        { message: "No matching challenges found." },
        { status: 404 }
      );
    }

    // Return the list of challenges the user started
    return NextResponse.json({
      challenges: challenges || [],
    });
  } catch (error) {
    console.error("Error in processing the request:", error);
    return NextResponse.json(
      { error: "Failed to process the request. Please try again later." },
      { status: 500 }
    );
  }
}
