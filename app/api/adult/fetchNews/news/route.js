import { NextResponse } from "next/server";
import { db } from "@/utils";
import { ADULT_NEWS, NEWS_CATEGORIES } from "@/utils/schema";
import { eq } from "drizzle-orm";

export async function POST(req) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "News ID is required." },
      { status: 400 }
    );
  }

  try {
    // Fetch the specific news item to get its news_group_id
    const originalNews = await db
      .select()
      .from(ADULT_NEWS)
      .where(eq(ADULT_NEWS.id, id))
      .execute();

    if (originalNews.length === 0) {
      return NextResponse.json(
        { error: "Original news not found." },
        { status: 404 }
      );
    }

    const { news_group_id } = originalNews[0];

    // Fetch all news with the same news_group_id
    const relatedNews = await db
      .select({
        id: ADULT_NEWS.id,
        title: ADULT_NEWS.title,
        description: ADULT_NEWS.description,
        category: NEWS_CATEGORIES.name,
        news_category_id: ADULT_NEWS.news_category_id,
        image_url: ADULT_NEWS.image_url,
        summary: ADULT_NEWS.summary,
        viewpoint: ADULT_NEWS.viewpoint,
        created_at: ADULT_NEWS.created_at,
        updated_at: ADULT_NEWS.updated_at,
      })
      .from(ADULT_NEWS)
      .leftJoin(NEWS_CATEGORIES, eq(ADULT_NEWS.news_category_id, NEWS_CATEGORIES.id)) // Join with categories
      .where(eq(ADULT_NEWS.news_group_id, news_group_id)) // Filter by news_group_id
      .execute();

    if (relatedNews.length === 0) {
      return NextResponse.json(
        { error: "No related news found for the given group." },
        { status: 404 }
      );
    }

    return NextResponse.json({ newsData: relatedNews }); // Return all related news
  } catch (error) {
    console.error("Error fetching related news:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching news." },
      { status: 500 }
    );
  }
}
