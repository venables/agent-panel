/** Default config written by `panel config:create`. */
export const DEFAULT_CONFIG_CONTENT = `{
  "$schema": "https://raw.githubusercontent.com/venables/agent-panel/main/config.schema.json",

  // Agent definitions -- each needs a {{prompt}} placeholder in command
  "agents": [
    { "name": "claude", "command": "claude {{prompt}}" },
    { "name": "codex", "command": "codex {{prompt}}" },
    { "name": "opencode", "command": "opencode --prompt {{prompt}}" }
  ],

  // Commands -- use {{arg}} for the optional argument
  "commands": {
    "review": {
      "prompt": "Review PR {{arg}}. Leave comments in this session and not on the PR itself.",
      "promptNoArg": "Review all changes between this branch and origin/main, including any dirty or unstaged files. Leave comments in this session and not on the PR itself."
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
`
