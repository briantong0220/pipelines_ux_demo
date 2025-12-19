import { Task, TaskField } from '@/types';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';

/**
 * Get all tasks
 */
export async function getTasks(): Promise<Task[]> {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    fields: task.fields as unknown as TaskField[],
    createdAt: task.createdAt.toISOString(),
    createdBy: task.createdBy,
  }));
}

/**
 * Get a task by ID
 */
export async function getTaskById(id: string): Promise<Task | undefined> {
  const task = await prisma.task.findUnique({
    where: { id },
  });

  if (!task) return undefined;

  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    fields: task.fields as unknown as TaskField[],
    createdAt: task.createdAt.toISOString(),
    createdBy: task.createdBy,
  };
}

/**
 * Create a new task
 */
export async function createTask(taskData: {
  title: string;
  description?: string;
  fields: Omit<TaskField, 'id'>[];
}): Promise<Task> {
  // Generate IDs for fields
  const fields: TaskField[] = taskData.fields.map((field) => ({
    ...field,
    id: randomUUID(),
  }));

  const task = await prisma.task.create({
    data: {
      title: taskData.title,
      description: taskData.description,
      fields: fields as unknown as object,
      createdBy: 'admin',
    },
  });

  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    fields: task.fields as unknown as TaskField[],
    createdAt: task.createdAt.toISOString(),
    createdBy: task.createdBy,
  };
}

/**
 * Delete a task by ID
 */
export async function deleteTask(id: string): Promise<boolean> {
  try {
    await prisma.task.delete({
      where: { id },
    });
    return true;
  } catch {
    return false; // Task not found
  }
}
