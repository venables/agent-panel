/**
 * CLI entry point for panel.
 *
 * Usage:
 *   panel init                  Create default config
 *   panel <command> [arg]       Run a command from config
 *
 * Examples:
 *   panel review 123            Review PR #123
 *   panel review                Review current branch vs main
 *   panel fix ISSUE-456         Fix an issue
 *   panel explain "the auth flow"
 */

import { loadConfig } from "./config.ts"
import { init } from "./init.ts"
import { launchAllAgents } from "./launch.ts"
import { list, printUsage } from "./list.ts"
import { detectTerminal } from "./terminal/index.ts"

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    await printUsage()
    process.exit(1)
  }

  const commandName = args[0]!

  if (commandName === "init") {
    await init()
    return
  }

  if (commandName === "list") {
    await list()
    return
  }

  const { kind, terminal } = detectTerminal()
  const config = await loadConfig()
  const arg = args[1]

  if (args.length > 2) {
    console.error("Usage: panel <command> [arg]")
    process.exit(1)
  }

  const description = arg ? `${commandName} ${arg}` : commandName
  console.log(
    `[${kind}] Launching ${config.agents.length} agents: ${description}`
  )

  const results = await launchAllAgents(terminal, config, commandName, arg)

  for (const result of results) {
    console.log(`  ${result.agent.name} -> ${result.pane.id}`)
  }

  console.log("All agents launched.")
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
})
