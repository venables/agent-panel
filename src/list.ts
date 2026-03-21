/**
 * Handles the `panel list` command.
 *
 * Shows available commands and agents from the user's config.
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
 * Prints available commands and agent summary from the config.
 *
 * @param config - The loaded config
 */
function printConfigSummary(config: Config): void {
  console.log(`Commands (from ${configPath()}):`)
  for (const [name, command] of Object.entries(config.commands)) {
    console.log(`  panel run ${formatCommand(name, command)}`)
  }
  console.log("")
  console.log(`Agents: ${config.agents.map((a) => a.name).join(", ")}`)
  console.log(`Config: ${configPath()}`)
}

/**
 * Loads config and prints a summary of commands and agents.
 */
export async function list(): Promise<void> {
  const config = await loadConfig()
  printConfigSummary(config)
}
