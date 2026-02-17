// Core types for the Where Am I CLI

export type NodePackageManagerId = 'npm' | 'yarn' | 'pnpm' | 'bun';
export type PythonPackageManagerId = 'uv' | 'poetry' | 'pdm' | 'pipenv' | 'pip';
export type GoPackageManagerId = 'go';

export type PackageManager = NodePackageManagerId | PythonPackageManagerId | GoPackageManagerId;

export interface Script {
  name: string;
  command: string;
  description?: string; // Optional description for the script
  interactive?: boolean; // Whether to prompt for arguments before running
}

export interface WorkspaceInfo {
  isWorkspace: boolean;
  workspaceRoot?: string; // Absolute path to workspace root package.json
  workspaceName?: string; // Name of the workspace root package
  relativePath?: string; // Relative path from workspace root to current package
}

export interface PackageInfo {
  path: string; // Absolute path to package.json
  name: string; // Package name
  packageManager: PackageManager;
  scripts: Script[];
  workspace?: WorkspaceInfo; // Workspace information if in a mono-repo
  hasVenv?: boolean; // Whether a virtual environment is detected
  venvPath?: string; // Path to virtual environment
}

export interface DetectionResult {
  found: boolean;
  packageInfo?: PackageInfo;
  error?: string;
}

/**
 * Configuration file schema for .wami.json
 * Allows users to customize commands per project
 */
export interface WamiConfig {
  commands?: Record<
    string,
    | string // Simple string command
    | {
        command: string;
        description?: string;
        interactive?: boolean; // Prompt for arguments before running
        args?: string[]; // Optional predefined arguments
      }
  >;
  ignore?: string[]; // Script names to hide from auto-detection
  venv?: {
    path?: string; // Custom venv path
    activate?: boolean; // Whether to activate venv before running commands
  };
}
