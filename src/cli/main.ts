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
import type { LaunchResult } from "../commands/launch.ts"
import { configExists, loadConfig } from "../config/config.ts"
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

export const main = defineCommand({
  meta: {
    name: "panel",
    version: __VERSION__,
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
      const options = mergeOptions(config.options, route.flags)
      const description = route.arg ? `${route.name} ${route.arg}` : route.name
      process.stdout.write(
        `Launching ${config.agents.length} agents: ${description}\n`
      )

      const results = await launchCommand(
        detectTerminal().terminal,
        config,
        route.name,
        route.arg,
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
