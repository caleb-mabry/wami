/**
 * Node.js Ecosystem Detector
 *
 * Detects Node.js projects by finding package.json files.
 * Supports npm, yarn, pnpm, and bun package managers.
 */

import * as path from 'path';
import { EcosystemDetector } from './detector.js';
import {
  findFileUpwards,
  findAllFilesUpwards,
  fileExists,
  readJsonFile,
} from '../utils/fs.js';
import type {
  PackageInfo,
  PackageManager,
  Script,
  WorkspaceInfo,
} from '../types/index.js';

interface PackageJson {
  name?: string;
  scripts?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}

export class NodeJSDetector extends EcosystemDetector {
  readonly name = 'Node.js';
  readonly markerFiles = ['package.json'];

  /**
   * Detect package.json by walking up the directory tree.
   */
  async detect(cwd: string): Promise<string | null> {
    return await findFileUpwards(cwd, 'package.json');
  }

  /**
   * Parse package.json and detect package manager.
   */
  async parse(projectRoot: string): Promise<PackageInfo> {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = await readJsonFile<PackageJson>(packageJsonPath);

    // Extract package name
    const name = packageJson.name || path.basename(projectRoot);

    // Detect package manager from lock files
    const packageManager = await this.detectPackageManager(projectRoot);

    // Extract scripts
    const scripts = this.extractScripts(packageJson);

    // Detect workspace information
    const workspace = await this.detectWorkspace(projectRoot);

    return {
      path: packageJsonPath,
      name,
      packageManager,
      scripts,
      workspace,
    };
  }

  /**
   * Detect which package manager is used by checking for lock files.
   * Priority: bun > pnpm > yarn > npm (fallback)
   */
  private async detectPackageManager(
    projectRoot: string
  ): Promise<PackageManager> {
    // Check in priority order
    const lockFiles: Array<[string, PackageManager]> = [
      ['bun.lockb', 'bun'],
      ['bun.lock', 'bun'], // Text version of bun lock
      ['pnpm-lock.yaml', 'pnpm'],
      ['yarn.lock', 'yarn'],
      ['package-lock.json', 'npm'],
    ];

    for (const [lockFile, manager] of lockFiles) {
      const lockPath = path.join(projectRoot, lockFile);
      if (await fileExists(lockPath)) {
        return manager;
      }
    }

    // Default to npm if no lock file found
    return 'npm';
  }

  /**
   * Extract scripts from package.json.
   */
  private extractScripts(packageJson: PackageJson): Script[] {
    if (!packageJson.scripts) {
      return [];
    }

    return Object.entries(packageJson.scripts).map(([name, command]) => ({
      name,
      command,
    }));
  }

  /**
   * Detect workspace information by checking parent package.json files.
   */
  private async detectWorkspace(
    projectRoot: string
  ): Promise<WorkspaceInfo | undefined> {
    // Find all package.json files up the tree
    const allPackageRoots = await findAllFilesUpwards(
      projectRoot,
      'package.json'
    );

    // If only one package.json found, not in a workspace
    if (allPackageRoots.length <= 1) {
      return undefined;
    }

    // Current package is the first (nearest) one
    const currentPackageRoot = allPackageRoots[0];
    if (!currentPackageRoot) {
      return undefined;
    }

    // Check parent package.json files for workspace configuration
    for (let i = 1; i < allPackageRoots.length; i++) {
      const parentRoot = allPackageRoots[i];
      if (!parentRoot) {
        continue;
      }

      const parentPackageJsonPath = path.join(parentRoot, 'package.json');
      const parentPackageJson = await readJsonFile<PackageJson>(
        parentPackageJsonPath
      );

      // Check if this parent defines workspaces
      if (parentPackageJson.workspaces) {
        const relativePath = path.relative(parentRoot, currentPackageRoot);

        return {
          isWorkspace: true,
          workspaceRoot: parentRoot,
          workspaceName: parentPackageJson.name || path.basename(parentRoot),
          relativePath,
        };
      }
    }

    // Found multiple package.json files but none define workspaces
    // This might be nested packages without workspace configuration
    return undefined;
  }

  /**
   * Build command string for executing a script.
   */
  buildCommand(packageInfo: PackageInfo, scriptName: string): string {
    const { packageManager } = packageInfo;

    // npm and yarn use "run", pnpm and bun can omit it
    if (packageManager === 'npm' || packageManager === 'yarn') {
      return `${packageManager} run ${scriptName}`;
    }

    return `${packageManager} ${scriptName}`;
  }
}
