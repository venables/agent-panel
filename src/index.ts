/**
 * CLI entry point for panel.
 *
 * Usage:
 *   panel run <command> [arg]        Run a configured command
 *   panel <prompt...> [--tabs] [-p]  Launch agents with a raw prompt
 *   panel config create              Create default config
 *   panel config edit                Open config in $EDITOR
 *   panel config delete              Delete config file
 *
 * Examples:
 *   panel run review 123
 *   panel run explain "the auth flow"
 *   panel what are some ways to improve this --tabs
 */

import { runCommand, showUsage } from "citty"

import { main } from "./cli/main.ts"

const rawArgs = process.argv.slice(2)

if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
  void showUsage(main).then(() => process.exit(0))
} else if (rawArgs.length === 1 && rawArgs[0] === "--version") {
  process.stdout.write("0.2.0\n")
} else {
  runCommand(main, { rawArgs }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(message + "\n")
    process.exit(1)
  })
}
