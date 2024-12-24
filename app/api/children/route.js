import { db } from "@/utils";
import { CHILDREN, USER_DETAILS } from "@/utils/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authenticate } from "@/lib/jwtMiddleware";
import { calculateAgeAndWeeks } from "@/app/hooks/CalculateAgeWeek";

export async function GET(req) {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response; // Return the response if authentication fails
    }
    
    const userId = authResult.decoded_Data.id;
    function calculateAge(dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
    
        // Adjust age if the birth date hasn't occurred yet this year
        if (
            today.getMonth() < birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
        ) {
            age--;
        }
    
        return age;
    }
  
    
    
    try {
        const userDetails = await db
        .select()
        .from(USER_DETAILS)
        .where(eq(USER_DETAILS.id, userId))
        .execute();

    if (userDetails.length === 0) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const user = userDetails[0];
        const children = await db
            .select()
            .from(CHILDREN)
            .where(eq(CHILDREN.user_id, userId))
            .execute();

            const childrenWithAge = children.map(child => {
                const age = calculateAge(child.age); // Call the function here to calculate the age
                const dob = child.age;
                const weekData = calculateAgeAndWeeks(child.age);
                const weeks = weekData.weeks;
                return { ...child, age ,dob,weeks}; // Add the calculated age to each child object
            });

        return NextResponse.json({ data: childrenWithAge,user });
    } catch (error) {
        console.error("Fetch Children Error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
