import { db } from "@/utils";
import {
  KNOWLEDGE_QUESTIONS,
  KNOWLEDGE_OPTIONS,
  KNOWLEDGE_PROGRESS,
  CHILDREN,
} from "@/utils/schema";
import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { authenticate } from "@/lib/jwtMiddleware";
import { calculateAgeAndWeeks } from "@/app/hooks/CalculateAgeWeek";
import axios from "axios";

export async function POST(req) {
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userData = authResult.decoded_Data;
  const userId = userData.id;
  const { childId, ages, weekData } = await req.json();
  const quizId = 5;

  let finalChildId = childId;
  let age = ages;
  let weeks = weekData;
  console.log("data",`finalChildId :${finalChildId},age :${age},week :${weeks},`)

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
    const quizWithOption = await db
      .select({
        questionId: KNOWLEDGE_QUESTIONS.id,
        questionText: KNOWLEDGE_QUESTIONS.question,
        answerId: KNOWLEDGE_OPTIONS.id,
        answerText: KNOWLEDGE_OPTIONS.option,
        isAnswer: KNOWLEDGE_OPTIONS.isAnswer,
      })
      .from(KNOWLEDGE_QUESTIONS)
      .leftJoin(
        KNOWLEDGE_OPTIONS,
        eq(KNOWLEDGE_QUESTIONS.id, KNOWLEDGE_OPTIONS.question_id)
      )
      .where(
        and(
          eq(KNOWLEDGE_QUESTIONS.quiz_id, quizId),
          eq(KNOWLEDGE_QUESTIONS.age_years, age),
          eq(KNOWLEDGE_QUESTIONS.age_weeks, weeks)
        )
      )
      .execute();

    if (quizWithOption.length === 0) {
      const prompt = `Generate a knowledge evaluation test for a child with age ${age} years and ${weeks} weeks. Include exactly 5 subjects, each with 5 multiple-choice questions. Ensure the data follows this structure:
[
  {
    "subject": "subject_1_name",
    "questions": [
      {
        "question": "question_1",
        "options": [
          { "text": "option1", "isAnswer": true },
          { "text": "option2", "isAnswer": false },
          { "text": "option3", "isAnswer": false },
          { "text": "option4", "isAnswer": false }
        ]
      },
      {
        "question": "question_2",
        "options": [
          { "text": "option1", "isAnswer": true },
          { "text": "option2", "isAnswer": false },
          { "text": "option3", "isAnswer": false },
          { "text": "option4", "isAnswer": false }
        ]
      },
      {
        "question": "question_3",
        "options": [
          { "text": "option1", "isAnswer": true },
          { "text": "option2", "isAnswer": false },
          { "text": "option3", "isAnswer": false },
          { "text": "option4", "isAnswer": false }
        ]
      },
      {
        "question": "question_4",
        "options": [
          { "text": "option1", "isAnswer": true },
          { "text": "option2", "isAnswer": false },
          { "text": "option3", "isAnswer": false },
          { "text": "option4", "isAnswer": false }
        ]
      },
      {
        "question": "question_5",
        "options": [
          { "text": "option1", "isAnswer": true },
          { "text": "option2", "isAnswer": false },
          { "text": "option3", "isAnswer": false },
          { "text": "option4", "isAnswer": false }
        ]
      }
    ]
  },
  {
    "subject": "subject_2_name",
    "questions": [...similar structure as above...]
  },
  ...
]
Ensure that only 5 subjects are included, each with exactly 5 questions.`;


      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4000,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      let responseText = response.data.choices[0].message.content.trim();
      responseText = responseText.replace(/```json|```/g, "").trim();
      const generatedQuestions = JSON.parse(responseText);

      for (const subject of generatedQuestions) {
        for (const question of subject.questions) {
          const insertedQuestion = await db
            .insert(KNOWLEDGE_QUESTIONS)
            .values({
              question: question.question,
              quiz_id: quizId,
              subject: subject.subject,
              age_years: age,
              age_weeks: weeks,
            })
            .execute();
            console.log("insertedQuestion",insertedQuestion)

          for (const option of question.options) {
            await db
              .insert(KNOWLEDGE_OPTIONS)
              .values({
                question_id: insertedQuestion[0].insertId,
                option: option.text,
                isAnswer: option.isAnswer ? "yes" : "no",
                quiz_id: quizId,
              })
              .execute();
          }
        }
      }
    }

    // Track progress
    let totalAnswered = 0;
    const progress = await db
      .select({
        isStarted: sql`IF(COUNT(${KNOWLEDGE_PROGRESS.id}) > 0, 1, 0)`,
      })
      .from(KNOWLEDGE_PROGRESS)
      .where(
        and(
          eq(KNOWLEDGE_PROGRESS.user_id, userId),
          eq(KNOWLEDGE_PROGRESS.quiz_id, quizId),
          eq(KNOWLEDGE_PROGRESS.child_id, finalChildId),
          eq(KNOWLEDGE_PROGRESS.age_years, age),
          eq(KNOWLEDGE_PROGRESS.age_weeks, weeks)
        )
      )
      .execute();

    if (progress[0].isStarted) {
      const totalQuestionsAnswered = await db
        .select({
          countQuestionIds: sql`COUNT(${KNOWLEDGE_PROGRESS.question_id})`,
        })
        .from(KNOWLEDGE_PROGRESS)
        .where(
          and(
            eq(KNOWLEDGE_PROGRESS.child_id, finalChildId),
            eq(KNOWLEDGE_PROGRESS.quiz_id, quizId),
            eq(KNOWLEDGE_PROGRESS.age_years, age),
            eq(KNOWLEDGE_PROGRESS.age_weeks, weeks)
          )
        )
        .execute();

      totalAnswered = totalQuestionsAnswered[0]?.countQuestionIds || 0;
    }

    // Group answers by question
    const result = quizWithOption.reduce((acc, curr) => {
      const { questionId, questionText, answerId, answerText, isAnswer } = curr;
      if (!acc[questionId]) {
        acc[questionId] = {
          id: questionId,
          question: questionText,
          answers: [],
        };
      }
      acc[questionId].answers.push({
        id: answerId,
        text: answerText,
        isAnswer,
      });
      return acc;
    }, {});

    // console.log("questions",result)
    return NextResponse.json({
      questions: Object.values(result),
      quizProgress:totalAnswered,
      progress: {
        isStarted: progress[0].isStarted,
        totalAnswered,
      },
    });
  } catch (error) {
    console.error("Error fetching or generating questions:", error);
    return NextResponse.json(
      { message: "Error processing request" },
      { status: 500 }
    );
  }
}
