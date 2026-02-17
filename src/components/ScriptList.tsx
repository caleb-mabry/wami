/**
 * Interactive Script List Component
 *
 * Displays scripts with keyboard navigation:
 * - Up/Down arrows or j/k: Navigate
 * - Enter: Execute selected script
 * - Escape: Back/Cancel (on sub-screens)
 * - q: Quit
 */

import React, { useState, useEffect } from 'react';
import { Text, Box, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import type { PackageInfo, Script } from '../types/index.js';
import type { EcosystemDetector } from '../core/detector.js';
import type { DetectionResult } from '../core/registry.js';
import { executeCommand } from '../utils/command.js';
import { ArgumentInput } from './ArgumentInput.js';
import { CommandEditor } from './CommandEditor.js';
import { CustomCommandInput } from './CustomCommandInput.js';
import { ProjectSwitcher } from './ProjectSwitcher.js';
import { getHistory, deleteFromHistory } from '../utils/history.js';

interface ScriptListProps {
  packageInfo: PackageInfo;
  detector: EcosystemDetector;
  history: Script[];
  projectPath: string;
  allProjects: DetectionResult[];
  onProjectSwitch: (project: DetectionResult) => void;
}

export function ScriptList({
  packageInfo,
  detector,
  history: initialHistory,
  projectPath,
  allProjects,
  onProjectSwitch,
}: ScriptListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showArgInput, setShowArgInput] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showCustomCommand, setShowCustomCommand] = useState(false);
  const [showProjectSwitcher, setShowProjectSwitcher] = useState(false);
  const [history, setHistory] = useState(initialHistory);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { exit } = useApp();

  // Combine history and regular scripts
  const allScriptsUnfiltered = [...history, ...packageInfo.scripts];
  const historyCount = history.length;

  // Filter scripts based on search query
  const allScripts = searchQuery
    ? allScriptsUnfiltered.filter((script) => {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = script.name.toLowerCase().includes(searchLower);
        const commandMatch = script.command.toLowerCase().includes(searchLower);
        const descMatch = script.description?.toLowerCase().includes(searchLower);
        return nameMatch || commandMatch || descMatch;
      })
    : allScriptsUnfiltered;

  // Reload history when it changes
  useEffect(() => {
    setHistory(initialHistory);
  }, [initialHistory]);

  // Reset selected index when search results change
  useEffect(() => {
    if (selectedIndex >= allScripts.length) {
      setSelectedIndex(Math.max(0, allScripts.length - 1));
    }
  }, [allScripts.length, selectedIndex]);

  useInput((input, key) => {
    // Don't handle input if showing argument input, editor, custom command, or project switcher
    if (showArgInput || showEditor || showCustomCommand || showProjectSwitcher) {
      return;
    }

    // Search mode
    if (isSearching) {
      if (key.escape) {
        // Clear search
        setIsSearching(false);
        setSearchQuery('');
        setSelectedIndex(0);
      } else if (key.backspace || key.delete) {
        setSearchQuery((prev) => prev.slice(0, -1));
      } else if (key.return) {
        // Exit search mode but keep filter active
        setIsSearching(false);
      } else if (!key.ctrl && !key.meta && !key.upArrow && !key.downArrow && input) {
        setSearchQuery((prev) => prev + input);
      } else if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(allScripts.length - 1, prev + 1));
      }
      return;
    }

    // Navigation (arrow keys and vim-style j/k)
    if (key.upArrow || input === 'k') {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex((prev) => Math.min(allScripts.length - 1, prev + 1));
    }

    // Execute script immediately
    else if (key.return) {
      const selectedScript = allScripts[selectedIndex];
      if (selectedScript) {
        // If it's from history, use the full command as-is
        const isHistory = selectedIndex < historyCount;
        const command = isHistory
          ? selectedScript.command
          : detector.buildCommand(packageInfo, selectedScript.name);

        // Always save to history to update frequency count
        executeCommand(
          command,
          exit,
          projectPath,
          selectedScript.name,
          true // Always save to update frequency
        );
      }
    }

    // Add arguments before executing
    else if (input === 'a') {
      setShowArgInput(true);
    }

    // Edit command before executing
    else if (input === 'e') {
      setShowEditor(true);
    }

    // Start search
    else if (input === '/' || input === 's') {
      setIsSearching(true);
      setSearchQuery('');
    }

    // Clear search filter OR open custom command
    else if (input === 'c') {
      if (searchQuery) {
        // Clear search if active
        setSearchQuery('');
        setSelectedIndex(0);
      } else {
        // Open custom command input
        setShowCustomCommand(true);
      }
    }

    // Delete from history
    else if (input === 'd' || key.delete) {
      const isHistory = selectedIndex < historyCount;
      if (isHistory) {
        const scriptToDelete = history[selectedIndex];
        if (scriptToDelete) {
          // Delete from history file
          deleteFromHistory(projectPath, scriptToDelete.command);

          // Remove from display immediately
          const newHistory = [...history];
          newHistory.splice(selectedIndex, 1);
          setHistory(newHistory);

          // Adjust selected index if needed
          if (selectedIndex >= newHistory.length + packageInfo.scripts.length) {
            setSelectedIndex((prev) => Math.max(0, prev - 1));
          }
        }
      }
    }

    // Open project switcher (only if multiple projects detected)
    else if (input === 'p' && allProjects.length > 1) {
      setShowProjectSwitcher(true);
    }

    // Exit (only 'q' quits, Escape does nothing on main screen)
    else if (input === 'q') {
      exit();
    }
  });

  const handleArgumentSubmit = (args: string) => {
    const selectedScript = allScripts[selectedIndex];
    if (selectedScript) {
      const isHistory = selectedIndex < historyCount;
      const baseCommand = isHistory
        ? selectedScript.command
        : detector.buildCommand(packageInfo, selectedScript.name);

      const fullCommand = args.trim() ? `${baseCommand} ${args.trim()}` : baseCommand;

      // Save to history if arguments were added
      const saveToHistory = args.trim().length > 0;
      executeCommand(
        fullCommand,
        exit,
        projectPath,
        selectedScript.name,
        saveToHistory
      );
    }
  };

  const handleArgumentCancel = () => {
    setShowArgInput(false);
  };

  const handleEditorSubmit = async (editedCommand: string) => {
    const selectedScript = allScripts[selectedIndex];
    if (selectedScript) {
      const isHistory = selectedIndex < historyCount;
      const originalCommand = isHistory
        ? selectedScript.command
        : detector.buildCommand(packageInfo, selectedScript.name);

      // If editing a history item, delete the old version first
      if (isHistory && editedCommand !== originalCommand) {
        await deleteFromHistory(projectPath, originalCommand);
      }

      const saveToHistory = editedCommand !== originalCommand;
      executeCommand(
        editedCommand,
        exit,
        projectPath,
        selectedScript.name,
        saveToHistory
      );
    }
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
  };

  const handleProjectSelect = (project: DetectionResult) => {
    setShowProjectSwitcher(false);
    onProjectSwitch(project);
  };

  const handleProjectSwitcherCancel = () => {
    setShowProjectSwitcher(false);
  };

  const handleCustomCommandSubmit = (name: string, command: string) => {
    setShowCustomCommand(false);
    // Save to history with user-provided name
    executeCommand(command, exit, projectPath, name, true);
  };

  const handleCustomCommandCancel = () => {
    setShowCustomCommand(false);
  };

  // Show custom command input if active
  if (showCustomCommand) {
    return (
      <CustomCommandInput
        onSubmit={handleCustomCommandSubmit}
        onCancel={handleCustomCommandCancel}
      />
    );
  }

  // Show project switcher if active
  if (showProjectSwitcher) {
    return (
      <ProjectSwitcher
        projects={allProjects}
        currentProjectPath={projectPath}
        onSelect={handleProjectSelect}
        onCancel={handleProjectSwitcherCancel}
      />
    );
  }

  if (showArgInput) {
    const selectedScript = allScripts[selectedIndex];
    if (selectedScript) {
      const isHistory = selectedIndex < historyCount;
      const baseCommand = isHistory
        ? selectedScript.command
        : detector.buildCommand(packageInfo, selectedScript.name);

      return (
        <ArgumentInput
          scriptName={selectedScript.name}
          baseCommand={baseCommand}
          onSubmit={handleArgumentSubmit}
          onCancel={handleArgumentCancel}
        />
      );
    }
  }

  if (showEditor) {
    const selectedScript = allScripts[selectedIndex];
    if (selectedScript) {
      const isHistory = selectedIndex < historyCount;
      const fullCommand = isHistory
        ? selectedScript.command
        : detector.buildCommand(packageInfo, selectedScript.name);

      return (
        <CommandEditor
          scriptName={selectedScript.name}
          initialCommand={fullCommand}
          onSubmit={handleEditorSubmit}
          onCancel={handleEditorCancel}
        />
      );
    }
  }

  if (allScripts.length === 0) {
    return (
      <Box flexDirection="column">
        {searchQuery ? (
          <>
            <Box marginBottom={1}>
              <Text bold color="cyan">Search: </Text>
              <Text color="yellow">{searchQuery}</Text>
            </Box>
            <Text dimColor>No matches found. Press <Text bold>Esc</Text> to clear search.</Text>
          </>
        ) : (
          <>
            <Text bold color="yellow">Available Scripts:</Text>
            <Box marginLeft={2}>
              <Text dimColor>No scripts found</Text>
            </Box>
          </>
        )}
      </Box>
    );
  }

  // Scrolling viewport calculation
  const MAX_VISIBLE_ITEMS = 15; // Maximum items to show at once
  const totalItems = allScripts.length;

  // Calculate scroll window
  let startIndex = 0;
  let endIndex = Math.min(MAX_VISIBLE_ITEMS, totalItems);

  if (totalItems > MAX_VISIBLE_ITEMS) {
    // Keep selected item in middle of viewport when possible
    const halfWindow = Math.floor(MAX_VISIBLE_ITEMS / 2);
    startIndex = Math.max(0, selectedIndex - halfWindow);
    endIndex = Math.min(totalItems, startIndex + MAX_VISIBLE_ITEMS);

    // Adjust if we hit the end
    if (endIndex === totalItems) {
      startIndex = Math.max(0, endIndex - MAX_VISIBLE_ITEMS);
    }
  }

  const visibleScripts = allScripts.slice(startIndex, endIndex);
  const hasMoreAbove = startIndex > 0;
  const hasMoreBelow = endIndex < totalItems;

  return (
    <Box flexDirection="column">
      {/* Search input */}
      {(isSearching || searchQuery) && (
        <Box marginBottom={1} borderStyle="round" borderColor="cyan" paddingX={1}>
          <Text bold color="cyan">
            {isSearching && <Spinner type="dots" />} Search:
          </Text>
          <Text color="yellow">{searchQuery}</Text>
          {isSearching && <Text inverse> </Text>}
          {searchQuery && !isSearching && (
            <Text dimColor> (press <Text bold>c</Text> to clear)</Text>
          )}
        </Box>
      )}

      {/* Search results count */}
      {searchQuery && allScripts.length > 0 && (
        <Box marginBottom={1}>
          <Text color="green">✓ </Text>
          <Text dimColor>
            {allScripts.length} match{allScripts.length !== 1 ? 'es' : ''} found
          </Text>
        </Box>
      )}

      {/* Scroll indicator - more above */}
      {hasMoreAbove && (
        <Box marginBottom={1}>
          <Text dimColor>↑ {startIndex} more above</Text>
        </Box>
      )}

      {/* Recent Commands Section */}
      {historyCount > 0 && startIndex < historyCount && (
        <>
          <Text bold color="green">
            Recent Commands:
          </Text>
          {visibleScripts.map((script, visibleIndex) => {
            const actualIndex = startIndex + visibleIndex;
            if (actualIndex >= historyCount) return null; // Skip if past history

            const isSelected = actualIndex === selectedIndex;
            let displayText = script.description || script.command;

            // Truncate long commands for display
            const maxLength = 60;
            if (displayText.length > maxLength) {
              displayText = displayText.substring(0, maxLength) + '... (' + displayText.length + ' chars)';
            }

            return (
              <Box key={`history-${actualIndex}`} marginLeft={2} flexDirection="column">
                <Box>
                  {isSelected ? (
                    <Text color="cyan" bold>
                      <Text>▶ </Text>
                      {script.name}
                    </Text>
                  ) : (
                    <Text>  {script.name}</Text>
                  )}
                  <Text dimColor> - {displayText}</Text>
                </Box>
              </Box>
            );
          })}
          <Box marginTop={1} />
        </>
      )}

      {/* Available Scripts Section */}
      {endIndex > historyCount && (
        <>
          <Text bold color="yellow">
            📜 Available Scripts:
          </Text>
          {visibleScripts.map((script, visibleIndex) => {
            const actualIndex = startIndex + visibleIndex;
            if (actualIndex < historyCount) return null; // Skip history items

            const isSelected = actualIndex === selectedIndex;
            let displayText = script.description || script.command;

            // Truncate long commands for display
            const maxLength = 60;
            if (displayText.length > maxLength) {
              displayText = displayText.substring(0, maxLength) + '...';
            }

            return (
              <Box key={script.name} marginLeft={2} flexDirection="column">
                <Box>
                  {isSelected ? (
                    <Text color="cyan" bold>
                      <Text>▶ </Text>
                      {script.name}
                    </Text>
                  ) : (
                    <Text>  {script.name}</Text>
                  )}
                  <Text dimColor> - {displayText}</Text>
                </Box>
              </Box>
            );
          })}
        </>
      )}

      {/* Scroll indicator - more below */}
      {hasMoreBelow && (
        <Box marginTop={1}>
          <Text dimColor>↓ {totalItems - endIndex} more below</Text>
        </Box>
      )}
      <Box marginTop={1} marginLeft={2}>
        <Text dimColor>
          {isSearching ? (
            <>
              <Text bold>Type</Text> to search  <Text bold>↑/↓/k/j</Text> navigate  <Text bold>Enter</Text> done  <Text bold>Esc</Text> cancel
            </>
          ) : (
            <>
              <Text bold>↑/↓/k/j</Text> navigate  <Text bold>Enter</Text> run  <Text bold>a</Text> add args  <Text bold>e</Text> edit  {searchQuery ? <><Text bold>c</Text> clear  </> : <><Text bold>c</Text> custom  </>}<Text bold>/</Text> search  {historyCount > 0 && <><Text bold>d</Text> delete  </>}{allProjects.length > 1 && <><Text bold>p</Text> projects  </>}<Text bold>q</Text> quit
            </>
          )}
        </Text>
      </Box>
    </Box>
  );
}
