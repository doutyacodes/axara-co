import { NextResponse } from "next/server";
import { db } from "@/utils";
import { BADGES, CHILDREN, USER_BADGES } from "@/utils/schema";
import { authenticate } from "@/lib/jwtMiddleware";
import { eq, and } from "drizzle-orm";

export async function POST(req) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const userId = authResult.decoded_Data.id;
    const { childId, badgeId } = await req.json();

    let finalChildId = childId;

    if (!childId) {
      const firstChild = await db
        .select()
        .from(CHILDREN)
        .where(eq(CHILDREN.user_id, userId))
        .limit(1)
        .execute();

      if (firstChild.length > 0) {
        finalChildId = firstChild[0].id;
      } else {
        return NextResponse.json(
          { error: "No children found for the user." },
          { status: 404 }
        );
      }
    }

    // Fetch the specific badge details
    const badgeData = await db
      .select({
        id: BADGES.id,
        badge_type: BADGES.badge_type,
        title: BADGES.title,
        image: BADGES.image,
        learn_topic_id: BADGES.learn_topic_id,
        search_count: BADGES.search_count,
        condition: BADGES.condition,
        condition_title: BADGES.condition_title,
        user_badge_id: USER_BADGES.id,
        earned_at:USER_BADGES.earned_at
      })
      .from(BADGES)
      .leftJoin(
        USER_BADGES,
        and(eq(BADGES.id, USER_BADGES.badge_id), eq(USER_BADGES.child_id, finalChildId))
      )
      .where(eq(BADGES.id, badgeId))
      .limit(1)
      .execute();

    if (badgeData.length === 0) {
      return NextResponse.json(
        { error: "Badge not found." },
        { status: 404 }
      );
    }

    // Check if user_badge_id exists to determine completion status
    const badgeDetails = badgeData[0];
    badgeDetails.completed = badgeDetails.user_badge_id !== null;

    // Return badge details with completion status
    return NextResponse.json({
      badge: {
        id: badgeDetails.id,
        badge_type: badgeDetails.badge_type,
        title: badgeDetails.title,
        image: badgeDetails.image,
        learn_topic_id: badgeDetails.learn_topic_id,
        search_count: badgeDetails.search_count,
        condition: badgeDetails.condition,
        condition_title: badgeDetails.condition_title,
        earned_at:badgeDetails.earned_at,
        completed: true,
      },
      message: "Badge details fetched successfully.",
    });
  } catch (error) {
    console.error("Error fetching badge details:", error);
    return NextResponse.json(
      { error: "Failed to fetch badge details." },
      { status: 500 }
    );
  }
}
