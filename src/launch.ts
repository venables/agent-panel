/**
 * Orchestrates launching agents in terminal splits.
 */

import type { AgentConfig, Config } from "./config.ts"
import { resolveAgentCommand, resolveCommandPrompt } from "./config.ts"
import type { PaneHandle, Terminal } from "./terminal/terminal.ts"

/** Result of launching a single agent. */
export interface LaunchResult {
  readonly agent: AgentConfig
  readonly pane: PaneHandle
}

/**
 * Launches an agent in a terminal pane with a resolved command.
 *
 * @param terminal - The terminal backend
 * @param agent - The agent to launch
 * @param shellCommand - The fully resolved shell command
 * @param pane - The pane to launch in
 * @returns The launch result
 */
async function launchInPane(
  terminal: Terminal,
  agent: AgentConfig,
  shellCommand: string,
  pane: PaneHandle
): Promise<LaunchResult> {
  await terminal.sendText(pane, shellCommand)
  await terminal.sendKey(pane, "Enter")

  return { agent, pane }
}

/**
 * Launches all configured agents with a resolved prompt.
 *
 * The first agent reuses the current pane. Subsequent agents get new splits.
 *
 * @param terminal - The terminal backend to use
 * @param agents - The agents to launch
 * @param prompt - The resolved prompt string
 * @returns Array of launch results for each agent
 */
export async function launchAgents(
  terminal: Terminal,
  agents: readonly AgentConfig[],
  prompt: string
): Promise<readonly LaunchResult[]> {
  const results: LaunchResult[] = []

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i]!
    const shellCommand = resolveAgentCommand(agent, prompt)

    // eslint-disable-next-line no-await-in-loop
    const pane = i === 0 ? terminal.currentPane() : await terminal.createSplit()

    // eslint-disable-next-line no-await-in-loop
    const result = await launchInPane(terminal, agent, shellCommand, pane)
    results.push(result)
  }

  return results
}

/**
 * Launches all agents for a configured command.
 *
 * @param terminal - The terminal backend to use
 * @param config - The full config
 * @param commandName - The command to run (e.g. "review")
 * @param arg - Optional argument for the command
 * @returns Array of launch results for each agent
 */
export async function launchCommand(
  terminal: Terminal,
  config: Config,
  commandName: string,
  arg: string | undefined
): Promise<readonly LaunchResult[]> {
  const command = config.commands[commandName]

  if (!command) {
    const available = Object.keys(config.commands).join(", ")
    throw new Error(
      `Unknown command: "${commandName}". Available commands: ${available}`
    )
  }

  const prompt = resolveCommandPrompt(command, arg)
  return launchAgents(terminal, config.agents, prompt)
}
