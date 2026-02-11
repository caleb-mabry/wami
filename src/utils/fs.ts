import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Walk up the directory tree from cwd to find a file.
 *
 * @param cwd - Starting directory
 * @param fileName - File to search for (e.g., "package.json")
 * @returns Absolute path to the directory containing the file, or null if not found
 */
export async function findFileUpwards(
  cwd: string,
  fileName: string
): Promise<string | null> {
  let currentDir = path.resolve(cwd);
  const root = path.parse(currentDir).root;

  while (true) {
    const filePath = path.join(currentDir, fileName);

    try {
      await fs.access(filePath);
      return currentDir; // Found it!
    } catch {
      // File doesn't exist, continue up
    }

    // Reached filesystem root without finding file
    if (currentDir === root) {
      return null;
    }

    // Move up one directory
    currentDir = path.dirname(currentDir);
  }
}

/**
 * Find ALL occurrences of a file walking up the directory tree.
 *
 * @param cwd - Starting directory
 * @param fileName - File to search for (e.g., "package.json")
 * @returns Array of absolute paths to directories containing the file (nearest first)
 */
export async function findAllFilesUpwards(
  cwd: string,
  fileName: string
): Promise<string[]> {
  const results: string[] = [];
  let currentDir = path.resolve(cwd);
  const root = path.parse(currentDir).root;

  while (true) {
    const filePath = path.join(currentDir, fileName);

    try {
      await fs.access(filePath);
      results.push(currentDir);
    } catch {
      // File doesn't exist at this level
    }

    // Reached filesystem root
    if (currentDir === root) {
      break;
    }

    // Move up one directory
    currentDir = path.dirname(currentDir);
  }

  return results;
}

/**
 * Check if a file exists.
 *
 * @param filePath - Absolute path to file
 * @returns true if file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read and parse a JSON file.
 *
 * @param filePath - Absolute path to JSON file
 * @returns Parsed JSON object
 */
export async function readJsonFile<T = any>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}
