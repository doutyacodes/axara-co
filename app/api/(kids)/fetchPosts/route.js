import { NextResponse } from "next/server";
import { db } from "@/utils";
import { CHILDREN, KIDS_POSTS, USER_DETAILS } from "@/utils/schema";
import { authenticate } from "@/lib/jwtMiddleware";
import { eq, and } from "drizzle-orm";

export async function POST(req) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const userId = authResult.decoded_Data.id;
    const { slug } = await req.json();

    // Fetch the specific post details
    const PostData = await db
      .select({
        postId: KIDS_POSTS.id,
        content: KIDS_POSTS.content,
        caption: KIDS_POSTS.caption,
        createdAt: KIDS_POSTS.created_at,
        username: USER_DETAILS.name,
        post_type: KIDS_POSTS.post_type,
        slug: KIDS_POSTS.slug,
        childname: CHILDREN.name,
      })
      .from(KIDS_POSTS)
      .leftJoin(USER_DETAILS, eq(KIDS_POSTS.user_id, USER_DETAILS.id))
      .leftJoin(CHILDREN, eq(KIDS_POSTS.child_id, CHILDREN.id))
      .where(eq(KIDS_POSTS.slug, slug))
      .limit(1)
      .execute();

    if (PostData.length === 0) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const PostDetails = PostData[0];

    // Return post details with completion status
    return NextResponse.json({
      PostDetails,
      message: "Post details fetched successfully.",
    });
  } catch (error) {
    console.error("Error fetching post details:", error);
    return NextResponse.json(
      { error: "Failed to fetch post details." },
      { status: 500 }
    );
  }
}
