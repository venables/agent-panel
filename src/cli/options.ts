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
  }
} as const satisfies ArgsDef

/** Parsed CLI flags from citty. */
export interface CliFlags {
  readonly tabs: boolean
  readonly preserve: boolean
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
