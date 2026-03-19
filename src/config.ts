/**
 * Configuration schema and loading for council.
 *
 * Config file: ~/.config/council/config.jsonc
 */

import { homedir } from "node:os"
import { join } from "node:path"

import { z } from "zod"

const APP_NAME = "council"

/** Schema for a single agent. */
const AgentSchema = z.object({
  name: z.string(),
  command: z
    .string()
    .describe("Shell command template with {{prompt}} placeholder")
})

/** Schema for a single command definition. */
const CommandSchema = z.object({
  prompt: z
    .string()
    .describe("Prompt template with optional {{arg}} placeholder"),
  promptNoArg: z
    .string()
    .optional()
    .describe("Fallback prompt when no arg is given"),
  requiresArg: z.boolean().optional().default(false)
})

/** Schema for the full config file. */
const ConfigSchema = z.object({
  agents: z.array(AgentSchema).min(1),
  commands: z.record(z.string(), CommandSchema)
})

export type AgentConfig = z.infer<typeof AgentSchema>
export type CommandConfig = z.infer<typeof CommandSchema>
export type Config = z.infer<typeof ConfigSchema>

/** Returns the path to the config file. */
export function configPath(): string {
  return join(homedir(), ".config", APP_NAME, "config.jsonc")
}

/**
 * Strips single-line // comments and trailing commas from JSONC.
 *
 * @param input - JSONC string
 * @returns Valid JSON string
 */
function stripJsonc(input: string): string {
  return input.replace(/\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1")
}

/**
 * Loads and validates the config file.
 *
 * @returns The validated config
 * @throws If the file is missing, invalid JSON, or fails schema validation
 */
export async function loadConfig(): Promise<Config> {
  const path = configPath()
  const file = Bun.file(path)
  const exists = await file.exists()

  if (!exists) {
    throw new Error(
      `Config file not found: ${path}\nRun 'council init' to create a default config.`
    )
  }

  const raw = await file.text()
  const json: unknown = JSON.parse(stripJsonc(raw))
  return ConfigSchema.parse(json)
}

/**
 * Resolves the prompt for a command + optional arg.
 *
 * @param command - The command config
 * @param arg - Optional argument to substitute for {{arg}}
 * @returns The resolved prompt string
 * @throws If arg is required but not provided
 */
export function resolveCommandPrompt(
  command: CommandConfig,
  arg: string | undefined
): string {
  if (!arg) {
    if (command.requiresArg) {
      throw new Error("This command requires an argument.")
    }
    if (command.promptNoArg) {
      return command.promptNoArg
    }
    return command.prompt.replace(" {{arg}}", "").replace("{{arg}}", "")
  }

  return command.prompt.replace("{{arg}}", arg)
}

/**
 * Resolves the full shell command for an agent given a prompt.
 *
 * @param agent - The agent config
 * @param prompt - The resolved prompt string
 * @returns The shell command to execute
 */
export function resolveAgentCommand(
  agent: AgentConfig,
  prompt: string
): string {
  return agent.command.replace("{{prompt}}", prompt)
}

/** Default config written by `council init`. */
export const DEFAULT_CONFIG_CONTENT = `{
  // Agent definitions -- each needs a {{prompt}} placeholder in command
  "agents": [
    { "name": "claude", "command": "claude \\"{{prompt}}\\"" },
    { "name": "codex", "command": "codex \\"{{prompt}}\\"" },
    { "name": "opencode", "command": "opencode --prompt \\"{{prompt}}\\"" }
  ],

  // Commands -- use {{arg}} for the optional argument
  "commands": {
    "review": {
      "prompt": "Review PR {{arg}}. Leave comments in this session and not on the PR itself.",
      "promptNoArg": "Review all changes between this branch and main, including any dirty or unstaged files. Leave comments in this session and not on the PR itself."
    },
    "fix": {
      "prompt": "Fix issue {{arg}}. Implement the fix and show me what you changed.",
      "requiresArg": true
    },
    "explain": {
      "prompt": "Explain {{arg}} in this codebase. Be thorough.",
      "requiresArg": true
    }
  }
}
`
