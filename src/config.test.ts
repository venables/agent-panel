import { describe, expect, test } from "bun:test"

import {
  resolveAgentCommand,
  resolveCommandPrompt,
  stripJsonc
} from "./config.ts"

describe("stripJsonc", () => {
  test("strips single-line comments", () => {
    const input = `{
  // this is a comment
  "key": "value"
}`
    expect(JSON.parse(stripJsonc(input))).toEqual({ key: "value" })
  })

  test("strips trailing commas", () => {
    const input = `{ "a": 1, "b": 2, }`
    expect(JSON.parse(stripJsonc(input))).toEqual({ a: 1, b: 2 })
  })

  test("preserves // inside string values", () => {
    const input = `{ "url": "https://github.com/foo/bar" }`
    expect(JSON.parse(stripJsonc(input))).toEqual({
      url: "https://github.com/foo/bar"
    })
  })

  test("preserves // inside string values with trailing comment", () => {
    const input = `{
  "url": "https://example.com" // a comment
}`
    expect(JSON.parse(stripJsonc(input))).toEqual({
      url: "https://example.com"
    })
  })

  test("handles escaped quotes inside strings", () => {
    const input = `{ "cmd": "echo \\"hello\\"" }`
    expect(JSON.parse(stripJsonc(input))).toEqual({ cmd: 'echo "hello"' })
  })

  test("handles empty input", () => {
    expect(stripJsonc("")).toBe("")
  })

  test("strips trailing commas in arrays", () => {
    const input = `{ "items": [1, 2, 3,] }`
    expect(JSON.parse(stripJsonc(input))).toEqual({ items: [1, 2, 3] })
  })

  test("preserves commas inside strings followed by a bracket", () => {
    const input = `{ "key": "value, }" }`
    expect(JSON.parse(stripJsonc(input))).toEqual({ key: "value, }" })
  })
})

describe("resolveCommandPrompt", () => {
  test("substitutes {{arg}} when arg is provided", () => {
    const command = { prompt: "Review PR {{arg}}.", requiresArg: false }
    expect(resolveCommandPrompt(command, "123")).toBe("Review PR 123.")
  })

  test("uses promptNoArg when no arg and promptNoArg exists", () => {
    const command = {
      prompt: "Review PR {{arg}}.",
      promptNoArg: "Review current branch.",
      requiresArg: false
    }
    expect(resolveCommandPrompt(command, undefined)).toBe(
      "Review current branch."
    )
  })

  test("strips {{arg}} placeholder when no arg and no promptNoArg", () => {
    const command = {
      prompt: "Review {{arg}} in this codebase.",
      requiresArg: false
    }
    expect(resolveCommandPrompt(command, undefined)).toBe(
      "Review in this codebase."
    )
  })

  test("strips ' {{arg}}' with leading space when no arg", () => {
    const command = { prompt: "Review PR {{arg}}.", requiresArg: false }
    expect(resolveCommandPrompt(command, undefined)).toBe("Review PR.")
  })

  test("substitutes multiple {{arg}} placeholders", () => {
    const command = {
      prompt: "Fix {{arg}} because {{arg}} is broken.",
      requiresArg: false
    }
    expect(resolveCommandPrompt(command, "it")).toBe(
      "Fix it because it is broken."
    )
  })

  test("strips multiple {{arg}} placeholders when no arg", () => {
    const command = { prompt: "Fix {{arg}} and {{arg}}.", requiresArg: false }
    expect(resolveCommandPrompt(command, undefined)).toBe("Fix and.")
  })

  test("throws when arg is required but not provided", () => {
    const command = {
      prompt: "Fix issue {{arg}}.",
      requiresArg: true
    }
    expect(() => resolveCommandPrompt(command, undefined)).toThrow(
      "This command requires an argument."
    )
  })
})

describe("resolveAgentCommand", () => {
  test("substitutes {{prompt}} with shell-escaped value", () => {
    const agent = { name: "claude", command: "claude {{prompt}}" }
    expect(resolveAgentCommand(agent, "Hello world")).toBe(
      "claude 'Hello world'"
    )
  })

  test("escapes shell metacharacters in prompt", () => {
    const agent = { name: "claude", command: "claude {{prompt}}" }
    expect(resolveAgentCommand(agent, "$(rm -rf ~)")).toBe(
      "claude '$(rm -rf ~)'"
    )
  })

  test("escapes single quotes in prompt", () => {
    const agent = { name: "claude", command: "claude {{prompt}}" }
    expect(resolveAgentCommand(agent, "it's a test")).toBe(
      "claude 'it'\\''s a test'"
    )
  })

  test("substitutes multiple {{prompt}} placeholders", () => {
    const agent = {
      name: "claude",
      command: "echo {{prompt}} | claude {{prompt}}"
    }
    expect(resolveAgentCommand(agent, "hello")).toBe(
      "echo 'hello' | claude 'hello'"
    )
  })
})
