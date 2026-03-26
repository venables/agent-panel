import { describe, expect, test } from "bun:test"

import { KNOWN_AGENTS, SPLIT_PANE_WARN_THRESHOLD } from "./known-agents.ts"

describe("KNOWN_AGENTS", () => {
  test("is not empty", () => {
    expect(KNOWN_AGENTS.length).toBeGreaterThan(0)
  })

  test("every agent has a {{prompt}} placeholder in command", () => {
    for (const agent of KNOWN_AGENTS) {
      expect(agent.command).toContain("{{prompt}}")
    }
  })

  test("every agent has a unique name", () => {
    const names = KNOWN_AGENTS.map((a) => a.name)
    expect(new Set(names).size).toBe(names.length)
  })

  test("every agent has a non-empty label", () => {
    for (const agent of KNOWN_AGENTS) {
      expect(agent.label.length).toBeGreaterThan(0)
    }
  })

  test("primary agents are listed first in canonical order", () => {
    expect(KNOWN_AGENTS[0]!.name).toBe("claude")
    expect(KNOWN_AGENTS[1]!.name).toBe("codex")
    expect(KNOWN_AGENTS[2]!.name).toBe("opencode")
  })

  test("split pane warn threshold is a positive number", () => {
    expect(SPLIT_PANE_WARN_THRESHOLD).toBeGreaterThan(0)
  })
})
