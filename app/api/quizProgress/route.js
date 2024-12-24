import { db } from "@/utils";
import { CHILDREN, QUIZ_SEQUENCES, USER_PROGRESS } from "@/utils/schema";
import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm"; // Ensure these imports match your ORM version
import { authenticate } from "@/lib/jwtMiddleware";

export async function POST(req) {
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }
// console.log("authResult",authResult)
  const userData = authResult.decoded_Data;
  const userId = userData.id;
// console.log("userId",userId)
  const { quizId, results, childId } = await req.json(); // Directly destructuring to get quizId and results array
  const { questionId, optionId, analyticId } = results;

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
    try {
      // Check if the record already exists
      const existingSequence = await db
        .select()
        .from(QUIZ_SEQUENCES)
        .where(
          and(
            eq(QUIZ_SEQUENCES.user_id, userId),
            eq(QUIZ_SEQUENCES.child_id, finalChildId),
            eq(QUIZ_SEQUENCES.quiz_id, quizId)
          )
        );

      if (existingSequence.length === 0) {
        // Record doesn't exist, so insert it
        await db.insert(QUIZ_SEQUENCES).values({
          user_id: userId,
          child_id: finalChildId,
          quiz_id: quizId,
          type_sequence: "",
          isStarted: true,
          isCompleted: false,
          createddate: new Date(),
        });
        console.log("Quiz sequence inserted successfully");
      } else {
        console.log("Quiz sequence already exists, skipping insert");
      }
    } catch (error) {
      console.error("Error processing quiz sequence:", error);
      throw error; // Rethrow the error to be caught by the outer catch block
    }

    const existingRecords = await db
      .select()
      .from(USER_PROGRESS)
      .where(
        and(
          eq(USER_PROGRESS.user_id, userId),
          eq(USER_PROGRESS.child_id, finalChildId),
          eq(USER_PROGRESS.question_id, questionId)
        )
      )
      .execute();

    if (existingRecords.length > 0) {
      return NextResponse.json(
        { message: "Records already created for this question." },
        { status: 400 }
      );
    }

    try {
      const insertData = {
        user_id: userId,
        question_id: questionId,
        option_id: optionId,
        analytic_id: analyticId,
        created_at: new Date(),
        child_id: finalChildId,
      };

      await db.insert(USER_PROGRESS).values(insertData);
    } catch (error) {
      console.error("Error adding progress sequence:", error);
      throw error;
    }
    return NextResponse.json(
      { message: "Progress added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Error processing request" },
      { status: 500 }
    );
  }
}
