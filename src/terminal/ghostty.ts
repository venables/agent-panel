/**
 * Ghostty terminal backend using AppleScript.
 *
 * Requires Ghostty 1.3.0+ on macOS with AppleScript enabled.
 *
 * Panes are tracked by terminal index within the selected tab of the
 * front window (e.g. "terminal 1", "terminal 2"). Each `createSplit`
 * increments the index.
 */

import type { PaneHandle, Terminal } from "./terminal.ts"

/**
 * Runs an AppleScript snippet against the Ghostty application.
 *
 * @param script - The AppleScript code to execute
 * @returns stdout from osascript
 */
async function runAppleScript(script: string): Promise<string> {
  const proc = Bun.spawn(["osascript", "-e", script], {
    stdout: "pipe",
    stderr: "pipe"
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(`osascript failed (exit ${exitCode}): ${stderr}`)
  }

  return output.trim()
}

/**
 * Builds the AppleScript reference for a terminal pane by index.
 *
 * @param pane - The pane handle containing the terminal index
 * @returns AppleScript object reference string
 */
function terminalRef(pane: PaneHandle): string {
  return `terminal ${pane.id} of selected tab of front window`
}

export function createGhosttyTerminal(): Terminal {
  let terminalCount = 1

  return {
    name: "ghostty",

    currentPane(): PaneHandle {
      return { id: "1" }
    },

    async createSplit(): Promise<PaneHandle> {
      const currentRef = terminalRef({ id: String(terminalCount) })

      const script = `tell application "Ghostty"
  split (${currentRef}) direction right
end tell`

      await runAppleScript(script)

      terminalCount++
      return { id: String(terminalCount) }
    },

    async sendText(pane: PaneHandle, text: string): Promise<void> {
      const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
      const ref = terminalRef(pane)

      const script = `tell application "Ghostty"
  input text "${escaped}" to ${ref}
end tell`

      await runAppleScript(script)
    },

    async sendKey(pane: PaneHandle, key: string): Promise<void> {
      const ref = terminalRef(pane)

      const script = `tell application "Ghostty"
  send key "${key.toLowerCase()}" to ${ref}
end tell`

      await runAppleScript(script)
    }
  }
}
