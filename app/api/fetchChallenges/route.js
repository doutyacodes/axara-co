import { NextResponse } from "next/server";
import { db } from "@/utils";
import { CHALLENGES, CHALLENGE_PROGRESS, CHILDREN } from "@/utils/schema";
import { authenticate } from "@/lib/jwtMiddleware";
import { and, eq, notIn, isNull, or, lt } from "drizzle-orm"; // Added `isNull` and `lt` for date comparison

export async function POST(req) {
  console.log(req)
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userId = authResult.decoded_Data.id;
  const { age, childId } = await req.json();

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required." },
      { status: 400 }
    );
  }

  if (!age) {
    return NextResponse.json({ error: "Age is required." }, { status: 400 });
  }

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

  try {
    const currentDate = new Date();

    // Fetch challenges that match the user's age and are not expired
    const challenges = await db
      .select()
      .from(CHALLENGES)
      .where(
        and(
          eq(CHALLENGES.age, age), // Filter by age
          or(
            isNull(CHALLENGES.end_date), // Include challenges without an end_date
            lt(currentDate, CHALLENGES.end_date) // Include challenges where end_date is in the future
          )
        )
      )
      .execute();

    // Fetch the completed challenges for the user to exclude from the list
    const completedChallenges = await db
      .select()
      .from(CHALLENGE_PROGRESS)
      .where(
        and(
          eq(CHALLENGE_PROGRESS.is_completed, true),
          eq(CHALLENGE_PROGRESS.user_id, userId),
          eq(CHALLENGE_PROGRESS.child_id, finalChildId)
        )
      )
      .execute();

    const completedChallengeIds = completedChallenges.map(
      (c) => c.challenge_id
    );

    // Exclude completed challenges from the results
    const filteredChallenges = challenges.filter(
      (challenge) => !completedChallengeIds.includes(challenge.id)
    );

    return NextResponse.json({
      challenges: filteredChallenges,
    });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenges." },
      { status: 500 }
    );
  }
}
