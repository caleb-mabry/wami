# wami (Where Am I?)

> A smart TUI that detects your repository and shows available commands. Works everywhere, zero config.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
[![npm version](https://img.shields.io/npm/v/@calebmabry/wami.svg)](https://www.npmjs.com/package/wami)

## ✨ Features

- 🚀 **Zero Config** - Works instantly in any repo. No setup files needed.
- 🔍 **Smart Detection** - Auto-detects Node.js, Python, and more
- 📦 **Multi-Package Manager** - Supports npm, yarn, pnpm, bun, poetry, uv, pipenv, pip
- 📝 **Command History** - Remembers commands with arguments across sessions
- ✏️ **Interactive Editing** - Add arguments on-the-fly, edit before running
- 🔎 **Smart Search** - Filter through 50+ scripts instantly
- 🏢 **Mono-repo Ready** - Intelligently detects workspaces

## 📦 Installation

```bash
# Using bun
bun install -g @calebmabry/wami

# Using npm
npm i -g @calebmabry/wami

# Using pnpm
pnpm add -g @calebmabry/wami

# Using yarn
yarn global add @calebmabry/wami
```

## 🚀 Usage

Navigate to any project and run:

```bash
wami
```

### Keyboard Shortcuts

- **↑/↓** - Navigate through scripts
- **Enter** - Run selected script
- **a** - Add arguments interactively
- **e** - Edit command before running
- **d** - Delete from history
- **/** - Search/filter scripts
- **c** - Clear search
- **q** - Quit

## 🎯 Supported Ecosystems

### Node.js
Detects \`package.json\` and supports:
- npm
- yarn
- pnpm
- bun

### Python
Detects \`pyproject.toml\`, \`Pipfile\`, or \`requirements.txt\` and supports:
- poetry
- uv
- pipenv
- pip
- PDM

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
