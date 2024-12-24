import { authenticate } from "@/lib/jwtMiddleware";
import { db } from "@/utils";
import { CHILDREN } from "@/utils/schema";
import { NextResponse } from "next/server";



export async function POST(req) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response; // Return the response if authentication fails
    }
    
    const userId = authResult.decoded_Data.id;
    const parsedData = await req.json();
    
    await db.insert(CHILDREN).values({
      name: parsedData.name,
      gender: parsedData.gender,
      age: parsedData.age,
      user_id: userId,
    });

    return NextResponse.json({ message: "Child added successfully" }, { status: 201 });
  } catch (error) {
    console.error("Add Child Error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 400 });
  }
}
