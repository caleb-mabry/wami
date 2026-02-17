import type { PythonTool } from '../interfaces/tool.js';

export const flake8Tool: PythonTool = {
  name: 'flake8',
  packageName: 'flake8',
  async scripts(_projectRoot) {
    return [
      { name: 'flake8', command: 'flake8', description: 'Run flake8 linter' },
    ];
  },
};
