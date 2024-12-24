// api/children/update.js
import { db } from "@/utils";
import { CHILDREN } from "@/utils/schema";
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/jwtMiddleware";

export async function POST(req) {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response; // Return the response if authentication fails
    }

    const userId = authResult.decoded_Data.id;

    try {
        const { id, name,search_criteria } = await req.json();
// const data = await req.json()
// console.log("data",data)
        // // Update the child's data in the database
        await db
            .update(CHILDREN)
            .set({ name, search_criteria })
            .where({ id });

        return NextResponse.json({ message: "Child updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Update Child Error:", error);
        return NextResponse.json({ message: "Error updating child" }, { status: 500 });
    }
}
