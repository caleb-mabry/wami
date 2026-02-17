/**
 * Python Ecosystem Detector
 *
 * Detects Python projects by finding pyproject.toml, requirements.txt, or Pipfile.
 * Supports poetry, pip, pipenv, and PDM.
 */

import * as path from 'path';
import * as TOML from '@iarna/toml';
import { EcosystemDetector } from '@core/detector.js';
import { findFileUpwards, fileExists, readJsonFile } from '@utils/fs.js';
import { loadConfig, detectVenv } from '@utils/config.js';
import { pythonParserRegistry } from './task-runner-registry.js';
import { detectPythonTools, extractDependencyNames } from './tool-detector.js';
import { promises as fs } from 'fs';
import type { PackageInfo, PythonPackageManagerId, Script } from '@wami-types';

type PythonPackageManager = PythonPackageManagerId;

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
    const pyprojectRoot = await findFileUpwards(cwd, 'pyproject.toml');
    if (pyprojectRoot) {
      return pyprojectRoot;
    }

    const pipfileRoot = await findFileUpwards(cwd, 'Pipfile');
    if (pipfileRoot) {
      return pipfileRoot;
    }

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
    const packageManager = await this.detectPackageManager(projectRoot);

    if (await fileExists(pyprojectPath)) {
      const result = await this.parsePyProject(pyprojectPath, projectRoot, packageManager);
      name = result.name;
      scripts = result.scripts;
    } else if (await fileExists(pipfilePath)) {
      const result = await this.parsePipfile(pipfilePath);
      name = result.name || name;
      scripts = result.scripts;
    } else if (await fileExists(requirementsPath)) {
      scripts = this.getDefaultPipScripts();
    }

    const venvPath = await detectVenv(projectRoot);
    const config = await loadConfig(projectRoot);

    if (config) {
      scripts = this.applyConfig(scripts, config);
    }

    return {
      path: pyprojectPath || pipfilePath || requirementsPath,
      name,
      packageManager,
      scripts,
      hasVenv: !!venvPath,
      venvPath: venvPath || undefined,
    };
  }

  private async detectPackageManager(projectRoot: string): Promise<PythonPackageManager> {
    const pyprojectPath = path.join(projectRoot, 'pyproject.toml');
    const pipfilePath = path.join(projectRoot, 'Pipfile');

    if (await fileExists(pyprojectPath)) {
      const content = await fs.readFile(pyprojectPath, 'utf-8');
      const toml = this.parseToml(content);

      const hasPoetryLock = await fileExists(path.join(projectRoot, 'poetry.lock'));
      const hasPdmLock = await fileExists(path.join(projectRoot, 'pdm.lock'));
      const hasUvLock = await fileExists(path.join(projectRoot, 'uv.lock'));

      if (toml.tool?.poetry || hasPoetryLock) return 'poetry';
      if (toml.tool?.pdm || hasPdmLock) return 'pdm';
      if (hasUvLock) return 'uv';
      return 'pip';
    }

    if (await fileExists(pipfilePath)) return 'pipenv';
    return 'pip';
  }

  private async parsePyProject(
    pyprojectPath: string,
    projectRoot: string,
    packageManager: PythonPackageManager
  ): Promise<{ name: string; scripts: Script[] }> {
    const content = await fs.readFile(pyprojectPath, 'utf-8');
    const toml = this.parseToml(content);

    let name = path.basename(projectRoot);
    let scripts: Script[] = [];

    if (packageManager === 'poetry') {
      name = toml.tool?.poetry?.name || name;

      if (toml.tool?.poetry?.scripts) {
        scripts = Object.entries(toml.tool.poetry.scripts).map(([key, value]) => ({
          name: key,
          command: value as string,
        }));
      }

      scripts.push(
        { name: 'install', command: 'poetry install' },
        { name: 'shell', command: 'poetry shell' },
        { name: 'run', command: 'poetry run python' }
      );
    } else if (packageManager === 'pdm') {
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

      scripts.push(
        { name: 'install', command: 'pdm install' },
        { name: 'run', command: 'pdm run' }
      );
    } else if (packageManager === 'uv') {
      name = toml.project?.name || name;

      if (toml.project?.scripts) {
        scripts = Object.entries(toml.project.scripts).map(([key, value]) => ({
          name: key,
          command: `uv run ${key}`,
        }));
      }

      scripts.push(
        { name: 'sync', command: 'uv sync', description: 'Install and sync dependencies' },
        { name: 'python', command: 'uv run python', description: 'Run Python interpreter' }
      );
    } else if (toml.project?.scripts) {
      name = toml.project.name || name;

      scripts = Object.entries(toml.project.scripts).map(([key, value]) => ({
        name: key,
        command: `python -m ${key}`,
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

    const existingScriptNames = new Set(scripts.map(s => s.name));
    const uniqueToolScripts = toolScripts.filter(tool => !existingScriptNames.has(tool.name));
    scripts.push(...uniqueToolScripts);

    return { name, scripts };
  }

  private collectAllDependencies(toml: any): Set<string> {
    const dependencies = new Set<string>();

    if (toml.project?.dependencies) {
      extractDependencyNames(toml.project.dependencies).forEach(dep => dependencies.add(dep));
    }

    if (toml['dependency-groups']) {
      Object.values(toml['dependency-groups']).forEach((group: any) => {
        if (Array.isArray(group)) {
          extractDependencyNames(group).forEach(dep => dependencies.add(dep));
        }
      });
    }

    if (toml.tool?.poetry?.dependencies) {
      Object.keys(toml.tool.poetry.dependencies).forEach(dep => dependencies.add(dep.toLowerCase()));
    }
    if (toml.tool?.poetry?.['dev-dependencies']) {
      Object.keys(toml.tool.poetry['dev-dependencies']).forEach(dep => dependencies.add(dep.toLowerCase()));
    }

    if (toml.tool?.pdm?.['dev-dependencies']) {
      Object.keys(toml.tool.pdm['dev-dependencies']).forEach(dep => dependencies.add(dep.toLowerCase()));
    }

    return dependencies;
  }

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

    scripts.push(
      { name: 'install', command: 'pipenv install' },
      { name: 'shell', command: 'pipenv shell' },
      { name: 'run', command: 'pipenv run' }
    );

    return { name: null, scripts };
  }

  private getDefaultPipScripts(): Script[] {
    return [
      { name: 'install', command: 'pip install -r requirements.txt' },
      { name: 'freeze', command: 'pip freeze > requirements.txt' },
    ];
  }

  private parseToml(content: string): any {
    return TOML.parse(content);
  }

  private applyConfig(scripts: Script[], config: any): Script[] {
    const configCommands = config.commands || {};
    const ignoreList = config.ignore || [];

    let filteredScripts = scripts.filter(
      (script) => !ignoreList.includes(script.name)
    );

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
        filteredScripts[existingIndex] = script;
      } else {
        filteredScripts.push(script);
      }
    }

    return filteredScripts;
  }

  buildCommand(packageInfo: PackageInfo, scriptName: string): string {
    const manager = packageInfo.packageManager;

    const script = packageInfo.scripts.find((s) => s.name === scriptName);
    if (script) {
      if (script.command.includes(manager) || script.command.includes('uv run') || script.command.includes('poetry run') || script.command.includes('pdm run') || script.command.includes('pipenv run')) {
        return script.command;
      }

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
          return script.command;
      }
    }

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
