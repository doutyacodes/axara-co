import { db } from '@/utils';
import { CHILDREN,  CHILDREN_PROGRESS } from '@/utils/schema';
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { authenticate } from '@/lib/jwtMiddleware';
import { createSequence } from './createSequence';

export async function POST(req) {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const userData = authResult.decoded_Data;
    const userId = userData.id;
    const { childId } = await req.json();

    let finalChildId = childId;

    // Check for the child ID or fetch first child if not provided
    if (userId && !childId) {
        const [firstChild] = await db
            .select()
            .from(CHILDREN)
            .where(eq(CHILDREN.user_id, userId))
            .limit(1)
            .execute();

        if (!firstChild) {
            return NextResponse.json(
                { error: "No children found for the user." },
                { status: 404 }
            );
        }
        finalChildId = firstChild.id;
    }

    try {
        // Fetch saved progress for each question for this user and child
        const savedProgress = await db
            .select()
            .from(CHILDREN_PROGRESS)
            .where(
                and(
                    eq(CHILDREN_PROGRESS.user_id, userId),
                    eq(CHILDREN_PROGRESS.child_id, finalChildId)
                )
            )
            .execute();

        console.log("Saved Progress:", savedProgress);

        // Generate and store sequence in QUIZ_SEQUENCES
        try {
            await createSequence(savedProgress, userId, 4, finalChildId);
            return NextResponse.json({ message: 'Quiz successfully submitted' }, { status: 201 });
        } catch (createSequenceError) {
            console.error("Error in creating sequence:", createSequenceError);
            return NextResponse.json({ message: 'Error creating quiz sequence' }, { status: 500 });
        }

    } catch (error) {
        console.error("Error processing quiz submission:", error);
        return NextResponse.json({ message: 'Error processing request' }, { status: 500 });
    }
}
