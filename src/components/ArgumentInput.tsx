/**
 * Argument Input Component
 *
 * Allows users to type additional arguments before executing a command.
 */

import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';

interface ArgumentInputProps {
  scriptName: string;
  baseCommand: string;
  onSubmit: (args: string) => void;
  onCancel: () => void;
}

export function ArgumentInput({
  scriptName,
  baseCommand,
  onSubmit,
  onCancel,
}: ArgumentInputProps) {
  const [input, setInput] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  useInput((char, key) => {
    if (key.return) {
      onSubmit(input);
    } else if (key.escape) {
      onCancel();
    } else if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        setInput((prev) => prev.slice(0, cursorPosition - 1) + prev.slice(cursorPosition));
        setCursorPosition((prev) => prev - 1);
      }
    } else if (key.leftArrow) {
      setCursorPosition((prev) => Math.max(0, prev - 1));
    } else if (key.rightArrow) {
      setCursorPosition((prev) => Math.min(input.length, prev + 1));
    } else if (!key.ctrl && !key.meta && char) {
      setInput((prev) => prev.slice(0, cursorPosition) + char + prev.slice(cursorPosition));
      setCursorPosition((prev) => prev + 1);
    }
  });

  // Truncate base command if too long
  let displayCommand = baseCommand;
  const maxLength = 60;
  if (displayCommand.length > maxLength) {
    displayCommand = displayCommand.substring(0, maxLength) + '...';
  }

  // Cursor display
  const beforeCursor = input.slice(0, cursorPosition);
  const atCursor = input[cursorPosition] || ' '; // Character at cursor, or space if at end
  const afterCursor = input.slice(cursorPosition + 1);

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Box marginBottom={1} borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">
          ✏️  Add arguments to: {scriptName}
        </Text>
      </Box>
      <Box marginBottom={1} flexDirection="column">
        <Text dimColor>Base: {displayCommand}</Text>
      </Box>
      <Box flexDirection="column">
        <Box>
          <Text bold>Arguments: </Text>
          <Text color="green">
            {beforeCursor}
            <Text inverse>{atCursor}</Text>
            {afterCursor}
          </Text>
        </Box>
        {input.length > 50 && (
          <Box paddingLeft={11}>
            <Text dimColor wrap="wrap">{input}</Text>
          </Box>
        )}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          <Text bold>Enter</Text> run  <Text bold>Esc</Text> cancel  <Text bold>←/→</Text> move cursor
        </Text>
      </Box>
    </Box>
  );
}
