// In your Next.js API route file (e.g., app/api/children/[childId]/route.js)
import { NextResponse } from 'next/server';
import { calculateWeekFromTimestamp } from '@/app/api/utils/calculateWeekFromTimestamp';
import { CHILDREN } from '@/utils/schema';
import { db } from '@/utils';
import { eq } from 'drizzle-orm';

export async function GET(req, { params }) {
const { childId } = await params; 

  try {
    // Get child's join date
    const child = await db
    .select({
        created_at: CHILDREN.created_at,
    })
    .from(CHILDREN)
    .where(eq(CHILDREN.id, childId))
    .execute();

    // If child is not found, return a 404 response
    if (!child.length) {
      return NextResponse.json({ message: 'Child not found' }, { status: 404 });
    }

    // Extract the joined date (created_at) from the fetched data
    const joinedDate = child[0].created_at;

    // Call the calculateWeekFromTimestamp function to calculate the week data
    const daysData = calculateWeekFromTimestamp(joinedDate);

    // Return the result in the response
    return NextResponse.json({daysData}, { status: 200 });

  } catch (error) {
    // Handle any errors and return a 500 server error
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
