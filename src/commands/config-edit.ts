/**
 * Opens the config file in the user's preferred editor.
 *
 * Resolves the editor from $EDITOR, $VISUAL, or falls back to "vi".
 */

import { spawn } from "node:child_process"
import { existsSync } from "node:fs"

import { configPath } from "../config/config.ts"

/** Resolved editor command and any flags (e.g. "code -w" -> ["code", "-w"]). */
interface EditorCommand {
  readonly command: string
  readonly args: readonly string[]
}

/**
 * Resolves the user's preferred editor from $EDITOR, $VISUAL, or "vi".
 *
 * Splits the value on whitespace so flags like "code -w" or "nvim -u ..."
 * are handled correctly.
 */
function resolveEditor(): EditorCommand {
  const raw = process.env["EDITOR"] || process.env["VISUAL"] || "vi"
  const parts = raw.split(/\s+/).filter(Boolean)
  return {
    command: parts[0] ?? "vi",
    args: parts.slice(1)
  }
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
    process.stderr.write('Run "panel config:create" to create one.\n')
    process.exit(1)
  }

  const editor = resolveEditor()

  await new Promise<void>((resolve, reject) => {
    const child = spawn(editor.command, [...editor.args, path], {
      stdio: "inherit"
    })

    child.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${editor.command} exited with code ${code}`))
      }
    })

    child.on("error", (error) => {
      reject(
        new Error(
          `Failed to launch editor "${editor.command}": ${error.message}`
        )
      )
    })
  })
}
