/**
 * Orchestrates launching agents in terminal splits.
 */

import type { AgentConfig, Config } from "../config/config.ts"
import { resolveAgentCommand, resolveCommandPrompt } from "../config/config.ts"
import type { PaneHandle, Terminal } from "../terminal/terminal.ts"

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

/** Options that control launch behavior. */
interface LaunchOptions {
  /** If true, all agents get new splits and the current pane is left alone. */
  readonly preserveActivePane: boolean
}

const DEFAULT_LAUNCH_OPTIONS: LaunchOptions = { preserveActivePane: false }

/**
 * Launches all configured agents with a resolved prompt.
 *
 * When preserveActivePane is false (default), the first agent takes over
 * the current pane. When true, every agent gets a fresh split.
 *
 * @param terminal - The terminal backend to use
 * @param agents - The agents to launch
 * @param prompt - The resolved prompt string
 * @param options - Launch behavior options
 * @returns Array of launch results for each agent
 */
export async function launchAgents(
  terminal: Terminal,
  agents: readonly AgentConfig[],
  prompt: string,
  options: LaunchOptions = DEFAULT_LAUNCH_OPTIONS
): Promise<readonly LaunchResult[]> {
  const results: LaunchResult[] = []

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i]!
    const shellCommand = resolveAgentCommand(agent, prompt)

    const useCurrentPane = !options.preserveActivePane && i === 0

    // Splits must be sequential -- each depends on the previous pane's position
    // eslint-disable-next-line no-await-in-loop
    const pane = useCurrentPane
      ? terminal.currentPane()
      : await terminal.createSplit()

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
  return launchAgents(terminal, config.agents, prompt, config.options)
}
