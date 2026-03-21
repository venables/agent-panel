/**
 * CLI entry point for panel.
 *
 * Usage:
 *   panel <prompt...>              Launch agents with a raw prompt
 *   panel run <command> [arg]      Run a configured command
 *   panel init                     Create default config
 *   panel list                     List configured commands
 *   panel config                   Open config in $EDITOR
 */

import { defineCommand, runMain } from "citty"

import { loadConfig } from "./config.ts"
import { launchAgents } from "./launch.ts"
import { detectTerminal } from "./terminal/index.ts"

const SUB_COMMANDS = {
  init: () => import("./commands/init.ts").then((m) => m.default),
  list: () => import("./commands/list.ts").then((m) => m.default),
  config: () => import("./commands/config.ts").then((m) => m.default),
  run: () => import("./commands/run.ts").then((m) => m.default)
} as const

const SUB_COMMAND_NAMES = new Set<string>(Object.keys(SUB_COMMANDS))

const main = defineCommand({
  meta: {
    name: "panel",
    version: "0.1.0",
    description: "Launch multiple AI coding agents in parallel terminal splits"
  },
  args: {
    prompt: {
      type: "positional",
      description: "Raw prompt to send to all agents",
      required: false
    }
  },
  subCommands: SUB_COMMANDS,
  async run({ rawArgs }) {
    const prompt = rawArgs.join(" ")

    if (!prompt || SUB_COMMAND_NAMES.has(rawArgs[0] ?? "")) {
      return
    }

    const config = await loadConfig()
    const { kind, terminal } = detectTerminal()

    console.log(`[${kind}] Launching ${config.agents.length} agents: ${prompt}`)

    const results = await launchAgents(terminal, config.agents, prompt)

    for (const result of results) {
      console.log(`  ${result.agent.name} -> ${result.pane.id}`)
    }
    console.log("All agents launched.")
  }
})

void runMain(main)
