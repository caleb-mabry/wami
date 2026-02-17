import type { PythonTool } from '../interfaces/tool.js';

export const isortTool: PythonTool = {
  name: 'isort',
  packageName: 'isort',
  async scripts(_projectRoot) {
    return [
      { name: 'isort', command: 'isort .', description: 'Sort imports with isort' },
      { name: 'isort-check', command: 'isort --check-only .', description: 'Check import sorting' },
    ];
  },
};
