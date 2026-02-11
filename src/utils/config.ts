/**
 * Configuration Loader
 *
 * Loads .wami.json from project root to allow custom commands and overrides.
 */

import * as path from 'path';
import { fileExists, readJsonFile } from './fs.js';
import type { WamiConfig } from '../types/index.js';

/**
 * Load .wami.json configuration from project root.
 *
 * @param projectRoot - Absolute path to project root
 * @returns Parsed config or null if not found
 */
export async function loadConfig(
  projectRoot: string
): Promise<WamiConfig | null> {
  const configPaths = [
    path.join(projectRoot, '.wami.json'),
    path.join(projectRoot, 'wami.json'),
  ];

  for (const configPath of configPaths) {
    if (await fileExists(configPath)) {
      try {
        return await readJsonFile<WamiConfig>(configPath);
      } catch (error) {
        console.error(`Failed to parse ${configPath}:`, error);
        return null;
      }
    }
  }

  return null;
}

/**
 * Detect virtual environment in project root.
 *
 * @param projectRoot - Absolute path to project root
 * @returns Path to venv if found, null otherwise
 */
export async function detectVenv(projectRoot: string): Promise<string | null> {
  const venvPaths = [
    path.join(projectRoot, '.venv'),
    path.join(projectRoot, 'venv'),
    path.join(projectRoot, 'env'),
  ];

  for (const venvPath of venvPaths) {
    if (await fileExists(venvPath)) {
      return venvPath;
    }
  }

  return null;
}
