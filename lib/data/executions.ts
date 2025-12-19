import { PipelineExecution, NodeExecution } from '@/types';
import prisma from '@/lib/prisma';

/**
 * Get all executions
 */
export async function getExecutions(): Promise<PipelineExecution[]> {
  const executions = await prisma.pipelineExecution.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return executions.map((execution) => ({
    id: execution.id,
    pipelineId: execution.pipelineId,
    currentNodeId: execution.currentNodeId,
    status: execution.status as 'active' | 'completed',
    nodeExecutions: execution.nodeExecutions as unknown as NodeExecution[],
    createdAt: execution.createdAt.toISOString(),
    completedAt: execution.completedAt?.toISOString(),
  }));
}

/**
 * Get an execution by ID
 */
export async function getExecutionById(id: string): Promise<PipelineExecution | undefined> {
  const execution = await prisma.pipelineExecution.findUnique({
    where: { id },
  });

  if (!execution) return undefined;

  return {
    id: execution.id,
    pipelineId: execution.pipelineId,
    currentNodeId: execution.currentNodeId,
    status: execution.status as 'active' | 'completed',
    nodeExecutions: execution.nodeExecutions as unknown as NodeExecution[],
    createdAt: execution.createdAt.toISOString(),
    completedAt: execution.completedAt?.toISOString(),
  };
}

/**
 * Get all active executions
 */
export async function getActiveExecutions(): Promise<PipelineExecution[]> {
  const executions = await prisma.pipelineExecution.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
  });

  return executions.map((execution) => ({
    id: execution.id,
    pipelineId: execution.pipelineId,
    currentNodeId: execution.currentNodeId,
    status: execution.status as 'active' | 'completed',
    nodeExecutions: execution.nodeExecutions as unknown as NodeExecution[],
    createdAt: execution.createdAt.toISOString(),
    completedAt: execution.completedAt?.toISOString(),
  }));
}

/**
 * Get executions by pipeline ID
 */
export async function getExecutionsByPipelineId(pipelineId: string): Promise<PipelineExecution[]> {
  const executions = await prisma.pipelineExecution.findMany({
    where: { pipelineId },
    orderBy: { createdAt: 'desc' },
  });

  return executions.map((execution) => ({
    id: execution.id,
    pipelineId: execution.pipelineId,
    currentNodeId: execution.currentNodeId,
    status: execution.status as 'active' | 'completed',
    nodeExecutions: execution.nodeExecutions as unknown as NodeExecution[],
    createdAt: execution.createdAt.toISOString(),
    completedAt: execution.completedAt?.toISOString(),
  }));
}

/**
 * Create a new execution
 */
export async function createExecution(executionData: PipelineExecution): Promise<PipelineExecution> {
  const execution = await prisma.pipelineExecution.create({
    data: {
      id: executionData.id,
      pipelineId: executionData.pipelineId,
      currentNodeId: executionData.currentNodeId,
      status: executionData.status,
      nodeExecutions: executionData.nodeExecutions as unknown as object,
      createdAt: new Date(executionData.createdAt),
      completedAt: executionData.completedAt ? new Date(executionData.completedAt) : null,
    },
  });

  return {
    id: execution.id,
    pipelineId: execution.pipelineId,
    currentNodeId: execution.currentNodeId,
    status: execution.status as 'active' | 'completed',
    nodeExecutions: execution.nodeExecutions as unknown as NodeExecution[],
    createdAt: execution.createdAt.toISOString(),
    completedAt: execution.completedAt?.toISOString(),
  };
}

/**
 * Update an existing execution
 */
export async function updateExecution(
  id: string,
  updates: Partial<Omit<PipelineExecution, 'id' | 'createdAt'>>
): Promise<PipelineExecution | undefined> {
  try {
    const execution = await prisma.pipelineExecution.update({
      where: { id },
      data: {
        ...(updates.pipelineId !== undefined && { pipelineId: updates.pipelineId }),
        ...(updates.currentNodeId !== undefined && { currentNodeId: updates.currentNodeId }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.nodeExecutions !== undefined && {
          nodeExecutions: updates.nodeExecutions as unknown as object,
        }),
        ...(updates.completedAt !== undefined && {
          completedAt: updates.completedAt ? new Date(updates.completedAt) : null,
        }),
      },
    });

    return {
      id: execution.id,
      pipelineId: execution.pipelineId,
      currentNodeId: execution.currentNodeId,
      status: execution.status as 'active' | 'completed',
      nodeExecutions: execution.nodeExecutions as unknown as NodeExecution[],
      createdAt: execution.createdAt.toISOString(),
      completedAt: execution.completedAt?.toISOString(),
    };
  } catch {
    return undefined; // Execution not found
  }
}

/**
 * Save updated execution (replaces entire execution)
 */
export async function saveExecution(executionData: PipelineExecution): Promise<PipelineExecution> {
  const execution = await prisma.pipelineExecution.upsert({
    where: { id: executionData.id },
    update: {
      pipelineId: executionData.pipelineId,
      currentNodeId: executionData.currentNodeId,
      status: executionData.status,
      nodeExecutions: executionData.nodeExecutions as unknown as object,
      completedAt: executionData.completedAt ? new Date(executionData.completedAt) : null,
    },
    create: {
      id: executionData.id,
      pipelineId: executionData.pipelineId,
      currentNodeId: executionData.currentNodeId,
      status: executionData.status,
      nodeExecutions: executionData.nodeExecutions as unknown as object,
      createdAt: new Date(executionData.createdAt),
      completedAt: executionData.completedAt ? new Date(executionData.completedAt) : null,
    },
  });

  return {
    id: execution.id,
    pipelineId: execution.pipelineId,
    currentNodeId: execution.currentNodeId,
    status: execution.status as 'active' | 'completed',
    nodeExecutions: execution.nodeExecutions as unknown as NodeExecution[],
    createdAt: execution.createdAt.toISOString(),
    completedAt: execution.completedAt?.toISOString(),
  };
}

/**
 * Delete an execution by ID
 */
export async function deleteExecution(id: string): Promise<boolean> {
  try {
    await prisma.pipelineExecution.delete({
      where: { id },
    });
    return true;
  } catch {
    return false; // Execution not found
  }
}
