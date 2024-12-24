import { NextResponse } from "next/server";
import { db } from "@/utils";
import { ADULT_NEWS, NEWS_CATEGORIES } from "@/utils/schema";
import { and, asc, eq } from "drizzle-orm";

export async function POST(req) {
  // Parse the request body to extract the ID
  const { id } = await req.json();

  // Ensure that the ID is provided and is a valid number
  if (!id || isNaN(id)) {
    return NextResponse.json(
      { error: "A valid News ID is required." },
      { status: 400 }
    );
  }

  try {
    // Fetch the specific news item by its ID
    const originalNews = await db
      .select()
      .from(ADULT_NEWS)
      .where(eq(ADULT_NEWS.id, id))
      .execute();

    // Check if no news was found with the provided ID
    if (originalNews.length === 0) {
      return NextResponse.json(
        { error: "News item not found." },
        { status: 404 }
      );
    }

    const { news_group_id } = originalNews[0];
    let originalNews2 = await db
      .select()
      .from(ADULT_NEWS)
      .where(
        and(
          eq(ADULT_NEWS.viewpoint, "Neutral"),
          eq(ADULT_NEWS.news_group_id, news_group_id)
        )
      )
      .orderBy(asc(ADULT_NEWS.created_at))
      .limit(1)
      .execute();

    if (originalNews2.length == 0) {
      originalNews2 = await db
        .select()
        .from(ADULT_NEWS)
        .where(eq(ADULT_NEWS.news_group_id, news_group_id))
        .orderBy(asc(ADULT_NEWS.created_at))
        .limit(1)
        .execute();
    }

    // Return the news data
    return NextResponse.json({ newsData: originalNews2[0] });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching news." },
      { status: 500 }
    );
  }
}
