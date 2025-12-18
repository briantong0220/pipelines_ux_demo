import { NextRequest } from 'next/server';
import { getExecutionById, saveExecution } from '@/lib/data/executions';
import { advanceAfterSubtask, advanceAfterReview } from '@/lib/pipeline/executor';
import { ApiResponse, PipelineExecution, FieldReviewResult } from '@/types';

/**
 * POST /api/executions/:id/advance
 * Advance execution after subtask submission or review completion
 *
 * Body for subtask:
 * {
 *   nodeId: string,
 *   type: 'subtask',
 *   data: { fieldValues: Record<string, string> }
 * }
 *
 * Body for review:
 * {
 *   nodeId: string,
 *   type: 'review',
 *   data: { fieldReviews: FieldReviewResult[] }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request
    if (!body.nodeId || !body.type || !body.data) {
      return Response.json(
        { success: false, error: 'nodeId, type, and data are required' } as ApiResponse,
        { status: 400 }
      );
    }

    // Get execution
    const execution = await getExecutionById(id);
    if (!execution) {
      return Response.json(
        { success: false, error: 'Execution not found' } as ApiResponse,
        { status: 404 }
      );
    }

    // Check if execution is active
    if (execution.status !== 'active') {
      return Response.json(
        { success: false, error: 'Execution is not active' } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if nodeId matches current node
    if (execution.currentNodeId !== body.nodeId) {
      return Response.json(
        { success: false, error: 'Node is not the current active node' } as ApiResponse,
        { status: 400 }
      );
    }

    let updatedExecution: PipelineExecution;

    if (body.type === 'subtask') {
      // Validate subtask data
      if (!body.data.fieldValues || typeof body.data.fieldValues !== 'object') {
        return Response.json(
          { success: false, error: 'fieldValues is required for subtask' } as ApiResponse,
          { status: 400 }
        );
      }

      updatedExecution = await advanceAfterSubtask(
        execution,
        body.nodeId,
        body.data.fieldValues
      );
    } else if (body.type === 'review') {
      // Validate review data
      if (!Array.isArray(body.data.fieldReviews)) {
        return Response.json(
          { success: false, error: 'fieldReviews array is required for review' } as ApiResponse,
          { status: 400 }
        );
      }

      // Validate each field review
      for (const review of body.data.fieldReviews as FieldReviewResult[]) {
        if (!review.fieldId || !review.status) {
          return Response.json(
            { success: false, error: 'Each field review must have fieldId and status' } as ApiResponse,
            { status: 400 }
          );
        }
        if (review.status !== 'accepted' && review.status !== 'rejected') {
          return Response.json(
            { success: false, error: 'Field review status must be "accepted" or "rejected"' } as ApiResponse,
            { status: 400 }
          );
        }
        // Comment is required for rejections only
        if (review.status === 'rejected' && !review.comment) {
          return Response.json(
            { success: false, error: 'A comment is required when rejecting a field' } as ApiResponse,
            { status: 400 }
          );
        }
      }

      updatedExecution = await advanceAfterReview(
        execution,
        body.nodeId,
        body.data.fieldReviews
      );
    } else {
      return Response.json(
        { success: false, error: 'Invalid type, must be "subtask" or "review"' } as ApiResponse,
        { status: 400 }
      );
    }

    // Save updated execution
    await saveExecution(updatedExecution);

    return Response.json({ success: true, data: updatedExecution } as ApiResponse<PipelineExecution>);
  } catch (error) {
    console.error('Error advancing execution:', error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to advance execution' } as ApiResponse,
      { status: 500 }
    );
  }
}
