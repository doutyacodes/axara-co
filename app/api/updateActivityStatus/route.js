import { db } from '@/utils'; 
import { USER_ACTIVITIES, ACTIVITIES } from '@/utils/schema'; 
import { eq , and} from 'drizzle-orm'; 
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/jwtMiddleware';

export async function POST(req) {
    console.log('got2')

    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const userData = authResult.decoded_Data;
    const userId = userData.id;

    const {activityId, status  } = await req.json(); 
    console.log(activityId,status)

    try {
        
        const existingActivity = await db
            .select()
            .from(USER_ACTIVITIES)
            .where(
                and(
                    eq(USER_ACTIVITIES.user_id, userId),
                    eq(USER_ACTIVITIES.activity_id, activityId)
                )
            )

        if (existingActivity.length > 0) {
            // If the activity exists, update its status
            await db.update(USER_ACTIVITIES)
                .set({
                    status: status,
                    updated_at: new Date(),
                })
                .where(
                    and(
                        eq(USER_ACTIVITIES.user_id, userId),
                        eq(USER_ACTIVITIES.activity_id, activityId)
                    )
                )

            return NextResponse.json({ message: 'Activity status updated successfully.' },{status:200});
        } else {
            // If the activity doesn't exist, insert a new record
            await db.insert(USER_ACTIVITIES).values({
                user_id: userId,
                activity_id: activityId,
                status: status,
                updated_at: new Date(),
            });

            return NextResponse.json({ message: 'Activity status added successfully.' }, {status:201});
        }
    } catch (error) {
        console.error('Error updating activity status:', error);
        return NextResponse.json({ message: 'Error updating activity status.', error: error.message },{status:500});
    }
}
