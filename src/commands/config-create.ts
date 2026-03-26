/**
 * Handles the `panel config create` command.
 *
 * Runs an interactive wizard to detect installed agents, let the user
 * select which agents and commands to include, then writes the config.
 */

import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

import * as p from "@clack/prompts"

import { isInstalled } from "../agents/detect.ts"
import {
  KNOWN_AGENTS,
  type KnownAgent,
  SPLIT_PANE_WARN_THRESHOLD
} from "../agents/known-agents.ts"
import { KNOWN_COMMANDS } from "../agents/known-commands.ts"
import { configExists, configPath } from "../config/config.ts"
import { generateConfig } from "../config/generate-config.ts"

/** Agent paired with its detection result. */
interface DetectedAgent {
  readonly agent: KnownAgent
  readonly installed: boolean
}

/**
 * Detects which known agents are installed on the system.
 *
 * @returns Each known agent paired with whether it was found on PATH
 */
async function detectAgents(): Promise<readonly DetectedAgent[]> {
  const results = await Promise.all(
    KNOWN_AGENTS.map(async (agent) => ({
      agent,
      installed: await isInstalled(agent.binary)
    }))
  )
  return results
}

/**
 * Runs the interactive config creation wizard.
 *
 * @returns The generated config content string, or undefined if cancelled
 */
export async function runWizard(): Promise<string | undefined> {
  p.intro("agent-panel setup")

  const s = p.spinner()
  s.start("Detecting installed agents")
  const detected = await detectAgents()
  const installedCount = detected.filter((d) => d.installed).length
  s.stop(
    `Found ${installedCount} installed agent${installedCount === 1 ? "" : "s"}`
  )

  const installedNames = detected
    .filter((d) => d.installed)
    .map((d) => d.agent.name)

  const selectedAgents = await p.multiselect({
    message: "Which agents do you want to use?",
    options: detected.map((d) => ({
      value: d.agent.name,
      label: d.agent.label,
      hint: d.installed ? "installed" : undefined
    })),
    initialValues: installedNames,
    required: true
  })

  if (p.isCancel(selectedAgents)) {
    p.cancel("Setup cancelled.")
    return undefined
  }

  if (selectedAgents.length > SPLIT_PANE_WARN_THRESHOLD) {
    p.log.warn(
      `${selectedAgents.length} agents selected -- split panes may be cramped. Consider using --tabs mode.`
    )
  }

  const selectedCommands = await p.multiselect({
    message: "Include any pre-configured commands?",
    options: KNOWN_COMMANDS.map((cmd) => ({
      value: cmd.name,
      label: cmd.name,
      hint: cmd.description
    })),
    initialValues: KNOWN_COMMANDS.map((cmd) => cmd.name),
    required: false
  })

  if (p.isCancel(selectedCommands)) {
    p.cancel("Setup cancelled.")
    return undefined
  }

  const agents = KNOWN_AGENTS.filter((a) => selectedAgents.includes(a.name))
  const commands = KNOWN_COMMANDS.filter((c) =>
    selectedCommands.includes(c.name)
  )

  return generateConfig({ agents, commands })
}

/**
 * Creates the config file with the given content.
 *
 * @param content - The JSONC config content to write
 * @returns The path to the created config file
 */
export async function createConfig(content: string): Promise<string> {
  const path = configPath()

  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content, "utf-8")

  return path
}

/**
 * CLI handler for `panel config create`. Errors if the config already exists.
 */
export async function init(): Promise<void> {
  if (await configExists()) {
    const path = configPath()
    process.stderr.write(`Config already exists: ${path}\n`)
    process.stderr.write("Delete it first if you want to regenerate.\n")
    process.exit(1)
  }

  const content = await runWizard()
  if (!content) {
    return
  }

  const path = await createConfig(content)
  p.outro(`Config created: ${path}`)
}
