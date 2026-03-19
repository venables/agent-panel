/**
 * CLI entry point for council.
 *
 * Usage:
 *   council init                  Create default config
 *   council <command> [arg]       Run a command from config
 *
 * Examples:
 *   council review 123            Review PR #123
 *   council review                Review current branch vs main
 *   council fix ISSUE-456         Fix an issue
 *   council explain "the auth flow"
 */

import { loadConfig } from "./config.ts"
import { init } from "./init.ts"
import { launchAllAgents } from "./launch.ts"
import { detectTerminal } from "./terminal/index.ts"

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error("Usage: council <command> [arg]")
    console.error("       council init")
    process.exit(1)
  }

  const commandName = args[0]!

  if (commandName === "init") {
    await init()
    return
  }

  const { kind, terminal } = detectTerminal()
  const config = await loadConfig()
  const arg = args[1]

  if (args.length > 2) {
    console.error("Usage: council <command> [arg]")
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
