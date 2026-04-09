/**
 * Utilities for extracting positional words from raw CLI arguments.
 *
 * citty parses known flags (--tabs, --preserve) but we handle positional
 * args ourselves because the prompt is variadic (multiple words).
 */

/** Flags that consume the next token as a value. */
interface StringFlag {
  readonly long: string
  readonly short: string | undefined
}

/**
 * Error message thrown when `--` appears in the argument list.
 *
 * Exported so tests can assert against the exact string.
 */
export const DASH_DASH_ERROR =
  "panel does not support '--' argument forwarding because prompts are dispatched through config-defined commands, not a single child process. Use 'panel ask <prompt>' or 'panel --message <prompt>'."

/**
 * Rejects raw argument arrays containing a bare `--` token.
 *
 * In POSIX convention `--` means "end of options, rest are positional".
 * panel has no single child process to forward to — every agent gets its
 * own shell command — so `--` has no meaningful interpretation here.
 * Earlier versions treated it as a raw-prompt escape, but that shortcut
 * was dropped when `ask` became a config-defined command. We fail loudly
 * rather than silently consume the token, to prevent scripts like
 * `panel -- review 429` from accidentally running the configured
 * `review` command with arg `429`.
 *
 * @param rawArgs - The raw argument array from citty's context
 * @throws If any argument equals exactly `--`
 */
export function assertNoDashDash(rawArgs: readonly string[]): void {
  if (rawArgs.includes("--")) {
    throw new Error(DASH_DASH_ERROR)
  }
}

/**
 * Extracts positional (non-flag) words from raw CLI arguments.
 *
 * Filters out anything starting with "-" and any value token immediately
 * following a known string-type flag (e.g. --file prompt.md).
 *
 * @param rawArgs - The raw argument array from citty's context
 * @param stringFlags - String flags whose next token should be skipped
 * @returns Array of positional words in order
 */
export function extractWords(
  rawArgs: readonly string[],
  stringFlags: readonly StringFlag[] = []
): readonly string[] {
  const flagTokens = new Set(
    stringFlags.flatMap((f) =>
      f.short ? [`--${f.long}`, `-${f.short}`] : [`--${f.long}`]
    )
  )

  const words: string[] = []
  let skipNext = false

  for (const arg of rawArgs) {
    if (skipNext) {
      skipNext = false
      continue
    }

    if (flagTokens.has(arg)) {
      skipNext = true
      continue
    }

    if (!arg.startsWith("-")) {
      words.push(arg)
    }
  }

  return words
}
