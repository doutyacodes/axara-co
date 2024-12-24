import { db } from "@/utils";
import { CHILDREN, QUIZ_SEQUENCES, CHILDREN_PROGRESS } from "@/utils/schema";
import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm"; 
import { authenticate } from "@/lib/jwtMiddleware";

export async function POST(req) {
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userData = authResult.decoded_Data;
  const userId = userData.id;
  const { quizId, results, childId } = await req.json(); 
//   const DataCheck = await req.json(); 
  const  questionId  = results[0].questionId; // 

//   console.log("DataCheck",DataCheck)
// const a ="apple"
// if(a=="apple")
// {
//     return
// }
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
        finalChildId = firstChild[0].id;
      } else {
        return NextResponse.json(
          { error: "No children found for the user." },
          { status: 404 }
        );
      }
    }
  }

  try {
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
      await db.insert(QUIZ_SEQUENCES).values({
        user_id: userId,
        child_id: finalChildId,
        quiz_id: quizId,
        type_sequence: "",
        isStarted: true,
        isCompleted: false,
        createddate: new Date(),
      });
    }

    const existingRecords = await db
      .select()
      .from(CHILDREN_PROGRESS)
      .where(
        and(
          eq(CHILDREN_PROGRESS.user_id, userId),
          eq(CHILDREN_PROGRESS.child_id, finalChildId),
          eq(CHILDREN_PROGRESS.question_id, questionId)
        )
      )
      .execute();

    if (existingRecords.length > 0) {
      return NextResponse.json(
        { message: "Records already created for this question." },
        { status: 400 }
      );
    }

    const insertData = results.map(({ optionId, option_letter }) => ({
        user_id: userId,
        question_id: questionId,
        option_id: optionId,
        option_letter: option_letter,
        child_id: finalChildId,
        created_at: new Date(),
      }));
      

    await db.insert(CHILDREN_PROGRESS).values(insertData);

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
