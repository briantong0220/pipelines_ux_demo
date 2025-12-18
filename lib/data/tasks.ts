import { Task, TaskField } from '@/types';
import { readJSONFile, writeJSONFile } from './storage';
import { randomUUID } from 'crypto';

const TASKS_FILE = 'tasks.json';

interface TasksData {
  tasks: Task[];
}

const DEFAULT_DATA: TasksData = {
  tasks: []
};

/**
 * Get all tasks
 */
export async function getTasks(): Promise<Task[]> {
  const data = await readJSONFile<TasksData>(TASKS_FILE, DEFAULT_DATA);
  return data.tasks;
}

/**
 * Get a task by ID
 */
export async function getTaskById(id: string): Promise<Task | undefined> {
  const tasks = await getTasks();
  return tasks.find(task => task.id === id);
}

/**
 * Create a new task
 */
export async function createTask(taskData: {
  title: string;
  description?: string;
  fields: Omit<TaskField, 'id'>[];
}): Promise<Task> {
  const data = await readJSONFile<TasksData>(TASKS_FILE, DEFAULT_DATA);

  // Generate IDs for fields
  const fields: TaskField[] = taskData.fields.map(field => ({
    ...field,
    id: randomUUID()
  }));

  const newTask: Task = {
    id: randomUUID(),
    title: taskData.title,
    description: taskData.description,
    fields,
    createdAt: new Date().toISOString(),
    createdBy: 'admin'
  };

  data.tasks.push(newTask);
  await writeJSONFile(TASKS_FILE, data);

  return newTask;
}

/**
 * Delete a task by ID
 */
export async function deleteTask(id: string): Promise<boolean> {
  const data = await readJSONFile<TasksData>(TASKS_FILE, DEFAULT_DATA);
  const initialLength = data.tasks.length;

  data.tasks = data.tasks.filter(task => task.id !== id);

  if (data.tasks.length === initialLength) {
    return false; // Task not found
  }

  await writeJSONFile(TASKS_FILE, data);
  return true;
}
