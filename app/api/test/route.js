import { NextResponse } from "next/server"

export async function GET(request) {
    console.log("Cron job ran at:",new Date())
    return new NextResponse("Cron job ran at: " + new Date())
}