/**
 * Python Tool Registry
 *
 * Iterates all registered tools against the project's dependency set
 * and collects their scripts. Adding a new tool requires only:
 * 1. Create a file in tools/ implementing PythonTool
 * 2. Import and register it below
 */

import type { Script } from '@wami-types';
import type { PythonTool } from './interfaces/tool.js';
import { ruffTool } from './tools/ruff.js';
import { pytestTool } from './tools/pytest.js';
import { blackTool } from './tools/black.js';
import { mypyTool } from './tools/mypy.js';
import { pyrightTool } from './tools/pyright.js';
import { isortTool } from './tools/isort.js';
import { flake8Tool } from './tools/flake8.js';
import { pylintTool } from './tools/pylint.js';
import { coverageTool } from './tools/coverage.js';
import { preCommitTool } from './tools/pre-commit.js';
import { banditTool } from './tools/bandit.js';
import { sphinxTool } from './tools/sphinx.js';

class PythonToolRegistry {
  private tools: PythonTool[] = [];

  constructor() {
    this.register(ruffTool);
    this.register(pytestTool);
    this.register(blackTool);
    this.register(mypyTool);
    this.register(pyrightTool);
    this.register(isortTool);
    this.register(flake8Tool);
    this.register(pylintTool);
    this.register(coverageTool);
    this.register(preCommitTool);
    this.register(banditTool);
    this.register(sphinxTool);
  }

  private register(tool: PythonTool): void {
    this.tools.push(tool);
  }

  async detect(dependencies: Set<string>, projectRoot: string): Promise<Script[]> {
    const scripts: Script[] = [];
    for (const tool of this.tools) {
      if (dependencies.has(tool.packageName)) {
        const toolScripts = await tool.scripts(projectRoot);
        scripts.push(...toolScripts);
      }
    }
    return scripts;
  }
}

export const pythonToolRegistry = new PythonToolRegistry();
