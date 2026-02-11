/**
 * Python Ecosystem Detector
 *
 * Detects Python projects by finding pyproject.toml, requirements.txt, or Pipfile.
 * Supports poetry, pip, pipenv, and PDM.
 */

import * as path from 'path';
import * as TOML from '@iarna/toml';
import { EcosystemDetector } from './detector.js';
import { findFileUpwards, fileExists, readJsonFile } from '../utils/fs.js';
import { loadConfig, detectVenv } from '../utils/config.js';
import { pythonParserRegistry } from './python/parser-registry.js';
import { detectPythonTools, extractDependencyNames } from './python/tool-detector.js';
import { promises as fs } from 'fs';
import type { PackageInfo, Script } from '../types/index.js';

type PythonPackageManager = 'uv' | 'poetry' | 'pdm' | 'pipenv' | 'pip';

interface PyProjectToml {
  tool?: {
    poetry?: {
      name?: string;
      scripts?: Record<string, string>;
    };
    pdm?: {
      name?: string;
      scripts?: Record<string, string | { cmd: string; env?: Record<string, string> }>;
    };
  };
  project?: {
    name?: string;
    scripts?: Record<string, string>;
  };
}

interface Pipfile {
  scripts?: Record<string, string>;
}

export class PythonDetector extends EcosystemDetector {
  readonly name = 'Python';
  readonly markerFiles = ['pyproject.toml', 'requirements.txt', 'Pipfile'];

  /**
   * Detect Python project by finding marker files.
   * Priority: pyproject.toml > Pipfile > requirements.txt
   */
  async detect(cwd: string): Promise<string | null> {
    // Check for pyproject.toml first (modern Python)
    const pyprojectRoot = await findFileUpwards(cwd, 'pyproject.toml');
    if (pyprojectRoot) {
      return pyprojectRoot;
    }

    // Check for Pipfile (pipenv)
    const pipfileRoot = await findFileUpwards(cwd, 'Pipfile');
    if (pipfileRoot) {
      return pipfileRoot;
    }

    // Check for requirements.txt (basic pip)
    const reqRoot = await findFileUpwards(cwd, 'requirements.txt');
    if (reqRoot) {
      return reqRoot;
    }

    return null;
  }

  /**
   * Parse Python project and detect package manager.
   */
  async parse(projectRoot: string): Promise<PackageInfo> {
    const pyprojectPath = path.join(projectRoot, 'pyproject.toml');
    const pipfilePath = path.join(projectRoot, 'Pipfile');
    const requirementsPath = path.join(projectRoot, 'requirements.txt');

    let name = path.basename(projectRoot);
    let scripts: Script[] = [];
    let packageManager: PythonPackageManager = 'pip';

    // Check for pyproject.toml (Poetry or PDM)
    if (await fileExists(pyprojectPath)) {
      const result = await this.parsePyProject(pyprojectPath, projectRoot);
      name = result.name;
      scripts = result.scripts;
      packageManager = result.packageManager;
    }
    // Check for Pipfile (pipenv)
    else if (await fileExists(pipfilePath)) {
      const result = await this.parsePipfile(pipfilePath);
      name = result.name || name;
      scripts = result.scripts;
      packageManager = 'pipenv';
    }
    // Fall back to pip with requirements.txt
    else if (await fileExists(requirementsPath)) {
      packageManager = 'pip';
      // pip doesn't have a standard scripts concept, add common commands
      scripts = this.getDefaultPipScripts();
    }

    // Detect virtual environment
    const venvPath = await detectVenv(projectRoot);

    // Load .wami.json configuration
    const config = await loadConfig(projectRoot);

    // Apply configuration overrides
    if (config) {
      scripts = this.applyConfig(scripts, config);
    }

    return {
      path: pyprojectPath || pipfilePath || requirementsPath,
      name,
      packageManager: packageManager as any, // Cast to satisfy PackageManager type
      scripts,
      hasVenv: !!venvPath,
      venvPath: venvPath || undefined,
    };
  }

  /**
   * Parse pyproject.toml for Poetry, PDM, or uv.
   */
  private async parsePyProject(
    pyprojectPath: string,
    projectRoot: string
  ): Promise<{ name: string; scripts: Script[]; packageManager: PythonPackageManager }> {
    const content = await fs.readFile(pyprojectPath, 'utf-8');
    const toml = this.parseToml(content);

    let name = path.basename(projectRoot);
    let scripts: Script[] = [];
    let packageManager: PythonPackageManager = 'pip';

    // Detect package manager from lock files
    const hasUvLock = await fileExists(path.join(projectRoot, 'uv.lock'));
    const hasPoetryLock = await fileExists(path.join(projectRoot, 'poetry.lock'));
    const hasPdmLock = await fileExists(path.join(projectRoot, 'pdm.lock'));

    // Check for Poetry
    if (toml.tool?.poetry || hasPoetryLock) {
      packageManager = 'poetry';
      name = toml.tool?.poetry?.name || name;

      if (toml.tool?.poetry?.scripts) {
        scripts = Object.entries(toml.tool.poetry.scripts).map(([key, value]) => ({
          name: key,
          command: value as string,
        }));
      }

      // Add common poetry commands
      scripts.push(
        { name: 'install', command: 'poetry install' },
        { name: 'shell', command: 'poetry shell' },
        { name: 'run', command: 'poetry run python' }
      );
    }
    // Check for PDM
    else if (toml.tool?.pdm || hasPdmLock) {
      packageManager = 'pdm';
      name = toml.tool?.pdm?.name || toml.project?.name || name;

      if (toml.tool?.pdm?.scripts) {
        scripts = Object.entries(toml.tool.pdm.scripts).map(([key, value]) => {
          let command: string;
          if (typeof value === 'string') {
            command = value;
          } else {
            command = (value as any).cmd || '';
          }
          return { name: key, command };
        });
      }

      // Add common PDM commands
      scripts.push(
        { name: 'install', command: 'pdm install' },
        { name: 'run', command: 'pdm run' }
      );
    }
    // Check for uv (modern Python package manager)
    else if (hasUvLock) {
      packageManager = 'uv';
      name = toml.project?.name || name;

      // For uv, project.scripts are entry points (installed executables)
      // These can be run with `uv run <script-name>`
      if (toml.project?.scripts) {
        scripts = Object.entries(toml.project.scripts).map(([key, value]) => ({
          name: key,
          command: `uv run ${key}`, // Entry points are run by name, not module path
        }));
      }

      // Add common uv commands
      scripts.push(
        { name: 'sync', command: 'uv sync', description: 'Install and sync dependencies' },
        { name: 'python', command: 'uv run python', description: 'Run Python interpreter' }
      );
    }
    // Check for PEP 621 project.scripts (generic pip)
    else if (toml.project?.scripts) {
      packageManager = 'pip';
      name = toml.project.name || name;

      // PEP 621 scripts are entry points - need to be installed first
      // Show them but note they need installation
      scripts = Object.entries(toml.project.scripts).map(([key, value]) => ({
        name: key,
        command: `python -m ${key}`, // Attempt to run as module
      }));

      scripts.push({ name: 'install', command: 'pip install -e .', description: 'Install package in editable mode' });
    }

    // Auto-discover and parse all task runners (poe, invoke, nox, etc.)
    const taskScripts = pythonParserRegistry.parseAll(toml);
    scripts.push(...taskScripts);

    // Collect all dependencies for tool detection
    const allDependencies = this.collectAllDependencies(toml);

    // Detect and add tool commands
    const toolScripts = await detectPythonTools(allDependencies, projectRoot);

    // Filter out tool scripts that conflict with existing script names
    const existingScriptNames = new Set(scripts.map(s => s.name));
    const uniqueToolScripts = toolScripts.filter(tool => !existingScriptNames.has(tool.name));
    scripts.push(...uniqueToolScripts);

    return { name, scripts, packageManager };
  }

  /**
   * Collect all dependencies from various sections of pyproject.toml.
   */
  private collectAllDependencies(toml: any): Set<string> {
    const dependencies = new Set<string>();

    // PEP 621 dependencies
    if (toml.project?.dependencies) {
      extractDependencyNames(toml.project.dependencies).forEach(dep => dependencies.add(dep));
    }

    // PEP 735 dependency-groups (new format)
    if (toml['dependency-groups']) {
      Object.values(toml['dependency-groups']).forEach((group: any) => {
        if (Array.isArray(group)) {
          extractDependencyNames(group).forEach(dep => dependencies.add(dep));
        }
      });
    }

    // Poetry dependencies
    if (toml.tool?.poetry?.dependencies) {
      Object.keys(toml.tool.poetry.dependencies).forEach(dep => dependencies.add(dep.toLowerCase()));
    }
    if (toml.tool?.poetry?.['dev-dependencies']) {
      Object.keys(toml.tool.poetry['dev-dependencies']).forEach(dep => dependencies.add(dep.toLowerCase()));
    }

    // PDM dependencies
    if (toml.tool?.pdm?.['dev-dependencies']) {
      Object.keys(toml.tool.pdm['dev-dependencies']).forEach(dep => dependencies.add(dep.toLowerCase()));
    }

    return dependencies;
  }

  /**
   * Parse Pipfile for pipenv.
   */
  private async parsePipfile(
    pipfilePath: string
  ): Promise<{ name: string | null; scripts: Script[] }> {
    const content = await fs.readFile(pipfilePath, 'utf-8');
    const pipfile = this.parseToml(content) as Pipfile;

    const scripts: Script[] = [];

    if (pipfile.scripts) {
      Object.entries(pipfile.scripts).forEach(([key, value]) => {
        scripts.push({ name: key, command: value });
      });
    }

    // Add common pipenv commands
    scripts.push(
      { name: 'install', command: 'pipenv install' },
      { name: 'shell', command: 'pipenv shell' },
      { name: 'run', command: 'pipenv run' }
    );

    return { name: null, scripts };
  }

  /**
   * Get default scripts for basic pip projects.
   */
  private getDefaultPipScripts(): Script[] {
    return [
      { name: 'install', command: 'pip install -r requirements.txt' },
      { name: 'freeze', command: 'pip freeze > requirements.txt' },
    ];
  }

  /**
   * Parse TOML content using proper TOML library.
   */
  private parseToml(content: string): any {
    return TOML.parse(content);
  }

  /**
   * Apply .wami.json configuration to scripts.
   */
  private applyConfig(scripts: Script[], config: any): Script[] {
    const configCommands = config.commands || {};
    const ignoreList = config.ignore || [];

    // Filter out ignored scripts
    let filteredScripts = scripts.filter(
      (script) => !ignoreList.includes(script.name)
    );

    // Add/override with config commands
    for (const [name, cmdConfig] of Object.entries(configCommands)) {
      const existingIndex = filteredScripts.findIndex((s) => s.name === name);

      let script: Script;
      if (typeof cmdConfig === 'string') {
        script = { name, command: cmdConfig };
      } else {
        const config = cmdConfig as any;
        script = {
          name,
          command: config.command,
          description: config.description,
        };
      }

      if (existingIndex >= 0) {
        // Override existing script
        filteredScripts[existingIndex] = script;
      } else {
        // Add new script
        filteredScripts.push(script);
      }
    }

    return filteredScripts;
  }

  /**
   * Build command string for executing a script.
   */
  buildCommand(packageInfo: PackageInfo, scriptName: string): string {
    const manager = packageInfo.packageManager as string;

    // Check if this is a built-in command (install, shell, etc.)
    const script = packageInfo.scripts.find((s) => s.name === scriptName);
    if (script) {
      // If the script already has the full command with package manager, use it as-is
      if (script.command.includes(manager) || script.command.includes('uv run') || script.command.includes('poetry run') || script.command.includes('pdm run') || script.command.includes('pipenv run')) {
        return script.command;
      }

      // Otherwise, prepend the package manager run command to the script's command
      switch (manager) {
        case 'uv':
          return `uv run ${script.command}`;
        case 'poetry':
          return `poetry run ${script.command}`;
        case 'pdm':
          return `pdm run ${script.command}`;
        case 'pipenv':
          return `pipenv run ${script.command}`;
        case 'pip':
        default:
          // For pip, just run the command directly (assumes venv is activated or tools are globally installed)
          return script.command;
      }
    }

    // Fallback if script not found - use scriptName directly
    switch (manager) {
      case 'uv':
        return `uv run ${scriptName}`;
      case 'poetry':
        return `poetry run ${scriptName}`;
      case 'pdm':
        return `pdm run ${scriptName}`;
      case 'pipenv':
        return `pipenv run ${scriptName}`;
      case 'pip':
      default:
        return `python ${scriptName}`;
    }
  }
}
