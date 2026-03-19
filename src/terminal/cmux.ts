/**
 * cmux terminal backend.
 */

import type { PaneHandle, Terminal } from "./terminal.ts"

/** Runs a cmux CLI command and returns stdout. Throws on failure. */
async function cmux(args: readonly string[]): Promise<string> {
  const proc = Bun.spawn(["cmux", ...args], {
    stdout: "pipe",
    stderr: "pipe"
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(`cmux ${args[0]} failed (exit ${exitCode}): ${stderr}`)
  }

  return output
}

export function createCmuxTerminal(surfaceId: string): Terminal {
  return {
    name: "cmux",

    currentPane(): PaneHandle {
      return { id: surfaceId }
    },

    async createSplit(): Promise<PaneHandle> {
      const output = await cmux(["new-split", "right"])
      const match = output.match(/surface:\d+/)

      if (!match) {
        throw new Error(
          `Could not parse surface ref from cmux output: ${output}`
        )
      }

      return { id: match[0] }
    },

    async sendText(pane: PaneHandle, text: string): Promise<void> {
      await cmux(["send", "--surface", pane.id, text])
    },

    async sendKey(pane: PaneHandle, key: string): Promise<void> {
      await cmux(["send-key", "--surface", pane.id, key])
    }
  }
}
