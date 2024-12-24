import { db } from "@/utils";
import { NextResponse } from 'next/server';
import { CAREER_GROUP } from '@/utils/schema';
import { eq } from "drizzle-orm";

export async function GET(req, { params }) {

    const { careerGrpId } = params;
    const career_name = await db
        .select({
            career_name: CAREER_GROUP.career_name,
        })
        .from(CAREER_GROUP)
        .where(eq(CAREER_GROUP.id, careerGrpId));

    const career = career_name.length > 0 ? career_name[0].career_name : null;

    if (!career) {
        return NextResponse.json({ error: "Career not found" }, { status: 404 });
    }
    return NextResponse.json({ career }, { status: 200 });
}