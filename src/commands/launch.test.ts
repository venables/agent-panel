import { describe, expect, test } from "bun:test"

import type { Config } from "../config/config.ts"
import type { PaneHandle, Terminal } from "../terminal/terminal.ts"
import { launchAgents, launchCommand } from "./launch.ts"

/**
 * Creates a fake terminal that records all interactions.
 *
 * Splits produce panes with incrementing IDs ("split-1", "split-2", etc.).
 */
function createFakeTerminal(): Terminal & {
  readonly calls: ReadonlyArray<{ method: string; args: readonly unknown[] }>
} {
  const calls: Array<{ method: string; args: readonly unknown[] }> = []
  let splitCount = 0

  return {
    name: "fake",
    calls,

    currentPane(): PaneHandle {
      return { id: "current" }
    },

    async createSplit(): Promise<PaneHandle> {
      splitCount++
      const pane = { id: `split-${splitCount}` }
      calls.push({ method: "createSplit", args: [] })
      return pane
    },

    async sendText(pane: PaneHandle, text: string): Promise<void> {
      calls.push({ method: "sendText", args: [pane.id, text] })
    },

    async sendKey(pane: PaneHandle, key: string): Promise<void> {
      calls.push({ method: "sendKey", args: [pane.id, key] })
    }
  }
}

const TWO_AGENTS = [
  { name: "claude", command: "claude {{prompt}}" },
  { name: "codex", command: "codex {{prompt}}" }
] as const

describe("launchAgents", () => {
  test("first agent reuses current pane, rest get splits", async () => {
    const terminal = createFakeTerminal()

    const results = await launchAgents(terminal, TWO_AGENTS, "hello")

    expect(results).toHaveLength(2)
    expect(results[0]!.pane.id).toBe("current")
    expect(results[1]!.pane.id).toBe("split-1")
  })

  test("sends resolved command and Enter to each pane", async () => {
    const terminal = createFakeTerminal()

    await launchAgents(terminal, TWO_AGENTS, "hello")

    expect(terminal.calls).toEqual([
      { method: "sendText", args: ["current", "claude 'hello'"] },
      { method: "sendKey", args: ["current", "Enter"] },
      { method: "createSplit", args: [] },
      { method: "sendText", args: ["split-1", "codex 'hello'"] },
      { method: "sendKey", args: ["split-1", "Enter"] }
    ])
  })

  test("returns agent metadata with each result", async () => {
    const terminal = createFakeTerminal()

    const results = await launchAgents(terminal, TWO_AGENTS, "test")

    expect(results[0]!.agent.name).toBe("claude")
    expect(results[1]!.agent.name).toBe("codex")
  })

  test("creates no splits for a single agent", async () => {
    const terminal = createFakeTerminal()
    const singleAgent = [TWO_AGENTS[0]]

    await launchAgents(terminal, singleAgent, "hello")

    const splitCalls = terminal.calls.filter((c) => c.method === "createSplit")
    expect(splitCalls).toHaveLength(0)
  })

  test("creates splits for all agents when preserveActivePane is true", async () => {
    const terminal = createFakeTerminal()

    const results = await launchAgents(terminal, TWO_AGENTS, "hello", {
      preserveActivePane: true
    })

    expect(results).toHaveLength(2)
    expect(results[0]!.pane.id).toBe("split-1")
    expect(results[1]!.pane.id).toBe("split-2")

    const splitCalls = terminal.calls.filter((c) => c.method === "createSplit")
    expect(splitCalls).toHaveLength(2)
  })
})

describe("launchCommand", () => {
  const config: Config = {
    agents: [...TWO_AGENTS],
    commands: {
      review: {
        prompt: "Review PR {{arg}}.",
        promptNoArg: "Review current branch.",
        requiresArg: false
      },
      fix: {
        prompt: "Fix issue {{arg}}.",
        requiresArg: true
      }
    },
    options: { preserveActivePane: false }
  }

  test("resolves command prompt and launches agents", async () => {
    const terminal = createFakeTerminal()

    const results = await launchCommand(terminal, config, "review", "123")

    expect(results).toHaveLength(2)

    const sentTexts = terminal.calls
      .filter((c) => c.method === "sendText")
      .map((c) => c.args[1])

    expect(sentTexts[0]).toBe("claude 'Review PR 123.'")
    expect(sentTexts[1]).toBe("codex 'Review PR 123.'")
  })

  test("uses promptNoArg when no arg provided", async () => {
    const terminal = createFakeTerminal()

    await launchCommand(terminal, config, "review", undefined)

    const sentText = terminal.calls.find((c) => c.method === "sendText")
    expect(sentText!.args[1]).toBe("claude 'Review current branch.'")
  })

  test("throws on unknown command", async () => {
    const terminal = createFakeTerminal()

    await expect(
      launchCommand(terminal, config, "deploy", undefined)
    ).rejects.toThrow('Unknown command: "deploy"')
  })

  test("throws when required arg is missing", async () => {
    const terminal = createFakeTerminal()

    await expect(
      launchCommand(terminal, config, "fix", undefined)
    ).rejects.toThrow("This command requires an argument.")
  })
})
