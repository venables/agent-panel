/**
 * Pre-configured command templates that users can include in their config.
 */

/** A pre-configured command template. */
export interface KnownCommand {
  /** Command name used as the key in config (e.g. "review"). */
  readonly name: string
  /** Short description shown in selection UI. */
  readonly description: string
  /** Prompt template with optional {{arg}} placeholder. */
  readonly prompt: string
  /** Fallback prompt when no arg is given. */
  readonly promptNoArg?: string
  /** Whether the command requires an argument. */
  readonly requiresArg?: boolean
}

/**
 * All known command templates, ordered by general usefulness.
 */
export const KNOWN_COMMANDS: readonly KnownCommand[] = [
  {
    name: "review",
    description: "Code review for a PR or current changes",
    prompt:
      "Review PR {{arg}}. Leave comments in this session and not on the PR itself.",
    promptNoArg:
      "Review all changes between this branch and origin/main, including any dirty or unstaged files. Leave comments in this session and not on the PR itself."
  },
  {
    name: "fix",
    description: "Fix a specific issue",
    prompt:
      "Fix issue {{arg}}. Implement the fix and show me what you changed.",
    requiresArg: true
  },
  {
    name: "explain",
    description: "Explain part of the codebase",
    prompt: "Explain {{arg}} in this codebase. Be thorough.",
    requiresArg: true
  },
  {
    name: "test",
    description: "Write tests for a file or feature",
    prompt:
      "Write comprehensive tests for {{arg}}. Include edge cases and aim for high coverage.",
    requiresArg: true
  },
  {
    name: "refactor",
    description: "Refactor code for clarity and maintainability",
    prompt:
      "Refactor {{arg}}. Focus on readability, maintainability, and best practices. Explain what you changed and why.",
    requiresArg: true
  }
]
