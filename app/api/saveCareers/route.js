import { NextResponse } from "next/server";
import { db } from "@/utils";
import { eq, and } from "drizzle-orm/expressions";
import { authenticate } from "@/lib/jwtMiddleware";
import { QUIZ_SEQUENCES, USER_CAREER, USER_DETAILS, COMMUNITY, USER_COMMUNITY } from "@/utils/schema";
import { saveCareer } from "../utils/saveCareer";

export const maxDuration = 40; // This function can run for a maximum of 5 seconds
export const dynamic = "force-dynamic";

export async function POST(req) {
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userData = authResult.decoded_Data;
  const userId = userData.id;
  const data = await req.json();
  const { results } = data;

  try {
    // Fetch user details to get the country
    const userDetails = await db
      .select()
      .from(USER_DETAILS)
      .where(eq(USER_DETAILS.id, userId))
      .execute();

    if (userDetails.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 } // Not Found
      );
    }

    const country = userDetails[0].country;

    const personalityTypes = await db
      .select({
        typeSequence: QUIZ_SEQUENCES.type_sequence,
        quizId: QUIZ_SEQUENCES.quiz_id,
      })
      .from(QUIZ_SEQUENCES)
      .where(eq(QUIZ_SEQUENCES.user_id, userId))
      .execute();

    const type1 = personalityTypes.find((pt) => pt.quizId === 1)?.typeSequence;
    const type2 = personalityTypes.find((pt) => pt.quizId === 2)?.typeSequence;
    console.log("results", results);

    const careerNames = results.map((item) => item.career_name);
    console.log("Career Names:", careerNames);

    // Call saveCareer and handle the response
    const existingCareers = await db
      .select()
      .from(USER_CAREER) // Assuming USER_CAREERS is the table where career data is stored
      .where(eq(USER_CAREER.user_id, userId))
      .execute();

    const isFirstTime = existingCareers.length === 0;

    if (existingCareers.length >= 5) {
      return NextResponse.json(
        { message: "Career limit reached. You can only save up to 5 careers." },
        { status: 400 } // Bad Request
      );
    }

    // Save the careers
    const saveCareerResponse = await saveCareer(
      careerNames,
      country,
      userId,
      type1,
      type2
    );

    // Loop through career names to check or create the communities
    for (const career of careerNames) {
      // Check if the global community exists
      const globalCommunity = await db
        .select()
        .from(COMMUNITY)
        .where(and(eq(COMMUNITY.career, career), eq(COMMUNITY.global, 'yes')))
        .execute();

      let globalCommunityId;

      // If the global community does not exist, create it
      if (globalCommunity.length === 0) {
        const [insertGlobal] = await db
          .insert(COMMUNITY)
          .values({
            career,
            global: 'yes',
            country: null, // Global community does not need a country
          })
          .execute();

        globalCommunityId = insertGlobal.insertId;
      } else {
        globalCommunityId = globalCommunity[0].id;
      }

      // Check if the country-specific community exists
      const countryCommunity = await db
        .select()
        .from(COMMUNITY)
        .where(
          and(eq(COMMUNITY.career, career), eq(COMMUNITY.global, 'no'), eq(COMMUNITY.country, country))
        )
        .execute();

      let countryCommunityId;

      // If the country-specific community does not exist, create it
      if (countryCommunity.length === 0) {
        const [insertCountry] = await db
          .insert(COMMUNITY)
          .values({
            career,
            global: 'no',
            country,
          })
          .execute();

        countryCommunityId = insertCountry.insertId;
      } else {
        countryCommunityId = countryCommunity[0].id;
      }

      // Add the user to the global community if not already added
      const globalUserCommunity = await db
        .select()
        .from(USER_COMMUNITY)
        .where(
          and(eq(USER_COMMUNITY.user_id, userId), eq(USER_COMMUNITY.community_id, globalCommunityId))
        )
        .execute();

      if (globalUserCommunity.length === 0) {
        await db
          .insert(USER_COMMUNITY)
          .values({
            user_id: userId,
            community_id: globalCommunityId,
            country: null, // No country for global community
          })
          .execute();
      }

      // Add the user to the country-specific community if not already added
      const countryUserCommunity = await db
        .select()
        .from(USER_COMMUNITY)
        .where(
          and(eq(USER_COMMUNITY.user_id, userId), eq(USER_COMMUNITY.community_id, countryCommunityId))
        )
        .execute();

      if (countryUserCommunity.length === 0) {
        await db
          .insert(USER_COMMUNITY)
          .values({
            user_id: userId,
            community_id: countryCommunityId,
            country, // Country-specific community
          })
          .execute();
      }
    }

    return NextResponse.json(
      { message: saveCareerResponse.message, isFirstTime },
      { status: saveCareerResponse.status }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "An unexpected error occurred" },
      { status: 500 } // Internal Server Error
    );
  }
}
