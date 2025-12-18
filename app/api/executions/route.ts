import { NextRequest } from 'next/server';
import { getExecutions, createExecution } from '@/lib/data/executions';
import { getPipelineById } from '@/lib/data/pipelines';
import { startExecution } from '@/lib/pipeline/executor';
import { ApiResponse, PipelineExecution } from '@/types';

/**
 * GET /api/executions
 * Fetch all executions
 * Query params: ?pipelineId=xxx (optional filter)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pipelineId = searchParams.get('pipelineId');

    let executions = await getExecutions();

    // Filter by pipeline if requested
    if (pipelineId) {
      executions = executions.filter(e => e.pipelineId === pipelineId);
    }

    return Response.json({ success: true, data: executions } as ApiResponse<PipelineExecution[]>);
  } catch (error) {
    console.error('Error fetching executions:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch executions' } as ApiResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/executions
 * Start new pipeline execution
 * Body: { pipelineId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.pipelineId) {
      return Response.json(
        { success: false, error: 'pipelineId is required' } as ApiResponse,
        { status: 400 }
      );
    }

    // Get the pipeline
    const pipeline = await getPipelineById(body.pipelineId);
    if (!pipeline) {
      return Response.json(
        { success: false, error: 'Pipeline not found' } as ApiResponse,
        { status: 404 }
      );
    }

    // Start execution
    const execution = await startExecution(pipeline);

    // Save execution
    await createExecution(execution);

    return Response.json({ success: true, data: execution } as ApiResponse<PipelineExecution>);
  } catch (error) {
    console.error('Error starting execution:', error);
    return Response.json(
      { success: false, error: 'Failed to start execution' } as ApiResponse,
      { status: 500 }
    );
  }
}
