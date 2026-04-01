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

/** Route to a configured command (e.g. "panel review 123"). */
interface CommandRoute {
  readonly type: "command"
  readonly name: string
  readonly arg: string | undefined
  readonly flags: CliFlags
}

/** Route to a raw prompt (e.g. "panel raw build an app"). */
interface PromptRoute {
  readonly type: "prompt"
  readonly prompt: string
  readonly flags: CliFlags
}

/** Route to show help (no args provided). */
interface HelpRoute {
  readonly type: "help"
}

/** Route when the first word does not match any known command. */
interface UnknownRoute {
  readonly type: "unknown"
  readonly word: string
}

export type Route =
  | ConfigRoute
  | CommandRoute
  | PromptRoute
  | HelpRoute
  | UnknownRoute

type ConfigAction = "create" | "edit" | "delete"

const CONFIG_ACTIONS: ReadonlySet<string> = new Set<ConfigAction>([
  "create",
  "edit",
  "delete"
])

function isConfigAction(value: string): value is ConfigAction {
  return CONFIG_ACTIONS.has(value)
}

/** Keywords that trigger a raw prompt route. */
const RAW_ALIASES: ReadonlySet<string> = new Set(["raw", "ask"])

/**
 * Builds a prompt route from an array of words.
 *
 * @param promptWords - Words to join into a prompt
 * @param flags - Parsed CLI flags
 * @returns A prompt route
 * @throws When no prompt words are provided
 */
function buildPromptRoute(
  promptWords: readonly string[],
  flags: CliFlags
): PromptRoute {
  const prompt = promptWords.join(" ").trim()

  if (prompt.length === 0) {
    throw new Error("No prompt provided. Usage: panel raw <prompt...>")
  }

  return { type: "prompt", prompt, flags }
}

/**
 * Resolves raw CLI arguments into a typed route.
 *
 * Routing rules (in priority order):
 * 1. No positional words -> help
 * 2. "--" in rawArgs -> everything after is a raw prompt
 * 3. First word is "raw" or "ask" -> raw prompt (remaining words)
 * 4. First word is "config" -> config subcommand
 * 5. First word is "run" + second word matches config -> command
 * 6. First word matches a configured command -> command (shortcut)
 * 7. Anything else -> unknown command error
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
  // Check for -- prompt escape before extracting words
  const doubleDashIndex = rawArgs.indexOf("--")

  if (doubleDashIndex !== -1) {
    const afterDash = rawArgs.slice(doubleDashIndex + 1)
    return buildPromptRoute(afterDash, flags)
  }

  const words = extractWords(rawArgs)

  if (words.length === 0) {
    return { type: "help" }
  }

  // "raw" / "ask" prefix -> raw prompt (bypasses command matching)
  if (words[0] && RAW_ALIASES.has(words[0])) {
    return buildPromptRoute(words.slice(1), flags)
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

  // Explicit "run" prefix
  if (words[0] === "run") {
    const rest = words.slice(1)

    if (rest.length > 0 && rest[0] && configCommandNames.includes(rest[0])) {
      const arg = rest.slice(1).join(" ") || undefined
      return {
        type: "command",
        name: rest[0],
        arg,
        flags
      }
    }

    return { type: "unknown", word: rest[0] ?? "run" }
  }

  // Command shortcut: first word matches a configured command
  if (words[0] && configCommandNames.includes(words[0])) {
    const arg = words.slice(1).join(" ") || undefined
    return {
      type: "command",
      name: words[0],
      arg,
      flags
    }
  }

  // No match — unknown command
  return { type: "unknown", word: words[0] ?? "" }
}
