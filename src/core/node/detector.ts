/**
 * Node.js Ecosystem Detector
 *
 * Detects Node.js projects by finding package.json files.
 * Supports npm, yarn, pnpm, and bun package managers.
 */

import * as path from 'path';
import { EcosystemDetector } from '@core/detector.js';
import {
  findFileUpwards,
  findAllFilesUpwards,
  fileExists,
  readJsonFile,
} from '@utils/fs.js';
import { NODE_PACKAGE_MANAGERS, findNodePackageManager } from './package-managers.js';
import type {
  PackageInfo,
  PackageManager,
  Script,
  WorkspaceInfo,
} from '@wami-types';

interface PackageJson {
  name?: string;
  scripts?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
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
    let scripts = this.extractScripts(packageJson);

    // Detect and add tool commands
    const toolScripts = await this.detectToolCommands(packageJson, projectRoot);

    // Filter out tool scripts that conflict with existing script names
    const existingScriptNames = new Set(scripts.map(s => s.name));
    const uniqueToolScripts = toolScripts.filter(tool => !existingScriptNames.has(tool.name));

    scripts = [...scripts, ...uniqueToolScripts];

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
   * Detect available tools from dependencies and infer useful commands.
   */
  private async detectToolCommands(
    packageJson: PackageJson,
    projectRoot: string
  ): Promise<Script[]> {
    const tools: Script[] = [];

    // Collect all dependencies (including peer dependencies)
    const allDeps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
      ...(packageJson.peerDependencies || {}),
    };

    const dependencies = new Set(Object.keys(allDeps).map(dep => dep.toLowerCase()));

    // TypeScript - Type checking and compilation
    if (dependencies.has('typescript')) {
      const hasTsConfig = await fileExists(path.join(projectRoot, 'tsconfig.json'));
      if (hasTsConfig) {
        tools.push(
          { name: 'tsc', command: 'tsc --noEmit', description: 'Type check with TypeScript' },
          { name: 'tsc-build', command: 'tsc', description: 'Build TypeScript project' }
        );
      }
    }

    // ESLint - Linting
    if (dependencies.has('eslint')) {
      tools.push(
        { name: 'eslint', command: 'eslint .', description: 'Lint code with ESLint' },
        { name: 'eslint-fix', command: 'eslint . --fix', description: 'Lint and auto-fix issues' }
      );
    }

    // Prettier - Formatting
    if (dependencies.has('prettier')) {
      tools.push(
        { name: 'prettier-check', command: 'prettier --check .', description: 'Check code formatting' },
        { name: 'prettier-write', command: 'prettier --write .', description: 'Format code with Prettier' }
      );
    }

    // Biome - Fast linter and formatter (alternative to ESLint + Prettier)
    if (dependencies.has('@biomejs/biome') || dependencies.has('biome')) {
      tools.push(
        { name: 'biome-check', command: 'biome check .', description: 'Check code with Biome' },
        { name: 'biome-check-fix', command: 'biome check --write .', description: 'Check and auto-fix with Biome' },
        { name: 'biome-format', command: 'biome format --write .', description: 'Format code with Biome' }
      );
    }

    // Vitest - Testing framework
    if (dependencies.has('vitest')) {
      tools.push(
        { name: 'vitest', command: 'vitest', description: 'Run tests with Vitest' },
        { name: 'vitest-ui', command: 'vitest --ui', description: 'Run tests with Vitest UI' },
        { name: 'vitest-run', command: 'vitest run', description: 'Run tests once' },
        { name: 'vitest-coverage', command: 'vitest --coverage', description: 'Run tests with coverage' }
      );
    }

    // Jest - Testing framework
    if (dependencies.has('jest') || dependencies.has('@jest/core')) {
      tools.push(
        { name: 'jest', command: 'jest', description: 'Run tests with Jest' },
        { name: 'jest-watch', command: 'jest --watch', description: 'Run tests in watch mode' },
        { name: 'jest-coverage', command: 'jest --coverage', description: 'Run tests with coverage' }
      );
    }

    // Playwright - E2E testing
    if (dependencies.has('@playwright/test') || dependencies.has('playwright')) {
      tools.push(
        { name: 'playwright-test', command: 'playwright test', description: 'Run Playwright tests' },
        { name: 'playwright-ui', command: 'playwright test --ui', description: 'Run Playwright tests with UI' },
        { name: 'playwright-debug', command: 'playwright test --debug', description: 'Debug Playwright tests' }
      );
    }

    // Cypress - E2E testing
    if (dependencies.has('cypress')) {
      tools.push(
        { name: 'cypress-open', command: 'cypress open', description: 'Open Cypress test runner' },
        { name: 'cypress-run', command: 'cypress run', description: 'Run Cypress tests headlessly' }
      );
    }

    // Vite - Build tool
    if (dependencies.has('vite')) {
      tools.push(
        { name: 'vite-dev', command: 'vite', description: 'Start Vite dev server' },
        { name: 'vite-build', command: 'vite build', description: 'Build with Vite' },
        { name: 'vite-preview', command: 'vite preview', description: 'Preview Vite build' }
      );
    }

    // Turbo - Monorepo build system
    if (dependencies.has('turbo')) {
      tools.push(
        { name: 'turbo-build', command: 'turbo build', description: 'Build with Turbo' },
        { name: 'turbo-dev', command: 'turbo dev', description: 'Start dev mode with Turbo' },
        { name: 'turbo-test', command: 'turbo test', description: 'Run tests with Turbo' }
      );
    }

    // Nx - Monorepo build system
    if (dependencies.has('nx') || dependencies.has('@nx/workspace')) {
      tools.push(
        { name: 'nx-build', command: 'nx build', description: 'Build with Nx' },
        { name: 'nx-test', command: 'nx test', description: 'Run tests with Nx' },
        { name: 'nx-graph', command: 'nx graph', description: 'View project graph' }
      );
    }

    // Type-check - General type checking (if no tsc script exists)
    if (dependencies.has('typescript') && !packageJson.scripts?.typecheck) {
      tools.push(
        { name: 'typecheck', command: 'tsc --noEmit', description: 'Type check code' }
      );
    }

    // Stylelint - CSS linting
    if (dependencies.has('stylelint')) {
      tools.push(
        { name: 'stylelint', command: 'stylelint "**/*.css"', description: 'Lint CSS files' },
        { name: 'stylelint-fix', command: 'stylelint "**/*.css" --fix', description: 'Lint and fix CSS files' }
      );
    }

    // Storybook - Component development
    if (dependencies.has('@storybook/react') || dependencies.has('storybook')) {
      tools.push(
        { name: 'storybook', command: 'storybook dev', description: 'Start Storybook dev server' },
        { name: 'storybook-build', command: 'storybook build', description: 'Build Storybook' }
      );
    }

    return tools;
  }

  /**
   * Detect which package manager is used by checking for lock files.
   * Detection priority and lock file names come from NODE_PACKAGE_MANAGERS.
   */
  private async detectPackageManager(
    projectRoot: string
  ): Promise<PackageManager> {
    for (const pm of NODE_PACKAGE_MANAGERS) {
      for (const lockFile of pm.lockFiles) {
        if (await fileExists(path.join(projectRoot, lockFile))) {
          return pm.id;
        }
      }
    }

    // npm is the fallback when no lock file is present
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

    return undefined;
  }

  /**
   * Build command string for executing a script.
   * Delegates to the package manager definition so the invocation format
   * stays co-located with the rest of that PM's knowledge.
   */
  buildCommand(packageInfo: PackageInfo, scriptName: string): string {
    const pm = findNodePackageManager(packageInfo.packageManager);
    return pm ? pm.buildRunCommand(scriptName) : `${packageInfo.packageManager} ${scriptName}`;
  }
}
