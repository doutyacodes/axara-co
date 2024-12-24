import { NextResponse } from "next/server";
import { authenticate } from "@/lib/jwtMiddleware";
import {
  USER_RESULT_CAREER,
  QUIZ_SEQUENCES,
  USER_DETAILS,
  USER_CAREER,
  CAREER_GROUP,
} from "@/utils/schema";
import { eq, and } from "drizzle-orm";
import { db } from "@/utils";
import axios from "axios";

export const maxDuration = 60; // This function can run for a maximum of 5 seconds
export const dynamic = "force-dynamic";

export async function GET(req) {
  console.log("got");
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userData = authResult.decoded_Data;
  const userId = userData.id;

  const url = new URL(req.url);
  const careerName = url.searchParams.get("career_name");
  const today = new Date(); // Get today's date
  const currentYear = today.getFullYear();

  const country_db = await db
    .select({
      country: USER_DETAILS.country,
      birth_date: USER_DETAILS.birth_date,
      education_country: USER_DETAILS.education_country,
    })
    .from(USER_DETAILS)
    .where(eq(USER_DETAILS.id, userId))
    .execute();
  // console.log("country_db",country_db);
  const country = country_db[0].country; // Access the country
  const education_country = country_db[0].education_country; // Access the country
  let finalAge = 18;
  if (country_db.length > 0) {
    const birthDate = new Date(country_db[0].birth_date); // Access the birth date from the first result
    // Calculate age in years
    let ageInNumber = today.getFullYear() - birthDate.getFullYear();

    // Adjust for whether the birthday has occurred this year
    const hasBirthdayPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());

    finalAge = hasBirthdayPassed ? ageInNumber : ageInNumber - 1;

    console.log("country_db", finalAge); // Log the calculated age
  } else {
    console.log("No user found with the given ID");
  }

  if (careerName) {
    const existingCareer = await db
      .select({
        career_name: USER_RESULT_CAREER.career_name,
        description: USER_RESULT_CAREER.description,
      })
      .from(USER_RESULT_CAREER)
      .where(
        and(
          eq(USER_RESULT_CAREER.career_name, careerName),
          eq(USER_RESULT_CAREER.user_id, userId)
        )
      )
      .execute();

    //   console.log("Existing career result:", existingCareer); // Log the result from the query

    if (existingCareer.length > 0) {
      
        const userCareers = await db
        .select({
          career_name: CAREER_GROUP.career_name,
        })
        .from(USER_CAREER)
        .innerJoin(CAREER_GROUP, eq(USER_CAREER.career_group_id, CAREER_GROUP.id))
        .where(eq(USER_CAREER.user_id, userId))
        .execute();
        const userCareerNames = userCareers.map(career => career.career_name);


        const parsedResult =  JSON.parse(existingCareer[0].description)

        const updatedResults = parsedResult.map(career => ({
          ...career,
          isCareerMoved: userCareerNames.includes(career.career_name), // Add isCareerMoved field
        }));

      return NextResponse.json(
        {
          result: updatedResults,
          isFirstTimeStoring: false,
        },
        { status: 200 }
      );
    } else {
      console.log("No existing career found.");
    }
  } else {
    console.log("No career name provided in the request.");
  }

  // Get quiz sequences
  // Get quiz sequences
  const personality2 = await db
    .select({
      typeSequence: QUIZ_SEQUENCES.type_sequence,
    })
    .from(QUIZ_SEQUENCES)
    .where(
      and(eq(QUIZ_SEQUENCES.user_id, userId), eq(QUIZ_SEQUENCES.quiz_id, 1))
    )
    .execute();

  const type2 = personality2[0].typeSequence;

  const personality1 = await db
    .select({
      typeSequence: QUIZ_SEQUENCES.type_sequence,
    })
    .from(QUIZ_SEQUENCES)
    .where(
      and(eq(QUIZ_SEQUENCES.user_id, userId), eq(QUIZ_SEQUENCES.quiz_id, 1))
    )
    .execute();

  const type1 = personality1[0].typeSequence;

  // Adjust the prompt based on whether a specific career name was passed
  let prompt;
  if (careerName && type1) {
    prompt = `Provide a JSON array with a single element, containing detailed information for the career named "${careerName}" for an individual with personality type ${type1} and RIASEC interest types of ${type2}. The fields should be:
      {
        "career_name": "A brief title of the career.",
        "reason_for_recommendation": "Why this career is suitable for someone with these interests.",
        "match": "Percentage of how the user is compatible with this career.Only the number is needed",
        "expenses": "Price range to complete this career, in local currency of ${education_country ? education_country:country} , mention the country and explain shortly in a sentence or two.",
        "salary": "low level , mid level and high level salary scale in the country ${country ? country:education_country} in a short paragraph.",
        "present_trends": "Current trends and opportunities in the field.",
        "future_prospects": "Predictions and potential growth in this career from the year ${currentYear} to ${
      currentYear + 5
    }.",
        "beyond_prospects": "Predictions and potential growth in this career from the year ${
          currentYear + 6
        } and beyond.",
        "currentYear":${currentYear},
        "tillYear":${currentYear + 5},
        "user_description": "Personality traits, strengths, and preferences that make this career a good fit.",
        "leading_country": "Name the country with most opportunities for the career ${careerName} with short description including the opportunity(in a sentence or two).",
        "similar_jobs": "Provide similar careers name in a sentence for the career "${careerName}" for an individual with personality type ${type1} and RIASEC interest types of ${type2}."
      }.
      Ensure that the response is a valid JSON array with exactly one object, no explanations, and no additional text, using the specified field names, but do not include the terms '${type1}' and '${type2}' in the data.`;
  } else {
    return NextResponse.json(
      { error: "No career name or type sequence provided." },
      { status: 400 }
    );
  }

  //   console.log("prompt", prompt);

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // or 'gpt-4' if you have access
        messages: [{ role: "user", content: prompt }],
        max_tokens: 5000, // Adjust the token limit as needed
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // console.log("OpenAI response:", response.data); // Log the response data

    let responseText = response.data.choices[0].message.content.trim();
    responseText = responseText.replace(/```json|```/g, "").trim();

    // Check if this is the user's first time storing a career result
    const careerResults = await db
      .select()
      .from(USER_RESULT_CAREER)
      .where(eq(USER_RESULT_CAREER.user_id, userId))
      .execute();

    const isFirstTimeStoring = careerResults.length === 0;
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (error) {
      console.error("Error while parsing the JSON response:", error);
      console.error("Response text:", responseText); // Log the actual text to see the exact issue
      return NextResponse.json(
        { error: "Failed to parse response data." },
        { status: 500 }
      );
    }

    // Store the new result in the user_result_career table
    await db
      .insert(USER_RESULT_CAREER)
      .values({
        user_id: userId,
        career_name: careerName,
        description: JSON.stringify(parsedResponse), // Save as a string
      })
      .execute();

    return NextResponse.json(
      { result: parsedResponse, isFirstTimeStoring },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching data from OpenAI or storing in DB:", error);
    return NextResponse.json(
      { error: "Failed to process the request." },
      { status: 500 }
    );
  }
}
