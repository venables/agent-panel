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

Run `panel` on its own to open an interactive prompt where you can type (or
paste) any text and send it to every configured agent at once:

```bash
panel
```

The prompt is multi-line: **Enter** submits, **Shift+Enter** (or **Alt+Enter**
as a fallback) inserts a newline. The list of agents the prompt will be sent to
is shown above the input.

Or run configured commands directly:

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

Send a one-off prompt to all agents without opening the TUI:

```bash
# -m / --message sends the text directly to every configured agent
panel -m "what are some ways to improve the error handling here"

# "ask" works the same way via a positional argument
panel ask "what are some ways to improve the error handling here"

# Read prompt from a file (works with any command)
panel ask --file prompt.md
panel review --file ./review-instructions.md
```

In non-interactive contexts (piped stdin, CI, scripts) a bare `panel` prints its
usage text instead of trying to open the TUI. Use `-m` in scripts.

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
panel                          Open the interactive prompt (or print usage
                                 in non-interactive contexts)
panel <command> [arg]          Run a configured command
panel config create            Create config (interactive)
panel config edit              Open config in $EDITOR
panel config delete            Delete config file
```

Flags:

```
-m, --message <prompt>         Send a prompt to every agent and skip the TUI
-f, --file <path>              Read the command argument from a file
-t, --tabs                     Use tabs instead of splits for this run
-p, --preserve                 Keep the current pane; give every agent a new one
-h, --help                     Show help
-v, --version                  Show version
```

`panel` does **not** accept a bare `--` as an argument-forwarding escape.
Prompts are dispatched through config-defined commands (one shell invocation per
agent), so there is no single child process to forward to. Use
`panel ask <prompt>` or `panel --message <prompt>` for raw prompts.

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
