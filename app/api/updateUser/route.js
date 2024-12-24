import { NextResponse } from "next/server";
import { db } from "@/utils";
import { USER_DETAILS } from "@/utils/schema";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm/expressions";
import { authenticate } from "@/lib/jwtMiddleware";

export async function PUT(req) {

    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
        }

    const userData = authResult.decoded_Data;
    const userId = userData.id;

    try {
        const data = await req.json();

         // Check if the new username is already in use
         if (data.username) {
            const [existingUser] = await db
                .select()
                .from(USER_DETAILS)
                .where(eq(USER_DETAILS.username, data.username))
                .execute();

            // If an existing user with the same username is found and it's not the current user, return an error
            if (existingUser && existingUser.id !== userId) {
                return NextResponse.json(
                    { message: "Username is already taken" },
                    { status: 409 } // Conflict
                );
            }
        }

        // Update user details in the database
        const result = await db.update(USER_DETAILS)
                        .set({
                        name: data?.name,
                        username: data?.username,
                        gender: data?.gender,
                        mobile: data?.mobile,
                        birth_date: new Date(data?.birth_date),
                        password: data?.password, 
                        education: data?.education,
                        student: data?.student,
                        college: data?.college,
                        university: data?.university,
                        yearOfPassing: data?.yearMonthOfPassing ? data?.yearMonthOfPassing.split('-')[0] : null, // Extract year
                        monthOfPassing: data?.yearMonthOfPassing ? data?.yearMonthOfPassing.split('-')[1] : null, // Extract month
                        })
                        .where(eq(USER_DETAILS.id, userId)); 
        console.log("Got daat result ", result);
        if (!result) {
            return NextResponse.json(
              { message: "User update failed" },
              { status: 500 }
            );
          }


        return NextResponse.json(
        {
            message: "User updated successfully",
        },
        { status: 201 } // OK
        );
    } catch (error) {
        console.error("Error in PUT:", error);
        return NextResponse.json(
          { message: error.message || "An unexpected error occurred" },
          { status: 500 } // Internal Server Error
        );
      }
}
