/**
 * Abstract base class for ecosystem detectors.
 *
 * Each ecosystem (Node.js, Rust, Go, Python, etc.) should implement this class.
 * This provides a clear contract and makes it easy to:
 * - Add new ecosystem support
 * - Debug issues with specific ecosystems
 * - Understand what each detector is responsible for
 */

import type { PackageInfo } from '../types/index.js';

export abstract class EcosystemDetector {
  /**
   * Human-readable name of the ecosystem (e.g., "Node.js", "Rust", "Go")
   */
  abstract readonly name: string;

  /**
   * File patterns that indicate this ecosystem (e.g., ["package.json"] for Node.js)
   */
  abstract readonly markerFiles: string[];

  /**
   * Detect if the current directory (or parents) contains a project of this ecosystem.
   *
   * @param cwd - Current working directory to start detection from
   * @returns Path to the project root, or null if not found
   */
  abstract detect(cwd: string): Promise<string | null>;

  /**
   * Parse project information from the detected project root.
   *
   * @param projectRoot - Absolute path to the project root
   * @returns Complete package information including scripts/commands
   */
  abstract parse(projectRoot: string): Promise<PackageInfo>;

  /**
   * Build the command string to execute a script/command.
   *
   * @param packageInfo - The package information
   * @param scriptName - Name of the script to execute
   * @returns Full command string to execute (e.g., "npm run dev")
   */
  abstract buildCommand(packageInfo: PackageInfo, scriptName: string): string;
}
