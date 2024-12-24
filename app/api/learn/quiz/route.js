// app/api/quiz-section/route.js
import { NextResponse } from "next/server";
import { db } from "@/utils";
import { LEARN_SUBJECTS, QUESTIONS, OPTIONS2, USER_LEARN_PROGRESS } from "@/utils/schema"; // Ensure the relevant schemas are imported
import { authenticate } from "@/lib/jwtMiddleware";
import { and, eq } from "drizzle-orm";

export async function POST(req) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response; // Return the response if authentication fails
    }

    const userId = authResult.decoded_Data.id;
    const { slug, childId, testId } = await req.json(); // Assume slug is passed as a query parameter

    if (!slug) {
      return NextResponse.json({ error: "slug is required." }, { status: 400 });
    }
    
    // Fetch the subject associated with the slug
    const subject = await db
      .select()
      .from(LEARN_SUBJECTS)
      .where(eq(LEARN_SUBJECTS.slug, slug))
      .execute();

    // Check if the subject was found
    if (subject.length === 0) {
      return NextResponse.json(
        { error: "No subject found for the given slug." },
        { status: 404 }
      );
    }

    const subjectId = subject[0].id;

    // Fetch questions associated with the subject
    const questions = await db
      .select()
      .from(QUESTIONS) 
      .where(eq(QUESTIONS.learn_test_id, testId))
      .execute();

      const questionsWithOptions = await Promise.all(
        questions.map(async (question) => {
          const options = await db
            .select()
            .from(OPTIONS2)
            .where(eq(OPTIONS2.question_id, question.id))
            .execute();
  
          return {
            ...question,
            options,
          };
        })
      );

    // Check user progress on this quiz
    const userProgress = await db
      .select()
      .from(USER_LEARN_PROGRESS)
      .where(
        and(
          eq(USER_LEARN_PROGRESS.learn_test_id, testId),
          eq(USER_LEARN_PROGRESS.child_id, childId)
        )
      )
      .execute();

    const completed = userProgress.length > 0;

    return NextResponse.json({
      completed,
      questions: questionsWithOptions,
    });
  } catch (error) {
    console.error("Error fetching quiz data:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz data." },
      { status: 500 }
    );
  }
}
