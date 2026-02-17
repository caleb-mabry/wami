import type { Script } from '@wami-types';
import { pythonToolRegistry } from './tool-registry.js';

export async function detectPythonTools(
  dependencies: Set<string>,
  projectRoot: string
): Promise<Script[]> {
  return pythonToolRegistry.detect(dependencies, projectRoot);
}

/**
 * Extract dependency names from various dependency formats.
 *
 * @param dependencies - Array of dependency strings or object of dependencies
 * @returns Array of package names (normalized to lowercase)
 */
export function extractDependencyNames(dependencies: string[] | Record<string, any>): string[] {
  if (Array.isArray(dependencies)) {
    return dependencies.map(dep => {
      // Extract package name from version specifier
      // Examples: "ruff>=0.1.0" -> "ruff", "pytest[asyncio]" -> "pytest"
      const packageName = /^([a-zA-Z0-9_-]+)/;
      const match = dep.match(packageName);
      return match ? match[1].toLowerCase() : '';
    }).filter(Boolean);
  } else {
    // For Poetry/PDM format where dependencies is an object
    return Object.keys(dependencies).map(dep => dep.toLowerCase());
  }
}
