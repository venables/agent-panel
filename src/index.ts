/**
 * CLI entry point for panel.
 *
 * Usage:
 *   panel <command> [arg]            Run a configured command
 *   panel ask <prompt...>            Send a prompt to all agents
 *   panel config create              Create config (interactive)
 *   panel config edit                Open config in $EDITOR
 *   panel config delete              Delete config file
 *
 * Examples:
 *   panel review 123
 *   panel explain "the auth flow"
 *   panel ask what are some ways to improve this --tabs
 */

import { runCommand } from "citty"

import { main } from "./cli/main.ts"
import { VERSION } from "./cli/version.ts"
import { printUsage } from "./commands/command-list.ts"

const rawArgs = process.argv.slice(2)

if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
  void printUsage().then(() => process.exit(0))
} else if (rawArgs.length === 1 && rawArgs[0] === "--version") {
  process.stdout.write(VERSION + "\n")
} else {
  runCommand(main, { rawArgs }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(message + "\n")
    process.exit(1)
  })
}
