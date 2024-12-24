import { db } from "@/utils"; // Ensure this path is correct
import { CHILDREN, QUIZ_SEQUENCES } from "@/utils/schema"; // Ensure this path is correct
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { authenticate } from "@/lib/jwtMiddleware";

export async function POST(req) {
  // Authenticate the request
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response; // Respond with authentication error
  }

  // Extract userId from decoded token
  const userData = authResult.decoded_Data;
  const userId = userData.id;
  const { childId } = await req.json();

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
  try {
    // Fetch data for the given userId
    const data = await db
      .select()
      .from(QUIZ_SEQUENCES)
      .where(
        and(
          eq(QUIZ_SEQUENCES.user_id, userId),
          eq(QUIZ_SEQUENCES.child_id, finalChildId)
        )
      ) // Ensure userId is an integer
      .execute();

    // Respond with the fetched data
    return NextResponse.json(data, { status: 200 }); // Use 200 for successful data retrieval
  } catch (error) {
    console.error("Error fetching quiz sequences:", error);
    return NextResponse.json(
      { message: "Error processing request" },
      { status: 500 }
    );
  }
}
