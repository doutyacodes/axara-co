import { db } from '@/utils';
import { CHILDREN, QUIZ_SEQUENCES, USER_PROGRESS } from '@/utils/schema';
import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm'; // Ensure these imports match your ORM version
import { authenticate } from '@/lib/jwtMiddleware';
import { createSequence } from './createSequence';


export async function POST(req) {

    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
      }

    const userData = authResult.decoded_Data;
    const userId = userData.id;
    const {  childId } = await req.json(); // Directly destructuring to get quizId and results array
  
    let finalChildId = childId;
    if (userId) {
      if (!childId) {
        const firstChild = await db
          .select()
          .from(CHILDREN)
          .where(eq(CHILDREN.user_id, userId))
          .limit(1)
          .execute();
  
        if (firstChild.length > 0) {
          finalChildId = firstChild[0].id; // Assuming 'id' is the identifier for CHILDREN
        } else {
          return NextResponse.json(
            { error: "No children found for the user." },
            { status: 404 }
          );
        }
      }
    }
    
    try {
        
            const savedProgress = await db
                                    .select()
                                    .from(USER_PROGRESS)
                                    .where(
                                        and(
                                            eq(USER_PROGRESS.user_id, userId),
                                            eq(USER_PROGRESS.child_id, finalChildId)
                                        )
                                    )

            console.log("savedprogress", savedProgress);
        
            // Create sequence and insert into QUIZ_SEQUENCES
            try {
                await createSequence(savedProgress, userId, 1,finalChildId);
                return NextResponse.json({ message: 'Success' }, { status: 201 });
            } catch (createSequenceError) {
                console.error("Error creating personality sequence:", createSequenceError);
                return NextResponse.json({ message: 'Error creating personality sequence' }, { status: 500 });
            }

    } catch (error) {
        console.error("Error fetching questions and answers:", error);
        return NextResponse.json({ message: 'Error fetching questions and answers' }, { status: 500 });
    }
}