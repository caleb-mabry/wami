/**
 * Command Execution Utilities
 *
 * Handles executing commands in the user's shell after exiting the TUI.
 */

import { spawn } from 'child_process';
import { addToHistory } from './history.js';

/**
 * Execute a command in the user's shell.
 *
 * This function exits the Ink app cleanly, then spawns the command
 * in the user's shell with inherited stdio (so output appears in terminal).
 *
 * @param command - Full command string to execute (e.g., "npm run dev")
 * @param exitFn - Ink's exit function to cleanly shutdown the TUI
 * @param projectPath - Absolute path to project root (for history)
 * @param scriptName - Name of the script being executed
 * @param saveToHistory - Whether to save this command to history
 */
export function executeCommand(
  command: string,
  exitFn: () => void,
  projectPath?: string,
  scriptName?: string,
  saveToHistory: boolean = false
): void {
  // Exit the Ink app first to restore terminal state
  exitFn();

  // Wait for next tick to ensure Ink has fully unmounted
  process.nextTick(async () => {
    // Save to history if requested
    if (saveToHistory && projectPath && scriptName) {
      await addToHistory(projectPath, scriptName, command);
    }

    // Small delay to ensure terminal is fully restored
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Clear screen to make it obvious TUI has exited
    console.clear();

    // Print separator and command
    console.log('─'.repeat(process.stdout.columns || 80));
    console.log(`Running: ${command}`);
    console.log('─'.repeat(process.stdout.columns || 80));
    console.log('');

    // Spawn the command in the user's shell
    // inherit stdio so output goes directly to the terminal
    const child = spawn(command, {
      shell: true,
      stdio: 'inherit',
      cwd: process.cwd(),
      detached: false,
    });

    // Exit with the same code as the child process
    child.on('exit', (code) => {
      process.exit(code || 0);
    });

    // Handle errors
    child.on('error', (err) => {
      console.error('\nFailed to execute command:', err);
      process.exit(1);
    });
  });
}
