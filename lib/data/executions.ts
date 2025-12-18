import { PipelineExecution } from '@/types';
import { readJSONFile, writeJSONFile } from './storage';

const EXECUTIONS_FILE = 'executions.json';

interface ExecutionsData {
  executions: PipelineExecution[];
}

const DEFAULT_DATA: ExecutionsData = {
  executions: []
};

/**
 * Get all executions
 */
export async function getExecutions(): Promise<PipelineExecution[]> {
  const data = await readJSONFile<ExecutionsData>(EXECUTIONS_FILE, DEFAULT_DATA);
  return data.executions;
}

/**
 * Get an execution by ID
 */
export async function getExecutionById(id: string): Promise<PipelineExecution | undefined> {
  const executions = await getExecutions();
  return executions.find(execution => execution.id === id);
}

/**
 * Get all active executions
 */
export async function getActiveExecutions(): Promise<PipelineExecution[]> {
  const executions = await getExecutions();
  return executions.filter(execution => execution.status === 'active');
}

/**
 * Get executions by pipeline ID
 */
export async function getExecutionsByPipelineId(pipelineId: string): Promise<PipelineExecution[]> {
  const executions = await getExecutions();
  return executions.filter(execution => execution.pipelineId === pipelineId);
}

/**
 * Create a new execution
 */
export async function createExecution(execution: PipelineExecution): Promise<PipelineExecution> {
  const data = await readJSONFile<ExecutionsData>(EXECUTIONS_FILE, DEFAULT_DATA);

  data.executions.push(execution);
  await writeJSONFile(EXECUTIONS_FILE, data);

  return execution;
}

/**
 * Update an existing execution
 */
export async function updateExecution(
  id: string,
  updates: Partial<Omit<PipelineExecution, 'id' | 'createdAt'>>
): Promise<PipelineExecution | undefined> {
  const data = await readJSONFile<ExecutionsData>(EXECUTIONS_FILE, DEFAULT_DATA);

  const executionIndex = data.executions.findIndex(execution => execution.id === id);
  if (executionIndex === -1) {
    return undefined;
  }

  data.executions[executionIndex] = {
    ...data.executions[executionIndex],
    ...updates
  };

  await writeJSONFile(EXECUTIONS_FILE, data);
  return data.executions[executionIndex];
}

/**
 * Save updated execution (replaces entire execution)
 */
export async function saveExecution(execution: PipelineExecution): Promise<PipelineExecution> {
  const data = await readJSONFile<ExecutionsData>(EXECUTIONS_FILE, DEFAULT_DATA);

  const executionIndex = data.executions.findIndex(e => e.id === execution.id);

  if (executionIndex === -1) {
    // New execution
    data.executions.push(execution);
  } else {
    // Update existing
    data.executions[executionIndex] = execution;
  }

  await writeJSONFile(EXECUTIONS_FILE, data);
  return execution;
}

/**
 * Delete an execution by ID
 */
export async function deleteExecution(id: string): Promise<boolean> {
  const data = await readJSONFile<ExecutionsData>(EXECUTIONS_FILE, DEFAULT_DATA);
  const initialLength = data.executions.length;

  data.executions = data.executions.filter(execution => execution.id !== id);

  if (data.executions.length === initialLength) {
    return false; // Execution not found
  }

  await writeJSONFile(EXECUTIONS_FILE, data);
  return true;
}
