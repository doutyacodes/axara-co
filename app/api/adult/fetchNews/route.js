import { NextResponse } from "next/server";
import { db } from "@/utils";
import {
  ADULT_NEWS,
  NEWS_CATEGORIES,
  ADULT_NEWS_TO_CATEGORIES,
  REGIONS,
} from "@/utils/schema";
import { and, asc, desc, eq, gt, lt, or, sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const { region = "India" } = await req.json();
    const Regions = await db
      .select()
      .from(REGIONS)
      .where(eq(REGIONS.name, region))
      .execute();

    let region_id = 2;

    if (Regions.length > 0) {
      region_id = Regions[0].id;
    }
    // Fetch news categories
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

    // Calculate 24-hour threshold
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch top news created within the last 24 hours
    const newsTop = await db
      .select({
        id: ADULT_NEWS.id,
        title: ADULT_NEWS.title,
        description: ADULT_NEWS.description,
        categoryIds: sql`GROUP_CONCAT(${NEWS_CATEGORIES.id} SEPARATOR ',')`.as(
          "categoryIds"
        ),
        categoryNames:
          sql`GROUP_CONCAT(${NEWS_CATEGORIES.name} SEPARATOR ',')`.as(
            "categoryNames"
          ),
        image_url: ADULT_NEWS.image_url,
        summary: ADULT_NEWS.summary,
        created_at: ADULT_NEWS.created_at,
        updated_at: ADULT_NEWS.updated_at,
        main_news: ADULT_NEWS.main_news,
        news_group_id: ADULT_NEWS.news_group_id, // Include news_group_id
        viewpoint: ADULT_NEWS.viewpoint, // Include news_group_id
      })
      .from(ADULT_NEWS)
      .leftJoin(
        ADULT_NEWS_TO_CATEGORIES,
        eq(ADULT_NEWS.id, ADULT_NEWS_TO_CATEGORIES.news_id)
      )
      .leftJoin(
        NEWS_CATEGORIES,
        eq(ADULT_NEWS_TO_CATEGORIES.news_category_id, NEWS_CATEGORIES.id)
      )
      .groupBy(ADULT_NEWS.id)
      .orderBy(desc(ADULT_NEWS.created_at))
      .where(
        and(
          eq(ADULT_NEWS.show_on_top, true),
          gt(ADULT_NEWS.created_at, twentyFourHoursAgo), // Created within the last 24 hours
          or(
            eq(ADULT_NEWS_TO_CATEGORIES.region_id, region_id),
            eq(ADULT_NEWS_TO_CATEGORIES.region_id, 1)
          )
        )
      )
      .execute();

    // Fetch normal news (not marked as "on top")
    const news = await db
      .select({
        id: ADULT_NEWS.id,
        title: ADULT_NEWS.title,
        description: ADULT_NEWS.description,
        categoryIds: sql`GROUP_CONCAT(${NEWS_CATEGORIES.id} SEPARATOR ',')`.as(
          "categoryIds"
        ),
        categoryNames:
          sql`GROUP_CONCAT(${NEWS_CATEGORIES.name} SEPARATOR ',')`.as(
            "categoryNames"
          ),
        image_url: ADULT_NEWS.image_url,
        summary: ADULT_NEWS.summary,
        created_at: ADULT_NEWS.created_at,
        updated_at: ADULT_NEWS.updated_at,
        news_group_id: ADULT_NEWS.news_group_id, // Include news_group_id
        viewpoint: ADULT_NEWS.viewpoint, // Include news_group_id
        // Ensure distinct viewpoints per group
      })
      .from(ADULT_NEWS)
      .leftJoin(
        ADULT_NEWS_TO_CATEGORIES,
        eq(ADULT_NEWS.id, ADULT_NEWS_TO_CATEGORIES.news_id)
      )
      .leftJoin(
        NEWS_CATEGORIES,
        eq(ADULT_NEWS_TO_CATEGORIES.news_category_id, NEWS_CATEGORIES.id)
      )
      .where(
        or(
          and(
            eq(ADULT_NEWS.show_on_top, false),
            or(
              eq(ADULT_NEWS_TO_CATEGORIES.region_id, region_id),
              eq(ADULT_NEWS_TO_CATEGORIES.region_id, 1)
            )
          ),
          and(
            and(
              eq(ADULT_NEWS.show_on_top, true),
              lt(ADULT_NEWS.created_at, twentyFourHoursAgo)
            ),
            or(
              eq(ADULT_NEWS_TO_CATEGORIES.region_id, region_id),
              eq(ADULT_NEWS_TO_CATEGORIES.region_id, 1)
            )
          )
        )
      )
      .groupBy(ADULT_NEWS.id, ADULT_NEWS.news_group_id) // Group by both id and news_group_id
      .orderBy(desc(ADULT_NEWS.created_at))
      .execute();

      const groupByNewsGroupId = (newsData) => {
        return newsData.reduce((acc, currentNews) => {
          const { news_group_id, viewpoint, created_at } = currentNews;
      
          if (!acc[news_group_id]) {
            acc[news_group_id] = {
              newsItems: [],
              viewpoints: [], // Store viewpoints with their created_at
            };
          }
      
          // Add the current news item to the respective group
          acc[news_group_id].newsItems.push(currentNews);
      
          // Check if the viewpoint already exists
          const existingViewpoint = acc[news_group_id].viewpoints.find(
            (vp) => vp.viewpoint === viewpoint
          );
      
          if (!existingViewpoint && viewpoint) {
            acc[news_group_id].viewpoints.push({ viewpoint, created_at });
          }
      
          return acc;
        }, {});
      };
      
      // Function to format grouped data
      const formatGroupedNews = (groupedNews) => {
        return Object.keys(groupedNews).map((groupId) => {
          const group = groupedNews[groupId];
      
          // Sort newsItems by created_at ascending
          group.newsItems.sort((a, b) => new Date(a.id) - new Date(b.id)); // Ascending order
      
          // Sort viewpoints by id ascending
          const sortedViewpoints = group.viewpoints
            .sort((a, b) => new Date(a.id) - new Date(b.id)) // Ascending order
            .map((vp) => vp.viewpoint) // Extract the viewpoint strings
            .join(","); // Combine viewpoints into a comma-separated string
      
          // Add viewpoints to each news item in the group
          group.newsItems.forEach((newsItem) => {
            newsItem.viewpoints = sortedViewpoints;
          });
      
          return {
            news_group_id: groupId,
            newsItems: group.newsItems,
          };
        });
      };
      
      

    // Group top news and normal news by news_group_id
    const groupedNewsTop = groupByNewsGroupId(newsTop);
    const groupedNews = groupByNewsGroupId(news);

    // Format grouped news
    const groupedNewsTopArray = formatGroupedNews(groupedNewsTop);
    const groupedNewsArray = formatGroupedNews(groupedNews);

    // Return the final JSON response
    return NextResponse.json({
      categories: newsCategories,
      newsTopGroupedByGroupId: groupedNewsTopArray, // Return grouped top news
      newsGroupedByGroupId: groupedNewsArray, // Return grouped normal news
    });
  } catch (error) {
    console.error("Error fetching news categories or news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news data." },
      { status: 500 }
    );
  }
}
