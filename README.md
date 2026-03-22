# agent-panel

Launch multiple AI coding agents in parallel terminal splits.

Ask a panel of agents to review your PR, fix an issue, or explain a codebase --
all at once, side by side.

## Supported terminals

- [Ghostty](https://ghostty.org) 1.3+ -- macOS only, via AppleScript
- [cmux](https://cmux.dev) -- full support

## Install

```bash
npm install -g agent-panel
```

This installs the `panel` binary (alias for `agent-panel`)

## Quick start

```bash
# Create your config file to specify which agents to use
panel config:create

# Send a raw prompt to all agents
panel what are some ways to improve the error handling here

# Run a "review" command (defined in the config file)
panel run review 123

# Review current branch vs main (including unstaged changes)
panel run review

# Fix an issue
panel run fix ISSUE-456

# Explain something in the codebase
panel run explain "the auth flow"

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

Run `panel config:edit:create` to create `~/.config/agent-panel/config.jsonc`:

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
panel config:edit
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

Then run it: `panel run refactor "the database layer"`

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
panel run <command> [arg]      Run a configured command
panel <prompt...>              Launch agents with a raw prompt
panel config:create            Create default config
panel config:edit              Open config in $EDITOR
```

## Development

```bash
# Install dependencies
bun install

# Run locally
bun run cli run review 123

# Build for production
bun run build

# Run all checks (format, lint, typecheck, test)
bun check

# Auto-fix format and lint issues
bun fix
```

### Project structure

```
src/
  index.ts                CLI entry point
  commands/
    command-list.ts       Usage/help display
    config-create.ts      `panel config:create`
    config-edit.ts        `panel config:edit`
    launch.ts             Agent orchestration
  config/
    config.ts             Schema, loading, validation (zod)
    default-config.ts     Default config template
  terminal/
    terminal.ts           Terminal interface
    cmux.ts               cmux backend
    ghostty.ts            Ghostty AppleScript backend
    detect.ts             Auto-detection logic
    index.ts              Barrel exports
  utils/
    exec.ts               Process execution utilities
```

## License

MIT
