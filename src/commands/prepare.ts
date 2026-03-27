/**
 * Runs a command's `prepare` script before agents launch.
 *
 * The prepare script is a shell command that can print JSON to stdout
 * to override launch context (workdir, arg). If it prints nothing,
 * no overrides are applied.
 */

// Using exec intentionally: prepare commands are user-defined shell strings
// from config (same trust model as agent commands). They need shell features
// like pipes and redirects. The user owns the config file.
import { exec } from "node:child_process"

import { z } from "zod"

/** Validated overrides returned by a prepare script. */
export interface PrepareResult {
  readonly workdir: string | undefined
  readonly arg: string | undefined
}

const EMPTY_RESULT: PrepareResult = { workdir: undefined, arg: undefined }

/** Schema for the JSON a prepare script can emit on stdout. */
const PrepareOutputSchema = z
  .object({
    workdir: z.string().optional(),
    arg: z.string().optional()
  })
  .strict()

/**
 * Substitutes `{{arg}}` in a prepare command template.
 *
 * @param template - The prepare command template
 * @param arg - The argument value (undefined leaves placeholder stripped)
 * @returns The resolved shell command
 */
export function resolvePrepareCommand(
  template: string,
  arg: string | undefined
): string {
  if (!arg) {
    return template.replaceAll(" {{arg}}", "").replaceAll("{{arg}}", "")
  }
  return template.replaceAll("{{arg}}", arg)
}

/**
 * Executes a prepare shell command and parses any JSON output.
 *
 * @param shellCommand - The resolved shell command to run
 * @returns Overrides from the script, or empty if no output
 * @throws If the command fails or outputs invalid JSON
 */
function execPrepare(shellCommand: string): Promise<PrepareResult> {
  return new Promise((resolve, reject) => {
    exec(shellCommand, { timeout: 30_000 }, (error, stdout, stderr) => {
      if (error) {
        const detail = stderr.trim() || error.message
        reject(new Error(`Prepare command failed: ${detail}`))
        return
      }

      const trimmed = stdout.trim()

      if (trimmed.length === 0) {
        resolve(EMPTY_RESULT)
        return
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(trimmed)
      } catch {
        reject(
          new Error(
            `Prepare command output is not valid JSON: ${trimmed.slice(0, 200)}`
          )
        )
        return
      }

      const result = PrepareOutputSchema.safeParse(parsed)

      if (!result.success) {
        reject(
          new Error(
            `Prepare command output failed validation: ${result.error.message}`
          )
        )
        return
      }

      resolve({
        workdir: result.data.workdir,
        arg: result.data.arg
      })
    })
  })
}

/**
 * Runs a prepare script for a command, returning any context overrides.
 *
 * @param prepareTemplate - The prepare command template (with optional {{arg}})
 * @param arg - The command argument
 * @returns Overrides from the script
 */
export async function runPrepare(
  prepareTemplate: string,
  arg: string | undefined
): Promise<PrepareResult> {
  const shellCommand = resolvePrepareCommand(prepareTemplate, arg)
  return execPrepare(shellCommand)
}
