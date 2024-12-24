import { NextResponse } from "next/server";
import { db } from "@/utils";
import { ACTIVITIES, CHILDREN, LEARN_SUBJECTS, USER_ACTIVITIES } from "@/utils/schema";
import { authenticate } from "@/lib/jwtMiddleware";
import { and, desc, eq } from "drizzle-orm";
import { calculateAgeAndWeeks } from "@/app/hooks/CalculateAgeWeek";

export async function POST(req) {
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userId = authResult.decoded_Data.id;
  const { age, grade = null,childId } = await req.json(); // Accept `limit` from the request, default to 10

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required." },
      { status: 400 }
    );
  }

  let finalAge = age;
  let finalGrade = grade;
  let finalChildId = childId;

  if (!finalAge || !finalGrade||!finalChildId) {
    // If `age` is null, fetch the first child's age
    const firstChild = await db
      .select()
      .from(CHILDREN)
      .where(eq(CHILDREN.user_id, userId))
      .limit(1)
      .execute();

    if (firstChild.length > 0) {
      const calculatedAge = calculateAgeAndWeeks(firstChild[0].age);
      finalAge = calculatedAge.age;
      finalGrade = firstChild[0].grade;
      finalChildId = firstChild[0].id;
    } else {
      return NextResponse.json(
        { error: "No children found for the user." },
        { status: 404 }
      );
    }
  }

  const getTodayDateInIST = () => {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (UTC+5:30)
    const istNow = new Date(now.getTime() + offset);

    // Format as YYYY-MM-DD
    const year = istNow.getUTCFullYear();
    const month = String(istNow.getUTCMonth() + 1).padStart(2, "0");
    const day = String(istNow.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDateInIST();
  // console.log("date and age",`${finalAge}"+"${todayDate}`)
  try {
    let learnSubjects;
    if (finalGrade) {
      // learnSubjects = await db
      //   .select()
      //   .from(LEARN_SUBJECTS)
      //   .where(
      //     and(
      //       eq(LEARN_SUBJECTS.show_date, todayDate),
      //       eq(LEARN_SUBJECTS.grade, finalGrade)
      //     )
      //   )
      //   .limit()
      //   .execute();


      learnSubjects = await db
      .select()
      .from(LEARN_SUBJECTS)
      .where(
          eq(LEARN_SUBJECTS.grade, finalGrade)
      )
      .limit()
      .execute();
    } else {
      // learnSubjects = await db
      //   .select()
      //   .from(LEARN_SUBJECTS)
      //   .where(
      //     and(
      //       eq(LEARN_SUBJECTS.show_date, todayDate),
      //       eq(LEARN_SUBJECTS.age, finalAge)
      //     )
      //   )
      //   .limit()
      //   .execute();
      learnSubjects = await db
        .select()
        .from(LEARN_SUBJECTS)
        .where(
            eq(LEARN_SUBJECTS.age, finalAge)
        )
        .limit()
        .execute();
    }

    // Fetch the latest weekly activity based on age
    const latestWeeklyActivity = await db
      .select()
      .from(ACTIVITIES)
      .where(and(eq(ACTIVITIES.age, finalAge), eq(ACTIVITIES.activity_type, "week")))
      .orderBy(desc(ACTIVITIES.created_at))
      .limit(1)
      .execute();
    
    console.log("latestWeeklyActivity", latestWeeklyActivity);

    // Check if the weekly activity is completed by the user
    let weeklyActivityStatus = null;
    if (latestWeeklyActivity.length > 0) {
      const weeklyActivityId = latestWeeklyActivity[0].id;
      const completionCheck = await db
        .select()
        .from(USER_ACTIVITIES)
        .where(
          and(
            eq(USER_ACTIVITIES.user_id, userId),
            eq(USER_ACTIVITIES.child_id, finalChildId),
            eq(USER_ACTIVITIES.activity_id, weeklyActivityId)
          )
        )
        .execute();
      weeklyActivityStatus = completionCheck.length > 0;
    }

    return NextResponse.json({
      learnSubjects,
      weeklyActivity: latestWeeklyActivity[0] ? { 
        ...latestWeeklyActivity[0], 
        completed: weeklyActivityStatus,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching learn_subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch learn_subjects." },
      { status: 500 }
    );
  }
}
