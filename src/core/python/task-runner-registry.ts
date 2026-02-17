/**
 * Task Runner Registry
 *
 * Auto-discovers and registers all Python task runner parsers.
 * Inspired by C# plugin introspection patterns.
 */

import type { TaskParser } from './interfaces/task-parser.js';
import type { Script } from '@wami-types';

// Import all parsers - new parsers are automatically discovered here
import { poeTaskParser } from './tools/poe.js';
// Future parsers:
// import { invokeTaskParser } from './tools/invoke.js';
// import { noxTaskParser } from './tools/nox.js';

/**
 * Registry of all Python task runner parsers.
 *
 * To add a new parser:
 * 1. Create a new file in tools/ (e.g., invoke.ts)
 * 2. Implement the TaskParser interface
 * 3. Export a singleton instance
 * 4. Import it above
 * 5. Add to the parsers array below
 */
class PythonParserRegistry {
  private parsers: TaskParser[] = [];

  constructor() {
    this.register(poeTaskParser);
    // Future parsers will be added here:
    // this.register(invokeTaskParser);
    // this.register(noxTaskParser);
  }

  private register(parser: TaskParser): void {
    this.parsers.push(parser);
  }

  getAllParsers(): TaskParser[] {
    return [...this.parsers];
  }

  parseAll(toml: any): Script[] {
    const allScripts: Script[] = [];

    for (const parser of this.parsers) {
      if (parser.isConfigured(toml)) {
        const scripts = parser.parse(toml);
        allScripts.push(...scripts);
      }
    }

    return allScripts;
  }

  getParserNames(): string[] {
    return this.parsers.map(p => p.name);
  }
}

export const pythonParserRegistry = new PythonParserRegistry();
