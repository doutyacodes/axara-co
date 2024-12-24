import { db } from '@/utils';
import { TASKS, USER_TASKS, CHALLENGES_MAIN } from '@/utils/schema';
import { NextResponse } from 'next/server';
import { eq, inArray, isNotNull, isNull } from 'drizzle-orm'; // Adjust based on your ORM version
import { authenticate } from '@/lib/jwtMiddleware';

export async function GET(req) {
     // Authenticate user
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
        return authResult.response;
      }

    const userData = authResult.decoded_Data;
    const userId = userData.id;

    try {

        // Fetch only the challenge IDs where career_group_id is not null
        const challenges = await db
        .select()
        .from(CHALLENGES_MAIN)
        .where(isNull(CHALLENGES_MAIN.career_group_id))  // Ensure career_group_id is not null
        .execute();

        if (!challenges.length) {
            return NextResponse.json({ message: 'No tests found for this career group' }, { status: 404 });
        }

        console.log("Challenges");
        

        const challengeIds = challenges.map(challenge => challenge.challenge_id);
        console.log("Challenges ID");


        // Step 2: Fetch all tasks (tests) associated with these challenges
        const tasks = await db
            .select()
            .from(TASKS)
            .where(inArray(TASKS.challenge_id, challengeIds));

        console.log("TAsks ");


        if (!tasks.length) {
            return NextResponse.json({ message: 'No tasks found for these challenges' }, { status: 404 });
        }

        const taskIds = tasks.map(task => task.task_id);

        console.log("tasks ID");


        // Step 3: Fetch user task completion status
        const userTasks = await db
            .select()
            .from(USER_TASKS)
            .where(inArray(USER_TASKS.task_id, taskIds))
            .where(eq(USER_TASKS.user_id, userId)); 

        // Map userTasks by task_id for easy lookup
        const userTasksMap = userTasks.reduce((map, userTask) => {
            map[userTask.task_id] = userTask.completed;
            return map;
        }, {});

        console.log("userTasks ID");

        // Combine tasks with user task status
        const tasksWithStatus = tasks.map(task => ({
            ...task,
            completed: userTasksMap[task.task_id] || 'no' // Default to 'no' if no status found
        }));

        // Return the tasks with their completion status
        return NextResponse.json({ tasks: tasksWithStatus }, { status: 200 });
        // // Return the tasks (tests)
        // return NextResponse.json({ tasks }, { status: 200 });

    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ message: 'Error fetching tasks' }, { status: 500 });
    }
}
