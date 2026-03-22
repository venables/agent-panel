/**
 * Node-compatible process execution utilities.
 */

import { execFile } from "node:child_process"

/**
 * Executes a command and returns stdout. Throws on non-zero exit.
 *
 * Uses execFile (not exec) to avoid shell injection.
 *
 * @param command - The command to run
 * @param args - Arguments to pass
 * @returns stdout as a string
 */
export function run(command: string, args: readonly string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        reject(
          new Error(`${command} ${args[0]} failed: ${stderr || error.message}`)
        )
        return
      }
      resolve(stdout)
    })
  })
}

/**
 * Wraps a string in single quotes for safe shell interpolation.
 *
 * Single-quoted strings have no shell expansion (no $, no backticks, nothing).
 * Internal single quotes are escaped by ending the quote, adding an escaped
 * single quote, and reopening.
 *
 * @param value - The string to escape
 * @returns A single-quoted, shell-safe string
 */
export function shellEscape(value: string): string {
  return "'" + value.replace(/'/g, "'\\''") + "'"
}

/**
 * Sleeps for a given number of milliseconds.
 *
 * @param ms - Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
