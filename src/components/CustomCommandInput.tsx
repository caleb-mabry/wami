/**
 * Custom Command Input Component
 *
 * Allows users to create a custom command with a name and command.
 * Useful for saving frequently used commands to history.
 */

import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';

interface CustomCommandInputProps {
  onSubmit: (name: string, command: string) => void;
  onCancel: () => void;
}

export function CustomCommandInput({
  onSubmit,
  onCancel,
}: CustomCommandInputProps) {
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [focusedField, setFocusedField] = useState<'name' | 'command'>('name');
  const [nameCursorPos, setNameCursorPos] = useState(0);
  const [commandCursorPos, setCommandCursorPos] = useState(0);

  const currentText = focusedField === 'name' ? name : command;
  const cursorPos = focusedField === 'name' ? nameCursorPos : commandCursorPos;
  const setCurrentText = focusedField === 'name' ? setName : setCommand;
  const setCursorPos = focusedField === 'name' ? setNameCursorPos : setCommandCursorPos;

  useInput((char, key) => {
    if (key.return) {
      if (focusedField === 'name' && name.trim()) {
        // Move to command field
        setFocusedField('command');
      } else if (focusedField === 'command' && command.trim()) {
        // Submit
        onSubmit(name.trim() || 'custom', command.trim());
      }
    } else if (key.escape) {
      onCancel();
    } else if (key.tab) {
      // Switch between fields
      setFocusedField(focusedField === 'name' ? 'command' : 'name');
    } else if (key.backspace || key.delete) {
      if (cursorPos > 0) {
        setCurrentText(
          (prev) => prev.slice(0, cursorPos - 1) + prev.slice(cursorPos)
        );
        setCursorPos((prev) => prev - 1);
      }
    } else if (key.leftArrow) {
      setCursorPos((prev) => Math.max(0, prev - 1));
    } else if (key.rightArrow) {
      setCursorPos((prev) => Math.min(currentText.length, prev + 1));
    } else if (!key.ctrl && !key.meta && char) {
      setCurrentText(
        (prev) => prev.slice(0, cursorPos) + char + prev.slice(cursorPos)
      );
      setCursorPos((prev) => prev + 1);
    }
  });

  const renderField = (fieldName: 'name' | 'command', value: string, cursor: number) => {
    const isFocused = focusedField === fieldName;

    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text color={isFocused ? 'cyan' : 'dim'} bold={isFocused}>
          {fieldName === 'name' ? 'Name' : 'Command'} {isFocused && '(active)'}:
        </Text>
        <Box paddingLeft={2}>
          {isFocused ? (
            <Text color="green">
              {value.slice(0, cursor)}
              <Text inverse>{value[cursor] || ' '}</Text>
              {value.slice(cursor + 1)}
            </Text>
          ) : (
            <Text dimColor>{value || ' '}</Text>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Box marginBottom={1} borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">
          Create Custom Command
        </Text>
      </Box>

      {renderField('name', name, nameCursorPos)}
      {renderField('command', command, commandCursorPos)}

      <Box marginTop={1}>
        <Text dimColor>
          <Text bold>Enter</Text> {focusedField === 'name' ? 'next' : 'run'}  <Text bold>Tab</Text> switch field  <Text bold>Esc</Text> cancel  <Text bold>←/→</Text> move  <Text bold>Backspace</Text> delete
        </Text>
      </Box>
    </Box>
  );
}
