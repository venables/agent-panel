/**
 * Handles the `council init` command.
 *
 * Creates the default config file at ~/.config/council/config.jsonc.
 */

import { mkdir } from "node:fs/promises"
import { dirname } from "node:path"

import { configPath, DEFAULT_CONFIG_CONTENT } from "./config.ts"

/**
 * Writes the default config file. Errors if it already exists.
 */
export async function init(): Promise<void> {
  const path = configPath()
  const file = Bun.file(path)
  const exists = await file.exists()

  if (exists) {
    console.error(`Config already exists: ${path}`)
    console.error("Delete it first if you want to regenerate.")
    process.exit(1)
  }

  await mkdir(dirname(path), { recursive: true })
  await Bun.write(path, DEFAULT_CONFIG_CONTENT)

  console.log(`Created config: ${path}`)
}
