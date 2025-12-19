import { NextRequest } from 'next/server';
import { getPipelines, createPipeline } from '@/lib/data/pipelines';
import { validatePipeline } from '@/lib/pipeline/validator';
import { ApiResponse, Pipeline } from '@/types';

/**
 * GET /api/pipelines
 * Fetch all pipelines
 */
export async function GET() {
  try {
    const pipelines = await getPipelines();
    return Response.json({ success: true, data: pipelines } as ApiResponse<Pipeline[]>);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch pipelines' } as ApiResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/pipelines
 * Create new pipeline
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.nodes || !body.edges) {
      return Response.json(
        { success: false, error: 'Invalid pipeline data: name, nodes, and edges are required' } as ApiResponse,
        { status: 400 }
      );
    }

    // Create temporary pipeline for validation
    const tempPipeline: Pipeline = {
      id: 'temp',
      name: body.name,
      description: body.description,
      nodes: body.nodes,
      edges: body.edges,
      edgePathType: body.edgePathType,
      createdAt: new Date().toISOString(),
      createdBy: 'admin'
    };

    // Validate pipeline structure
    const validationResult = validatePipeline(tempPipeline);
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

    // Create the pipeline
    const pipeline = await createPipeline({
      name: body.name,
      description: body.description,
      nodes: body.nodes,
      edges: body.edges,
      edgePathType: body.edgePathType
    });

    return Response.json({ success: true, data: pipeline } as ApiResponse<Pipeline>);
  } catch (error) {
    console.error('Error creating pipeline:', error);
    return Response.json(
      { success: false, error: 'Failed to create pipeline' } as ApiResponse,
      { status: 500 }
    );
  }
}
