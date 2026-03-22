/**
 * CLI entry point for panel.
 *
 * Usage:
 *   panel run <command> [arg]      Run a configured command
 *   panel <prompt...>              Launch agents with a raw prompt
 *   panel config:create            Create default config
 *   panel config:edit              Open config in $EDITOR
 *   panel config:delete            Delete config file
 *
 * Examples:
 *   panel run review 123
 *   panel run explain "the auth flow"
 *   panel what are some ways to improve this
 */

import { printUsage } from "./commands/command-list.ts"
import { createConfig, init } from "./commands/config-create.ts"
import { deleteConfig } from "./commands/config-delete.ts"
import { editConfig } from "./commands/config-edit.ts"
import { launchAgents, launchCommand } from "./commands/launch.ts"
import type { LaunchResult } from "./commands/launch.ts"
import { configExists, configPath, loadConfig } from "./config/config.ts"
import { detectTerminal } from "./terminal/index.ts"
import { confirm } from "./utils/confirm.ts"

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

  if (subcommand === "config:create") {
    await init()
    return
  }

  if (subcommand === "config:edit") {
    await editConfig()
    return
  }

  if (subcommand === "config:delete") {
    await deleteConfig()
    return
  }

  if (!(await configExists())) {
    const path = configPath()
    const shouldCreate = await confirm(
      `No config found. Create one at ${path}?`
    )

    if (!shouldCreate) {
      process.stderr.write(
        "Run 'panel config:create' when you're ready to set up.\n"
      )
      process.exit(1)
    }

    await createConfig()
    process.stdout.write(`Created config: ${path}\n`)
  }

  const config = await loadConfig()
  const { terminal } = detectTerminal()

  // "panel run <command> [arg]" -- only way to invoke configured commands
  if (subcommand === "run") {
    const commandName = args[1]

    if (!commandName || args.length > 3) {
      process.stderr.write("Usage: panel run <command> [arg]\n")
      process.exit(1)
    }

    const arg = args[2]
    const description = arg ? `${commandName} ${arg}` : commandName
    process.stdout.write(
      `Launching ${config.agents.length} agents: ${description}\n`
    )

    const results = await launchCommand(terminal, config, commandName, arg)
    printResults(results)
    return
  }

  // Everything else is a raw prompt
  const prompt = args.join(" ")
  process.stdout.write(`Launching ${config.agents.length} agents: ${prompt}\n`)

  const results = await launchAgents(
    terminal,
    config.agents,
    prompt,
    config.options
  )
  printResults(results)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(message + "\n")
  process.exit(1)
})
