import type { PythonTool } from '../interfaces/tool.js';

export const coverageTool: PythonTool = {
  name: 'coverage',
  packageName: 'coverage',
  async scripts(_projectRoot) {
    return [
      { name: 'coverage-run', command: 'coverage run -m pytest', description: 'Run tests with coverage' },
      { name: 'coverage-report', command: 'coverage report', description: 'Show coverage report' },
      { name: 'coverage-html', command: 'coverage html', description: 'Generate HTML coverage report' },
    ];
  },
};
