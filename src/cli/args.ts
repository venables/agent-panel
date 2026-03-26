/**
 * Utilities for extracting positional words from raw CLI arguments.
 *
 * citty parses known flags (--tabs, --preserve) but we handle positional
 * args ourselves because the prompt is variadic (multiple words).
 */

/**
 * Extracts positional (non-flag) words from raw CLI arguments.
 *
 * Filters out anything starting with "-" and any value immediately
 * following a known string-type flag (none currently, but future-proof).
 *
 * @param rawArgs - The raw argument array from citty's context
 * @returns Array of positional words in order
 */
export function extractWords(rawArgs: readonly string[]): readonly string[] {
  return rawArgs.filter((arg) => !arg.startsWith("-"))
}
