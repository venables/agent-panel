/**
 * Shared CLI flag definitions and option merging for launch behavior.
 *
 * The --tabs and --preserve flags can be passed on any command that
 * launches agents, overriding the config defaults for that invocation.
 */

import type { ArgsDef } from "citty"

/** CLI flag definitions shared across root and run commands. */
export const launchFlags = {
  tabs: {
    type: "boolean",
    alias: "t",
    description: "Use tabs layout instead of splits"
  },
  preserve: {
    type: "boolean",
    alias: "p",
    description: "Preserve the active pane (all agents get new panes)"
  },
  file: {
    type: "string",
    alias: "f",
    description: "Read prompt from a file"
  },
  message: {
    type: "string",
    alias: "m",
    description: "Send a prompt to all agents without opening the TUI"
  }
} as const satisfies ArgsDef

/**
 * String-type flags that consume the next token as a value.
 *
 * Used by extractWords to skip flag values during positional arg extraction.
 */
export const STRING_FLAGS = Object.entries(launchFlags)
  .filter(([, def]) => def.type === "string")
  .map(([name, def]) => ({
    long: name,
    short: "alias" in def ? def.alias : undefined
  }))

/** Parsed CLI flags from citty. */
export interface CliFlags {
  readonly tabs: boolean
  readonly preserve: boolean
  readonly file: string | undefined
  readonly message: string | undefined
}

/** Options that control launch behavior. */
export interface LaunchOptions {
  readonly layout: "splits" | "tabs"
  readonly preserveActivePane: boolean
}

/** Config-level options (from the user's config file). */
export interface ConfigOptions {
  readonly layout: "splits" | "tabs"
  readonly preserveActivePane: boolean
}

/**
 * Merges config-level options with per-call CLI flag overrides.
 *
 * CLI flags are additive-only: --tabs forces tabs, --preserve forces
 * preserve. Without flags, config defaults apply.
 *
 * @param configOptions - Options from the config file
 * @param flags - CLI flags from the current invocation
 * @returns Merged launch options
 */
export function mergeOptions(
  configOptions: ConfigOptions,
  flags: CliFlags
): LaunchOptions {
  return {
    layout: flags.tabs ? "tabs" : configOptions.layout,
    preserveActivePane: flags.preserve ? true : configOptions.preserveActivePane
  }
}
