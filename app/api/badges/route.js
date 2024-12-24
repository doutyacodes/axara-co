import { NextResponse } from "next/server";
import { db } from "@/utils";
import { BADGES, CHILDREN, USER_BADGES } from "@/utils/schema";
import { authenticate } from "@/lib/jwtMiddleware";
import { eq, leftJoin, isNotNull, and } from "drizzle-orm";

export async function POST(req) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const userId = authResult.decoded_Data.id;
    const { childId } = await req.json();

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

    // Fetch all badges, joining with USER_BADGES to check completion status
    const badges = await db
      .select({
        id: BADGES.id,
        badge_type: BADGES.badge_type,
        title: BADGES.title,
        image: BADGES.image,
        learn_topic_id: BADGES.learn_topic_id,
        search_count: BADGES.search_count,
        condition: BADGES.condition,
        condition_title: BADGES.condition_title,
        completed: isNotNull(USER_BADGES.id) // Set completed to true if user has the badge
      })
      .from(BADGES)
      .leftJoin(
        USER_BADGES,
        and(eq(BADGES.id, USER_BADGES.badge_id), eq(USER_BADGES.child_id, finalChildId))
      )
      .execute();

    // Return badges with completion status
    return NextResponse.json({
      badges,
      message: "Badges fetched successfully.",
    });
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch badges." },
      { status: 500 }
    );
  }
}
