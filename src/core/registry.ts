/**
 * Detector Registry
 *
 * Manages all ecosystem detectors and provides a unified API for detection.
 * To add support for a new ecosystem:
 * 1. Create a new detector class extending EcosystemDetector
 * 2. Register it here in the detectors array
 */

import { EcosystemDetector } from './detector.js';
import { NodeJSDetector } from './nodejs-detector.js';
import { PythonDetector } from './python-detector.js';
import type { PackageInfo } from '../types/index.js';

export interface DetectionResult {
  found: boolean;
  packageInfo?: PackageInfo;
  detector?: EcosystemDetector;
  error?: string;
}

export class DetectorRegistry {
  private detectors: EcosystemDetector[] = [];

  constructor() {
    // Register all supported ecosystems here
    // Order matters: Detectors are tried in order until one succeeds
    // Put more specific detectors first (Python before Node.js)
    this.register(new PythonDetector());
    this.register(new NodeJSDetector());

    // Future detectors will be added here:
    // this.register(new RustDetector());
    // this.register(new GoDetector());
  }

  /**
   * Register a new ecosystem detector.
   */
  register(detector: EcosystemDetector): void {
    this.detectors.push(detector);
  }

  /**
   * Detect ecosystem and parse project information.
   *
   * Iterates through all registered detectors until one succeeds.
   *
   * @param cwd - Current working directory
   * @returns Detection result with package info if found
   */
  async detect(cwd: string): Promise<DetectionResult> {
    for (const detector of this.detectors) {
      try {
        const projectRoot = await detector.detect(cwd);

        if (projectRoot) {
          const packageInfo = await detector.parse(projectRoot);

          return {
            found: true,
            packageInfo,
            detector,
          };
        }
      } catch (error) {
        // Continue to next detector if this one fails
        console.error(
          `Detector ${detector.name} failed:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    return {
      found: false,
      error: 'No supported project found in current directory or parent directories',
    };
  }

  /**
   * Detect multiple projects in a mono-repo.
   * Scans current directory, siblings, and children (1-2 levels deep).
   *
   * @param cwd - Current working directory
   * @returns Array of all detected projects
   */
  async detectAll(cwd: string): Promise<DetectionResult[]> {
    const projects: DetectionResult[] = [];
    const scannedPaths = new Set<string>();

    // Helper to try detecting a project at a specific path
    const tryDetect = async (path: string): Promise<void> => {
      for (const detector of this.detectors) {
        try {
          const projectRoot = await detector.detect(path);
          if (projectRoot) {
            // Check if we've already added this project root
            if (scannedPaths.has(projectRoot)) {
              break; // Already found this project, skip
            }
            scannedPaths.add(projectRoot);
            const packageInfo = await detector.parse(projectRoot);
            projects.push({
              found: true,
              packageInfo,
              detector,
            });
            break; // Found a project at this path, don't check other detectors
          }
        } catch (error) {
          // Continue to next detector
        }
      }
    };

    // Import fs/path modules
    const fs = await import('fs/promises');
    const path = await import('path');

    // 1. Detect current project
    await tryDetect(cwd);

    // 2. Scan siblings (directories at the same level)
    const parent = path.dirname(cwd);
    try {
      const siblings = await fs.readdir(parent, { withFileTypes: true });
      for (const sibling of siblings) {
        if (sibling.isDirectory()) {
          const siblingPath = path.join(parent, sibling.name);
          await tryDetect(siblingPath);
        }
      }
    } catch (error) {
      // Can't read parent directory, skip siblings
    }

    // 3. Scan children (1-2 levels deep from current or from detected project root)
    const scanChildren = async (basePath: string, depth: number, maxDepth: number = 2) => {
      if (depth > maxDepth) return;

      try {
        const entries = await fs.readdir(basePath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            const childPath = path.join(basePath, entry.name);
            await tryDetect(childPath);
            if (depth < maxDepth) {
              await scanChildren(childPath, depth + 1, maxDepth);
            }
          }
        }
      } catch (error) {
        // Can't read directory, skip
      }
    };

    // Scan children from current directory
    await scanChildren(cwd, 1);

    return projects;
  }

  /**
   * Get all registered detector names.
   */
  getSupportedEcosystems(): string[] {
    return this.detectors.map((d) => d.name);
  }
}

// Export singleton instance
export const registry = new DetectorRegistry();
