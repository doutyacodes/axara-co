import { db } from "@/utils"; // Ensure this path is correct
import { CAREER_GROUP, USER_CAREER, USER_DETAILS } from "@/utils/schema"; // Ensure this path is correct
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/jwtMiddleware"; // Ensure this path is correct
import { eq } from "drizzle-orm";
// import { formattedAge } from "@/lib/formattedAge";

export async function GET(req) {
  // Authenticate the request
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  // Extract userId from decoded token
  const userData = authResult.decoded_Data;
  const userId = userData.id;

  try {
    // Fetch data including created_at timestamp
    // const data = await db
    //   .select({
    //     id: USER_CAREER.id,
    //     career_group_id: CAREER_GROUP.id,
    //     career_name: CAREER_GROUP.career_name, // Get career name from CAREER_GROUP table
    //     birth_date: USER_DETAILS.birth_date, // Get birth_date from USER_DETAILS table
    //     created_at: USER_CAREER.created_at, // Get created_at from USER_CAREER
    //     planType: USER_DETAILS.plan_type,
    //   })
    //   .from(USER_CAREER)
    //   .innerJoin(CAREER_GROUP, eq(USER_CAREER.career_group_id, CAREER_GROUP.id)) // Join on career_group_id
    //   .innerJoin(USER_DETAILS, eq(USER_CAREER.user_id, USER_DETAILS.id)) // Join on user_id
    //   .where(eq(USER_CAREER.user_id, userId));

    const data = await db
      .select({
        id: USER_CAREER.id, // User career ID (can be null if no career entry)
        career_group_id: CAREER_GROUP.id, // Career group ID (can be null if no career entry)
        career_name: CAREER_GROUP.career_name, // Career name from CAREER_GROUP table (can be null if no career entry)
        created_at: USER_CAREER.created_at, // Creation date from USER_CAREER (can be null if no career entry)
      })
      .from(USER_DETAILS) // Start from USER_DETAILS
      .leftJoin(USER_CAREER, eq(USER_CAREER.user_id, USER_DETAILS.id)) // Left join on USER_CAREER
      .leftJoin(CAREER_GROUP, eq(USER_CAREER.career_group_id, CAREER_GROUP.id)) // Left join on CAREER_GROUP
      .where(eq(USER_DETAILS.id, userId)); // Filter by user ID

    // Extract birth_date and calculate the age
    const age =  5 ;


    // Loop through the career data and calculate the weekData for each entry
    const carrerData = data.reduce((acc, career) => {
      if (career.career_name !== null) {
        const createdAt = career.created_at;
        const weekData = createdAt ? calculateWeekFromTimestamp(createdAt) : null;
    
        // Push the career entry with weekData into the result array
        acc.push({
          ...career,
          weekData,
        });
      }
      return acc;
    }, []);

    // Respond with the modified career data and age
    return NextResponse.json({ carrerData, age }, { status: 201 });
  } catch (error) {
    console.error("Error fetching career data:", error);
    return NextResponse.json(
      { message: "Error processing request" },
      { status: 500 }
    );
  }
}

// Helper function to calculate the week number, start of the week, and number of years since created_at
function calculateWeekFromTimestamp(timestamp) {
  const date = new Date(timestamp);
  const currentDate = new Date();

  // Set the start of the week to Monday 12:00 AM
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when the day is Sunday
  const startOfWeek = new Date(date.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0); // Reset to 12:00 AM Monday

  // Calculate the week number of the year
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;

  // Calculate the number of years since created_at
  let yearsSinceCreated = currentDate.getFullYear() - date.getFullYear(); // Use 'let' instead of 'const'

  // Check if the current month/day is earlier than created_at's month/day to adjust the year count
  if (
    currentDate.getMonth() < date.getMonth() ||
    (currentDate.getMonth() === date.getMonth() && currentDate.getDate() < date.getDate())
  ) {
    yearsSinceCreated -= 1; // Now it's safe to reassign
  }

  // Return the week number, start of the week, and number of years since created_at
  return {
    weekNumber: Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7),
    startOfWeek,
    yearsSinceCreated, // Number of years since the created_at timestamp
  };
}

