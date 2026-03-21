/**
 * CLI entry point for panel.
 *
 * Usage:
 *   panel <prompt...>              Launch agents with a raw prompt
 *   panel run <command> [arg]      Run a configured command
 *   panel init                     Create default config
 *   panel list                     List configured commands
 *
 * Examples:
 *   panel what are some ways to improve this
 *   panel run review 123
 *   panel run explain "the auth flow"
 */

import { loadConfig } from "./config.ts"
import { init } from "./init.ts"
import { launchAgents, launchCommand } from "./launch.ts"
import type { LaunchResult } from "./launch.ts"
import { list, printUsage } from "./list.ts"
import { detectTerminal } from "./terminal/index.ts"

function printResults(results: readonly LaunchResult[]): void {
  for (const result of results) {
    console.log(`  ${result.agent.name} -> ${result.pane.id}`)
  }
  console.log("All agents launched.")
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    await printUsage()
    process.exit(args.length === 0 ? 1 : 0)
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

  const config = await loadConfig()
  const { kind, terminal } = detectTerminal()

  if (subcommand === "run") {
    const commandName = args[1]

    if (!commandName || args.length > 3) {
      console.error("Usage: panel run <command> [arg]")
      process.exit(1)
    }

    const arg = args[2]
    const description = arg ? `${commandName} ${arg}` : commandName
    console.log(
      `[${kind}] Launching ${config.agents.length} agents: ${description}`
    )

    const results = await launchCommand(terminal, config, commandName, arg)
    printResults(results)
    return
  }

  const prompt = args.join(" ")
  console.log(`[${kind}] Launching ${config.agents.length} agents: ${prompt}`)

  const results = await launchAgents(terminal, config.agents, prompt)
  printResults(results)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
})
