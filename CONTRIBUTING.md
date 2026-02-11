# Contributing to Where Am I (wami)

## Adding Support for New Ecosystems

Want to add support for Rust, Go, Python, or another ecosystem? Here's how:

### 1. Create a New Detector Class

Create a new file in `src/core/` (e.g., `rust-detector.ts`) that extends `EcosystemDetector`:

```typescript
import { EcosystemDetector } from './detector.js';
import type { PackageInfo } from '../types/index.js';

export class RustDetector extends EcosystemDetector {
  readonly name = 'Rust';
  readonly markerFiles = ['Cargo.toml'];

  async detect(cwd: string): Promise<string | null> {
    // Find Cargo.toml by walking up directory tree
    return await findFileUpwards(cwd, 'Cargo.toml');
  }

  async parse(projectRoot: string): Promise<PackageInfo> {
    // Read and parse Cargo.toml
    // Return PackageInfo with available commands
  }

  buildCommand(packageInfo: PackageInfo, scriptName: string): string {
    // Build the command string (e.g., "cargo run")
    return `cargo ${scriptName}`;
  }
}
```

### 2. Register the Detector

Add it to the registry in `src/core/registry.ts`:

```typescript
constructor() {
  this.register(new NodeJSDetector());
  this.register(new RustDetector());  // Add your detector here
}
```

### 3. That's It!

The detector will automatically be tried when running `wami`. If your ecosystem is broken, you know exactly which file to look at: `src/core/your-detector.ts`.

## Architecture Overview

```
src/
├── core/
│   ├── detector.ts           # Abstract base class - defines the contract
│   ├── nodejs-detector.ts    # Node.js implementation
│   ├── rust-detector.ts      # Your new detector here
│   └── registry.ts           # Manages all detectors
├── utils/
│   └── fs.ts                 # File system utilities
└── types/
    └── index.ts              # TypeScript interfaces
```

## The EcosystemDetector Contract

Every detector must implement:

- **`name`**: Human-readable ecosystem name
- **`markerFiles`**: Files that indicate this ecosystem (e.g., `["package.json"]`)
- **`detect(cwd)`**: Find the project root from current directory
- **`parse(projectRoot)`**: Parse project info and available commands
- **`buildCommand(packageInfo, scriptName)`**: Build the command string to execute

## Advanced: Modular Task Parser Architecture (Python Example)

For complex ecosystems with multiple task runners, use the plugin pattern:

### 1. Define a TaskParser Interface

```typescript
export interface TaskParser {
  readonly name: string;
  isConfigured(config: any): boolean;
  parse(config: any): Script[];
}
```

### 2. Create Individual Parsers

**src/core/python/poe-parser.ts:**
```typescript
export class PoeTaskParser implements TaskParser {
  readonly name = 'poethepoet';

  isConfigured(toml: any): boolean {
    return !!toml.tool?.poe?.tasks;
  }

  parse(toml: any): Script[] {
    // Parse [tool.poe.tasks] section
    return scripts;
  }
}

export const poeTaskParser = new PoeTaskParser();
```

### 3. Auto-Discovery Registry

**src/core/python/parser-registry.ts:**
```typescript
import { poeTaskParser } from './poe-parser.js';
import { invokeTaskParser } from './invoke-parser.js';

class PythonParserRegistry {
  private parsers: TaskParser[] = [];

  constructor() {
    this.register(poeTaskParser);
    this.register(invokeTaskParser);
    // Auto-discovers all parsers!
  }

  parseAll(toml: any): Script[] {
    return this.parsers
      .filter(p => p.isConfigured(toml))
      .flatMap(p => p.parse(toml));
  }
}
```

### 4. Use in Main Detector

```typescript
import { pythonParserRegistry } from './python/parser-registry.js';

const taskScripts = pythonParserRegistry.parseAll(toml);
scripts.push(...taskScripts);
```

### Benefits

- **Isolated**: Each parser in its own file (e.g., `poe-parser.ts`)
- **Extensible**: Add new task runners by creating a file and registering
- **Maintainable**: Easy to debug and update individual parsers
- **Auto-discovery**: Registry automatically finds and runs all configured parsers

## Example Ecosystems to Add

- **Rust**: Detect `Cargo.toml`, parse cargo commands
- **Go**: Detect `go.mod`, parse available commands
- **Ruby**: Detect `Gemfile`, parse rake tasks
- **Java/Maven**: Detect `pom.xml`, parse maven goals
- **Java/Gradle**: Detect `build.gradle`, parse gradle tasks
- **PHP/Composer**: Detect `composer.json`, parse composer scripts
- **Elixir/Mix**: Detect `mix.exs`, parse mix tasks
