/**
 * Node.js Package Manager Definitions
 *
 * Each definition owns the full knowledge of one package manager:
 * - Which lock files indicate its presence (used for detection)
 * - Which config files it reads (npmrc, yarnrc, etc.)
 * - How to build a run command for a script name
 *
 * Detection iterates this list in priority order, so order matters.
 * To add a new Node.js package manager, add a definition here — nothing
 * else in the codebase needs to change.
 */

import type { NodePackageManagerId } from '@wami-types';

export interface NodePackageManagerDefinition {
  readonly id: NodePackageManagerId;
  /** Lock files whose presence indicates this package manager is in use. */
  readonly lockFiles: readonly string[];
  /** Config files this package manager reads. Used for future config-aware features. */
  readonly configFiles: readonly string[];
  /** Build the shell command used to run a named script. */
  buildRunCommand(scriptName: string): string;
}

const bun: NodePackageManagerDefinition = {
  id: 'bun',
  lockFiles: ['bun.lockb', 'bun.lock'],
  configFiles: ['bunfig.toml'],
  buildRunCommand: (script) => `bun ${script}`,
};

const pnpm: NodePackageManagerDefinition = {
  id: 'pnpm',
  lockFiles: ['pnpm-lock.yaml'],
  // pnpm reads .npmrc in addition to its own workspace file
  configFiles: ['.npmrc', 'pnpm-workspace.yaml'],
  buildRunCommand: (script) => `pnpm ${script}`,
};

const yarn: NodePackageManagerDefinition = {
  id: 'yarn',
  lockFiles: ['yarn.lock'],
  configFiles: ['.yarnrc.yml', '.yarnrc', 'yarn.config.mjs'],
  buildRunCommand: (script) => `yarn ${script}`,
};

const npm: NodePackageManagerDefinition = {
  id: 'npm',
  lockFiles: ['package-lock.json'],
  configFiles: ['.npmrc'],
  buildRunCommand: (script) => `npm run ${script}`,
};

/**
 * All Node.js package manager definitions, ordered by detection priority.
 * The first definition whose lock file is present wins.
 * npm is last because it is also the fallback when no lock file is found.
 */
export const NODE_PACKAGE_MANAGERS: readonly NodePackageManagerDefinition[] = [
  bun,
  pnpm,
  yarn,
  npm,
];

/**
 * Look up a Node.js package manager definition by id.
 * Returns null if the id belongs to a different ecosystem (Python, Go, etc.).
 */
export function findNodePackageManager(
  id: string
): NodePackageManagerDefinition | null {
  return NODE_PACKAGE_MANAGERS.find((pm) => pm.id === id) ?? null;
}
