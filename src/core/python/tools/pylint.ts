import type { PythonTool } from '../interfaces/tool.js';

export const pylintTool: PythonTool = {
  name: 'pylint',
  packageName: 'pylint',
  async scripts(_projectRoot) {
    return [
      { name: 'pylint', command: 'pylint src', description: 'Run pylint linter' },
    ];
  },
};
