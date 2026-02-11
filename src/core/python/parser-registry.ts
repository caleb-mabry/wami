/**
 * Task Parser Registry
 *
 * Auto-discovers and registers all Python task parsers.
 * Inspired by C# plugin introspection patterns.
 */

import type { TaskParser } from './task-parser.js';
import type { Script } from '../../types/index.js';

// Import all parsers - new parsers are automatically discovered here
import { poeTaskParser } from './poe-parser.js';
// Future parsers:
// import { invokeTaskParser } from './invoke-parser.js';
// import { noxTaskParser } from './nox-parser.js';

/**
 * Registry of all Python task parsers.
 *
 * To add a new parser:
 * 1. Create a new file (e.g., invoke-parser.ts)
 * 2. Implement the TaskParser interface
 * 3. Export a singleton instance
 * 4. Import it above
 * 5. Add to the parsers array below
 *
 * That's it! The parser is now auto-discovered.
 */
class PythonParserRegistry {
  private parsers: TaskParser[] = [];

  constructor() {
    // Auto-register all parsers
    this.register(poeTaskParser);
    // Future parsers will be added here:
    // this.register(invokeTaskParser);
    // this.register(noxTaskParser);
  }

  /**
   * Register a task parser.
   */
  private register(parser: TaskParser): void {
    this.parsers.push(parser);
  }

  /**
   * Get all registered parsers.
   */
  getAllParsers(): TaskParser[] {
    return [...this.parsers];
  }

  /**
   * Parse tasks from all configured parsers.
   *
   * @param toml - Parsed pyproject.toml content
   * @returns Combined array of scripts from all parsers
   */
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

  /**
   * Get names of all registered parsers.
   */
  getParserNames(): string[] {
    return this.parsers.map(p => p.name);
  }
}

// Export singleton instance
export const pythonParserRegistry = new PythonParserRegistry();
