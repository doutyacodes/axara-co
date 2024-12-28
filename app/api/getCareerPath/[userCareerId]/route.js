import { db } from '@/utils';
import { CAREER_GROUP, CAREER_PATH, CAREER_SUBJECTS, SUBJECTS, TESTS, USER_CAREER, USER_DETAILS, USER_TESTS } from '@/utils/schema';
import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm'; // Adjust based on your ORM version
import { authenticate } from '@/lib/jwtMiddleware';
import axios from 'axios';

const languageOptions = {
  en: 'in English',
  hi: 'in Hindi',
  mar: 'in Marathi',
  ur: 'in Urdu',
  sp: 'in Spanish',
  ben: 'in Bengali',
  assa: 'in Assamese',
  ge: 'in German',
  tam:'in Tamil',
  mal:'in malayalam'
};

export const maxDuration = 60; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';


export async function GET(req, { params }) {
  console.log('generating')
     // Authenticate user
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
      }

    const userData = authResult.decoded_Data;
    const userId = userData.id;

    const language = req.headers.get('accept-language') || 'en';

    const { userCareerId } = params;    

    try {

          // Check if CAREER_PATH data exists for the given careerGrpId
              const existingCareerPath = await db
              .select()
              .from(CAREER_PATH)
              .where(eq(CAREER_PATH.user_career_id, userCareerId))
              .limit(1);

            if (existingCareerPath.length > 0) {
              // If data exists, return it
              return NextResponse.json({ careerPath: existingCareerPath[0] }, { status: 200 });
            }

            const userCareer = await db
              .select({
                  type1: USER_CAREER.type1,
                  type2: USER_CAREER.type2,
                  country: USER_CAREER.country,
                  careerGroupId: USER_CAREER.career_group_id
              })
              .from(USER_CAREER)
              .where(and(eq(USER_CAREER.user_id, userId), eq(USER_CAREER.id, userCareerId)));

              const careerGrpId = userCareer[0]?.careerGroupId;
          
            const careerGroup = await db
                .select({ career_name: CAREER_GROUP.career_name })
                .from(CAREER_GROUP)
                .where(eq(CAREER_GROUP.id, careerGrpId));
                
            const career_name = careerGroup[0]?.career_name;
            const { type1, type2, country } = userCareer[0];

            const prompt = `
            I want you to generate a detailed career path description for a specific profession based on the following information. Format the output as a JSON object with all values as strings for consistency, avoiding arrays or other data structures.Provide the data without mentioning the personality type "${type1}".
            
            Input:
            1. **Career Name**: ${career_name}
            2. **Personality Type**: ${type1}
            3. **Language**: ${languageOptions[language] || 'English'}
            4. **Country**: ${country || 'India'}
            
            Output Structure:
            
            {
              "career_name": "${career_name}",
              "overview": "A brief summary of the profession and its relevance to the given personality type without mentioning the type "${type1}".",
              "step_by_step_career_path": {
                "education": "Details of required education, including duration, degrees, and fields of study.",
                "skill_development": "Key skills and certifications necessary for this career.",
                "entry_level_jobs": "Examples of entry-level roles and responsibilities.",
                "mid_level_career": "Opportunities for mid-career progression.",
                "senior_level_roles": "Senior-level or leadership positions available.",
                "entrepreneurial_path": "Optional: Entrepreneurial opportunities in this field."
              },
              "key_learning_milestones": "Important knowledge and skill milestones at various stages of the career.",
              "challenges_opportunities": {
                "challenges": "Key challenges commonly faced in this career.",
                "opportunities": "Major growth and advancement opportunities."
              },
              "future_prospects": "Insights into the future growth and evolution of this career.",
              "career_path_summary": "A summary of the career path, explaining its suitability for the specified personality type."
            }`
            


              const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                  model: "gpt-4o-mini", // or 'gpt-4' if you have access
                  messages: [{ role: "user", content: prompt }],
                  max_tokens: 2000,
                },
                {
                  headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              console.log("API request completed.");
              let responseText = response.data.choices[0].message.content.trim();
              responseText = responseText.replace(/```json|```/g, "").trim();
              // console.log("responseText",responseText);
              const parsedData = JSON.parse(responseText);

              const insertCareerPath = await db
                .insert(CAREER_PATH)
                .values({
                  user_career_id: careerGrpId, // Replace with the actual value from your user_career table
                  overview: parsedData.overview,
                  education: parsedData.step_by_step_career_path.education,
                  specialized_skills_development: parsedData.step_by_step_career_path.skill_development,
                  entry_level_jobs: parsedData.step_by_step_career_path.entry_level_jobs,
                  mid_level_career: parsedData.step_by_step_career_path.mid_level_career,
                  senior_roles: parsedData.step_by_step_career_path.senior_level_roles,
                  entrepreneurial_path: parsedData.step_by_step_career_path.entrepreneurial_path || null,
                  key_learning_milestones: parsedData.key_learning_milestones,
                  challenges: parsedData.challenges_opportunities.challenges,
                  opportunities: parsedData.challenges_opportunities.opportunities,
                  future_prospects: parsedData.future_prospects,
                  career_path_summary: parsedData.career_path_summary,
                });

              // Fetch the newly inserted data from the database
              const newCareerPath = await db
              .select()
              .from(CAREER_PATH)
              .where(eq(CAREER_PATH.user_career_id, careerGrpId))
              .limit(1);

            // Return the newly inserted data
            return NextResponse.json({ careerPath: newCareerPath[0] }, { status: 200 });
                        
    } catch (error) {
        console.error("Error fetching or generating career path:", error);
        return NextResponse.json({ message: 'Error fetching or generating career path' }, { status: 500 });
    }
}