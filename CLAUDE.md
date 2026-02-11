# Where Am I (wami) - Implementation Plan

## Project Overview
A TUI (Terminal User Interface) tool that detects what repository you're in and displays available commands. When you run `wami` in any repository, it automatically detects the project type, package manager, and shows you a list of runnable commands.

## Tech Stack
- **TypeScript**: Primary language
- **React with Ink**: UI framework for terminal interfaces
- **Yoga**: Layout system for responsive terminal UI
- **Bun**: Build tool and package manager

## MVP Scope
- **Language Support**: Node.js only (npm, yarn, pnpm, bun)
- **Command Execution**: Immediate execution on selection
- **Mono-repo**: Auto-detect nearest package.json based on current directory
- **Configuration**: Global user preferences (~/.wami/config.json)
- **Output**: Exit TUI and run command in terminal

---

## Implementation Phases

### Phase 1: Project Setup & Scaffolding
**Goal**: Initialize project with proper tooling and structure

#### Tasks:
- [ ] Initialize Bun project with TypeScript
- [ ] Install dependencies (ink, react, yoga-layout, etc.)
- [ ] Set up project structure:
  ```
  src/
    cli.tsx          # Entry point
    components/      # React/Ink components
    core/           # Core detection logic
    types/          # TypeScript types
    utils/          # Helper functions
  ```
- [ ] Configure tsconfig.json for strict mode
- [ ] Set up build/bundle configuration
- [ ] Add CLI binary configuration in package.json

---

### Phase 2: Repository Detection Core
**Goal**: Detect package.json and package manager

#### Tasks:
- [ ] **Directory Traversal**
  - Walk up directory tree from cwd to find package.json
  - Stop at filesystem root or when package.json found
  - Return absolute path to package.json location

- [ ] **Package Manager Detection**
  - Check for lock files in priority order:
    - `bun.lockb` → bun
    - `pnpm-lock.yaml` → pnpm
    - `yarn.lock` → yarn
    - `package-lock.json` → npm
  - Fallback to npm if no lock file found
  - Return detected package manager name

- [ ] **Script Parser**
  - Read and parse package.json
  - Extract `scripts` section
  - Return array of {name, command} objects
  - Handle parsing errors gracefully

#### Types:
```typescript
interface PackageInfo {
  path: string;              // Absolute path to package.json
  name: string;              // Package name
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  scripts: Script[];
}

interface Script {
  name: string;
  command: string;
}
```

---

### Phase 3: Basic TUI Interface
**Goal**: Display scripts and handle user interaction

#### Tasks:
- [ ] **Main App Component**
  - Display repository name and location
  - Show detected package manager
  - List available scripts

- [ ] **Script List Component**
  - Render scripts as selectable list
  - Highlight selected item
  - Keyboard navigation (up/down arrows)
  - Enter to execute
  - Escape/q to quit

- [ ] **Script Execution**
  - Build command: `{packageManager} run {scriptName}`
  - Exit Ink process cleanly
  - Spawn command in user's shell
  - Preserve terminal state

- [ ] **Error States**
  - No package.json found
  - Empty scripts section
  - Read errors

#### UI Layout:
```
┌─────────────────────────────────────┐
│ Where Am I?                         │
├─────────────────────────────────────┤
│ Repository: my-awesome-app          │
│ Location: /Users/dev/my-awesome-app │
│ Package Manager: pnpm               │
├─────────────────────────────────────┤
│ Available Scripts:                  │
│ > dev     - Start dev server        │
│   build   - Build for production    │
│   test    - Run tests               │
│   lint    - Lint codebase           │
└─────────────────────────────────────┘
```

---

### Phase 4: Mono-repo Support
**Goal**: Handle mono-repos intelligently

#### Tasks:
- [ ] **Nearest Package Detection**
  - Find ALL package.json files from cwd up to root
  - Use the closest one to current directory
  - Store workspace root if detected

- [ ] **Workspace Detection**
  - Check if package.json has `workspaces` field
  - Detect mono-repo tools (nx, turbo, lerna)
  - Display workspace info if applicable

- [ ] **Context Display**
  - Show if in workspace vs root
  - Display relative path within mono-repo
  - Indicate workspace package name

---

### Phase 5: Plugin Architecture (Future-proofing)
**Goal**: Create extensible interface for other ecosystems

#### Tasks:
- [ ] **Define Plugin Interface**
  ```typescript
  interface EcosystemPlugin {
    name: string;
    detect(cwd: string): Promise<boolean>;
    getCommands(cwd: string): Promise<Command[]>;
    buildExecutionCommand(command: Command): string;
  }
  ```

- [ ] **Plugin Registry**
  - Load plugins from configuration
  - Iterate through plugins to find match
  - Cache detection results

- [ ] **Refactor Node.js as Plugin**
  - Move existing Node.js logic to plugin
  - Implement plugin interface
  - Register as default plugin

---

### Phase 6: Configuration & Polish
**Goal**: Add configurability and improve UX

#### Tasks:
- [ ] **Global Configuration**
  - Create ~/.wami/config.json
  - Support custom theme colors
  - Allow disabling certain package managers
  - Custom command aliases

- [ ] **Error Handling & Messages**
  - Friendly error messages
  - Help text / usage guide
  - Version flag support

- [ ] **Performance**
  - Cache package.json location briefly
  - Optimize file system reads
  - Fast startup time (<100ms)

- [ ] **Testing**
  - Unit tests for detection logic
  - Integration tests for TUI
  - Test fixtures for different repo types

- [ ] **Documentation**
  - README with installation & usage
  - Contributing guide
  - Plugin development guide

---

## File Structure (Final)
```
where-am-i/
├── src/
│   ├── cli.tsx                 # Entry point
│   ├── app.tsx                 # Main Ink app component
│   ├── components/
│   │   ├── Header.tsx          # Repo info display
│   │   ├── ScriptList.tsx      # Interactive script list
│   │   └── ErrorMessage.tsx    # Error states
│   ├── core/
│   │   ├── detector.ts         # Package.json detection
│   │   ├── packageManager.ts   # PM detection
│   │   └── parser.ts           # Script parsing
│   ├── plugins/
│   │   ├── types.ts            # Plugin interface
│   │   ├── registry.ts         # Plugin loader
│   │   └── nodejs/             # Node.js plugin
│   │       └── index.ts
│   ├── types/
│   │   └── index.ts            # Shared types
│   └── utils/
│       ├── fs.ts               # File system helpers
│       └── command.ts          # Command execution
├── tests/
├── fixtures/                   # Test fixtures
├── package.json
├── tsconfig.json
└── README.md
```

---

## Success Criteria (MVP)
- [ ] Run `wami` in any Node.js project directory
- [ ] Correctly detect package manager (npm/yarn/pnpm/bun)
- [ ] Display all available scripts from package.json
- [ ] Navigate scripts with arrow keys
- [ ] Execute selected script immediately
- [ ] Work in mono-repo subdirectories (use nearest package.json)
- [ ] Handle errors gracefully (no package.json, no scripts, etc.)
- [ ] Install globally via `bun install -g wami`

---

## Future Enhancements (Post-MVP)
- Support for other ecosystems (Rust, Go, Python, etc.)
- In-TUI command output display
- Command history and favorites
- Custom commands per project (.wami.json)
- Search/filter scripts
- Script descriptions/documentation
- Parallel script execution
- Environment variable management
