/**
 * Task Parser Interface
 *
 * Common interface for all Python task runner parsers.
 * Allows for automatic discovery and registration of parsers.
 */

import type { Script } from '@wami-types';

/**
 * Interface for task runner parsers.
 * Each parser detects and extracts tasks from a specific task runner.
 */
export interface TaskParser {
  /**
   * Name of the task runner (e.g., "poethepoet", "invoke", "nox")
   */
  readonly name: string;

  /**
   * Check if this task runner is configured in the project.
   *
   * @param toml - Parsed pyproject.toml content
   * @returns True if the task runner is configured
   */
  isConfigured(toml: any): boolean;

  /**
   * Parse tasks from the configuration.
   *
   * @param toml - Parsed pyproject.toml content
   * @returns Array of scripts representing the tasks
   */
  parse(toml: any): Script[];
}
