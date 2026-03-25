/**
 * cmux terminal backend.
 */

import { run } from "../utils/exec.ts"
import type { PaneHandle, Terminal } from "./terminal.ts"

/**
 * Parses a cmux surface reference from command output.
 *
 * @param output - Raw stdout from a cmux command
 * @returns A pane handle with the parsed surface ID
 */
function parseSurfaceRef(output: string): PaneHandle {
  const match = output.match(/surface:\d+/)

  if (!match) {
    throw new Error(`Could not parse surface ref from cmux output: ${output}`)
  }

  return { id: match[0] }
}

export function createCmuxTerminal(surfaceId: string): Terminal {
  return {
    name: "cmux",

    currentPane(): PaneHandle {
      return { id: surfaceId }
    },

    async createSplit(): Promise<PaneHandle> {
      const output = await run("cmux", ["new-split", "right"])
      return parseSurfaceRef(output)
    },

    async createTab(): Promise<PaneHandle> {
      const output = await run("cmux", ["new-surface"])
      return parseSurfaceRef(output)
    },

    async sendText(pane: PaneHandle, text: string): Promise<void> {
      await run("cmux", ["send", "--surface", pane.id, text])
    },

    async sendKey(pane: PaneHandle, key: string): Promise<void> {
      await run("cmux", ["send-key", "--surface", pane.id, key])
    }
  }
}
