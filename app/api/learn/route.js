import { db } from "@/utils";
import { LEARN_TOPICS } from "@/utils/schema"; // Import your LEARN_TOPICS table schema
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { authenticate } from "@/lib/jwtMiddleware";

export async function POST(req) {
  const authResult = await authenticate(req, true);
  if (!authResult.authenticated) {
    return authResult.response; // Return the response if authentication fails
  }

  const { age } = await req.json();
  const userId = authResult.decoded_Data.id;

  const learnId = 1;

  if (!learnId) {
    return NextResponse.json(
      { message: "learn_id parameter is required" },
      { status: 400 }
    );
  }

  if (userId) {
    let finalAge = age;

    if (!age) {
      const firstChild = await db
        .select()
        .from(CHILDREN)
        .where(eq(CHILDREN.user_id, userId))
        .limit(1)
        .execute();

      if (firstChild.length > 0) {
        finalAge = firstChild[0].age; // Assuming 'id' is the identifier for CHILDREN
      } else {
        return NextResponse.json(
          { error: "No children found for the user." },
          { status: 404 }
        );
      }
    }

    try {
      const topics = await db
        .select()
        .from(LEARN_TOPICS)
        .where(
          and(
            eq(LEARN_TOPICS.learn_id, learnId),
            eq(LEARN_TOPICS.age, finalAge)
          )
        )
        .execute();
      return NextResponse.json({ data: topics });
    } catch (error) {
      console.error("Fetch Learn Topics Error:", error);
      return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
  } else {
    try {
      const topics = await db
        .select()
        .from(LEARN_TOPICS)
        .where(
            and(
              eq(LEARN_TOPICS.learn_id, learnId),
              eq(LEARN_TOPICS.age, 4)
            )
          )
        .execute();
      return NextResponse.json({ data: topics });
    } catch (error) {
      console.error("Fetch Learn Topics Error:", error);
      return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
  }
}
