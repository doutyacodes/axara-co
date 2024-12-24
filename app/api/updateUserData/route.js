import { db } from "@/utils";
import { USER_DETAILS } from "@/utils/schema";
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/jwtMiddleware";
import { and, eq, ne, or, } from "drizzle-orm";

export async function POST(req) {
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response; // Return the response if authentication fails
  }

  const userId = authResult.decoded_Data.id;

  try {
    const { name, username, mobile } = await req.json();

    // Check if the username or mobile already exists (excluding the current user)
    const existingUser = await db
      .select()
      .from(USER_DETAILS)
      .where(
        and(
          ne(USER_DETAILS.id, userId), // Use neq to exclude current user
          or(
            eq(USER_DETAILS.username, username),
            eq(USER_DETAILS.mobile, mobile)
          )
        )
      );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: "Username or mobile already exists" },
        { status: 400 }
      );
    }

    // Update the user's data in the database
    await db
      .update(USER_DETAILS)
      .set({ name, username, mobile })
      .where({ id: userId });

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update User Error:", error);
    return NextResponse.json(
      { message: "Error updating user" },
      { status: 500 }
    );
  }
}
