/**
 * Auto-detects the terminal backend based on environment variables.
 */

import { createCmuxTerminal } from "./cmux.ts"
import { createGhosttyTerminal } from "./ghostty.ts"
import type { Terminal } from "./terminal.ts"

export type TerminalKind = "cmux" | "ghostty"

/** Detection result with the identified terminal kind. */
export interface DetectResult {
  readonly kind: TerminalKind
  readonly terminal: Terminal
}

/**
 * Detects the current terminal environment and returns the appropriate backend.
 *
 * Detection order:
 * 1. cmux -- checked first since it can run inside any terminal (Ghostty included)
 * 2. Ghostty -- checked via TERM_PROGRAM
 *
 * @returns The detected terminal backend
 * @throws If no supported terminal is detected
 */
export function detectTerminal(): DetectResult {
  const cmuxSurface = process.env["CMUX_SURFACE_ID"]
  if (cmuxSurface) {
    return {
      kind: "cmux",
      terminal: createCmuxTerminal(cmuxSurface)
    }
  }

  const termProgram = process.env["TERM_PROGRAM"]
  if (termProgram === "ghostty") {
    if (process.platform !== "darwin") {
      throw new Error(
        "Ghostty terminal support is macOS-only (requires AppleScript)."
      )
    }
    return {
      kind: "ghostty",
      terminal: createGhosttyTerminal()
    }
  }

  throw new Error(
    "No supported terminal detected. Run this inside cmux or Ghostty 1.3+."
  )
}
