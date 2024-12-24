// /app/api/subtopics/route.js
import { NextResponse } from "next/server";
import { COURSES } from "@/utils/schema";
import { db } from "@/utils";
import { eq } from "drizzle-orm";

export async function POST(req) {
  try {
    const { slug } = await req.json();

    if (!slug) {
      return NextResponse.json(
        { message: "Slug is required." },
        { status: 400 }
      );
    }

    // Fetch course details, modules, subtopics, and keywords based on course slug
    const courseData = await db
      .select()
      .from(COURSES)
      .where(eq(COURSES.slug, slug));

    if (!courseData || courseData.length === 0) {
      return NextResponse.json(
        { message: "No course found for this slug." },
        { status: 404 }
      );
    }

    return NextResponse.json({ course: courseData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching course details:", error);
    return NextResponse.json(
      { message: "Error fetching course details", error: error.message },
      { status: 500 }
    );
  }
}
