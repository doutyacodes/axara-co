import { db } from '@/utils';
import { SUBJECT_QUIZ, SUBJECT_QUIZ_OPTIONS, SUBJECT_USER_PROGRESS, SUBJECTS, TEST_ANSWERS, TEST_QUESTIONS, USER_DETAILS, USER_SUBJECT_COMPLETION } from '@/utils/schema';
import { NextResponse } from 'next/server';
import { and, eq, inArray, sql } from 'drizzle-orm'; // Ensure these imports match your ORM version
import { authenticate } from '@/lib/jwtMiddleware';
import { calculateAge } from '@/lib/ageCalculate';
import axios from 'axios';

export const maxDuration = 60; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {

    // Authenticate user
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const userData = authResult.decoded_Data;
    const userId = userData.id;

    const { subjectId } = params;
    
    if (!subjectId) {
        return NextResponse.json({ message: 'Invalid subjectId' }, { status: 400 });
    }

    try {

        const birthDateResult = await db
            .select({ birth_date: USER_DETAILS.birth_date })
            .from(USER_DETAILS)
            .where(eq(USER_DETAILS.id, userId));

        const birth_date = birthDateResult[0]?.birth_date;
        const age = calculateAge(birth_date);
        console.log("age", age);

        const subject = await db
            .select({ subjectName: SUBJECTS.subject_name })
            .from(SUBJECTS)
            .where(eq(SUBJECTS.subject_id, subjectId));

         const subjectName = subject[0].subjectName
        
        // Check if questions exist in the database for the given subjectName and age
        const existingQuestions = await db
            .select({
                questionId: SUBJECT_QUIZ.id,
                question: SUBJECT_QUIZ.question,
                optionId: SUBJECT_QUIZ_OPTIONS.id,
                option_text: SUBJECT_QUIZ_OPTIONS.option_text,
                is_answer: SUBJECT_QUIZ_OPTIONS.is_answer,
            })
            .from(SUBJECT_QUIZ)
            .innerJoin(SUBJECT_QUIZ_OPTIONS, eq(SUBJECT_QUIZ.id, SUBJECT_QUIZ_OPTIONS.question_id))
            .where(
                and(
                    eq(SUBJECT_QUIZ.subject_id, subjectId),
                    eq(SUBJECT_QUIZ.age, age)
                )
            )

            let totalAnswered = 0;

            // Check if isStarted is true in the  table
            const checkProgress = await db
                                .select({
                                    isStarted: USER_SUBJECT_COMPLETION.isStarted
                                })
                                .from(USER_SUBJECT_COMPLETION)
                                .where(
                                    and(
                                        eq(USER_SUBJECT_COMPLETION.user_id, userId),
                                        eq(USER_SUBJECT_COMPLETION.subject_id, subjectId)
                                    )
                                )
                                .execute();

            // Proceed only if a progress exists and isStarted is true
            if (checkProgress.length > 0 && checkProgress[0].isStarted) { 
                // Geting the total no of saved quiz from SUBJECT_USER_PROGRESS if isStarted is true
                const totalQuestionsAnswered = await db
                .select({
                    countQuestionIds: sql`COUNT(${SUBJECT_USER_PROGRESS.quiz_id})`
                })
                .from(SUBJECT_USER_PROGRESS)
                .where(
                    and(
                        eq(SUBJECT_USER_PROGRESS.user_id, userId),
                        eq(SUBJECT_USER_PROGRESS.subject_id, subjectId)
                    )
                )
                .execute();

                // The total number of questions answered
                totalAnswered = totalQuestionsAnswered[0]?.countQuestionIds || 0;
            }


         // If existing questions are found, format them and return
         if (existingQuestions.length > 0) {

            console.log("Previously exist");
            

            const formattedQuestions = existingQuestions.reduce((acc, row) => {
                const {questionId, question, optionId, option_text, is_answer } = row;

                // Find or create a question entry in the accumulator
                let questionEntry = acc.find(q => q.question === question);
                if (!questionEntry) {
                    questionEntry = { id: questionId, question, options: [] };
                    acc.push(questionEntry);
                }

                // Push the option to the options array
                questionEntry.options.push({
                    id: optionId,
                    text: option_text,
                    is_answer: is_answer === "yes" ? "yes" : "no", // Ensure is_answer is correctly set
                });

                return acc;
            }, []);

            return NextResponse.json({quizProgress: totalAnswered, questions: formattedQuestions}, { status: 200 });
        }
        
        const prompt = `
                    Create 9 multiple-choice questions in ${subjectName} for a ${age} year old.
                   Each question should have 4 answer options, and one option should be marked as the correct answer using "is_answer": "yes" for the correct option and "is_answer": "no" for the others.Make sure no questions and the options being repeated and the questions must be apt for the age ${age}. The questions should be unique and difficulty level should be hard.  
                    Return all questions in a single array with no additional commentary or difficulty labels. The format for each question should be:

                    {
                    "question": "Question text here",
                    "options": [
                        { "text": "Option 1", "is_answer": "no" },
                        { "text": "Option 2", "is_answer": "yes" },
                        { "text": "Option 3", "is_answer": "no" },
                        { "text": "Option 4", "is_answer": "no" }
                    ]
                    }

                    Only return the array of questions, nothing else.
                    `;

              const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                  model: "gpt-4o-mini", // or 'gpt-4' if you have access
                  messages: [{ role: "user", content: prompt }],
                  max_tokens: 2500,
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
            //   console.log("responseText",responseText);
              const parsedData = JSON.parse(responseText);

            // Save questions and options to the database
            const questionIds = [];
            const questionsWithOptions = []; // Array to store questions with their options

            for (const questionData of parsedData) {
                // Insert question into SUBJECT_QUIZ
                const questionInsert = await db.insert(SUBJECT_QUIZ).values({
                    question: questionData.question,
                    subject_id: subjectId, 
                    age: age
                });
            
                const questionId = questionInsert[0].insertId; // Adjust this according to your ORM's way of retrieving last insert ID
                questionIds.push(questionId); // Store the question ID for future reference
            
                const optionsArray = []; // Array to store options for the current question
            
                for (const option of questionData.options) {
                    // Insert options into SUBJECT_QUIZ_OPTIONS
                    const optionInsert = await db.insert(SUBJECT_QUIZ_OPTIONS).values({
                        question_id: questionId,
                        option_text: option.text,
                        is_answer: option.is_answer, // Convert to boolean
                    });
            
                    const optionId = optionInsert[0].insertId;
                    optionsArray.push({
                        id: optionId,
                        text: option.text,
                        is_answer: option.is_answer, 
                    });
                }
            
                // Push the question with its options to the main array
                questionsWithOptions.push({
                    id: questionId,
                    question: questionData.question,
                    options: optionsArray,
                });
            }
            
            // Prepare the response with quiz progress and questions
            return NextResponse.json({
                quizProgress: totalAnswered,
                questions: questionsWithOptions, // Return the questions with options
            }, { status: 200 });

    } catch (error) {
        console.error("Error fetching questions and answers:", error);
        return NextResponse.json({ message: 'Error fetching questions and answers' }, { status: 500 });
    }
}