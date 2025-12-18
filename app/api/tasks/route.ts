import { NextRequest } from 'next/server';
import { getTasks, createTask } from '@/lib/data/tasks';
import { ApiResponse, Task } from '@/types';

/**
 * GET /api/tasks
 * Fetch all tasks
 */
export async function GET() {
  try {
    const tasks = await getTasks();
    return Response.json({ success: true, data: tasks } as ApiResponse<Task[]>);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch tasks' } as ApiResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.fields || !Array.isArray(body.fields)) {
      return Response.json(
        { success: false, error: 'Invalid task data' } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate that at least one field is provided
    if (body.fields.length === 0) {
      return Response.json(
        { success: false, error: 'At least one field is required' } as ApiResponse,
        { status: 400 }
      );
    }

    const task = await createTask(body);
    return Response.json({ success: true, data: task } as ApiResponse<Task>);
  } catch (error) {
    console.error('Error creating task:', error);
    return Response.json(
      { success: false, error: 'Failed to create task' } as ApiResponse,
      { status: 500 }
    );
  }
}
