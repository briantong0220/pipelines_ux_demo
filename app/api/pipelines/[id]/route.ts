import { NextRequest } from 'next/server';
import { getPipelineById, updatePipeline, deletePipeline } from '@/lib/data/pipelines';
import { validatePipeline } from '@/lib/pipeline/validator';
import { ApiResponse, Pipeline } from '@/types';

/**
 * GET /api/pipelines/:id
 * Fetch specific pipeline
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pipeline = await getPipelineById(id);

    if (!pipeline) {
      return Response.json(
        { success: false, error: 'Pipeline not found' } as ApiResponse,
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: pipeline } as ApiResponse<Pipeline>);
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch pipeline' } as ApiResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pipelines/:id
 * Update pipeline
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get existing pipeline
    const existingPipeline = await getPipelineById(id);
    if (!existingPipeline) {
      return Response.json(
        { success: false, error: 'Pipeline not found' } as ApiResponse,
        { status: 404 }
      );
    }

    // Create updated pipeline for validation
    const updatedPipeline: Pipeline = {
      ...existingPipeline,
      ...body,
      id: existingPipeline.id, // Preserve ID
      createdAt: existingPipeline.createdAt, // Preserve creation date
      createdBy: existingPipeline.createdBy // Preserve creator
    };

    // Validate pipeline structure if nodes or edges changed
    if (body.nodes || body.edges) {
      const validationResult = validatePipeline(updatedPipeline);
      if (!validationResult.valid) {
        return Response.json(
          {
            success: false,
            error: 'Invalid pipeline structure',
            data: validationResult.errors
          } as ApiResponse,
          { status: 400 }
        );
      }
    }

    // Update the pipeline
    const pipeline = await updatePipeline(id, body);

    return Response.json({ success: true, data: pipeline } as ApiResponse<Pipeline>);
  } catch (error) {
    console.error('Error updating pipeline:', error);
    return Response.json(
      { success: false, error: 'Failed to update pipeline' } as ApiResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pipelines/:id
 * Delete pipeline
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deletePipeline(id);

    if (!deleted) {
      return Response.json(
        { success: false, error: 'Pipeline not found' } as ApiResponse,
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: { id } } as ApiResponse);
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    return Response.json(
      { success: false, error: 'Failed to delete pipeline' } as ApiResponse,
      { status: 500 }
    );
  }
}
