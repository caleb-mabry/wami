/**
 * Error Message Component
 *
 * Displays friendly error messages when no project is detected.
 */

import React from 'react';
import { Text, Box } from 'ink';

interface ErrorMessageProps {
  error: string;
  supportedEcosystems: string[];
}

export function ErrorMessage({ error, supportedEcosystems }: ErrorMessageProps) {
  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="red" padding={1}>
        <Text bold color="red">
          ❌ No Project Found
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text>{error}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          Supported ecosystems: {supportedEcosystems.join(', ')}
        </Text>
      </Box>
    </Box>
  );
}
