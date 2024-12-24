import { NextResponse } from "next/server";
import { db } from "@/utils";
import {
  NEWS,
  NEWS_CATEGORIES,
  NEWS_TO_CATEGORIES,
  REGIONS,
} from "@/utils/schema";
import { authenticate } from "@/lib/jwtMiddleware";
import { and, asc, desc, eq, gt, inArray, lt, or, sql } from "drizzle-orm";

export async function POST(req) {
  // const authResult = await authenticate(req,true);
  // if (!authResult.authenticated) {
  //   return authResult.response;
  // }

  // const userId = authResult.decoded_Data.id;
  const { age, region = "India" } = await req.json();

  if (!age) {
    return NextResponse.json({ error: "Age is required." }, { status: 400 });
  }

  try {
    // Fetch news categories
    const Regions = await db
      .select()
      .from(REGIONS)
      .where(eq(REGIONS.name, region))
      .execute();

    let region_id = 2;

    if (Regions.length > 0) {
      region_id = Regions[0].id;
    }
    const newsCategories = await db
      .select()
      .from(NEWS_CATEGORIES)
      .orderBy(asc(NEWS_CATEGORIES.order_no))
      .where(
        or(
          eq(NEWS_CATEGORIES.region, "no"),
          and(
            eq(NEWS_CATEGORIES.region, "yes"),
            eq(NEWS_CATEGORIES.region_id, region_id)
          )
        )
      )
      .execute();
    // console.log(Regions)
    // Calculate 24-hour threshold
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch top news created within the last 24 hours
    // Fetch top news created within the last 24 hours
    const newsTop = await db
      .select({
        id: NEWS.id,
        title: NEWS.title,
        description: NEWS.description,
        categoryIds: sql`GROUP_CONCAT(${NEWS_CATEGORIES.id} SEPARATOR ',')`.as(
          "categoryIds"
        ),
        categoryNames:
          sql`GROUP_CONCAT(${NEWS_CATEGORIES.name} SEPARATOR ',')`.as(
            "categoryNames"
          ),
        age: NEWS.age,
        image_url: NEWS.image_url,
        summary: NEWS.summary,
        created_at: NEWS.created_at,
        updated_at: NEWS.updated_at,
        main_news: NEWS.main_news,
      })
      .from(NEWS)
      .leftJoin(NEWS_TO_CATEGORIES, eq(NEWS.id, NEWS_TO_CATEGORIES.news_id))
      .leftJoin(
        NEWS_CATEGORIES,
        eq(NEWS_TO_CATEGORIES.news_category_id, NEWS_CATEGORIES.id)
      )
      .groupBy(NEWS.id)
      .orderBy(desc(NEWS.created_at))
      .where(
        and(
          eq(NEWS.age, age),
          eq(NEWS.show_on_top, true),
          gt(NEWS.created_at, twentyFourHoursAgo), // Created within the last 24 hours
          or(
            eq(NEWS_TO_CATEGORIES.region_id, region_id),
            eq(NEWS_TO_CATEGORIES.region_id, 1)
          )
        )
      )
      .limit(1) // Limit to only one top news per category
      .execute();

    // Fetch normal news (not marked as "on top")
    const news = await db
      .select({
        id: NEWS.id,
        title: NEWS.title,
        description: NEWS.description,
        categoryIds: sql`GROUP_CONCAT(${NEWS_CATEGORIES.id} SEPARATOR ',')`.as(
          "categoryIds"
        ),
        categoryNames:
          sql`GROUP_CONCAT(${NEWS_CATEGORIES.name} SEPARATOR ',')`.as(
            "categoryNames"
          ),
        age: NEWS.age,
        image_url: NEWS.image_url,
        summary: NEWS.summary,
        created_at: NEWS.created_at,
        updated_at: NEWS.updated_at,
      })
      .from(NEWS)
      .leftJoin(NEWS_TO_CATEGORIES, eq(NEWS.id, NEWS_TO_CATEGORIES.news_id))
      .leftJoin(
        NEWS_CATEGORIES,
        eq(NEWS_TO_CATEGORIES.news_category_id, NEWS_CATEGORIES.id)
      )
      .where(
        or(
          and(
            eq(NEWS.age, age),
            eq(NEWS.show_on_top, false),
            or(
              eq(NEWS_TO_CATEGORIES.region_id, region_id),
              eq(NEWS_TO_CATEGORIES.region_id, 1)
            )
          ),
          and(
            eq(NEWS.age, age),
            and(
              eq(NEWS.show_on_top, true),
              lt(NEWS.created_at, twentyFourHoursAgo)
            ),
            or(
              eq(NEWS_TO_CATEGORIES.region_id, region_id),
              eq(NEWS_TO_CATEGORIES.region_id, 1)
            )
          )
        )
      )
      .groupBy(NEWS.id)
      .orderBy(desc(NEWS.created_at))

      .execute();

    return NextResponse.json({
      categories: newsCategories,
      news,
      newsTop,
    });
  } catch (error) {
    console.error("Error fetching news categories or news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news data." },
      { status: 500 }
    );
  }
}
