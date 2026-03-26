/**
 * Handles the `panel config create` command.
 *
 * Creates the default config file at ~/.config/agent-panel/config.jsonc.
 */

import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

import { configExists, configPath } from "../config/config.ts"
import { DEFAULT_CONFIG_CONTENT } from "../config/default-config.ts"

/**
 * Creates the default config file.
 *
 * @returns The path to the created config file
 * @throws If the config file already exists
 */
export async function createConfig(): Promise<string> {
  const path = configPath()

  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, DEFAULT_CONFIG_CONTENT, "utf-8")

  return path
}

/**
 * CLI handler for `panel config create`. Errors if the config already exists.
 */
export async function init(): Promise<void> {
  if (await configExists()) {
    const path = configPath()
    process.stderr.write(`Config already exists: ${path}\n`)
    process.stderr.write("Delete it first if you want to regenerate.\n")
    process.exit(1)
  }

  const path = await createConfig()
  process.stdout.write(`Created config: ${path}\n`)
}
