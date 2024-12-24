import { db } from "@/utils";
import { KIDS_LIKES, KIDS_COMMENTS, CHILDREN } from "@/utils/schema";
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/jwtMiddleware";
import { eq, and } from "drizzle-orm";

// Route for handling likes
export async function POST(req) {
  const { postId, action, commentText,childId } = await req.json();
  const authResult = await authenticate(req);

  if (!authResult.authenticated) {
    return authResult.response; // If authentication fails, return the response
  }

  const userId = authResult.decoded_Data.id;
  let finalChildId = childId;
  if(userId)
  {

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
    if (action === "like") {
      // Check if the user has already liked the post
      const existingLike = await db
        .select()
        .from(KIDS_LIKES)
        .where(and(eq(KIDS_LIKES.post_id, postId), eq(KIDS_LIKES.user_id, userId)))
        .execute();

      if (existingLike.length > 0) {
        // If already liked, remove the like (dislike)
        await db.delete(KIDS_LIKES)
          .where(and(eq(KIDS_LIKES.post_id, postId), eq(KIDS_LIKES.user_id, userId)))
          .execute();
        return NextResponse.json({ message: "Post unliked" });
      } else {
        // Add a new like
        await db.insert(KIDS_LIKES).values({
          post_id: postId,
          user_id: userId,
          child_id:finalChildId
        }).execute();
        return NextResponse.json({ message: "Post liked" });
      }
    } else if (action === "comment") {
      // Add a new comment
      await db.insert(KIDS_COMMENTS).values({
        post_id: postId,
        user_id: userId,
        comment_text: commentText,
      }).execute();
      return NextResponse.json({ message: "Comment added" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error handling like/comment:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
