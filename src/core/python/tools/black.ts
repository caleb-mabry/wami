import type { PythonTool } from '../interfaces/tool.js';

export const blackTool: PythonTool = {
  name: 'black',
  packageName: 'black',
  async scripts(_projectRoot) {
    return [
      { name: 'black', command: 'black .', description: 'Format code with black' },
      { name: 'black-check', command: 'black --check .', description: 'Check if code is formatted' },
    ];
  },
};
