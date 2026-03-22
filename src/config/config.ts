/**
 * Configuration schema and loading for panel.
 *
 * Config file: ~/.config/agent-panel/config.jsonc
 */

import { readFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

import { z } from "zod"

import { shellEscape } from "../utils/exec.ts"

const APP_NAME = "agent-panel"

/** Schema for a single agent. */
const AgentSchema = z.object({
  name: z.string(),
  command: z
    .string()
    .refine((cmd) => cmd.includes("{{prompt}}"), {
      message: "Agent command must include a {{prompt}} placeholder"
    })
    .describe("Shell command template with {{prompt}} placeholder")
})

/** Schema for a single command definition. */
const CommandSchema = z
  .object({
    prompt: z
      .string()
      .describe("Prompt template with optional {{arg}} placeholder"),
    promptNoArg: z
      .string()
      .optional()
      .describe("Fallback prompt when no arg is given"),
    requiresArg: z.boolean().optional().default(false)
  })
  .refine(
    (cmd) => !cmd.requiresArg || cmd.prompt.includes("{{arg}}"),
    "Command with requiresArg must include {{arg}} in prompt"
  )

/** Schema for behavioral options. */
const OptionsSchema = z.object({
  preserveActivePane: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "If true, all agents get new splits and the current pane is left alone."
    )
})

/** Schema for the full config file. */
const ConfigSchema = z.object({
  $schema: z.string().optional(),
  agents: z.array(AgentSchema).min(1),
  commands: z.record(z.string(), CommandSchema),
  options: OptionsSchema.optional().default({ preserveActivePane: false })
})

export type AgentConfig = z.infer<typeof AgentSchema>
export type CommandConfig = z.infer<typeof CommandSchema>
export type Config = z.infer<typeof ConfigSchema>

/** Returns the path to the config file, respecting XDG_CONFIG_HOME. */
export function configPath(): string {
  const configHome =
    process.env["XDG_CONFIG_HOME"] || join(homedir(), ".config")
  return join(configHome, APP_NAME, "config.jsonc")
}

/**
 * Strips single-line // comments and trailing commas from JSONC.
 *
 * Handles // inside quoted strings correctly by walking char-by-char.
 *
 * @param input - JSONC string
 * @returns Valid JSON string
 */
export function stripJsonc(input: string): string {
  let result = ""
  let inString = false
  let i = 0

  while (i < input.length) {
    const ch = input[i]!

    if (inString) {
      result += ch
      if (ch === "\\" && i + 1 < input.length) {
        result += input[i + 1]!
        i += 2
        continue
      }
      if (ch === '"') {
        inString = false
      }
      i++
      continue
    }

    if (ch === '"') {
      inString = true
      result += ch
      i++
      continue
    }

    if (ch === "/" && i + 1 < input.length && input[i + 1] === "/") {
      while (i < input.length && input[i] !== "\n") {
        i++
      }
      continue
    }

    if (!inString && (ch === "}" || ch === "]")) {
      let j = result.length - 1
      while (j >= 0 && /\s/.test(result[j]!)) {
        j--
      }
      if (j >= 0 && result[j] === ",") {
        result = result.slice(0, j) + result.slice(j + 1)
      }
    }

    result += ch
    i++
  }

  return result
}

/**
 * Loads and validates the config file.
 *
 * @returns The validated config
 * @throws If the file is missing, invalid JSON, or fails schema validation
 */
export async function loadConfig(): Promise<Config> {
  const path = configPath()

  let raw: string
  try {
    raw = await readFile(path, "utf-8")
  } catch {
    throw new Error(
      `Config file not found: ${path}\nRun 'panel config:create' to create a default config.`
    )
  }

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
    if (command.promptNoArg !== undefined) {
      return command.promptNoArg
    }
    return command.prompt.replaceAll(" {{arg}}", "").replaceAll("{{arg}}", "")
  }

  return command.prompt.replaceAll("{{arg}}", arg)
}

/**
 * Resolves the full shell command for an agent given a prompt.
 *
 * The prompt is shell-escaped (single-quoted) before substitution to prevent
 * shell expansion of $(), backticks, and other metacharacters.
 *
 * @param agent - The agent config
 * @param prompt - The resolved prompt string
 * @returns The shell command to execute
 */
export function resolveAgentCommand(
  agent: AgentConfig,
  prompt: string
): string {
  return agent.command.replaceAll("{{prompt}}", shellEscape(prompt))
}
