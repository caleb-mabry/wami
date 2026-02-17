import type { PythonTool } from '../interfaces/tool.js';

export const pyrightTool: PythonTool = {
  name: 'pyright',
  packageName: 'pyright',
  async scripts(_projectRoot) {
    return [
      { name: 'pyright', command: 'pyright', description: 'Run pyright type checker' },
    ];
  },
};
