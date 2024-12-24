import { db } from "@/utils";
import { CHILDREN, QUIZ_SEQUENCES, KNOWLEDGE_PROGRESS } from "@/utils/schema";
import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm"; // Ensure these imports match your ORM version
import { authenticate } from "@/lib/jwtMiddleware";
import { createSequence } from "./createSequence";

export async function POST(req) {
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userData = authResult.decoded_Data;
  const userId = userData.id;
  const { childId, ages, weekData } = await req.json(); // Directly destructuring to get quizId and results array

  let finalChildId = childId;
  let age = ages;
  let weeks = weekData;
  // console.log(
  //   "data",
  //   `finalChildId :${finalChildId},age :${age},week :${weeks},`
  // );

  if (!childId || !weeks) {
    const firstChild = await db
      .select()
      .from(CHILDREN)
      .where(eq(CHILDREN.user_id, userId))
      .limit(1)
      .execute();

    if (firstChild.length > 0) {
      const weekDatas = calculateAgeAndWeeks(firstChild[0].age);
      finalChildId = firstChild[0].id;
      weeks = weekDatas.weeks;
      age = weekDatas.age;
    } else {
      return NextResponse.json(
        { error: "No children found for the user." },
        { status: 404 }
      );
    }
  }

  try {
    const savedProgress = await db
      .select()
      .from(KNOWLEDGE_PROGRESS)
      .where(
        and(
          eq(KNOWLEDGE_PROGRESS.user_id, userId),
          eq(KNOWLEDGE_PROGRESS.child_id, finalChildId),
          eq(KNOWLEDGE_PROGRESS.age_years, age),
          eq(KNOWLEDGE_PROGRESS.age_weeks, weeks),
        )
      );

    console.log("savedprogress", savedProgress);

    // Create sequence and insert into QUIZ_SEQUENCES
    try {
      await createSequence(savedProgress, userId, 5, finalChildId,age,weeks);
      return NextResponse.json({ message: "Success" }, { status: 201 });
    } catch (createSequenceError) {
      console.error(
        "Error creating personality sequence:",
        createSequenceError
      );
      return NextResponse.json(
        { message: "Error creating personality sequence" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching questions and answers:", error);
    return NextResponse.json(
      { message: "Error fetching questions and answers" },
      { status: 500 }
    );
  }
}
