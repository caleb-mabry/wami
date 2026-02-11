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
   * Get all registered detector names.
   */
  getSupportedEcosystems(): string[] {
    return this.detectors.map((d) => d.name);
  }
}

// Export singleton instance
export const registry = new DetectorRegistry();
