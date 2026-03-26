/**
 * Detects whether a CLI binary is available on the system PATH.
 */

import { execFile } from "node:child_process"

/**
 * Checks if a command exists on the system PATH using `which`.
 *
 * @param binary - The binary name to look up (e.g. "claude")
 * @returns True if the binary is found on PATH
 */
export function isInstalled(binary: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile("which", [binary], (error) => {
      resolve(error === null)
    })
  })
}
