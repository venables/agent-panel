/**
 * Handles the `panel init` command.
 *
 * Creates the default config file at ~/.config/agent-panel/config.jsonc.
 */

import { access, mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

import { configPath, DEFAULT_CONFIG_CONTENT } from "./config.ts"

/**
 * Writes the default config file. Errors if it already exists.
 */
export async function init(): Promise<void> {
  const path = configPath()

  const exists = await access(path)
    .then(() => true)
    .catch(() => false)

  if (exists) {
    console.error(`Config already exists: ${path}`)
    console.error("Delete it first if you want to regenerate.")
    process.exit(1)
  }

  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, DEFAULT_CONFIG_CONTENT, "utf-8")

  console.log(`Created config: ${path}`)
}
