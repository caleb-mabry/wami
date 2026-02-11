#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './app.js';

// Entry point for the CLI
const { waitUntilExit, clear } = render(<App />, {
  exitOnCtrlC: true,
  patchConsole: false, // Don't intercept console.log
});

// Wait for the app to exit
await waitUntilExit();

// Clear Ink output
clear();

// Clear the terminal completely
process.stdout.write('\x1Bc'); // ESC c - Full terminal reset
