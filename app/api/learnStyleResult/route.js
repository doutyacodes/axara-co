import { db } from "@/utils";
import { CHILDREN, QUIZ_SEQUENCES } from "@/utils/schema";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { authenticate } from "@/lib/jwtMiddleware";

// Define a description for each learning style
const styleDescriptions = {
    Visual: 
      "Visual learners understand and retain information best when it is presented through imagery. They excel with visuals like charts, diagrams, videos, and illustrations that help them see the big picture. They may prefer studying alone in a visually organized space and use tools like color-coded notes or mind maps to enhance their understanding.",
      
    Auditory: 
      "Auditory learners comprehend information best through listening. They are highly receptive to spoken instructions, discussions, and explanations. Such learners often excel in lecture-based environments and benefit from group discussions, podcasts, and audio recordings. Repeating information aloud or explaining it to someone else can also help them solidify their knowledge.",
      
    Kinesthetic: 
      "Kinesthetic learners thrive on a hands-on approach. They learn by doing and engaging in physical activities, whether it's taking notes, performing experiments, or using models. They may prefer interactive learning environments, where they can move around and participate actively, as sitting still can feel stifling for them. Tactile tasks and real-world applications often enhance their learning experience.",
      
    ReadingWriting: 
      "Reading/Writing learners absorb information best through reading text and writing. They often prefer written explanations and benefit from activities like taking notes, reading books, and referencing written resources. These learners excel at traditional academic tasks, and may remember more by rephrasing what they learn in their own words, summarizing notes, or creating lists and structured written outlines.",
      
    Logical: 
      "Logical learners have a natural aptitude for reasoning and problem-solving. They thrive on organization, categorization, and logic-based information, often preferring structured and systematic approaches. Analytical by nature, they enjoy puzzles, experiments, and tasks that involve critical thinking. They may excel in subjects like mathematics and science, where they can break down complex concepts into understandable steps.",
      
    Social: 
      "Social learners are most engaged when they learn in groups or through interaction. They benefit from collaborative tasks, open discussions, and group activities where they can bounce ideas off others. They often prefer study groups, teamwork, and environments where they can share insights and learn through others' perspectives. These learners may thrive in settings like workshops, group projects, and peer-to-peer learning environments."
  };
  

// Server action to get and display the learning style profile for a child
export async function POST(req) {
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userData = authResult.decoded_Data;
  const userId = userData.id;
  const { childId } = await req.json();
  const quizId = 4;

  

  if (!userId || !quizId) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

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
        finalChildId = firstChild[0].id;
      } else {
        return NextResponse.json(
          { error: "No children found for the user." },
          { status: 404 }
        );
      }
    }
  }

  try {
    // Fetch the learning style profile from the database
    const result = await db
      .select()
      .from(QUIZ_SEQUENCES)
      .where(and(eq(QUIZ_SEQUENCES.user_id, userId),eq(QUIZ_SEQUENCES.child_id, finalChildId),eq(QUIZ_SEQUENCES.quiz_id, quizId)))
      .limit(1)
      .execute();

    if (!result[0] || !result[0].type_sequence) {
      return NextResponse.json(
        { error: "No learning style profile found for this child" },
        { status: 404 }
      );
    }

    // Split the type_sequence to list out individual styles if there are multiple
    const styles = result[0].type_sequence.split(" & ").map((style) => ({
      name: style,
      description: styleDescriptions[style] || "Description not available",
    }));

    // Return the styles with descriptions
    return NextResponse.json(
      {  learningStyles: styles },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching learning style profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
