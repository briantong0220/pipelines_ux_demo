import { NextRequest } from 'next/server';
import { getExecutionById } from '@/lib/data/executions';
import { ApiResponse, PipelineExecution } from '@/types';

/**
 * GET /api/executions/:id
 * Fetch specific execution
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const execution = await getExecutionById(id);

    if (!execution) {
      return Response.json(
        { success: false, error: 'Execution not found' } as ApiResponse,
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: execution } as ApiResponse<PipelineExecution>);
  } catch (error) {
    console.error('Error fetching execution:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch execution' } as ApiResponse,
      { status: 500 }
    );
  }
}
