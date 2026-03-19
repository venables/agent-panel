/**
 * Orchestrates launching review agents in terminal splits.
 */

import type { AgentConfig, ReviewConfig, ReviewTarget } from "./config.ts"
import { resolvePrompt } from "./config.ts"
import type { PaneHandle, Terminal } from "./terminal/terminal.ts"

/** Result of launching a single agent. */
export interface LaunchResult {
  readonly agent: AgentConfig
  readonly pane: PaneHandle
}

/**
 * Builds the full shell command to launch an agent with its prompt.
 *
 * @param config - The review config
 * @param agent - The agent to launch
 * @param target - The review target
 * @returns The shell command string (e.g. `claude "Review PR 123..."`)
 */
function buildCommand(
  config: ReviewConfig,
  agent: AgentConfig,
  target: ReviewTarget
): string {
  const prompt = resolvePrompt(config, agent, target)
  return agent.command.replace("{{prompt}}", prompt)
}

/**
 * Launches an agent in a terminal pane.
 *
 * @param terminal - The terminal backend
 * @param config - The review config
 * @param agent - The agent to launch
 * @param target - The review target
 * @param pane - The pane to launch in
 * @returns The launch result
 */
async function launchInPane(
  terminal: Terminal,
  config: ReviewConfig,
  agent: AgentConfig,
  target: ReviewTarget,
  pane: PaneHandle
): Promise<LaunchResult> {
  const command = buildCommand(config, agent, target)
  await terminal.sendText(pane, command)
  await terminal.sendKey(pane, "Enter")
  return { agent, pane }
}

/**
 * Launches all configured agents.
 *
 * The first agent reuses the current pane. Subsequent agents get new splits.
 *
 * @param terminal - The terminal backend to use
 * @param config - The review config containing agent definitions
 * @param target - The review target (PR or branch diff)
 * @returns Array of launch results for each agent
 */
export async function launchAllAgents(
  terminal: Terminal,
  config: ReviewConfig,
  target: ReviewTarget
): Promise<readonly LaunchResult[]> {
  const results: LaunchResult[] = []

  for (let i = 0; i < config.agents.length; i++) {
    const agent = config.agents[i]!

    let pane: PaneHandle
    if (i === 0) {
      pane = terminal.currentPane()
    } else {
      pane = await terminal.createSplit()
      // Small delay to let the shell initialize in the new split
      await Bun.sleep(500)
    }

    const result = await launchInPane(terminal, config, agent, target, pane)
    results.push(result)
  }

  return results
}
