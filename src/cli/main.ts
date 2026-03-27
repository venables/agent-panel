/**
 * Root CLI command definition using citty.
 *
 * Routes to config subcommands, configured commands, or raw prompts.
 * Does NOT use citty subCommands (which throw on unknown first words)
 * — instead routes manually to support catch-all prompt mode.
 */

import { defineCommand } from "citty"

import { printUsage } from "../commands/command-list.ts"
import { createConfig, init, runWizard } from "../commands/config-create.ts"
import { deleteConfig } from "../commands/config-delete.ts"
import { editConfig } from "../commands/config-edit.ts"
import { launchAgents, launchCommand } from "../commands/launch.ts"
import type { LaunchOptions, LaunchResult } from "../commands/launch.ts"
import { runPrepare } from "../commands/prepare.ts"
import type { PrepareResult } from "../commands/prepare.ts"
import { configExists, loadConfig } from "../config/config.ts"
import type { CommandConfig } from "../config/config.ts"
import { detectTerminal } from "../terminal/index.ts"
import type { CliFlags } from "./options.ts"
import { launchFlags, mergeOptions } from "./options.ts"
import { resolveRoute } from "./route.ts"

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

const NO_OVERRIDES: PrepareResult = { workdir: undefined, arg: undefined }

/**
 * Runs the prepare script for a command if one is configured.
 *
 * @param command - The command config (may be undefined for unknown commands)
 * @param arg - The command argument
 * @returns Overrides from the prepare script, or empty defaults
 */
async function maybePrepare(
  command: CommandConfig | undefined,
  arg: string | undefined
): Promise<PrepareResult> {
  if (!command?.prepare) {
    return NO_OVERRIDES
  }

  process.stdout.write(`Running prepare: ${command.prepare}\n`)
  return runPrepare(command.prepare, arg)
}

export const main = defineCommand({
  meta: {
    name: "panel",
    version: "0.2.0",
    description:
      "Launch multiple AI coding agents in parallel terminal splits or tabs."
  },
  args: {
    ...launchFlags
  },
  async run({ rawArgs, args }) {
    const flags: CliFlags = {
      tabs: Boolean(args.tabs),
      preserve: Boolean(args.preserve)
    }

    // Config commands don't need a loaded config
    // Try to resolve route with empty command names first for config/help
    const words = rawArgs.filter((arg: string) => !arg.startsWith("-"))

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

    if (words.length === 0) {
      await printUsage()
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
      const command = config.commands[route.name]
      const prepared = await maybePrepare(command, route.arg)
      const arg = prepared.arg ?? route.arg
      const options: LaunchOptions = {
        ...mergeOptions(config.options, route.flags),
        workdir: prepared.workdir
      }

      const description = arg ? `${route.name} ${arg}` : route.name
      if (prepared.workdir) {
        process.stdout.write(`Prepare: workdir -> ${prepared.workdir}\n`)
      }
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

    if (route.type === "prompt") {
      const options = mergeOptions(config.options, route.flags)
      process.stdout.write(
        `Launching ${config.agents.length} agents: ${route.prompt}\n`
      )

      const results = await launchAgents(
        detectTerminal().terminal,
        config.agents,
        route.prompt,
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
      process.stderr.write("Use 'panel raw <prompt>' to send a raw prompt.\n")
      process.exit(1)
    }

    // help — show usage
    await printUsage()
  }
})
