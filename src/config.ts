/**
 * Agent and CLI configuration for review-cli.
 */

/** Configuration for a single review agent. */
export interface AgentConfig {
  /** Display name for the agent. */
  readonly name: string

  /**
   * Shell command template. Use {{prompt}} as placeholder for the review prompt.
   *
   * @example 'claude "{{prompt}}"'
   * @example 'opencode --prompt "{{prompt}}"'
   */
  readonly command: string

  /** Optional per-agent prompt override for PR mode. Falls back to default. */
  readonly promptPr?: string

  /** Optional per-agent prompt override for branch diff mode. Falls back to default. */
  readonly promptDiff?: string
}

/** Review target: either a specific PR or the current branch vs main. */
export type ReviewTarget =
  | { readonly mode: "pr"; readonly prNumber: string }
  | { readonly mode: "diff" }

/** Top-level configuration. */
export interface ReviewConfig {
  /** Default prompt template for PR mode. Use {{pr}} as placeholder. */
  readonly defaultPromptPr: string

  /** Default prompt template for branch diff mode. */
  readonly defaultPromptDiff: string

  /** Ordered list of agents to launch in splits. */
  readonly agents: readonly AgentConfig[]
}

const DEFAULT_PROMPT_PR =
  "Review PR {{pr}}. Leave comments in this session and not on the PR itself."

const DEFAULT_PROMPT_DIFF =
  "Review all changes between this branch and main, including any dirty or unstaged files. Leave comments in this session and not on the PR itself."

export const DEFAULT_CONFIG: ReviewConfig = {
  defaultPromptPr: DEFAULT_PROMPT_PR,
  defaultPromptDiff: DEFAULT_PROMPT_DIFF,
  agents: [
    { name: "claude", command: 'claude "{{prompt}}"' },
    { name: "codex", command: 'codex "{{prompt}}"' },
    { name: "opencode", command: 'opencode --prompt "{{prompt}}"' }
  ]
}

/**
 * Resolves the prompt for a given agent and review target.
 *
 * Uses per-agent prompt if configured, otherwise falls back to the default.
 * Substitutes {{pr}} in PR mode.
 *
 * @param config - The top-level review config
 * @param agent - The agent whose prompt to resolve
 * @param target - The review target (PR number or branch diff)
 * @returns The fully resolved prompt string
 */
export function resolvePrompt(
  config: ReviewConfig,
  agent: AgentConfig,
  target: ReviewTarget
): string {
  if (target.mode === "pr") {
    const template = agent.promptPr ?? config.defaultPromptPr
    return template.replace("{{pr}}", target.prNumber)
  }

  return agent.promptDiff ?? config.defaultPromptDiff
}
