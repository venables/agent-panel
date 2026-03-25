/**
 * Handles the `panel config:delete` command.
 *
 * Deletes the config file after user confirmation.
 */

import { unlink } from "node:fs/promises"

import { configExists, configPath } from "../config/config.ts"
import { confirm } from "../utils/confirm.ts"

/**
 * CLI handler for `panel config:delete`.
 *
 * Prompts for confirmation before deleting. Exits with an error if no
 * config file exists.
 */
export async function deleteConfig(): Promise<void> {
  const path = configPath()

  if (!(await configExists())) {
    process.stderr.write(`No config file found at ${path}\n`)
    process.exit(1)
  }

  const shouldDelete = await confirm(`Delete config at ${path}?`)

  if (!shouldDelete) {
    process.stdout.write("Cancelled.\n")
    return
  }

  await unlink(path)
  process.stdout.write(`Deleted config: ${path}\n`)
}
