import { db } from "@/utils";
import { NEWS_REPORTS } from "@/utils/schema";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { news_id, report_text } = await req.json(); // Directly destructuring to get quizId and results array

  try {
    try {
      const insertData = {
        news_id,
        report_text,
      };

      await db.insert(NEWS_REPORTS).values(insertData);
    } catch (error) {
      console.error("Error adding report:", error);
      throw error;
    }

    return NextResponse.json(
      { message: "report added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Error processing request" },
      { status: 500 }
    );
  }
}
