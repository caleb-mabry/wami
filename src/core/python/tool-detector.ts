/**
 * Python Tool Detector
 *
 * Detects installed Python development tools and generates
 * appropriate commands for them (linters, formatters, test runners, etc.)
 */

import * as path from 'path';
import { fileExists } from '../../utils/fs.js';
import type { Script } from '../../types/index.js';

/**
 * Detect available Python tools from dependencies and generate commands.
 *
 * @param dependencies - Set of installed package names (normalized to lowercase)
 * @param projectRoot - Absolute path to project root
 * @returns Array of scripts for detected tools
 */
export async function detectPythonTools(
  dependencies: Set<string>,
  projectRoot: string
): Promise<Script[]> {
  const tools: Script[] = [];

  // Ruff - Modern Python linter and formatter
  if (dependencies.has('ruff')) {
    tools.push(
      { name: 'ruff-check', command: 'ruff check', description: '🔍 Run ruff linter' },
      { name: 'ruff-check-fix', command: 'ruff check --fix', description: '🔧 Run ruff linter and auto-fix issues' },
      { name: 'ruff-format', command: 'ruff format', description: '✨ Format code with ruff' },
      { name: 'ruff-format-check', command: 'ruff format --check', description: '👀 Check if code is formatted' }
    );
  }

  // Pytest - Testing framework
  if (dependencies.has('pytest')) {
    tools.push(
      { name: 'test', command: 'pytest', description: '🧪 Run all tests' },
      { name: 'test-verbose', command: 'pytest -v', description: '🧪 Run tests with verbose output' },
      { name: 'test-cov', command: 'pytest --cov', description: '📊 Run tests with coverage report' }
    );
  }

  // Black - Code formatter
  if (dependencies.has('black')) {
    tools.push(
      { name: 'black', command: 'black .', description: '✨ Format code with black' },
      { name: 'black-check', command: 'black --check .', description: '👀 Check if code is formatted' }
    );
  }

  // MyPy - Static type checker
  if (dependencies.has('mypy')) {
    tools.push(
      { name: 'mypy', command: 'mypy .', description: '🔍 Run mypy type checker' }
    );
  }

  // Pyright - Static type checker
  if (dependencies.has('pyright')) {
    tools.push(
      { name: 'pyright', command: 'pyright', description: '🔍 Run pyright type checker' }
    );
  }

  // isort - Import sorter
  if (dependencies.has('isort')) {
    tools.push(
      { name: 'isort', command: 'isort .', description: '📑 Sort imports with isort' },
      { name: 'isort-check', command: 'isort --check-only .', description: '👀 Check import sorting' }
    );
  }

  // Flake8 - Linter
  if (dependencies.has('flake8')) {
    tools.push(
      { name: 'flake8', command: 'flake8', description: '🔍 Run flake8 linter' }
    );
  }

  // Pylint - Linter
  if (dependencies.has('pylint')) {
    tools.push(
      { name: 'pylint', command: 'pylint src', description: '🔍 Run pylint linter' }
    );
  }

  // Coverage.py - Code coverage
  if (dependencies.has('coverage')) {
    tools.push(
      { name: 'coverage-run', command: 'coverage run -m pytest', description: '📊 Run tests with coverage' },
      { name: 'coverage-report', command: 'coverage report', description: '📊 Show coverage report' },
      { name: 'coverage-html', command: 'coverage html', description: '📊 Generate HTML coverage report' }
    );
  }

  // Pre-commit - Git hook framework
  if (dependencies.has('pre-commit')) {
    tools.push(
      { name: 'pre-commit-install', command: 'pre-commit install', description: '🪝 Install pre-commit hooks' },
      { name: 'pre-commit-run', command: 'pre-commit run --all-files', description: '🪝 Run pre-commit on all files' }
    );
  }

  // Bandit - Security linter
  if (dependencies.has('bandit')) {
    tools.push(
      { name: 'bandit', command: 'bandit -r .', description: '🔒 Run security checks with bandit' }
    );
  }

  // Sphinx - Documentation generator
  if (dependencies.has('sphinx')) {
    const docsDir = await fileExists(path.join(projectRoot, 'docs')) ? 'docs' : '.';
    tools.push(
      { name: 'docs-build', command: `sphinx-build -b html ${docsDir} ${docsDir}/_build`, description: '📚 Build documentation with Sphinx' }
    );
  }

  return tools;
}

/**
 * Extract dependency names from various dependency formats.
 *
 * @param dependencies - Array of dependency strings or object of dependencies
 * @returns Array of package names (normalized to lowercase)
 */
export function extractDependencyNames(dependencies: string[] | Record<string, any>): string[] {
  if (Array.isArray(dependencies)) {
    return dependencies.map(dep => {
      // Extract package name from version specifier
      // Examples: "ruff>=0.1.0" -> "ruff", "pytest[asyncio]" -> "pytest"
      const match = dep.match(/^([a-zA-Z0-9_-]+)/);
      return match ? match[1].toLowerCase() : '';
    }).filter(Boolean);
  } else {
    // For Poetry/PDM format where dependencies is an object
    return Object.keys(dependencies).map(dep => dep.toLowerCase());
  }
}
