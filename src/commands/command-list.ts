/**
 * Usage display for panel.
 *
 * Shows built-in commands, configured commands, and agent summary.
 */

import type { Config } from "../config/config.ts"
import { configPath, loadConfig } from "../config/config.ts"

/**
 * Formats a command entry for display.
 *
 * @param name - The command name
 * @param command - The command config
 * @returns A formatted string like "review [arg]" or "fix <arg>"
 */
function formatCommand(
  name: string,
  command: { readonly requiresArg: boolean }
): string {
  return command.requiresArg ? `${name} <arg>` : `${name} [arg]`
}

/**
 * Prints available commands and agent summary from the config.
 *
 * @param config - The loaded config
 */
function printConfigSummary(config: Config): void {
  const commandEntries = Object.entries(config.commands)

  if (commandEntries.length > 0) {
    process.stdout.write("\nConfigured commands:\n")
    for (const [name, command] of commandEntries) {
      process.stdout.write(`  panel ${formatCommand(name, command)}\n`)
    }
  }

  process.stdout.write(
    `\nAgents: ${config.agents.map((a) => a.name).join(", ")}\n`
  )
  process.stdout.write(`Config: ${configPath()}\n`)
}

/**
 * Prints full usage help, including available commands if config exists.
 */
export async function printUsage(): Promise<void> {
  process.stdout.write(
    "Launch multiple AI coding agents in parallel terminal splits or tabs.\n\n"
  )

  process.stdout.write("Usage:\n")
  process.stdout.write(
    "  panel <command> [arg]           Run a configured command\n"
  )
  process.stdout.write("\n")

  process.stdout.write("Config:\n")
  process.stdout.write(
    "  panel config create            Create config (interactive)\n"
  )
  process.stdout.write(
    "  panel config edit              Open config in $EDITOR\n"
  )
  process.stdout.write("  panel config delete            Delete config file\n")
  process.stdout.write("\n")

  process.stdout.write("Options:\n")
  process.stdout.write(
    "  -m, --message <prompt>         Send a prompt to all agents (skip TUI)\n"
  )
  process.stdout.write(
    "  -f, --file <path>              Read argument from a file\n"
  )
  process.stdout.write(
    "  -t, --tabs                     Use tabs instead of splits\n"
  )
  process.stdout.write(
    "  -p, --preserve                 Keep current pane, give agents new panes\n"
  )
  process.stdout.write("  -h, --help                     Show this help\n")
  process.stdout.write("  -v, --version                  Show version\n")

  try {
    const config = await loadConfig()
    printConfigSummary(config)
  } catch {
    process.stdout.write(
      "\nNo config found. Run 'panel config create' to get started.\n"
    )
  }
}
