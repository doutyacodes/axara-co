import { NextResponse } from "next/server";
import { CHILDREN, KIDS_COMMENTS } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { db } from "@/utils";
import { authenticate } from "@/lib/jwtMiddleware";

export async function POST(request) {
  const { postId, childId, commentText, parentCommentId } =
    await request.json();

  const authResult = await authenticate(request);
  if (!authResult.authenticated) {
    return authResult.response; // Return the response if authentication fails
  }

  const userId = authResult.decoded_Data.id;

  let finalChildId = childId;
  if (userId) {
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

  const insertResult = await db
    .insert(KIDS_COMMENTS)
    .values({
      post_id: postId,
      child_id: finalChildId,
      comment_text: commentText,
      parent_comment_id: parentCommentId || null,
      user_id: userId,
    })
    .execute();

  const newCommentId = insertResult[0].insertId;

  // Fetch the full comment data using the new comment ID
  const [result] = await db
    .select()
    .from(KIDS_COMMENTS)
    .where(eq(KIDS_COMMENTS.id, newCommentId))
    .execute();
  console.log(result);

  return NextResponse.json(result);
}

export async function DELETE(request) {
  const { commentId } = await request.json();

  await db.delete(KIDS_COMMENTS).where(eq(KIDS_COMMENTS.id, commentId));
  return NextResponse.json({ success: true });
}

export async function PATCH(request) {
  const { commentId, commentText } = await request.json();

  await db
    .update(KIDS_COMMENTS)
    .set({ comment_text: commentText })
    .where(eq(KIDS_COMMENTS.id, commentId));

  return NextResponse.json({ success: true });
}

export async function GET(request, { params }) {
  const { postId } = params;
  const page = parseInt(params.page || "1", 10);

  const limit = 10;
  const offset = (page - 1) * limit;

  const comments = await db
    .select()
    .from(KIDS_COMMENTS)
    .where(eq(KIDS_COMMENTS.post_id, postId))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(comments);
}
