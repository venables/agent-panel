/**
 * CLI entry point for review-cli.
 *
 * Usage:
 *   bun run cli [pr-number]
 *
 * With a PR number: agents review that PR.
 * Without arguments: agents review the diff between this branch and main.
 */

import type { ReviewTarget } from "./config.ts"
import { DEFAULT_CONFIG } from "./config.ts"
import { launchAllAgents } from "./launch.ts"
import { detectTerminal } from "./terminal/index.ts"

function parseTarget(args: readonly string[]): ReviewTarget {
  if (args.length > 1) {
    console.error("Usage: review-cli [pr-number]")
    process.exit(1)
  }

  const prNumber = args[0]

  if (prNumber) {
    return { mode: "pr", prNumber }
  }

  return { mode: "diff" }
}

function describeTarget(target: ReviewTarget): string {
  if (target.mode === "pr") {
    return `PR #${target.prNumber}`
  }
  return "current branch vs main"
}

async function main(): Promise<void> {
  const { kind, terminal } = detectTerminal()
  const args = process.argv.slice(2)
  const target = parseTarget(args)

  console.log(
    `[${kind}] Launching ${DEFAULT_CONFIG.agents.length} agents to review ${describeTarget(target)}...`
  )

  const results = await launchAllAgents(terminal, DEFAULT_CONFIG, target)

  for (const result of results) {
    console.log(`  ${result.agent.name} -> ${result.pane.id}`)
  }

  console.log("All agents launched.")
}

main()
