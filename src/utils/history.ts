/**
 * Command History Manager
 *
 * Tracks commands executed with arguments per-project.
 * Stores globally in ~/.wami/history.json
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileExists } from './fs.js';
import type { Script } from '../types/index.js';

interface HistoryEntry {
  script: string; // Script name
  command: string; // Full command with arguments
  timestamp: string; // ISO timestamp
  count: number; // How many times this exact command was run
}

interface ProjectHistory {
  [projectPath: string]: {
    history: HistoryEntry[];
  };
}

const HISTORY_FILE = path.join(os.homedir(), '.wami', 'history.json');
const MAX_HISTORY_PER_PROJECT = 10;

/**
 * Ensure ~/.wami directory exists.
 */
async function ensureWamiDir(): Promise<void> {
  const wamiDir = path.dirname(HISTORY_FILE);
  try {
    await fs.mkdir(wamiDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

/**
 * Load command history from disk.
 */
async function loadHistory(): Promise<ProjectHistory> {
  await ensureWamiDir();

  if (!(await fileExists(HISTORY_FILE))) {
    return {};
  }

  try {
    const content = await fs.readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load history:', error);
    return {};
  }
}

/**
 * Save command history to disk.
 */
async function saveHistory(history: ProjectHistory): Promise<void> {
  await ensureWamiDir();

  try {
    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

/**
 * Add a command to history.
 *
 * @param projectPath - Absolute path to project root
 * @param scriptName - Name of the script
 * @param command - Full command with arguments
 */
export async function addToHistory(
  projectPath: string,
  scriptName: string,
  command: string
): Promise<void> {
  const history = await loadHistory();

  if (!history[projectPath]) {
    history[projectPath] = { history: [] };
  }

  const projectHistory = history[projectPath].history;

  // Check if this exact command already exists
  const existingIndex = projectHistory.findIndex(
    (entry) => entry.command === command
  );

  if (existingIndex >= 0) {
    const existingEntry = projectHistory[existingIndex];
    if (existingEntry) {
      // Increment count and update timestamp
      existingEntry.count++;
      existingEntry.timestamp = new Date().toISOString();

      // Move to front (most recent)
      projectHistory.splice(existingIndex, 1);
      projectHistory.unshift(existingEntry);
    }
  } else {
    // Add new entry at front
    projectHistory.unshift({
      script: scriptName,
      command,
      timestamp: new Date().toISOString(),
      count: 1,
    });

    // Limit history size
    if (projectHistory.length > MAX_HISTORY_PER_PROJECT) {
      projectHistory.pop();
    }
  }

  await saveHistory(history);
}

/**
 * Get command history for a project.
 *
 * @param projectPath - Absolute path to project root
 * @returns Array of recent commands as Script objects
 */
export async function getHistory(projectPath: string): Promise<Script[]> {
  const history = await loadHistory();

  if (!history[projectPath]) {
    return [];
  }

  return history[projectPath].history.map((entry) => ({
    name: entry.script,
    command: entry.command,
    description: entry.command, // Show the actual command
  }));
}

/**
 * Clear history for a project.
 *
 * @param projectPath - Absolute path to project root
 */
export async function clearHistory(projectPath: string): Promise<void> {
  const history = await loadHistory();
  delete history[projectPath];
  await saveHistory(history);
}

/**
 * Delete a specific command from history.
 *
 * @param projectPath - Absolute path to project root
 * @param command - Full command string to delete
 */
export async function deleteFromHistory(
  projectPath: string,
  command: string
): Promise<void> {
  const history = await loadHistory();

  if (!history[projectPath]) {
    return;
  }

  const projectHistory = history[projectPath].history;
  const index = projectHistory.findIndex((entry) => entry.command === command);

  if (index >= 0) {
    projectHistory.splice(index, 1);
    await saveHistory(history);
  }
}

/**
 * Clear all history.
 */
export async function clearAllHistory(): Promise<void> {
  await saveHistory({});
}
