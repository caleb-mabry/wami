/**
 * Project Switcher Component
 *
 * Allows navigation between multiple detected projects in a mono-repo.
 */

import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';
import type { DetectionResult } from '../core/registry.js';
import * as path from 'path';

interface ProjectSwitcherProps {
  projects: DetectionResult[];
  currentProjectPath: string;
  onSelect: (project: DetectionResult) => void;
  onCancel: () => void;
}

export function ProjectSwitcher({
  projects,
  currentProjectPath,
  onSelect,
  onCancel,
}: ProjectSwitcherProps) {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    // Find current project in the list
    return projects.findIndex(
      (p) => p.packageInfo?.path.replace(/\/(package\.json|pyproject\.toml|Pipfile|requirements\.txt)$/, '') === currentProjectPath
    );
  });

  useInput((input, key) => {
    // Navigation
    if (key.upArrow || input === 'k') {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex((prev) => Math.min(projects.length - 1, prev + 1));
    }
    // Select
    else if (key.return) {
      const selected = projects[selectedIndex];
      if (selected) {
        onSelect(selected);
      }
    }
    // Cancel
    else if (key.escape || input === 'q') {
      onCancel();
    }
  });

  if (projects.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="yellow">📁 Project Switcher</Text>
        <Box marginTop={1}>
          <Text dimColor>No other projects detected in this mono-repo.</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press <Text bold>Esc</Text> to close</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">📁 Switch Project ({projects.length} found):</Text>

      <Box marginTop={1} flexDirection="column">
        {projects.map((project, index) => {
          if (!project.packageInfo) return null;

          const isSelected = index === selectedIndex;
          const projectPath = project.packageInfo.path.replace(
            /\/(package\.json|pyproject\.toml|Pipfile|requirements\.txt)$/,
            ''
          );
          const isCurrent = projectPath === currentProjectPath;
          const relativePath = path.relative(process.cwd(), projectPath) || '.';

          return (
            <Box key={projectPath} marginLeft={2}>
              {isSelected ? (
                <Text color="cyan" bold>
                  ▶ {relativePath} <Text dimColor>({project.detector?.name} - {project.packageInfo.packageManager})</Text>
                  {isCurrent && <Text color="green"> [current]</Text>}
                </Text>
              ) : (
                <Text>
                  {'  '}{relativePath} <Text dimColor>({project.detector?.name} - {project.packageInfo.packageManager})</Text>
                  {isCurrent && <Text color="green"> [current]</Text>}
                </Text>
              )}
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1} marginLeft={2}>
        <Text dimColor>
          <Text bold>↑/↓/k/j</Text> navigate  <Text bold>Enter</Text> select  <Text bold>Esc/q</Text> cancel
        </Text>
      </Box>
    </Box>
  );
}
