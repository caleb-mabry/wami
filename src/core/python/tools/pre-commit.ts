import type { PythonTool } from '../interfaces/tool.js';

export const preCommitTool: PythonTool = {
  name: 'pre-commit',
  packageName: 'pre-commit',
  async scripts(_projectRoot) {
    return [
      { name: 'pre-commit-install', command: 'pre-commit install', description: 'Install pre-commit hooks' },
      { name: 'pre-commit-run', command: 'pre-commit run --all-files', description: 'Run pre-commit on all files' },
    ];
  },
};
