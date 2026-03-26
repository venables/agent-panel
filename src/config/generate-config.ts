/**
 * Generates config file content from user selections.
 */

import type { KnownAgent } from "../agents/known-agents.ts"
import type { KnownCommand } from "../agents/known-commands.ts"

/** User selections from the interactive wizard. */
export interface ConfigSelections {
  readonly agents: readonly KnownAgent[]
  readonly commands: readonly KnownCommand[]
}

/**
 * Builds a JSONC config string from the user's selections.
 *
 * @param selections - The agents and commands the user selected
 * @returns A formatted JSONC config string
 */
export function generateConfig(selections: ConfigSelections): string {
  const agentEntries = selections.agents
    .map((a) => `    { "name": "${a.name}", "command": "${a.command}" }`)
    .join(",\n")

  const commandEntries = selections.commands
    .map((cmd) => {
      const parts: string[] = [`      "prompt": "${cmd.prompt}"`]
      if (cmd.promptNoArg !== undefined) {
        parts.push(`      "promptNoArg": "${cmd.promptNoArg}"`)
      }
      if (cmd.requiresArg) {
        parts.push(`      "requiresArg": true`)
      }
      return `    "${cmd.name}": {\n${parts.join(",\n")}\n    }`
    })
    .join(",\n")

  const commandsBlock =
    selections.commands.length > 0
      ? `\n\n  // Commands -- use {{arg}} for the optional argument\n  "commands": {\n${commandEntries}\n  },`
      : `\n\n  // Commands -- use {{arg}} for the optional argument\n  "commands": {},`

  return `{
  "$schema": "https://raw.githubusercontent.com/venables/agent-panel/main/config.schema.json",

  // Agent definitions -- each needs a {{prompt}} placeholder in command
  "agents": [
${agentEntries}
  ],${commandsBlock}

  // Options
  "options": {
    // Layout: "splits" for side-by-side panes, "tabs" for separate tabs
    "layout": "splits",
    // Set to true to give every agent a new pane (leaves your current pane alone)
    "preserveActivePane": false
  }
}
`
}
