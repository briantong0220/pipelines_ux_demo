import { NextRequest } from 'next/server';
import { getResponsesWithTasks, createResponse } from '@/lib/data/responses';
import { ApiResponse, TaskResponse, ResponseWithTask } from '@/types';

/**
 * GET /api/responses
 * Fetch all responses with their associated task data
 */
export async function GET() {
  try {
    const responses = await getResponsesWithTasks();
    return Response.json({ success: true, data: responses } as ApiResponse<ResponseWithTask[]>);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch responses' } as ApiResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/responses
 * Create a new response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.taskId || !body.fields || !Array.isArray(body.fields)) {
      return Response.json(
        { success: false, error: 'Invalid response data' } as ApiResponse,
        { status: 400 }
      );
    }

    const response = await createResponse(body);
    return Response.json({ success: true, data: response } as ApiResponse<TaskResponse>);
  } catch (error) {
    console.error('Error creating response:', error);
    return Response.json(
      { success: false, error: 'Failed to create response' } as ApiResponse,
      { status: 500 }
    );
  }
}
