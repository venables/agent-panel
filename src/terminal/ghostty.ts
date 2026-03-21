/**
 * Ghostty terminal backend using AppleScript.
 *
 * Requires Ghostty 1.3.0+ on macOS with AppleScript enabled.
 *
 * Panes are tracked by terminal index within the selected tab of the
 * front window (e.g. "terminal 1", "terminal 2"). Each `createSplit`
 * increments the index.
 */

import { run } from "../exec.ts"
import { sleep } from "../exec.ts"
import type { PaneHandle, Terminal } from "./terminal.ts"

/** Delay after creating a split to let Ghostty render the new pane. */
const SPLIT_SETTLE_MS = 500

/**
 * Runs an AppleScript snippet via osascript.
 *
 * @param lines - The AppleScript lines to execute (each becomes a -e arg)
 * @param args - Optional arguments passed to the script's `on run argv` handler
 * @returns stdout from osascript
 */
async function runAppleScript(
  lines: readonly string[],
  args?: readonly string[]
): Promise<string> {
  const scriptArgs = lines.flatMap((line) => ["-e", line])
  const trailingArgs = args && args.length > 0 ? ["--", ...args] : []
  const output = await run("osascript", [...scriptArgs, ...trailingArgs])
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

/**
 * Sends text to a Ghostty pane via AppleScript's `on run argv` handler.
 *
 * @param ref - The AppleScript terminal reference
 * @param text - The text to send
 */
async function inputText(ref: string, text: string): Promise<void> {
  await runAppleScript(
    [
      "on run argv",
      '  tell application "Ghostty"',
      `    input text (item 1 of argv) to ${ref}`,
      "  end tell",
      "end run"
    ],
    [text]
  )
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

      await runAppleScript([
        'tell application "Ghostty"',
        `  split (${currentRef}) direction right`,
        "end tell"
      ])

      await sleep(SPLIT_SETTLE_MS)

      terminalCount++
      return { id: String(terminalCount) }
    },

    async sendText(pane: PaneHandle, text: string): Promise<void> {
      await inputText(terminalRef(pane), text)
    },

    async sendKey(pane: PaneHandle, key: string): Promise<void> {
      const keyMap: Record<string, string> = {
        enter: "\r",
        tab: "\t",
        escape: "\u001b"
      }
      const char = keyMap[key.toLowerCase()]

      if (!char) {
        throw new Error(`Unsupported key for Ghostty: "${key}"`)
      }

      await inputText(terminalRef(pane), char)
    }
  }
}
