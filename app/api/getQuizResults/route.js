import { calculateAgeAndWeeks } from "@/app/hooks/CalculateAgeWeek";
import { authenticate } from "@/lib/jwtMiddleware";
import { db } from "@/utils";
import { QUIZ_SEQUENCES, KNOWLEDGE_QUESTIONS, KNOWLEDGE_OPTIONS, KNOWLEDGE_PROGRESS, CHILDREN } from "@/utils/schema";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export  async function POST(req) {
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }
  
  const userData = authResult.decoded_Data;
  const userId = userData.id;
  const { childId, ageYears, ageWeeks } = await req.json();
  const quizId = 5;
console.log("userId",userId)
  try {
    let finalChildId = childId;
    let age = ageYears;
    let weeks = ageWeeks;

    if (!childId || !weeks) {
      const firstChild = await db
        .select()
        .from(CHILDREN)
        .where(eq(CHILDREN.user_id, userId))
        .limit(1)
        .execute();

      if (firstChild.length > 0) {
        const weekData = calculateAgeAndWeeks(firstChild[0].age);
        finalChildId = firstChild[0].id;
        weeks = weekData.weeks;
        age = weekData.age;
      } else {
        return NextResponse.json(
          { error: "No children found for the user." },
          { status: 404 }
        );
      }
    }

    // Step 1: Verify if the quiz for this age and week has been completed
    const completedQuiz = await db
      .select()
      .from(QUIZ_SEQUENCES)
      .where(
        and(
          eq(QUIZ_SEQUENCES.child_id, finalChildId),
          eq(QUIZ_SEQUENCES.age, age),
          eq(QUIZ_SEQUENCES.weeks, weeks),
          eq(QUIZ_SEQUENCES.isCompleted, true),
          eq(QUIZ_SEQUENCES.quiz_id, quizId)
        )
      );

    if (!completedQuiz.length) {
      return NextResponse.json({ message: "Quiz not completed for the specified week." }, { status: 404 });
    }

    // Step 2: Retrieve questions for the given age and week
    const questions = await db
      .select({
        id: KNOWLEDGE_QUESTIONS.id,
        question: KNOWLEDGE_QUESTIONS.question,
        subject: KNOWLEDGE_QUESTIONS.subject,
      })
      .from(KNOWLEDGE_QUESTIONS)
      .where(
        and(
          eq(KNOWLEDGE_QUESTIONS.age_years, age),
          eq(KNOWLEDGE_QUESTIONS.age_weeks, weeks)
        )
      );

    if (!questions.length) {
      return NextResponse.json({ message: "No questions found for the specified age and week." }, { status: 404 });
    }

    // Step 3: Retrieve options and answers for each question
    const questionIds = questions.map((q) => q.id);
    const options = await db
      .select({
        question_id: KNOWLEDGE_OPTIONS.question_id,
        option: KNOWLEDGE_OPTIONS.option,
        isAnswer: KNOWLEDGE_OPTIONS.isAnswer,
      })
      .from(KNOWLEDGE_OPTIONS)
      .where(inArray(KNOWLEDGE_OPTIONS.question_id, questionIds));

    // Step 4: Get the child’s progress and correctness for each question
    const progress = await db
      .select({
        question_id: KNOWLEDGE_PROGRESS.question_id,
        answered_option_id: KNOWLEDGE_PROGRESS.answered_option_id,
        is_correct: KNOWLEDGE_PROGRESS.is_correct,
      })
      .from(KNOWLEDGE_PROGRESS)
      .where(
        and(
          eq(KNOWLEDGE_PROGRESS.child_id, finalChildId),
          inArray(KNOWLEDGE_PROGRESS.question_id, questionIds)
        )
      );

    // Step 5: Organize questions by subject and calculate correct answers
    const subjects = questions.reduce((acc, question) => {
      if (!acc[question.subject]) {
        acc[question.subject] = { questions: [], correctCount: 0, total: 0 };
      }
      acc[question.subject].questions.push({
        ...question,
        options: options.filter((opt) => opt.question_id === question.id),
        progress: progress.find((p) => p.question_id === question.id),
      });
      acc[question.subject].total++;
      return acc;
    }, {});

    // Calculate the correct answers per subject
    progress.forEach((record) => {
      const subject = questions.find((q) => q.id === record.question_id)?.subject;
      if (subject && subjects[subject] && record.is_correct) {
        subjects[subject].correctCount++;
      }
    });

    // Format data to send
    const formattedData = Object.keys(subjects).map((subject) => ({
      subject,
      correctCount: subjects[subject].correctCount,
      total: subjects[subject].total,
      questions: subjects[subject].questions,
    }));

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return NextResponse.json({ message: "An error occurred while fetching quiz results." }, { status: 500 });
  }
}
