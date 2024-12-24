import { NextResponse } from "next/server";
import { db } from "@/utils";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { authenticate } from "@/lib/jwtMiddleware";
import { CHILDREN, LEARN_DATAS, LEARN_SUBJECTS, LEARN_TESTS, QUESTIONS, USER_LEARN_PROGRESS } from "@/utils/schema";

export async function POST(req) {
  try {
    const authResult = await authenticate(req, true);
    if (!authResult.authenticated) {
      return authResult.response; // Return the response if authentication fails
    }

    const userId = authResult.decoded_Data.id;
    const { slug, childId = null } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "slug is required." }, { status: 400 });
    }

    if (!childId && userId) {
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

    // Fetch the learn subject ID associated with the provided slug
    const subject = await db
      .select()
      .from(LEARN_SUBJECTS)
      .where(eq(LEARN_SUBJECTS.slug, slug))
      .execute();

    // Check if the topic was found
    if (subject.length === 0) {
      return NextResponse.json(
        { error: "No subject found for the given slug." },
        { status: 404 }
      );
    }

    const subjectId = subject[0].id; // Get the ID of the subject

    // // Get the start date (Sunday) and end date (Saturday) of the current week
    // // Get the current date in local time
    // const now = new Date();
    // // Calculate the start of the week (Sunday, local timezone)
    // const startOfWeek = new Date(now);
    // startOfWeek.setDate(now.getDate() - now.getDay()); // Set to Sunday
    // startOfWeek.setHours(0, 0, 0, 0); // Midnight

    // // Calculate the end of the week (Saturday, local timezone)
    // const endOfWeek = new Date(startOfWeek);
    // endOfWeek.setDate(startOfWeek.getDate() + 6); // Add 6 days to get Saturday
    // endOfWeek.setHours(23, 59, 59, 999); // End of day
    // console.log("startOfWeek", startOfWeek, "endOfWeek", endOfWeek)

    // // Fetch the test for the given subject and check if show_date is within the week range
    // const test = await db
    //   .select()
    //   .from(LEARN_TESTS)
    //   .where(
    //     and(
    //       eq(LEARN_TESTS.learn_subject_id, subjectId),
    //       gte(LEARN_TESTS.show_date, startOfWeek.toISOString().split("T")[0]), // >= startOfWeek
    //       lte(LEARN_TESTS.show_date, endOfWeek.toISOString().split("T")[0])  // <= endOfWeek
    //     )
    //   )
    //   .execute();


    // Get the current date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
console.log("today", today);
console.log("subjectId is", subjectId);
     // Fetch the test for the given subject and check if the current date falls within the start_date and end_date
     const test = await db
     .select()
     .from(LEARN_TESTS)
     .where(
       and(
         eq(LEARN_TESTS.learn_subject_id, subjectId),
         sql`DATE(${LEARN_TESTS.start_date}) <= ${today}`, // Check if today is >= start_date
         sql`DATE(${LEARN_TESTS.end_date}) >= ${today}`   // Check if today is <= end_date
       )
     )
    //  .execute();
     console.log(test);
     

    if (test.length === 0) {
      return NextResponse.json(
        { error: "No test found for the current week." },
        { status: 404 }
      );
    }

    const testId = test[0].id;

 // Count the number of quizzes (questions) associated with the retrieved topic_id
    const quiz = await db
      .select()
      .from(QUESTIONS)
      .where(eq(QUESTIONS.learn_test_id, testId))
      .execute();
    const quizCountResult = quiz.length;
    const quizCount = quizCountResult || 0;

    let userProgressCountResult = 0;

    let finalChildId = childId;
    
    if (userId && finalChildId) {
      // Count the number of user progress entries associated with the retrieved topic_id
      const userProgress = await db
        .select()
        .from(USER_LEARN_PROGRESS)
        .where(
          and(
            eq(USER_LEARN_PROGRESS.learn_test_id, testId),
            eq(USER_LEARN_PROGRESS.child_id, finalChildId)
          )
        ) // Assuming you want to count progress on the questions for this topic
        .execute();
      userProgressCountResult = userProgress.length;
    }

    const userProgressCount = userProgressCountResult || 0;

    // Determine the completion status
    let status;
    if (userProgressCount == 0) {
      status = "incomplete";
    } else if (quizCount === userProgressCount) {
      status = "completed";
    } else if (quizCount > userProgressCount) {
      status = "continue";
    } else {
      status = "unknown"; // Handle unexpected cases, if necessary
    }
  
    // Fetch the learning data for the subject that matches today's date and subjectId
    const learnData = await db
        .select()
        .from(LEARN_DATAS)
        .where(
          and(
            eq(LEARN_DATAS.learn_subject_id, subjectId),
            eq(LEARN_DATAS.show_date, today) // match today's date
          )
        )
        .execute();
    return NextResponse.json({
      quizCount,
      userProgressCount,
      status,
      subject,
      learnData:learnData[0],
      testId,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data." },
      { status: 500 }
    );
  }
}
