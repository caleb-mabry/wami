# Development Guide

Welcome to the `wami` (Where Am I) development guide! This document will help you set up your local environment and contribute to the project.

## Prerequisites

- [Bun](https://bun.sh) v1.0 or higher
- Node.js v18+ (for npm link)
- Git

## Initial Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd where-am-i
bun install
```

### 2. Build the Project

```bash
bun run build
```

This compiles TypeScript and bundles the CLI into `dist/cli.js`.

## Local Testing

To test `wami` globally on your machine during development:

### Install Globally

```bash
# Make the CLI executable
chmod +x dist/cli.js

# Create a global symlink
npm link
```

Now `wami` is available globally! Verify with:

```bash
which wami
```

### Test in Different Projects

```bash
# Test in a non-project directory (should show error)
cd /tmp
wami

# Test in any Node.js project
cd ~/your-project
wami
```

### Development Workflow

Since `npm link` creates a symlink, changes are reflected immediately after rebuild:

```bash
# 1. Make changes to src/
vim src/core/nodejs-detector.ts

# 2. Rebuild
bun run build

# 3. Test immediately - no reinstall needed!
cd ~/test-project
wami
```

## Available Scripts

```bash
# Development mode (runs TypeScript directly)
bun run dev

# Build for production
bun run build

# Type checking
bun run typecheck

# Run from built version
bun run start
```

## Testing

### Manual Testing

```bash
# Test workspace detection
bun run test-workspace.ts
```

This script tests detection in various scenarios:
- Standalone packages
- Monorepo root
- Workspace packages

### Test Fixtures

The `fixtures/` directory contains test projects:

```
fixtures/
└── test-monorepo/           # Example monorepo
    ├── package.json         # Root with workspaces
    └── packages/
        ├── app-a/          # Workspace package A
        └── app-b/          # Workspace package B
```

Test manually:
```bash
cd fixtures/test-monorepo/packages/app-a
wami
# Should detect workspace and show app-a scripts
```

## Project Structure

```
where-am-i/
├── src/
│   ├── cli.tsx                 # Entry point
│   ├── app.tsx                 # Main Ink app
│   ├── components/             # UI components
│   │   ├── Header.tsx          # Project info display
│   │   ├── ScriptList.tsx      # Interactive script list
│   │   └── ErrorMessage.tsx    # Error states
│   ├── core/                   # Core detection logic
│   │   ├── detector.ts         # Abstract base class
│   │   ├── nodejs-detector.ts  # Node.js implementation
│   │   └── registry.ts         # Detector registry
│   ├── types/                  # TypeScript types
│   │   └── index.ts
│   └── utils/                  # Utility functions
│       ├── fs.ts               # File system helpers
│       └── command.ts          # Command execution
├── dist/                       # Built output
├── fixtures/                   # Test fixtures
└── tests/                      # Test files (future)
```

## Adding a New Ecosystem

Want to add support for Rust, Go, Python, etc? See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

Quick overview:

1. Create detector class in `src/core/`:
   ```typescript
   export class RustDetector extends EcosystemDetector {
     readonly name = 'Rust';
     readonly markerFiles = ['Cargo.toml'];
     // Implement detect(), parse(), buildCommand()
   }
   ```

2. Register in `src/core/registry.ts`:
   ```typescript
   this.register(new RustDetector());
   ```

3. Test it:
   ```bash
   bun run build
   cd ~/rust-project
   wami
   ```

## Debugging Tips

### TypeScript Errors

```bash
# Run type checker
bun run typecheck
```

### Runtime Issues

Add console.log statements and test with:
```bash
bun run dev
```

### Ink/TUI Issues

The raw mode error (`Raw mode is not supported`) only appears when:
- Running through automation/scripts
- stdin is not interactive

This is normal! Test in a real terminal to see the TUI working properly.

### Check Detection Logic

Use the test script to debug detection without TUI:
```bash
bun run test-workspace.ts
```

## Common Tasks

### Update Dependencies

```bash
bun update
```

### Clean Build

```bash
rm -rf dist/
bun run build
```

### Unlink Global Install

When done testing:
```bash
npm unlink -g wami
```

## Code Style

- Use TypeScript strict mode (already configured)
- Follow existing naming conventions
- Add JSDoc comments to exported functions
- Keep functions focused and single-purpose

## Git Workflow

```bash
# Create a feature branch
git checkout -b feature/add-rust-support

# Make changes, commit
git add .
git commit -m "feat: add Rust ecosystem detector"

# Push and create PR
git push origin feature/add-rust-support
```

## Performance Considerations

- `wami` should start in <100ms for good UX
- Minimize file system reads
- Use async operations for I/O
- Cache detection results when appropriate

## Architecture Principles

1. **Extensibility**: Easy to add new ecosystems via detector pattern
2. **Separation of Concerns**: UI, detection, and execution are separate
3. **Type Safety**: Strict TypeScript for reliability
4. **User Experience**: Fast, intuitive, helpful error messages

## Getting Help

- Check [CONTRIBUTING.md](./CONTRIBUTING.md) for ecosystem detector guide
- Review existing detectors for examples
- Open an issue for questions or bugs

## Release Process

(For maintainers)

```bash
# 1. Update version
npm version patch|minor|major

# 2. Build
bun run build

# 3. Test
cd ~/test-project && wami

# 4. Publish
npm publish

# 5. Push tags
git push --tags
```

---

Happy coding! 🚀 If you make improvements, we'd love to see your PR!
