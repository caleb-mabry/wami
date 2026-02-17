/**
 * Go Ecosystem Detector
 *
 * Detects Go projects by finding go.mod.
 * Provides default go commands and parses Makefile/Taskfile targets.
 */

import * as path from 'path';
import { promises as fs } from 'fs';
import { EcosystemDetector } from '@core/detector.js';
import { findFileUpwards, fileExists } from '@utils/fs.js';
import { loadConfig } from '@utils/config.js';
import type { PackageInfo, Script } from '@wami-types';

export class GoDetector extends EcosystemDetector {
  readonly name = 'Go';
  readonly markerFiles = ['go.mod'];

  async detect(cwd: string): Promise<string | null> {
    return findFileUpwards(cwd, 'go.mod');
  }

  async parse(projectRoot: string): Promise<PackageInfo> {
    const goModPath = path.join(projectRoot, 'go.mod');
    const content = await fs.readFile(goModPath, 'utf-8');
    const moduleName = this.parseModuleName(content);
    const name = moduleName ? path.basename(moduleName) : path.basename(projectRoot);
    const packageManager = await this.detectPackageManager(projectRoot);

    let scripts: Script[] = [];

    // Makefile targets come first — they represent the project's defined workflow
    const makefilePath = path.join(projectRoot, 'Makefile');
    if (await fileExists(makefilePath)) {
      const makeScripts = await this.parseMakefile(makefilePath);
      scripts.push(...makeScripts);
    }

    // Taskfile targets (https://taskfile.dev)
    const taskfilePath = await this.findTaskfile(projectRoot);
    if (taskfilePath) {
      const taskScripts = await this.parseTaskfile(taskfilePath);
      scripts.push(...taskScripts);
    }

    // Default Go commands that don't conflict with Makefile/Task targets
    const existingNames = new Set(scripts.map((s) => s.name));
    const defaultScripts = this.getDefaultGoScripts().filter((s) => !existingNames.has(s.name));
    scripts.push(...defaultScripts);

    // Load .wami.json configuration
    const config = await loadConfig(projectRoot);
    if (config) {
      scripts = this.applyConfig(scripts, config);
    }

    return {
      path: goModPath,
      name,
      packageManager,
      scripts,
    };
  }

  buildCommand(_packageInfo: PackageInfo, scriptName: string): string {
    const script = _packageInfo.scripts.find((s) => s.name === scriptName);
    return script ? script.command : `go ${scriptName}`;
  }

  private async detectPackageManager(_projectRoot: string): Promise<'go'> {
    return 'go';
  }

  private parseModuleName(content: string): string | null {
    const moduleDeclaration = /^module\s+(\S+)/m;
    const match = content.match(moduleDeclaration);
    return match?.[1] ?? null;
  }

  private getDefaultGoScripts(): Script[] {
    return [
      { name: 'run', command: 'go run .', description: 'Run the main package' },
      { name: 'build', command: 'go build ./...', description: 'Build all packages' },
      { name: 'test', command: 'go test ./...', description: 'Run all tests' },
      { name: 'test:race', command: 'go test -race ./...', description: 'Run tests with race detector' },
      { name: 'test:cover', command: 'go test -cover ./...', description: 'Run tests with coverage' },
      { name: 'vet', command: 'go vet ./...', description: 'Run go vet' },
      { name: 'tidy', command: 'go mod tidy', description: 'Tidy module dependencies' },
      { name: 'download', command: 'go mod download', description: 'Download module dependencies' },
      { name: 'generate', command: 'go generate ./...', description: 'Run code generation' },
    ];
  }

  private async parseMakefile(makefilePath: string): Promise<Script[]> {
    const content = await fs.readFile(makefilePath, 'utf-8');
    const targets = new Set<string>();

    const phonyDeclaration = /^\.PHONY\s*:\s*(.+)$/gm;
    const makefileTarget = /^([a-zA-Z][a-zA-Z0-9_-]*):/gm;
    const whitespace = /\s+/;

    for (const match of content.matchAll(phonyDeclaration)) {
      const group = match[1];
      if (group) {
        for (const target of group.trim().split(whitespace)) {
          targets.add(target);
        }
      }
    }

    for (const match of content.matchAll(makefileTarget)) {
      const group = match[1];
      if (group) targets.add(group);
    }

    return [...targets].map((target) => ({
      name: `make:${target}` as string,
      command: `make ${target}`,
      description: `Run make ${target}`,
    }));
  }

  private async findTaskfile(projectRoot: string): Promise<string | null> {
    for (const name of ['Taskfile.yml', 'Taskfile.yaml', 'taskfile.yml', 'taskfile.yaml']) {
      const fullPath = path.join(projectRoot, name);
      if (await fileExists(fullPath)) return fullPath;
    }
    return null;
  }

  private async parseTaskfile(taskfilePath: string): Promise<Script[]> {
    const content = await fs.readFile(taskfilePath, 'utf-8');
    const scripts: Script[] = [];

    const tasksBlock = /^tasks:\s*\n([\s\S]*)/m;
    const taskEntry = /^ {2}([a-zA-Z][a-zA-Z0-9_:-]*):/gm;

    const tasksMatch = content.match(tasksBlock);
    if (!tasksMatch) return scripts;

    const taskBlock = tasksMatch[1];
    if (!taskBlock) return scripts;
    const reserved = new Set(['cmds', 'desc', 'vars', 'env', 'deps', 'generates', 'sources', 'dir', 'silent']);
    for (const match of taskBlock.matchAll(taskEntry)) {
      const taskName = match[1];
      if (taskName && !reserved.has(taskName)) {
        scripts.push({
          name: `task:${taskName}`,
          command: `task ${taskName}`,
          description: `Run task ${taskName}`,
        });
      }
    }

    return scripts;
  }

  private applyConfig(scripts: Script[], config: any): Script[] {
    const configCommands = config.commands || {};
    const ignoreList: string[] = config.ignore || [];

    let filtered = scripts.filter((s) => !ignoreList.includes(s.name));

    for (const [name, cmdConfig] of Object.entries(configCommands)) {
      const existingIndex = filtered.findIndex((s) => s.name === name);
      let script: Script;
      if (typeof cmdConfig === 'string') {
        script = { name, command: cmdConfig };
      } else {
        const cfg = cmdConfig as any;
        script = { name, command: cfg.command, description: cfg.description };
      }
      if (existingIndex >= 0) {
        filtered[existingIndex] = script;
      } else {
        filtered.push(script);
      }
    }

    return filtered;
  }
}
