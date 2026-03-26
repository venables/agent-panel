import { describe, expect, test } from "bun:test"

import type { KnownAgent } from "../agents/known-agents.ts"
import type { KnownCommand } from "../agents/known-commands.ts"
import { stripJsonc } from "./config.ts"
import { generateConfig } from "./generate-config.ts"

const AGENT_CLAUDE: KnownAgent = {
  name: "claude",
  label: "Claude Code",
  binary: "claude",
  command: "claude {{prompt}}"
}

const AGENT_CODEX: KnownAgent = {
  name: "codex",
  label: "Codex",
  binary: "codex",
  command: "codex {{prompt}}"
}

const CMD_REVIEW: KnownCommand = {
  name: "review",
  description: "Code review",
  prompt: "Review PR {{arg}}.",
  promptNoArg: "Review all changes."
}

const CMD_FIX: KnownCommand = {
  name: "fix",
  description: "Fix a bug",
  prompt: "Fix issue {{arg}}.",
  requiresArg: true
}

describe("generateConfig", () => {
  test("generates valid JSON when stripped of comments", () => {
    const content = generateConfig({
      agents: [AGENT_CLAUDE, AGENT_CODEX],
      commands: [CMD_REVIEW]
    })

    const json = JSON.parse(stripJsonc(content))
    expect(json.agents).toHaveLength(2)
    expect(json.agents[0].name).toBe("claude")
    expect(json.agents[1].name).toBe("codex")
  })

  test("includes selected commands", () => {
    const content = generateConfig({
      agents: [AGENT_CLAUDE],
      commands: [CMD_REVIEW, CMD_FIX]
    })

    const json = JSON.parse(stripJsonc(content))
    expect(json.commands.review.prompt).toBe("Review PR {{arg}}.")
    expect(json.commands.review.promptNoArg).toBe("Review all changes.")
    expect(json.commands.fix.requiresArg).toBe(true)
  })

  test("handles empty commands", () => {
    const content = generateConfig({
      agents: [AGENT_CLAUDE],
      commands: []
    })

    const json = JSON.parse(stripJsonc(content))
    expect(json.commands).toEqual({})
  })

  test("includes schema reference", () => {
    const content = generateConfig({
      agents: [AGENT_CLAUDE],
      commands: []
    })

    const json = JSON.parse(stripJsonc(content))
    expect(json.$schema).toBeDefined()
  })

  test("includes default options", () => {
    const content = generateConfig({
      agents: [AGENT_CLAUDE],
      commands: []
    })

    const json = JSON.parse(stripJsonc(content))
    expect(json.options.layout).toBe("splits")
    expect(json.options.preserveActivePane).toBe(false)
  })
})
