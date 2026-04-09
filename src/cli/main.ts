/**
 * Root CLI command definition using citty.
 *
 * Routes to config subcommands, configured commands, or raw prompts.
 * Does NOT use citty subCommands (which throw on unknown first words)
 * — instead routes manually to support catch-all prompt mode.
 */

import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

import { defineCommand } from "citty"

import { printUsage } from "../commands/command-list.ts"
import { createConfig, init, runWizard } from "../commands/config-create.ts"
import { deleteConfig } from "../commands/config-delete.ts"
import { editConfig } from "../commands/config-edit.ts"
import { launchCommand } from "../commands/launch.ts"
import type { LaunchResult } from "../commands/launch.ts"
import { configExists, loadConfig } from "../config/config.ts"
import { detectTerminal } from "../terminal/index.ts"
import { runPromptTui } from "../tui/prompt-tui.ts"
import { assertNoDashDash, extractWords } from "./args.ts"
import type { CliFlags } from "./options.ts"
import { launchFlags, mergeOptions, STRING_FLAGS } from "./options.ts"
import { resolveRoute } from "./route.ts"
import { VERSION } from "./version.ts"

/**
 * Reads a prompt from a file path, if provided.
 *
 * @param filePath - Path to read, or undefined if not provided
 * @returns The file contents trimmed, or undefined if no path given
 */
async function readPromptFile(
  filePath: string | undefined
): Promise<string | undefined> {
  if (!filePath) {
    return undefined
  }

  const resolved = resolve(filePath)
  const content = await readFile(resolved, "utf-8")
  const prompt = content.trim()

  if (prompt.length === 0) {
    throw new Error(`File is empty: ${resolved}`)
  }

  return prompt
}

function printResults(results: readonly LaunchResult[]): void {
  for (const result of results) {
    process.stdout.write(`  ${result.agent.name} -> ${result.pane.id}\n`)
  }
  process.stdout.write("All agents launched.\n")
}

/**
 * Ensures a config file exists, prompting to create one if missing.
 *
 * @returns True if config is available, false if user declined creation
 */
async function ensureConfig(): Promise<boolean> {
  if (await configExists()) {
    return true
  }

  const content = await runWizard()
  if (!content) {
    process.stderr.write(
      "Run 'panel config create' when you're ready to set up.\n"
    )
    return false
  }

  await createConfig(content)
  return true
}

export const main = defineCommand({
  meta: {
    name: "panel",
    version: VERSION,
    description:
      "Launch multiple AI coding agents in parallel terminal splits or tabs."
  },
  args: {
    ...launchFlags
  },
  async run({ rawArgs, args }) {
    // Fail loudly on `--` instead of silently dropping it. Earlier versions
    // treated it as a raw-prompt escape; that shortcut is gone now and we
    // don't want `panel -- review 429` to silently run the configured
    // `review` command with arg `429`.
    assertNoDashDash(rawArgs)

    const flags: CliFlags = {
      tabs: Boolean(args.tabs),
      preserve: Boolean(args.preserve),
      file: typeof args.file === "string" ? args.file : undefined,
      message: typeof args.message === "string" ? args.message : undefined
    }

    // Config commands don't need a loaded config
    // Try to resolve route with empty command names first for config/help
    const words = extractWords(rawArgs, STRING_FLAGS)

    if (words[0] === "config") {
      const route = resolveRoute(rawArgs, flags, [])

      if (route.type !== "config") {
        throw new Error("Unexpected route type for config command")
      }

      switch (route.action) {
        case "create":
          await init()
          return
        case "edit":
          await editConfig()
          return
        case "delete":
          await deleteConfig()
          return
      }
    }

    // -m / --message: non-interactive shortcut that sends a prompt directly
    // to all agents via the "ask" command. Takes precedence over positional
    // routing so scripts can use `panel -m "..."` without worrying about
    // whether the message collides with a configured command name.
    if (flags.message !== undefined) {
      if (flags.file !== undefined) {
        throw new Error("Cannot use --message with --file")
      }

      if (!(await ensureConfig())) {
        process.exit(1)
      }

      const config = await loadConfig()
      const options = mergeOptions(config.options, flags)
      process.stdout.write(
        `Launching ${config.agents.length} agents: ${flags.message}\n`
      )

      const results = await launchCommand(
        detectTerminal().terminal,
        config,
        "ask",
        flags.message,
        options
      )
      printResults(results)
      return
    }

    if (words.length === 0) {
      // Non-interactive context (piped stdin, CI, etc.): fall back to
      // printing usage instead of trying to open a TUI that would hang.
      if (!process.stdin.isTTY) {
        await printUsage()
        return
      }

      if (!(await ensureConfig())) {
        process.exit(1)
      }

      const config = await loadConfig()
      const launchOptions = mergeOptions(config.options, flags)
      const terminal = detectTerminal().terminal

      await runPromptTui({ terminal, config, launchOptions })
      return
    }

    // All other routes require a config
    if (!(await ensureConfig())) {
      process.exit(1)
    }

    const config = await loadConfig()
    const commandNames = Object.keys(config.commands)
    const route = resolveRoute(rawArgs, flags, commandNames)

    if (route.type === "command") {
      const fileArg = await readPromptFile(flags.file)
      if (fileArg && route.arg) {
        throw new Error("Cannot use --file with positional arguments")
      }

      const arg = route.arg ?? fileArg
      const options = mergeOptions(config.options, route.flags)
      const description = arg ? `${route.name} ${arg}` : route.name
      process.stdout.write(
        `Launching ${config.agents.length} agents: ${description}\n`
      )

      const results = await launchCommand(
        detectTerminal().terminal,
        config,
        route.name,
        arg,
        options
      )
      printResults(results)
      return
    }

    if (route.type === "unknown") {
      const available = commandNames.join(", ")
      process.stderr.write(
        `Unknown command: "${route.word}". Available: ${available}\n`
      )
      process.stderr.write("Use 'panel ask <prompt>' to send a raw prompt.\n")
      process.exit(1)
    }

    // help — show usage
    await printUsage()
  }
})
