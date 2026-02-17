import type { PythonTool } from '../interfaces/tool.js';

export const ruffTool: PythonTool = {
  name: 'ruff',
  packageName: 'ruff',
  async scripts(_projectRoot) {
    return [
      { name: 'ruff-check', command: 'ruff check', description: 'Run ruff linter' },
      { name: 'ruff-check-fix', command: 'ruff check --fix', description: 'Run ruff linter and auto-fix issues' },
      { name: 'ruff-format', command: 'ruff format', description: 'Format code with ruff' },
      { name: 'ruff-format-check', command: 'ruff format --check', description: 'Check if code is formatted' },
    ];
  },
};
