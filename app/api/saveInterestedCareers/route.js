import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/jwtMiddleware';
import { QUIZ_SEQUENCES } from '@/utils/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/utils';
import { validateCareer } from './validateCareer';
import { saveCareer } from '../utils/saveCareer';

export async function POST(req) {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
    }

    const userData = authResult.decoded_Data;
    const userId = userData.id;

    try {

        const { career, country } = await req.json();
        // Validate career data
        const validationResult = await validateCareer(career);

        if (!validationResult.isValid) {
            return NextResponse.json({ message: validationResult.message }, { status: 201 });
        }

        const validatedCareer = validationResult.career_name
        console.log("validatedCareer", validatedCareer);
        

        // Fetch type1 and type2 from QUIZ_SEQUENCES
        const personalityTypes = await db.select({
            typeSequence: QUIZ_SEQUENCES.type_sequence,
            quizId : QUIZ_SEQUENCES.quiz_id
        }).from(QUIZ_SEQUENCES)
        .where(eq(QUIZ_SEQUENCES.user_id, userId));
        console.log("personalityTypes", personalityTypes);
        
        const type1 = personalityTypes.find(pt => pt.quizId === 1)?.typeSequence || 'defaultType1';
        const type2 = personalityTypes.find(pt => pt.quizId === 2)?.typeSequence || 'defaultType2';
        console.log("saveCareer adata", [validatedCareer], country, userId, type1, type2);
        
        await saveCareer([validatedCareer], country, userId, type1, type2);

        return NextResponse.json({ success: true, message: 'Career saved successfully.' }, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ message: error.message || "An unexpected error occurred" }, { status: 500 });
    }
}