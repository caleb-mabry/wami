import type { PythonTool } from '../interfaces/tool.js';

export const banditTool: PythonTool = {
  name: 'bandit',
  packageName: 'bandit',
  async scripts(_projectRoot) {
    return [
      { name: 'bandit', command: 'bandit -r .', description: 'Run security checks with bandit' },
    ];
  },
};
