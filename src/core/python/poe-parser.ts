/**
 * Poethepoet Task Parser
 *
 * Parses tasks from [tool.poe.tasks] in pyproject.toml
 * https://github.com/nat-n/poethepoet
 */

import type { Script } from '../../types/index.js';
import type { TaskParser } from './task-parser.js';

/**
 * Poethepoet task runner parser.
 */
export class PoeTaskParser implements TaskParser {
  readonly name = 'poethepoet';

  /**
   * Check if poethepoet is configured.
   */
  isConfigured(toml: any): boolean {
    return !!toml.tool?.poe?.tasks;
  }

  /**
   * Parse poethepoet tasks from [tool.poe.tasks].
   */
  parse(toml: any): Script[] {
    const scripts: Script[] = [];

    if (!this.isConfigured(toml)) {
      return scripts;
    }

    const tasks = toml.tool.poe.tasks;

    for (const [taskName, taskConfig] of Object.entries(tasks)) {
      // Tasks can be:
      // 1. String: task = "command"
      // 2. Object: task = { shell = "command", help = "description" }
      // 3. Object: task = { script = "module:function", help = "description" }
      // 4. Object: task = { cmd = "command", help = "description" }

      let command = '';
      let description = '';

      if (typeof taskConfig === 'string') {
        command = taskConfig;
      } else if (typeof taskConfig === 'object' && taskConfig !== null) {
        const config = taskConfig as any;

        // Get the command
        if (config.shell) {
          command = config.shell;
        } else if (config.script) {
          command = config.script;
        } else if (config.cmd) {
          command = config.cmd;
        } else if (Array.isArray(config)) {
          // Some tasks are defined as arrays of commands
          command = config.join(' && ');
        }

        // Get the description
        if (config.help) {
          description = config.help;
        }
      }

      if (command) {
        scripts.push({
          name: `poe:${taskName}`,
          command: `poe ${taskName}`,
          description: description || `Run poe task: ${taskName}`,
        });
      }
    }

    return scripts;
  }
}

// Export singleton instance for auto-discovery
export const poeTaskParser = new PoeTaskParser();
