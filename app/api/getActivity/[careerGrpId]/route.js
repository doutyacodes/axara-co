import { db } from '@/utils';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/jwtMiddleware';
import { CAREER_GROUP, USER_DETAILS, ACTIVITIES, USER_ACTIVITIES } from '@/utils/schema';
import { calculateAge } from '@/lib/ageCalculate';
import { eq, and } from 'drizzle-orm';
import axios from 'axios';

export const maxDuration = 40; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {

    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const userData = authResult.decoded_Data;
    const userId = userData.id;

    const { careerGrpId } = params;
    console.log(careerGrpId)

    const user_data = await db
        .select({
            birth_date: USER_DETAILS.birth_date,
            country: USER_DETAILS.country
        })
        .from(USER_DETAILS)
        .where(eq(USER_DETAILS.id, userId))
    const birth_date = user_data[0].birth_date
    const age = calculateAge(birth_date)
    const country = user_data[0].country

    const career_name = await db
        .select({
            career_name: CAREER_GROUP.career_name,
        })
        .from(CAREER_GROUP)
        .where(eq(CAREER_GROUP.id, careerGrpId))
    const career = career_name[0].career_name


    const existingActivities = await db
        .select({
            activity_id: ACTIVITIES.activity_id,
            step: ACTIVITIES.step,
            activity_text: ACTIVITIES.activity_text,
        })
        .from(ACTIVITIES)
        .where(
            and(
                eq(ACTIVITIES.user_id, userId),
                eq(ACTIVITIES.career_id, careerGrpId)
            )
        );

    if (existingActivities.length > 0) {
        const userProgress = await db
            .select({
                activity_id: USER_ACTIVITIES.activity_id,
                status: USER_ACTIVITIES.status,
                updated_at: USER_ACTIVITIES.updated_at
            })
            .from(USER_ACTIVITIES)
            .innerJoin(ACTIVITIES, eq(USER_ACTIVITIES.activity_id, ACTIVITIES.activity_id)) 
            .where(
                and(
                    eq(ACTIVITIES.career_id, careerGrpId),
                    eq(USER_ACTIVITIES.user_id, userId) 
                )
            );
        console.log(userProgress)

        const progressMap = {};
        userProgress.forEach(progress => {
            progressMap[progress.activity_id] = {
                status: progress.status,
                updated_at: progress.updated_at
            };
        });

        const activitiesWithStatus = existingActivities.map(activity => ({
            ...activity,
            status: progressMap[activity.activity_id] || 'active',
            updated_at: progressMap[activity.activity_id]?.updated_at || activity.updated_at
        }));

        return NextResponse.json({ activities: activitiesWithStatus }, { status: 200 });
    }
    else {
        const prompt = `Give activities progressive step by step like step 1, step 2... till step 25 which will contain 3 activities in each step  for a ${age} year old who wants to be a ${career} and lives in ${country}, to increase the interest and passion .Ensure that the response is valid JSON, using the specified field names, but do not include the terms ${age} or ${country} in the data. Give it as a single JSON data without any wrapping other than [].`

        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1500, // Adjust the token limit as needed
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );
        let responseText = response.data.choices[0].message.content.trim();
        responseText = responseText.replace(/```json|```/g, "").trim();

        const activities = JSON.parse(responseText);
        let activityId = 1;

        for (let stepObj of activities) {
            const step = stepObj.step;
            for (let activity of stepObj.activities) {
                await db.insert(ACTIVITIES).values({
                    activity_id: activityId,
                    user_id: userId,
                    career_id: careerGrpId,
                    step: step,
                    activity_text: activity,
                    created_at: new Date()
                });
                activityId++;
            }
        }
        return NextResponse.json({ activities: activities }, { status: 201 });
    }
}