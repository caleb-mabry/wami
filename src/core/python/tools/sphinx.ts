import * as path from 'path';
import { fileExists } from '@utils/fs.js';
import type { PythonTool } from '../interfaces/tool.js';

export const sphinxTool: PythonTool = {
  name: 'sphinx',
  packageName: 'sphinx',
  async scripts(projectRoot) {
    const docsDir = await fileExists(path.join(projectRoot, 'docs')) ? 'docs' : '.';
    return [
      { name: 'docs-build', command: `sphinx-build -b html ${docsDir} ${docsDir}/_build`, description: 'Build documentation with Sphinx' },
    ];
  },
};
