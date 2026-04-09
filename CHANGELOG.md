# Changelog

## 1.0.1 (2026-04-09)

### Fixes

- Handle Ctrl+C correctly in the multi-line TUI prompt when the kitty keyboard
  protocol is active. Ghostty/Kitty rewrite Ctrl+C from the raw `\x03` byte to
  `\x1b[99;5u`, which bypassed clack's default cancel alias and left the prompt
  unresponsive to Ctrl+C. Both forms are now intercepted at the stdin level and
  in the keypress listener.
- Add `exit` / `quit` as a typed escape hatch to cancel the prompt, matching
  common REPL conventions for users who prefer not to reach for Ctrl+C.
- Update the prompt hint text to advertise the new ways to quit.

## 1.0.0 (2026-04-09)

### Features

- Running `panel` with no arguments now opens an interactive multi-line prompt
  and sends the text to every configured agent. **Enter** submits,
  **Shift+Enter** (or **Alt+Enter** as a fallback) inserts a newline. The target
  agents are listed above the input.
- Re-add `-m` / `--message <prompt>` to send a prompt to every agent without
  opening the TUI (equivalent to `panel ask <prompt>`). Useful in scripts and
  CI.
- In non-interactive contexts (piped stdin, no TTY), bare `panel` now prints
  usage instead of attempting to open a TUI that would hang.

### Breaking changes

- `panel -- <args>` no longer silently falls through to command routing. A bare
  `--` argument is now rejected with an explicit error pointing at
  `panel ask <prompt>` and `panel --message <prompt>`. Scripts that relied on
  `--` as a raw-prompt escape need to be updated.

## 0.3.2

### Fixes

- Derive CLI `--version` from package.json instead of hardcoding

## 0.3.1

## 0.3.0

### Features

- Migrate CLI to citty for structured arg parsing
- Commands-first routing with `ask`/`--` for raw prompts
- Interactive config wizard with agent detection

### Refactors

- Rename `ask` to `raw`, drop fallthrough, support multi-word args

## 0.2.0

### Features

- Add tabs layout option as alternative to splits
- Add `config:delete` command

## 0.1.0

- Initial release
