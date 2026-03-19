/**
 * Handles the `panel list` command and usage display.
 *
 * Shows available commands from the user's config.
 */

import type { Config } from "./config.ts"
import { configPath, loadConfig } from "./config.ts"

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
 * Prints available commands from the config.
 *
 * @param config - The loaded config
 */
function printCommands(config: Config): void {
  console.log(`Commands (from ${configPath()}):`)
  for (const [name, command] of Object.entries(config.commands)) {
    console.log(`  panel ${formatCommand(name, command)}`)
  }
}

/**
 * Prints full usage help, including available commands if config exists.
 */
export async function printUsage(): Promise<void> {
  console.log("Usage: panel <command> [arg]")
  console.log("       panel init")
  console.log("       panel list")
  console.log("")

  try {
    const config = await loadConfig()
    printCommands(config)
    console.log("")
    console.log(`Agents: ${config.agents.map((a) => a.name).join(", ")}`)
    console.log(`Config: ${configPath()}`)
  } catch {
    console.log(`No config found. Run 'panel init' to get started.`)
  }
}

/**
 * Handles the `panel list` command.
 */
export async function list(): Promise<void> {
  const config = await loadConfig()
  printCommands(config)
  console.log("")
  console.log(`Agents: ${config.agents.map((a) => a.name).join(", ")}`)
  console.log(`Config: ${configPath()}`)
}
