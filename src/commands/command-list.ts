/**
 * Usage display for panel.
 *
 * Shows available commands from the user's config.
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
  process.stdout.write(`Commands (from ${configPath()}):\n`)
  for (const [name, command] of Object.entries(config.commands)) {
    process.stdout.write(`  panel run ${formatCommand(name, command)}\n`)
  }
  process.stdout.write("\n")
  process.stdout.write(
    `Agents: ${config.agents.map((a) => a.name).join(", ")}\n`
  )
  process.stdout.write(`Config: ${configPath()}\n`)
}

/**
 * Prints full usage help, including available commands if config exists.
 */
export async function printUsage(): Promise<void> {
  process.stdout.write("Usage: panel run <command> [arg]\n")
  process.stdout.write("       panel <prompt...>\n")
  process.stdout.write("       panel config:create\n")
  process.stdout.write("       panel config:edit\n")
  process.stdout.write("\n")

  try {
    const config = await loadConfig()
    printConfigSummary(config)
  } catch {
    process.stdout.write(
      `No config found. Run 'panel config:create' to get started.\n`
    )
  }
}
