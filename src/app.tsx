import React, { useEffect, useState } from 'react';
import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';
import { registry } from './core/registry.js';
import { Header } from './components/Header.js';
import { ScriptList } from './components/ScriptList.js';
import { ErrorMessage } from './components/ErrorMessage.js';
import { getHistory } from './utils/history.js';
import type { DetectionResult } from './core/registry.js';
import type { Script } from './types/index.js';

export function App() {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [allProjects, setAllProjects] = useState<DetectionResult[]>([]);
  const [history, setHistory] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectProject = async () => {
      const cwd = process.cwd();

      // Detect current project
      const detectionResult = await registry.detect(cwd);
      setResult(detectionResult);

      // Detect all projects in mono-repo (for project switcher)
      const allDetected = await registry.detectAll(cwd);
      setAllProjects(allDetected);

      // Load command history for this project
      if (detectionResult.found && detectionResult.packageInfo) {
        const projectPath = detectionResult.packageInfo.path.replace(
          /\/(package\.json|pyproject\.toml|Pipfile|requirements\.txt)$/,
          ''
        );
        const projectHistory = await getHistory(projectPath);
        setHistory(projectHistory);
      }

      setLoading(false);
    };

    detectProject();
  }, []);

  // Handler to switch to a different project
  const handleProjectSwitch = async (newProject: DetectionResult) => {
    if (!newProject.packageInfo) return;

    setResult(newProject);

    // Load history for new project
    const projectPath = newProject.packageInfo.path.replace(
      /\/(package\.json|pyproject\.toml|Pipfile|requirements\.txt)$/,
      ''
    );
    const projectHistory = await getHistory(projectPath);
    setHistory(projectHistory);
  };

  if (loading) {
    return (
      <Box padding={1}>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Detecting project...</Text>
      </Box>
    );
  }

  if (!result?.found) {
    return (
      <ErrorMessage
        error={result?.error || 'Unknown error'}
        supportedEcosystems={registry.getSupportedEcosystems()}
      />
    );
  }

  const { packageInfo, detector } = result;
  const projectPath = packageInfo!.path.replace(
    /\/(package\.json|pyproject\.toml|Pipfile|requirements\.txt)$/,
    ''
  );

  return (
    <Box flexDirection="column" padding={1}>
      <Header packageInfo={packageInfo!} ecosystemName={detector!.name} />

      <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
        <ScriptList
          packageInfo={packageInfo!}
          detector={detector!}
          history={history}
          projectPath={projectPath}
          allProjects={allProjects}
          onProjectSwitch={handleProjectSwitch}
        />
      </Box>
    </Box>
  );
}
