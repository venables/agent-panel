/**
 * cmux terminal backend.
 */

import { run } from "../utils/exec.ts"
import type { PaneHandle, Terminal } from "./terminal.ts"

export function createCmuxTerminal(surfaceId: string): Terminal {
  return {
    name: "cmux",

    currentPane(): PaneHandle {
      return { id: surfaceId }
    },

    async createSplit(): Promise<PaneHandle> {
      const output = await run("cmux", ["new-split", "right"])
      const match = output.match(/surface:\d+/)

      if (!match) {
        throw new Error(
          `Could not parse surface ref from cmux output: ${output}`
        )
      }

      return { id: match[0] }
    },

    async sendText(pane: PaneHandle, text: string): Promise<void> {
      await run("cmux", ["send", "--surface", pane.id, text])
    },

    async sendKey(pane: PaneHandle, key: string): Promise<void> {
      await run("cmux", ["send-key", "--surface", pane.id, key])
    }
  }
}
