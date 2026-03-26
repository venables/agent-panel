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

Run configured commands directly:

```bash
# Review a PR (uses the "review" command from your config)
panel review 123

# Review current branch vs main (including unstaged changes)
panel review

# Fix an issue
panel fix ISSUE-456

# Explain something in the codebase
panel explain "the auth flow"
```

Send a raw prompt to all agents:

```bash
# "raw" sends the literal text to all agents
panel raw what are some ways to improve the error handling here

# Use "raw" to bypass command matching
panel raw review this for security issues

# "--" works as an alias for "ask"
panel -- review this for security issues
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

Run `panel config create` to create `~/.config/agent-panel/config.jsonc`:

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
panel config edit
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

### Options

Add an `options` object to configure panel behavior:

```jsonc
"options": {
  "layout": "tabs",
  "preserveActivePane": true
}
```

| Field                | Type                   | Description                                                                                   |
| -------------------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| `layout`             | `"splits"` \| `"tabs"` | How to arrange agents: side-by-side splits or separate tabs. Defaults to `"splits"`.          |
| `preserveActivePane` | `boolean?`             | If `true`, all agents get new panes and your current pane is left alone. Defaults to `false`. |

### Adding an agent

Add a new entry to `agents`. The `command` field is the shell command to run,
with `{{prompt}}` as the placeholder:

```jsonc
{ "name": "aider", "command": "aider --message \"{{prompt}}\"" }
```

## CLI reference

```
panel <command> [arg]          Run a configured command
panel raw <prompt...>          Send a raw prompt to all agents
panel -- <prompt...>           Send a raw prompt (alias for raw)
panel config create            Create config (interactive)
panel config edit              Open config in $EDITOR
panel config delete            Delete config file
```

## Development

```bash
# Install dependencies
bun install

# Run locally
bun run cli review 123

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
  cli/
    main.ts               Root command, flow orchestration
    route.ts              Route resolution (pure function)
    args.ts               Positional word extraction
    options.ts            Flag definitions, option merging
  commands/
    command-list.ts       Usage/help display
    config-create.ts      Interactive config wizard
    config-edit.ts        Open config in $EDITOR
    config-delete.ts      Confirm and delete config
    launch.ts             Agent orchestration
  agents/
    known-agents.ts       Registry of supported agent CLIs
    known-commands.ts     Registry of pre-configured commands
  config/
    config.ts             Schema, loading, validation (zod)
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
