# .wami.json Configuration Guide

The `.wami.json` file allows you to customize `wami` behavior for your project. Place it in your project root to override auto-detected commands, add custom commands with arguments, and hide unwanted scripts.

## Location

Create `.wami.json` or `wai.json` in your project root (same directory as `package.json`, `pyproject.toml`, etc.)

## Schema

```json
{
  "commands": {
    "command-name": "simple command string",
    "another-command": {
      "command": "command with arguments",
      "description": "Human-readable description"
    }
  },
  "ignore": ["script-to-hide", "another-script"],
  "venv": {
    "path": ".venv",
    "activate": true
  }
}
```

## Examples

### Python Project with uv

**Problem:** Entry point commands need complex arguments

**pyproject.toml:**
```toml
[project.scripts]
postgres-mcp = "postgres_mcp:main"
```

**.wami.json:**
```json
{
  "commands": {
    "postgres-mcp": {
      "command": "uv run postgres-mcp --access-mode=unrestricted --transport=streamable-http --streamable-http-host=0.0.0.0 --streamable-http-port=8000",
      "description": "Run PostgreSQL MCP server (unrestricted, port 8000)"
    },
    "dev": {
      "command": "uv run postgres-mcp --access-mode=unrestricted",
      "description": "Run in development mode"
    }
  },
  "ignore": ["python", "sync"]
}
```

**Result:**
```
❯ postgres-mcp - Run PostgreSQL MCP server (unrestricted, port 8000)
  dev - Run in development mode
```

### Node.js Project with Custom Scripts

**Problem:** Want to add docker commands not in package.json

**.wami.json:**
```json
{
  "commands": {
    "docker-up": "docker-compose up -d",
    "docker-down": "docker-compose down",
    "docker-logs": {
      "command": "docker-compose logs -f",
      "description": "Follow docker logs"
    }
  },
  "ignore": ["postinstall", "prepare"]
}
```

### Python Project with Virtual Environment

**.wami.json:**
```json
{
  "venv": {
    "path": ".venv",
    "activate": true
  },
  "commands": {
    "test": {
      "command": "pytest tests/ -v",
      "description": "Run tests with verbose output"
    }
  }
}
```

## Configuration Options

### `commands`

Add or override commands shown in `wami`.

**Format:**
```json
{
  "commands": {
    "name": "command string",
    "name": {
      "command": "command string",
      "description": "Optional description"
    }
  }
}
```

- **Simple string:** Just the command to run
- **Object with `command`:** Full command with optional description
- **Override:** If name matches auto-detected script, it overrides it
- **Add new:** If name doesn't exist, it's added to the list

### `ignore`

Hide auto-detected scripts you don't want to see.

**Format:**
```json
{
  "ignore": ["script-name", "another-script"]
}
```

**Common uses:**
- Hide internal scripts (postinstall, prepare)
- Remove confusing/rarely-used commands
- Clean up the UI

### `venv` (Python)

Configure virtual environment handling.

**Format:**
```json
{
  "venv": {
    "path": ".venv",
    "activate": true
  }
}
```

- **`path`:** Custom venv directory (default: auto-detect `.venv`, `venv`, `env`)
- **`activate`:** Whether to activate venv before running commands (future feature)

## Use Cases

### 1. Complex Arguments

Commands that need many flags or environment variables:

```json
{
  "commands": {
    "start": "NODE_ENV=production PORT=3000 npm start",
    "test-ci": "CI=true npm test -- --coverage --maxWorkers=2"
  }
}
```

### 2. Docker Shortcuts

Add docker commands alongside your app commands:

```json
{
  "commands": {
    "db-up": "docker-compose up -d postgres",
    "db-down": "docker-compose down",
    "db-reset": "docker-compose down -v && docker-compose up -d postgres"
  }
}
```

### 3. Environment-Specific Commands

Different commands for different environments:

```json
{
  "commands": {
    "dev": "npm run start:dev",
    "staging": "npm run start -- --env=staging",
    "prod": "npm run start -- --env=production"
  }
}
```

### 4. Clean Up Noise

Hide auto-generated or internal scripts:

```json
{
  "ignore": [
    "postinstall",
    "prepare",
    "pretest",
    "posttest"
  ]
}
```

## Best Practices

1. **Add descriptions** for complex commands
2. **Use descriptive names** (e.g., `db-reset` not `dbr`)
3. **Group related commands** (e.g., all docker commands start with `docker-`)
4. **Document in README** if your project uses `.wami.json`
5. **Commit to git** so team members benefit

## Priority

When the same script exists in multiple places:

1. **`.wami.json` commands** (highest priority - always override)
2. **Auto-detected scripts** (package.json, pyproject.toml, etc.)
3. **Common commands** (install, test, etc.)

## Tips

- ✅ Use `.wami.json` for complex commands with arguments
- ✅ Add team-wide shortcuts (docker, database, etc.)
- ✅ Hide confusing auto-generated scripts
- ✅ Override default commands with better ones
- ❌ Don't duplicate simple scripts that work fine
- ❌ Don't commit secrets (use environment variables)

## Examples Repository

See `fixtures/test-python-uv/.wami.json` in the repo for a working example.

---

**Need more examples?** Open an issue or check the [documentation](./README.md)!
