/**
 * CLI entry point for panel.
 *
 * Usage:
 *   panel <command> [arg]          Run a configured command
 *   panel <prompt...>              Launch agents with a raw prompt
 *   panel init                     Create default config
 *   panel list                     List configured commands
 *   panel config                   Open config in $EDITOR
 *
 * Examples:
 *   panel review 123
 *   panel explain "the auth flow"
 *   panel what are some ways to improve this
 */

import { loadConfig } from "./config.ts"
import { editConfig } from "./edit-config.ts"
import { init } from "./init.ts"
import { launchAgents, launchCommand } from "./launch.ts"
import type { LaunchResult } from "./launch.ts"
import { list, printUsage } from "./list.ts"
import { detectTerminal } from "./terminal/index.ts"

function printResults(results: readonly LaunchResult[]): void {
  for (const result of results) {
    process.stdout.write(`  ${result.agent.name} -> ${result.pane.id}\n`)
  }
  process.stdout.write("All agents launched.\n")
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    await printUsage()
    process.exit(0)
  }

  const subcommand = args[0]!

  if (subcommand === "init") {
    await init()
    return
  }

  if (subcommand === "list") {
    await list()
    return
  }

  if (subcommand === "config") {
    await editConfig()
    return
  }

  const config = await loadConfig()
  const { kind, terminal } = detectTerminal()

  // "panel run <command> [arg]" -- explicit form
  if (subcommand === "run") {
    const commandName = args[1]

    if (!commandName || args.length > 3) {
      process.stderr.write("Usage: panel run <command> [arg]\n")
      process.exit(1)
    }

    const arg = args[2]
    const description = arg ? `${commandName} ${arg}` : commandName
    process.stdout.write(
      `[${kind}] Launching ${config.agents.length} agents: ${description}\n`
    )

    const results = await launchCommand(terminal, config, commandName, arg)
    printResults(results)
    return
  }

  // "panel <command> [arg]" -- shorthand when first arg matches a command name
  if (config.commands[subcommand] && args.length <= 2) {
    const arg = args[1]
    const description = arg ? `${subcommand} ${arg}` : subcommand
    process.stdout.write(
      `[${kind}] Launching ${config.agents.length} agents: ${description}\n`
    )

    const results = await launchCommand(terminal, config, subcommand, arg)
    printResults(results)
    return
  }

  // Otherwise treat everything as a raw prompt
  const prompt = args.join(" ")
  process.stdout.write(
    `[${kind}] Launching ${config.agents.length} agents: ${prompt}\n`
  )

  const results = await launchAgents(terminal, config.agents, prompt)
  printResults(results)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(message + "\n")
  process.exit(1)
})
