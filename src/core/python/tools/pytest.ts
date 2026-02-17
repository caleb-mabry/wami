import type { PythonTool } from '../interfaces/tool.js';

export const pytestTool: PythonTool = {
  name: 'pytest',
  packageName: 'pytest',
  async scripts(_projectRoot) {
    return [
      { name: 'test', command: 'pytest', description: 'Run all tests' },
      { name: 'test-verbose', command: 'pytest -v', description: 'Run tests with verbose output' },
      { name: 'test-cov', command: 'pytest --cov', description: 'Run tests with coverage report' },
    ];
  },
};
