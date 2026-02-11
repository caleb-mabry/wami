# wami (Where Am I?)

> A smart TUI that detects your repository and shows available commands. Works everywhere, zero config.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
[![npm version](https://img.shields.io/npm/v/@calebmabry/wami.svg)](https://www.npmjs.com/package/wami)

## ✨ Features

- 🚀 **Zero Config** - Works instantly in any repo. No setup files needed.
- 🔍 **Smart Detection** - Auto-detects Node.js, Python, and more
- 🛠️ **Auto-discover Dev Tools** - Detects ruff, pytest, eslint, prettier, and more from dependencies
- 📦 **Multi-Package Manager** - Supports npm, yarn, pnpm, bun, poetry, uv, pipenv, pip
- 🎯 **Task Runner Support** - Poethepoet (poe), npm scripts, and more
- 📝 **Command History** - Remembers commands with arguments across sessions
- ✏️ **Interactive Editing** - Add arguments on-the-fly, edit before running
- ⚡ **Custom Commands** - Create and save custom commands with arguments
- 🔎 **Smart Search** - Filter through 50+ scripts instantly with fuzzy search
- 🏢 **Mono-repo Ready** - Intelligently detects and switches between multiple projects
- ⌨️ **Vim Navigation** - j/k keys for navigation, familiar keyboard shortcuts

## 📦 Installation

### Try it without installing (npx)

```bash
npx @calebmabry/wami
```

Perfect for trying it out or using in CI/CD without global installation!

### Install globally

```bash
# Using npm
npm i -g @calebmabry/wami

# Using bun
bun install -g @calebmabry/wami

# Using pnpm
pnpm add -g @calebmabry/wami

# Using yarn
yarn global add @calebmabry/wami
```

## 🚀 Usage

Navigate to any project and run:

```bash
# If installed globally
wami

# Or use npx (no installation needed)
npx @calebmabry/wami
```

### Keyboard Shortcuts

#### Navigation
- **↑/↓ or j/k** - Navigate through scripts (vim-style)
- **Enter** - Run selected script immediately
- **Esc** - Go back/cancel (context-aware)
- **q** - Quit application

#### Actions
- **a** - Add arguments to command before running
- **e** - Edit full command before running
- **c** - Create custom command (or clear search if active)
- **d** - Delete command from history
- **/** or **s** - Search/filter scripts
- **p** - Switch between projects (in mono-repos)

#### In Input Modes
- **Tab** - Switch between fields
- **←/→** - Move cursor
- **Backspace** - Delete character
- **Esc** - Cancel and return

## 🎯 Supported Ecosystems

### Node.js
**Detects:** \`package.json\`
**Package Managers:** npm, yarn, pnpm, bun
**Auto-detected Tools:** TypeScript, ESLint, Prettier, Biome, Vitest, Jest, Playwright, Cypress

Automatically discovers and shows dev tools installed in your dependencies.

### Python
**Detects:** \`pyproject.toml\`, \`Pipfile\`, \`requirements.txt\`
**Package Managers:** poetry, uv, pipenv, pip, PDM
**Task Runners:** poethepoet (poe)
**Auto-detected Tools:** ruff, pytest, black, mypy, pyright, isort, flake8, pylint, coverage, pre-commit, bandit, sphinx

Automatically discovers:
- Scripts from \`[project.scripts]\` (PEP 621)
- Tasks from \`[tool.poe.tasks]\` (poethepoet)
- Dev tools from dependencies (both main and dev groups)

## 🏗️ How It Works

\`wami\` uses an extensible plugin architecture to detect your project type:

1. Searches for ecosystem marker files (package.json, pyproject.toml, etc.)
2. Detects the package manager from lock files or configuration
3. Parses available scripts/commands
4. Presents an interactive TUI with keyboard navigation
5. Remembers your commands with arguments for future use

## 🔧 Development

```bash
# Clone the repository
git clone https://github.com/caleb-mabry/wami.git
cd wami

# Install dependencies
bun install

# Run in development
bun run dev

# Build for production
bun run build

# Type check
bun run typecheck
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Adding New Ecosystem Support

1. Create a new detector class extending \`EcosystemDetector\`
2. Implement \`detect()\`, \`parse()\`, and \`buildCommand()\` methods
3. Register it in \`src/core/registry.ts\`

See \`src/core/nodejs-detector.ts\` or \`src/core/python-detector.ts\` for examples.

## 📄 License

MIT © Caleb Mabry

## 🙏 Acknowledgments

Built with:
- [Ink](https://github.com/vadimdemedes/ink) - React for interactive CLIs
- [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime

---

**Never forget your commands again.** 🎯
