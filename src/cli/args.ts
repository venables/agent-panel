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
