# agent-panel

Launch multiple AI coding agents in parallel terminal splits. Ask a panel of
agents to review your PR, fix an issue, or explain a codebase -- all at once,
side by side.

## Supported terminals

- [cmux](https://cmux.dev) -- full support
- [Ghostty](https://ghostty.org) 1.3+ -- macOS only, via AppleScript

## Install

```bash
npm install -g agent-panel
```

## Quick start

```bash
# Create your config file
panel init

# Review a PR (opens 3 agent splits)
panel review 123

# Review current branch vs main (including unstaged changes)
panel review

# Fix an issue
panel fix ISSUE-456

# Explain something in the codebase
panel explain "the auth flow"

# Send a raw prompt to all agents
panel what are some ways to improve the error handling here
```

The `agent-panel` command also works as an alias for `panel`.

## How it works

1. Detects your terminal (cmux or Ghostty)
2. Loads commands and agents from `~/.config/agent-panel/config.jsonc`
3. Opens N terminal splits (one per agent)
4. Sends each agent the same prompt

The first agent runs in your current pane. Each additional agent gets a new
split to the right.

## Configuration

Run `panel init` to create `~/.config/agent-panel/config.jsonc`:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/venables/agent-panel/main/config.schema.json",

  // Each agent needs a {{prompt}} placeholder in its command
  "agents": [
    { "name": "claude", "command": "claude {{prompt}}" },
    { "name": "codex", "command": "codex {{prompt}}" },
    { "name": "opencode", "command": "opencode --prompt {{prompt}}" }
  ],

  // Commands use {{arg}} for the optional argument
  "commands": {
    "review": {
      "prompt": "Review PR {{arg}}. Leave comments in this session and not on the PR itself.",
      "promptNoArg": "Review all changes between this branch and main, including dirty or unstaged files. Leave comments in this session and not on the PR itself."
    },
    "fix": {
      "prompt": "Fix issue {{arg}}. Implement the fix and show me what you changed.",
      "requiresArg": true
    },
    "explain": {
      "prompt": "Explain {{arg}} in this codebase. Be thorough.",
      "requiresArg": true
    }
  }
}
```

The `$schema` field enables autocompletion and validation in editors that
support JSON Schema (VS Code, Zed, JetBrains, etc.).

### Editing your config

Open the config in your editor:

```bash
panel config
```

This launches `$EDITOR` (or `$VISUAL`, or `vi` as a fallback) with the config
file.

### Adding a command

Add a new key to `commands`:

```jsonc
"refactor": {
  "prompt": "Refactor {{arg}}. Explain your reasoning.",
  "requiresArg": true
}
```

Then run it: `panel refactor "the database layer"`

### Command options

| Field         | Type       | Description                                                            |
| ------------- | ---------- | ---------------------------------------------------------------------- |
| `prompt`      | `string`   | Prompt template. `{{arg}}` is replaced with the CLI argument.          |
| `promptNoArg` | `string?`  | Fallback prompt when no argument is given.                             |
| `requiresArg` | `boolean?` | If `true`, the command fails without an argument. Defaults to `false`. |

### Adding an agent

Add a new entry to `agents`. The `command` field is the shell command to run,
with `{{prompt}}` as the placeholder:

```jsonc
{ "name": "aider", "command": "aider --message \"{{prompt}}\"" }
```

## CLI reference

```
panel <command> [arg]          Run a configured command
panel <prompt...>              Launch agents with a raw prompt
panel init                     Create default config
panel list                     List configured commands and agents
panel config                   Open config in $EDITOR
```

`panel run <command> [arg]` also works as an explicit form.

## Development

```bash
# Install dependencies
pnpm install

# Run locally
pnpm run cli review 123

# Build for production
pnpm run build

# Run all checks (format, lint, typecheck, test)
pnpm check

# Auto-fix format and lint issues
pnpm fix
```

### Project structure

```
src/
  index.ts              CLI entry point
  config.ts             Config schema, loading, validation (zod)
  launch.ts             Agent orchestration
  init.ts               `panel init` command
  edit-config.ts        `panel config` command
  list.ts               `panel list` command
  exec.ts               Node-compatible process utilities
  terminal/
    terminal.ts         Terminal interface
    cmux.ts             cmux backend
    ghostty.ts          Ghostty AppleScript backend
    detect.ts           Auto-detection logic
    index.ts            Barrel exports
```

## License

MIT
