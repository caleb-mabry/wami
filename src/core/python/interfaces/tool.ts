import type { Script } from '@wami-types';

/**
 * Interface for a detectable Python development tool.
 *
 * To add a new tool:
 * 1. Create a new file in the tools/ directory (e.g., mypy.ts)
 * 2. Implement this interface and export a singleton
 * 3. Import and register it in tool-registry.ts
 */
export interface PythonTool {
  /** Human-readable tool name (e.g., "ruff", "pytest") */
  readonly name: string;
  /** pip package name checked against the project's dependency set */
  readonly packageName: string;
  /** Return the scripts this tool contributes when detected */
  scripts(projectRoot: string): Promise<Script[]>;
}
