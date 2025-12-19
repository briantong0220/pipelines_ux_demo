import { Pipeline, PipelineNode, PipelineEdge } from '@/types';
import prisma from '@/lib/prisma';

/**
 * Get all pipelines
 */
export async function getPipelines(): Promise<Pipeline[]> {
  const pipelines = await prisma.pipeline.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return pipelines.map((pipeline) => ({
    id: pipeline.id,
    name: pipeline.name,
    description: pipeline.description ?? undefined,
    nodes: pipeline.nodes as unknown as PipelineNode[],
    edges: pipeline.edges as unknown as PipelineEdge[],
    createdAt: pipeline.createdAt.toISOString(),
    createdBy: pipeline.createdBy,
  }));
}

/**
 * Get a pipeline by ID
 */
export async function getPipelineById(id: string): Promise<Pipeline | undefined> {
  const pipeline = await prisma.pipeline.findUnique({
    where: { id },
  });

  if (!pipeline) return undefined;

  return {
    id: pipeline.id,
    name: pipeline.name,
    description: pipeline.description ?? undefined,
    nodes: pipeline.nodes as unknown as PipelineNode[],
    edges: pipeline.edges as unknown as PipelineEdge[],
    createdAt: pipeline.createdAt.toISOString(),
    createdBy: pipeline.createdBy,
  };
}

/**
 * Create a new pipeline
 */
export async function createPipeline(
  pipelineData: Omit<Pipeline, 'id' | 'createdAt' | 'createdBy'>
): Promise<Pipeline> {
  const pipeline = await prisma.pipeline.create({
    data: {
      name: pipelineData.name,
      description: pipelineData.description,
      nodes: pipelineData.nodes as unknown as object,
      edges: pipelineData.edges as unknown as object,
      createdBy: 'admin',
    },
  });

  return {
    id: pipeline.id,
    name: pipeline.name,
    description: pipeline.description ?? undefined,
    nodes: pipeline.nodes as unknown as PipelineNode[],
    edges: pipeline.edges as unknown as PipelineEdge[],
    createdAt: pipeline.createdAt.toISOString(),
    createdBy: pipeline.createdBy,
  };
}

/**
 * Update an existing pipeline
 */
export async function updatePipeline(
  id: string,
  updates: Partial<Omit<Pipeline, 'id' | 'createdAt' | 'createdBy'>>
): Promise<Pipeline | undefined> {
  try {
    const pipeline = await prisma.pipeline.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.nodes !== undefined && { nodes: updates.nodes as unknown as object }),
        ...(updates.edges !== undefined && { edges: updates.edges as unknown as object }),
      },
    });

    return {
      id: pipeline.id,
      name: pipeline.name,
      description: pipeline.description ?? undefined,
      nodes: pipeline.nodes as unknown as PipelineNode[],
      edges: pipeline.edges as unknown as PipelineEdge[],
      createdAt: pipeline.createdAt.toISOString(),
      createdBy: pipeline.createdBy,
    };
  } catch {
    return undefined; // Pipeline not found
  }
}

/**
 * Delete a pipeline by ID
 */
export async function deletePipeline(id: string): Promise<boolean> {
  try {
    await prisma.pipeline.delete({
      where: { id },
    });
    return true;
  } catch {
    return false; // Pipeline not found
  }
}
