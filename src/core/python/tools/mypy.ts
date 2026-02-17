import type { PythonTool } from '../interfaces/tool.js';

export const mypyTool: PythonTool = {
  name: 'mypy',
  packageName: 'mypy',
  async scripts(_projectRoot) {
    return [
      { name: 'mypy', command: 'mypy .', description: 'Run mypy type checker' },
    ];
  },
};
