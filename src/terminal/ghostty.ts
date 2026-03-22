/**
 * Ghostty terminal backend using AppleScript.
 *
 * Requires Ghostty 1.3.0+ on macOS with AppleScript enabled.
 *
 * Panes are tracked by Ghostty's stable terminal IDs. New splits are
 * created from the previously created pane, and AppleScript interactions
 * target terminals by ID rather than guessed indices.
 */

import { run } from "../utils/exec.ts"
import { sleep } from "../utils/exec.ts"
import type { PaneHandle, Terminal } from "./terminal.ts"

/** Delay after creating a split to let Ghostty render the new pane. */
const SPLIT_SETTLE_MS = 500
const CURRENT_PANE_ID = "__CURRENT__"

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
 * Resolves a pane handle to a stable Ghostty terminal ID.
 *
 * The current pane is represented by a sentinel and resolved dynamically
 * to the focused terminal in the selected tab of the front window.
 *
 * @param pane - The pane handle to resolve
 * @returns The stable terminal ID string
 */
function terminalId(pane: PaneHandle): string {
  return pane.id
}

/**
 * Finds a target terminal and returns its stable ID.
 *
 * @param paneId - Pane ID or the current-pane sentinel
 * @returns AppleScript lines that resolve and return the target terminal ID
 */
function resolveTerminalScript(paneId: string): readonly string[] {
  if (paneId === CURRENT_PANE_ID) {
    return [
      "    set targetTerminal to focused terminal of selected tab of front window",
      "    return id of targetTerminal"
    ]
  }

  return [
    "    set targetTerminal to missing value",
    "    repeat with candidate in terminals of front window",
    `      if id of candidate is ${JSON.stringify(paneId)} then`,
    "        set targetTerminal to candidate",
    "        exit repeat",
    "      end if",
    "    end repeat",
    '    if targetTerminal is missing value then error "Ghostty terminal not found"',
    "    return id of targetTerminal"
  ]
}

/**
 * Finds a target terminal without returning its ID.
 *
 * @param paneId - Pane ID or the current-pane sentinel
 * @returns AppleScript lines that set `targetTerminal`
 */
function findTerminalScript(paneId: string): readonly string[] {
  return resolveTerminalScript(paneId).filter(
    (line) => line !== "    return id of targetTerminal"
  )
}

/**
 * Resolves a pane to a stable Ghostty terminal ID.
 *
 * @param pane - The pane handle to resolve
 * @returns The terminal ID
 */
async function resolveTerminalId(pane: PaneHandle): Promise<string> {
  return runAppleScript([
    'tell application "Ghostty"',
    ...resolveTerminalScript(terminalId(pane)),
    "end tell"
  ])
}

/**
 * Sends text to a Ghostty pane via AppleScript's `on run argv` handler.
 *
 * Uses parameterized argv to prevent AppleScript injection.
 *
 * @param pane - The destination pane
 * @param text - The text to send
 */
async function inputText(pane: PaneHandle, text: string): Promise<void> {
  const id = await resolveTerminalId(pane)

  await runAppleScript(
    [
      "on run argv",
      '  tell application "Ghostty"',
      "    set targetTerminal to first terminal whose id is item 2 of argv",
      "    input text (item 1 of argv) to targetTerminal",
      "  end tell",
      "end run"
    ],
    [text, id]
  )
}

export function createGhosttyTerminal(): Terminal {
  let activePaneId = CURRENT_PANE_ID

  return {
    name: "ghostty",

    currentPane(): PaneHandle {
      return { id: CURRENT_PANE_ID }
    },

    async createSplit(): Promise<PaneHandle> {
      const newPaneId = await runAppleScript([
        'tell application "Ghostty"',
        ...findTerminalScript(activePaneId),
        "  set newTerminal to split targetTerminal direction right",
        "  return id of newTerminal",
        "end tell"
      ])

      await sleep(SPLIT_SETTLE_MS)

      activePaneId = newPaneId
      return { id: newPaneId }
    },

    async sendText(pane: PaneHandle, text: string): Promise<void> {
      await inputText(pane, text)
    },

    async sendKey(pane: PaneHandle, key: string): Promise<void> {
      const id = await resolveTerminalId(pane)

      await runAppleScript(
        [
          "on run argv",
          '  tell application "Ghostty"',
          "    set targetTerminal to first terminal whose id is item 2 of argv",
          "    send key (item 1 of argv) to targetTerminal",
          "  end tell",
          "end run"
        ],
        [key.toLowerCase(), id]
      )
    }
  }
}
