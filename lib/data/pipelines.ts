import { Pipeline } from '@/types';
import { readJSONFile, writeJSONFile } from './storage';
import { randomUUID } from 'crypto';

const PIPELINES_FILE = 'pipelines.json';

interface PipelinesData {
  pipelines: Pipeline[];
}

const DEFAULT_DATA: PipelinesData = {
  pipelines: []
};

/**
 * Get all pipelines
 */
export async function getPipelines(): Promise<Pipeline[]> {
  const data = await readJSONFile<PipelinesData>(PIPELINES_FILE, DEFAULT_DATA);
  return data.pipelines;
}

/**
 * Get a pipeline by ID
 */
export async function getPipelineById(id: string): Promise<Pipeline | undefined> {
  const pipelines = await getPipelines();
  return pipelines.find(pipeline => pipeline.id === id);
}

/**
 * Create a new pipeline
 */
export async function createPipeline(pipelineData: Omit<Pipeline, 'id' | 'createdAt' | 'createdBy'>): Promise<Pipeline> {
  const data = await readJSONFile<PipelinesData>(PIPELINES_FILE, DEFAULT_DATA);

  const newPipeline: Pipeline = {
    id: randomUUID(),
    ...pipelineData,
    createdAt: new Date().toISOString(),
    createdBy: 'admin'
  };

  data.pipelines.push(newPipeline);
  await writeJSONFile(PIPELINES_FILE, data);

  return newPipeline;
}

/**
 * Update an existing pipeline
 */
export async function updatePipeline(
  id: string,
  updates: Partial<Omit<Pipeline, 'id' | 'createdAt' | 'createdBy'>>
): Promise<Pipeline | undefined> {
  const data = await readJSONFile<PipelinesData>(PIPELINES_FILE, DEFAULT_DATA);

  const pipelineIndex = data.pipelines.findIndex(pipeline => pipeline.id === id);
  if (pipelineIndex === -1) {
    return undefined;
  }

  data.pipelines[pipelineIndex] = {
    ...data.pipelines[pipelineIndex],
    ...updates
  };

  await writeJSONFile(PIPELINES_FILE, data);
  return data.pipelines[pipelineIndex];
}

/**
 * Delete a pipeline by ID
 */
export async function deletePipeline(id: string): Promise<boolean> {
  const data = await readJSONFile<PipelinesData>(PIPELINES_FILE, DEFAULT_DATA);
  const initialLength = data.pipelines.length;

  data.pipelines = data.pipelines.filter(pipeline => pipeline.id !== id);

  if (data.pipelines.length === initialLength) {
    return false; // Pipeline not found
  }

  await writeJSONFile(PIPELINES_FILE, data);
  return true;
}
