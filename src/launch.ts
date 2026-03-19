/**
 * Orchestrates launching review agents in cmux splits.
 */

import { createSplit, sendKeyToSurface, sendToSurface } from "./cmux.ts"
import type { AgentConfig, ReviewConfig, ReviewTarget } from "./config.ts"
import { resolvePrompt } from "./config.ts"

/** Result of launching a single agent. */
export interface LaunchResult {
  readonly agent: AgentConfig
  readonly surfaceId: string
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
 * Launches an agent in an existing cmux surface.
 *
 * @param config - The review config
 * @param agent - The agent to launch
 * @param target - The review target
 * @param surfaceId - The surface to launch in
 * @returns The launch result
 */
async function launchInSurface(
  config: ReviewConfig,
  agent: AgentConfig,
  target: ReviewTarget,
  surfaceId: string
): Promise<LaunchResult> {
  const command = buildCommand(config, agent, target)
  await sendToSurface(surfaceId, command)
  await sendKeyToSurface(surfaceId, "Enter")
  return { agent, surfaceId }
}

/**
 * Launches an agent in a new right-side cmux split.
 *
 * @param config - The review config
 * @param agent - The agent to launch
 * @param target - The review target
 * @returns The launch result with the new surface info
 */
async function launchInNewSplit(
  config: ReviewConfig,
  agent: AgentConfig,
  target: ReviewTarget
): Promise<LaunchResult> {
  const { surfaceId } = await createSplit()

  // Small delay to let the shell initialize in the new split
  await Bun.sleep(500)

  return launchInSurface(config, agent, target, surfaceId)
}

/**
 * Launches all configured agents.
 *
 * The first agent reuses the current surface. Subsequent agents get new splits.
 *
 * @param config - The review config containing agent definitions
 * @param target - The review target (PR or branch diff)
 * @param currentSurfaceId - The cmux surface ID of the current terminal
 * @returns Array of launch results for each agent
 */
export async function launchAllAgents(
  config: ReviewConfig,
  target: ReviewTarget,
  currentSurfaceId: string
): Promise<readonly LaunchResult[]> {
  const results: LaunchResult[] = []

  for (let i = 0; i < config.agents.length; i++) {
    const agent = config.agents[i]!
    const result =
      i === 0
        ? await launchInSurface(config, agent, target, currentSurfaceId)
        : await launchInNewSplit(config, agent, target)
    results.push(result)
  }

  return results
}
