/**
 * Command Editor Component
 *
 * Allows users to edit the full command before executing.
 * Useful for fixing typos or modifying saved commands.
 */

import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';

interface CommandEditorProps {
  scriptName: string;
  initialCommand: string;
  onSubmit: (command: string) => void;
  onCancel: () => void;
}

export function CommandEditor({
  scriptName,
  initialCommand,
  onSubmit,
  onCancel,
}: CommandEditorProps) {
  const [command, setCommand] = useState(initialCommand);
  const [cursorPosition, setCursorPosition] = useState(initialCommand.length);

  useInput((char, key) => {
    if (key.return) {
      onSubmit(command);
    } else if (key.escape) {
      onCancel();
    } else if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        setCommand(
          (prev) => prev.slice(0, cursorPosition - 1) + prev.slice(cursorPosition)
        );
        setCursorPosition((prev) => prev - 1);
      }
    } else if (key.leftArrow) {
      setCursorPosition((prev) => Math.max(0, prev - 1));
    } else if (key.rightArrow) {
      setCursorPosition((prev) => Math.min(command.length, prev + 1));
    } else if (!key.ctrl && !key.meta && char) {
      setCommand(
        (prev) => prev.slice(0, cursorPosition) + char + prev.slice(cursorPosition)
      );
      setCursorPosition((prev) => prev + 1);
    }
  });

  // Split command into chunks for display (word wrap)
  const beforeCursor = command.slice(0, cursorPosition);
  const atCursor = command[cursorPosition] || ' '; // Character at cursor, or space if at end
  const afterCursor = command.slice(cursorPosition + 1);

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Box marginBottom={1} borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">
          ✏️  Edit command: {scriptName}
        </Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text dimColor>Command ({command.length} chars):</Text>
        <Box flexDirection="column" paddingLeft={2}>
          <Text color="green" wrap="wrap">
            {beforeCursor}
            <Text inverse>{atCursor}</Text>
            {afterCursor}
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          <Text bold>Enter</Text> run  <Text bold>Esc</Text> cancel  <Text bold>←/→</Text> move  <Text bold>Backspace</Text> delete
        </Text>
      </Box>
    </Box>
  );
}
