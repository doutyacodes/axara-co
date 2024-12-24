import { NextResponse } from "next/server";
import { db } from "@/utils";
import { COURSES, CHILDREN } from "@/utils/schema"; // Ensure CHILDREN is imported
import { authenticate } from "@/lib/jwtMiddleware";
import { and, asc, desc, eq } from "drizzle-orm";
import { count } from "drizzle-orm"; // Import count function

export async function POST(req) {
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userId = authResult.decoded_Data.id;
  const { childId, page, limit, type, sortBy } = await req.json();

  if (!userId) {
    return NextResponse.json(
      { error: "user_id is required." },
      { status: 400 }
    );
  }

  // If childId is null, fetch the first child's ID
  let finalChildId = childId;

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

  const offset = (page - 1) * limit;

  try {
    let query = db
      .select()
      .from(COURSES)
      .where(and(eq(COURSES.user_id, userId), eq(COURSES.child_id, finalChildId), eq(COURSES.type, type)))
      .limit(limit)
      .offset(offset);

    if (sortBy === "latest") {
      query = query.orderBy(desc(COURSES.created_at));
    } else if (sortBy === "oldest") {
      query = query.orderBy(asc(COURSES.created_at));
    }

    const courses = await query.execute();

    const [{ count: totalCount }] = await db
      .select({ count: count(COURSES.child_id) }) // Counts only non-NULL child_id
      .from(COURSES)
      .where(and(eq(COURSES.user_id, userId), eq(COURSES.child_id, finalChildId), eq(COURSES.type, type)))
      .execute();

    return NextResponse.json({
      courses,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses." },
      { status: 500 }
    );
  }
}
