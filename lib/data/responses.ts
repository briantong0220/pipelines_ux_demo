import { TaskResponse, ResponseField, ResponseWithTask, TaskField } from '@/types';
import prisma from '@/lib/prisma';

/**
 * Get all responses
 */
export async function getResponses(): Promise<TaskResponse[]> {
  const responses = await prisma.taskResponse.findMany({
    orderBy: { submittedAt: 'desc' },
  });

  return responses.map((response) => ({
    id: response.id,
    taskId: response.taskId,
    fields: response.fields as unknown as ResponseField[],
    submittedAt: response.submittedAt.toISOString(),
    submittedBy: response.submittedBy,
  }));
}

/**
 * Get all responses with their associated task data
 */
export async function getResponsesWithTasks(): Promise<ResponseWithTask[]> {
  const responses = await prisma.taskResponse.findMany({
    include: { task: true },
    orderBy: { submittedAt: 'desc' },
  });

  return responses.map((response) => ({
    id: response.id,
    taskId: response.taskId,
    fields: response.fields as unknown as ResponseField[],
    submittedAt: response.submittedAt.toISOString(),
    submittedBy: response.submittedBy,
    task: {
      id: response.task.id,
      title: response.task.title,
      description: response.task.description ?? undefined,
      fields: response.task.fields as unknown as TaskField[],
      createdAt: response.task.createdAt.toISOString(),
      createdBy: response.task.createdBy,
    },
  }));
}

/**
 * Get a response by ID
 */
export async function getResponseById(id: string): Promise<TaskResponse | undefined> {
  const response = await prisma.taskResponse.findUnique({
    where: { id },
  });

  if (!response) return undefined;

  return {
    id: response.id,
    taskId: response.taskId,
    fields: response.fields as unknown as ResponseField[],
    submittedAt: response.submittedAt.toISOString(),
    submittedBy: response.submittedBy,
  };
}

/**
 * Get responses for a specific task
 */
export async function getResponsesByTaskId(taskId: string): Promise<TaskResponse[]> {
  const responses = await prisma.taskResponse.findMany({
    where: { taskId },
    orderBy: { submittedAt: 'desc' },
  });

  return responses.map((response) => ({
    id: response.id,
    taskId: response.taskId,
    fields: response.fields as unknown as ResponseField[],
    submittedAt: response.submittedAt.toISOString(),
    submittedBy: response.submittedBy,
  }));
}

/**
 * Create a new response
 */
export async function createResponse(responseData: {
  taskId: string;
  fields: ResponseField[];
}): Promise<TaskResponse> {
  const response = await prisma.taskResponse.create({
    data: {
      taskId: responseData.taskId,
      fields: responseData.fields as unknown as object,
      submittedBy: 'editor',
    },
  });

  return {
    id: response.id,
    taskId: response.taskId,
    fields: response.fields as unknown as ResponseField[],
    submittedAt: response.submittedAt.toISOString(),
    submittedBy: response.submittedBy,
  };
}
