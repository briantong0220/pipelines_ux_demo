import { TaskResponse, ResponseField, ResponseWithTask } from '@/types';
import { readJSONFile, writeJSONFile } from './storage';
import { getTaskById } from './tasks';
import { randomUUID } from 'crypto';

const RESPONSES_FILE = 'responses.json';

interface ResponsesData {
  responses: TaskResponse[];
}

const DEFAULT_DATA: ResponsesData = {
  responses: []
};

/**
 * Get all responses
 */
export async function getResponses(): Promise<TaskResponse[]> {
  const data = await readJSONFile<ResponsesData>(RESPONSES_FILE, DEFAULT_DATA);
  return data.responses;
}

/**
 * Get all responses with their associated task data
 */
export async function getResponsesWithTasks(): Promise<ResponseWithTask[]> {
  const responses = await getResponses();

  const responsesWithTasks: ResponseWithTask[] = [];

  for (const response of responses) {
    const task = await getTaskById(response.taskId);
    if (task) {
      responsesWithTasks.push({
        ...response,
        task
      });
    }
  }

  return responsesWithTasks;
}

/**
 * Get a response by ID
 */
export async function getResponseById(id: string): Promise<TaskResponse | undefined> {
  const responses = await getResponses();
  return responses.find(response => response.id === id);
}

/**
 * Get responses for a specific task
 */
export async function getResponsesByTaskId(taskId: string): Promise<TaskResponse[]> {
  const responses = await getResponses();
  return responses.filter(response => response.taskId === taskId);
}

/**
 * Create a new response
 */
export async function createResponse(responseData: {
  taskId: string;
  fields: ResponseField[];
}): Promise<TaskResponse> {
  const data = await readJSONFile<ResponsesData>(RESPONSES_FILE, DEFAULT_DATA);

  const newResponse: TaskResponse = {
    id: randomUUID(),
    taskId: responseData.taskId,
    fields: responseData.fields,
    submittedAt: new Date().toISOString(),
    submittedBy: 'editor'
  };

  data.responses.push(newResponse);
  await writeJSONFile(RESPONSES_FILE, data);

  return newResponse;
}
