import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Ensures the data directory exists, creating it if necessary
 */
export async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Reads a JSON file from the data directory
 * If the file doesn't exist, returns the default data and creates the file
 * @param filename - Name of the JSON file (e.g., 'tasks.json')
 * @param defaultData - Default data to use if file doesn't exist
 * @returns Parsed JSON data
 */
export async function readJSONFile<T>(filename: string, defaultData: T): Promise<T> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    // File doesn't exist or is invalid, create it with default data
    await writeJSONFile(filename, defaultData);
    return defaultData;
  }
}

/**
 * Writes data to a JSON file in the data directory
 * @param filename - Name of the JSON file (e.g., 'tasks.json')
 * @param data - Data to write
 */
export async function writeJSONFile<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
