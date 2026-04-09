/**
 * Interactive TUI for entering and sending prompts to all configured agents.
 *
 * Shows a list of configured agents and a multi-line text input, then
 * launches each agent with the prompt.
 */

import { intro, isCancel, log, outro } from "@clack/prompts"

import type { LaunchOptions } from "../cli/options.ts"
import { launchAgents } from "../commands/launch.ts"
import type { LaunchResult } from "../commands/launch.ts"
import type { Config } from "../config/config.ts"
import type { Terminal } from "../terminal/terminal.ts"
import { multiline } from "./multiline.ts"

interface PromptTuiOptions {
  readonly terminal: Terminal
  readonly config: Config
  readonly launchOptions: LaunchOptions
}

function printResults(results: readonly LaunchResult[]): void {
  for (const result of results) {
    process.stdout.write(`  ${result.agent.name} -> ${result.pane.id}\n`)
  }
}

/**
 * Runs the interactive prompt TUI.
 *
 * Displays a multi-line text area for the user to type a prompt,
 * then launches all configured agents with that prompt.
 *
 * @param options - Terminal, config, and launch options
 */
export async function runPromptTui(options: PromptTuiOptions): Promise<void> {
  const { terminal, config, launchOptions } = options

  intro("agent-panel")

  const agentNames = config.agents.map((a) => a.name).join(", ")
  const count = config.agents.length
  log.info(
    `Will send to ${count} agent${count === 1 ? "" : "s"}: ${agentNames}`
  )

  const prompt = await multiline({
    message: "Enter your prompt:",
    hint: "shift+return for newline · return to submit"
  })

  if (isCancel(prompt)) {
    return
  }

  process.stdout.write(`Launching ${count} agent${count === 1 ? "" : "s"}...\n`)

  const results = await launchAgents(
    terminal,
    config.agents,
    prompt,
    launchOptions
  )

  printResults(results)
  outro("All agents launched.")
}
