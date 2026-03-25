/**
 * Registry of known AI coding agent CLIs.
 *
 * Each entry defines how to invoke the agent and how to detect it.
 * Order matters -- it determines display order in the selection UI.
 */

/** A known agent CLI that can be configured in agent-panel. */
export interface KnownAgent {
  /** Short identifier used in config and as the pane label. */
  readonly name: string
  /** Pretty display name shown in selection UI (e.g. "Claude Code"). */
  readonly label: string
  /** The binary name used for detection and invocation. */
  readonly binary: string
  /** Shell command template with {{prompt}} placeholder. */
  readonly command: string
}

/** Maximum agents before warning about crowded split panes. */
export const SPLIT_PANE_WARN_THRESHOLD = 4

/**
 * All known agent CLIs in canonical display order.
 *
 * The first three (Claude Code, Codex, OpenCode) are the primary agents.
 * Remaining entries are alphabetical.
 */
export const KNOWN_AGENTS: readonly KnownAgent[] = [
  {
    name: "claude",
    label: "Claude Code",
    binary: "claude",
    command: "claude {{prompt}}"
  },
  {
    name: "codex",
    label: "Codex",
    binary: "codex",
    command: "codex {{prompt}}"
  },
  {
    name: "opencode",
    label: "OpenCode",
    binary: "opencode",
    command: "opencode --prompt {{prompt}}"
  },
  {
    name: "aider",
    label: "Aider",
    binary: "aider",
    command: "aider --message {{prompt}}"
  },
  {
    name: "amp",
    label: "Amp",
    binary: "amp",
    command: "amp {{prompt}}"
  },
  {
    name: "gemini",
    label: "Gemini CLI",
    binary: "gemini",
    command: "gemini {{prompt}}"
  },
  {
    name: "pi",
    label: "Pi",
    binary: "pi",
    command: "pi {{prompt}}"
  }
]
