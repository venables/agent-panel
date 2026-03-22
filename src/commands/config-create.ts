/**
 * Handles the `panel config:create` command.
 *
 * Creates the default config file at ~/.config/agent-panel/config.jsonc.
 */

import { access, mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

import { configPath } from "../config/config.ts"
import { DEFAULT_CONFIG_CONTENT } from "../config/default-config.ts"

/**
 * Writes the default config file. Errors if it already exists.
 */
export async function init(): Promise<void> {
  const path = configPath()

  const exists = await access(path)
    .then(() => true)
    .catch(() => false)

  if (exists) {
    process.stderr.write(`Config already exists: ${path}\n`)
    process.stderr.write("Delete it first if you want to regenerate.\n")
    process.exit(1)
  }

  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, DEFAULT_CONFIG_CONTENT, "utf-8")

  process.stdout.write(`Created config: ${path}\n`)
}
