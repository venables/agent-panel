/**
 * CLI routing logic.
 *
 * Resolves raw CLI arguments into a typed route that the main handler
 * dispatches on. Extracted as a pure function for testability.
 */

import { extractWords } from "./args.ts"
import type { CliFlags } from "./options.ts"

/** Route to a config subcommand. */
interface ConfigRoute {
  readonly type: "config"
  readonly action: "create" | "edit" | "delete"
}

/** Route to a configured command (e.g. "panel run review 123"). */
interface CommandRoute {
  readonly type: "command"
  readonly name: string
  readonly arg: string | undefined
  readonly flags: CliFlags
}

/** Route to a raw prompt (e.g. "panel build an app"). */
interface PromptRoute {
  readonly type: "prompt"
  readonly prompt: string
  readonly flags: CliFlags
}

/** Route to show help (no args provided). */
interface HelpRoute {
  readonly type: "help"
}

export type Route = ConfigRoute | CommandRoute | PromptRoute | HelpRoute

type ConfigAction = "create" | "edit" | "delete"

const CONFIG_ACTIONS: ReadonlySet<string> = new Set<ConfigAction>([
  "create",
  "edit",
  "delete"
])

function isConfigAction(value: string): value is ConfigAction {
  return CONFIG_ACTIONS.has(value)
}

/**
 * Resolves raw CLI arguments into a typed route.
 *
 * Routing rules:
 * - No positional words -> help
 * - First word is "config" -> config subcommand
 * - First word is "run" + second word matches a configured command -> command
 * - First word is "run" + no match -> prompt (with "run" prepended)
 * - Anything else -> prompt
 *
 * @param rawArgs - Raw argument array from citty
 * @param flags - Parsed CLI flags (--tabs, --preserve)
 * @param configCommandNames - Known command names from the user's config
 * @returns The resolved route
 */
export function resolveRoute(
  rawArgs: readonly string[],
  flags: CliFlags,
  configCommandNames: readonly string[]
): Route {
  const words = extractWords(rawArgs)

  if (words.length === 0) {
    return { type: "help" }
  }

  if (words[0] === "config") {
    const action = words[1]

    if (!action || !isConfigAction(action)) {
      const available = [...CONFIG_ACTIONS].join(", ")
      throw new Error(
        `Unknown config action: "${action ?? ""}". Available: ${available}`
      )
    }

    return { type: "config", action }
  }

  if (words[0] === "run") {
    const rest = words.slice(1)

    if (rest.length > 0 && rest[0] && configCommandNames.includes(rest[0])) {
      return {
        type: "command",
        name: rest[0],
        arg: rest[1],
        flags
      }
    }

    // "run" is included in the prompt when no config command matches
    const prompt = words.join(" ")
    return { type: "prompt", prompt, flags }
  }

  // Everything else is a raw prompt
  const prompt = words.join(" ")
  return { type: "prompt", prompt, flags }
}
