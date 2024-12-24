import { db } from "@/utils"; // Ensure this path is correct
import { eq, and, sql, between } from "drizzle-orm";
import { LEARN_SUBJECTS, LEARN_TEST_SCORES, CHILDREN } from "@/utils/schema"; // Import your tables
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/jwtMiddleware"; // Ensure this path is correct
import { calculateAge } from "@/lib/ageCalculate";


export async function GET(req, { params }) {
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userData = authResult.decoded_Data;
  const parentId = userData.userId;
  const { childId } = params;

  try {

    const { searchParams } = new URL(req.url);
    const relativeYear = parseInt(searchParams.get("year"), 10); // Year relative to created_at
    const relativeMonth = parseInt(searchParams.get("month"), 10); // Month relative to created_at

  if (relativeYear < 1 || relativeMonth < 1 || relativeMonth > 12) {
    return NextResponse.json(
      { message: "Invalid year or month parameters. Ensure year > 0 and 1 <= month <= 12." },
      { status: 400 }
    );
  }

  // Get child's join date
  const child = await db
    .select({
      created_at: CHILDREN.created_at,
    })
    .from(CHILDREN)
    .where(eq(CHILDREN.id, childId))
    .execute();

  if (!child || !child[0]?.created_at) {
    return NextResponse.json(
      { message: "Child not found. Please provide a valid child ID." },
      { status: 404 }
    );
  }

  const childJoinDate = new Date(child[0].created_at);

  // Calculate start and end dates for the given relative year and month
  const startDate = new Date(childJoinDate);
  startDate.setFullYear(startDate.getFullYear() + (relativeYear - 1));
  startDate.setMonth(startDate.getMonth() + (relativeMonth - 1));
  startDate.setDate(1);

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0); // Last day of the calculated month

  const currentDate = new Date();
  if (currentDate <= endDate) {
    return NextResponse.json(
      { message: "Feedback for this period will be available once the month is completed." },
      { status: 200 }
    );
  }

  // Fetch subjects for the child's age
  const age = calculateAge(childJoinDate);
  const subjects = await db
    .select({
      id: LEARN_SUBJECTS.id,
      subject: LEARN_SUBJECTS.subject,
    })
    .from(LEARN_SUBJECTS)
    .where(eq(LEARN_SUBJECTS.age, age))
    .execute();

  // Fetch test results for the calculated date range
  const testResults = await db
    .select({
      subject_id: LEARN_TEST_SCORES.subject_id,
      total_percentage: LEARN_TEST_SCORES.total_percentage,
    })
    .from(LEARN_TEST_SCORES)
    .where(
      and(
        eq(LEARN_TEST_SCORES.child_id, childId),
        between(LEARN_TEST_SCORES.created_at, startDate, endDate)
      )
    )
    .execute();

  // Calculate average percentage per subject
  const subjectScores = {};
  testResults.forEach((result) => {
    if (!subjectScores[result.subject_id]) {
      subjectScores[result.subject_id] = { total: 0, count: 0 };
    }
    subjectScores[result.subject_id].total += result.total_percentage;
    subjectScores[result.subject_id].count += 1;
  });

  // Generate feedback
  const feedback = subjects.map((subject) => {
    const scores = subjectScores[subject.id];
    const avgPercentage = scores ? scores.total / scores.count : 0;

    let subjectFeedback;
    if (avgPercentage >= 90) {
      subjectFeedback = `Excellent progress in ${subject.subject}! You've mastered this month's content with perfect scores. Your dedication and understanding shine through in your work. Keep maintaining this exceptional standard!`;
    } else if (avgPercentage >= 70) {
      subjectFeedback = `Good performance in ${subject.subject}! You're showing great understanding, though there's still room to grow. Focus on the challenging topics and you'll be reaching perfect scores soon.`;
    } else if (avgPercentage >= 50) {
      subjectFeedback = `Steady progress in ${subject.subject}, but we see potential for more. Try reviewing your study materials before tests and don't hesitate to ask for help with topics you find challenging.`;
    } else {
      subjectFeedback = `We notice you're having some difficulties with ${subject.subject}. Let's work on strengthening your foundation - try reviewing past lessons and practice regularly. Remember, every small improvement counts!`;
    }

    return {
      subject: subject.subject,
      averagePercentage: avgPercentage,
      feedback: subjectFeedback,
    };
  });

   // Calculate consolidated feedback based on average performance across all subjects
   const totalPercentage = testResults.reduce((acc, result) => acc + result.total_percentage, 0);
   const avgTotalPercentage = totalPercentage / testResults.length;

   let consolidatedFeedback;
   if (avgTotalPercentage >= 90) {
     consolidatedFeedback = "Phenomenal performance this period! You're excelling across all subjects. Keep up the great work!";
   } else if (avgTotalPercentage >= 75) {
     consolidatedFeedback = "Excellent progress! Your performance across subjects is impressive, and you're well on your way to achieving even greater success.";
   } else if (avgTotalPercentage >= 50) {
     consolidatedFeedback = "You're making steady progress. Keep focusing on your weak areas and continue working hard to improve!";
   } else {
     consolidatedFeedback = "You're facing some challenges, but don't worry – learning is a journey! Focus on building strong foundational knowledge and seek help when needed.";
   }

  return NextResponse.json({ feedback, consolidatedFeedback }, { status: 200 });
} catch (error) {
    console.error("Error fetching course data:", error);
    return NextResponse.json(
      { message: "Error processing request" },
      { status: 500 }
    );
  }
}
