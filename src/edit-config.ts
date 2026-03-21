/**
 * Opens the config file in the user's preferred editor.
 *
 * Resolves the editor from $EDITOR, $VISUAL, or falls back to "vi".
 */

import { spawn } from "node:child_process"
import { existsSync } from "node:fs"

import { configPath } from "./config.ts"

function resolveEditor(): string {
  return process.env["EDITOR"] || process.env["VISUAL"] || "vi"
}

/**
 * Spawns the user's editor with the config file path.
 *
 * Waits for the editor process to exit before resolving.
 */
export async function editConfig(): Promise<void> {
  const path = configPath()

  if (!existsSync(path)) {
    process.stderr.write(`Config file not found: ${path}\n`)
    process.stderr.write('Run "panel init" to create one.\n')
    process.exit(1)
  }

  const editor = resolveEditor()

  await new Promise<void>((resolve, reject) => {
    const child = spawn(editor, [path], { stdio: "inherit" })

    child.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${editor} exited with code ${code}`))
      }
    })

    child.on("error", (error) => {
      reject(new Error(`Failed to launch editor "${editor}": ${error.message}`))
    })
  })
}
