/**
 * Header Component
 *
 * Displays repository information in a clean, organized way.
 * Shows workspace context for mono-repos.
 */

import React from 'react';
import { Text, Box } from 'ink';
import type { PackageInfo } from '../types/index.js';

interface HeaderProps {
  packageInfo: PackageInfo;
  ecosystemName: string;
}

export function Header({ packageInfo, ecosystemName }: HeaderProps) {
  const workspace = packageInfo.workspace;
  const isInWorkspace = workspace?.isWorkspace && workspace.workspaceRoot;

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="cyan" padding={1}>
        <Text bold color="cyan">
          Where Am I? 🗺️
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        {isInWorkspace && workspace && (
          <>
            <Box>
              <Text bold>Workspace: </Text>
              <Text color="yellow">
                {workspace.workspaceName || 'Unknown'}
              </Text>
              <Text dimColor> (mono-repo)</Text>
            </Box>
            <Box marginLeft={2}>
              <Text dimColor>Root: {workspace.workspaceRoot}</Text>
            </Box>
          </>
        )}
        <Box>
          <Text bold>{isInWorkspace ? 'Package: ' : 'Repository: '}</Text>
          <Text color="green">{packageInfo.name}</Text>
        </Box>
        <Box marginLeft={isInWorkspace ? 2 : 0}>
          <Text dimColor>
            {isInWorkspace && '↳ '}
            {packageInfo.path.replace('/package.json', '')}
          </Text>
        </Box>
        {isInWorkspace && workspace?.relativePath && (
          <Box marginLeft={2}>
            <Text dimColor>Relative: {workspace.relativePath}</Text>
          </Box>
        )}
        <Box>
          <Text bold>Ecosystem: </Text>
          <Text color="blue">{ecosystemName}</Text>
        </Box>
        <Box>
          <Text bold>Package Manager: </Text>
          <Text color="magenta">{packageInfo.packageManager}</Text>
        </Box>
      </Box>
    </Box>
  );
}
