/**
 * Ghostty terminal backend using AppleScript.
 *
 * Requires Ghostty 1.3.0+ on macOS with AppleScript enabled.
 */

import type { PaneHandle, Terminal } from "./terminal.ts"

/** Counter for generating unique pane IDs within a session. */
let nextPaneId = 1

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
 * Builds an AppleScript reference to a pane by its ID.
 *
 * The "initial" pane refers to terminal 1 of the front window.
 * Split panes are referenced by their osascript variable name.
 */
function paneRef(pane: PaneHandle): string {
  if (pane.id === "initial") {
    return "terminal 1 of selected tab of front window"
  }
  return pane.id
}

export function createGhosttyTerminal(): Terminal {
  return {
    name: "ghostty",

    currentPane(): PaneHandle {
      return { id: "initial" }
    },

    async createSplit(): Promise<PaneHandle> {
      const varName = `pane${nextPaneId++}`

      // Split the front window's first terminal to the right.
      // We use 'do script' style -- osascript returns a reference to the new terminal.
      const script = `tell application "Ghostty"
  set ${varName} to split (${paneRef({ id: "initial" })}) direction right
  return id of ${varName}
end tell`

      const terminalId = await runAppleScript(script)

      return { id: terminalId }
    },

    async sendText(pane: PaneHandle, text: string): Promise<void> {
      // Escape backslashes and double quotes for AppleScript string
      const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')

      const ref =
        pane.id === "initial"
          ? paneRef(pane)
          : `(first terminal of selected tab of front window whose id is ${pane.id})`

      const script = `tell application "Ghostty"
  input text "${escaped}" to ${ref}
end tell`

      await runAppleScript(script)
    },

    async sendKey(pane: PaneHandle, key: string): Promise<void> {
      const ghosttyKey = key.toLowerCase()

      const ref =
        pane.id === "initial"
          ? paneRef(pane)
          : `(first terminal of selected tab of front window whose id is ${pane.id})`

      const script = `tell application "Ghostty"
  send key "${ghosttyKey}" to ${ref}
end tell`

      await runAppleScript(script)
    }
  }
}
