/**
 * The `panel run <command> [arg]` command.
 *
 * Runs a configured command across all agents.
 */

import { defineCommand } from "citty"

import { loadConfig } from "../config.ts"
import { launchCommand } from "../launch.ts"
import { detectTerminal } from "../terminal/index.ts"

export default defineCommand({
  meta: {
    name: "run",
    description: "Run a configured command"
  },
  args: {
    command: {
      type: "positional",
      description: "The command name (e.g. review, fix, explain)",
      required: true
    },
    arg: {
      type: "positional",
      description: "Optional argument for the command",
      required: false
    }
  },
  async run({ args }) {
    const config = await loadConfig()
    const { kind, terminal } = detectTerminal()

    const description = args.arg ? `${args.command} ${args.arg}` : args.command

    console.log(
      `[${kind}] Launching ${config.agents.length} agents: ${description}`
    )

    const results = await launchCommand(
      terminal,
      config,
      args.command,
      args.arg
    )

    for (const result of results) {
      console.log(`  ${result.agent.name} -> ${result.pane.id}`)
    }
    console.log("All agents launched.")
  }
})
