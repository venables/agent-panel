import { describe, expect, test } from "bun:test"

import { run, shellEscape, sleep } from "./exec.ts"

describe("shellEscape", () => {
  test("wraps simple string in single quotes", () => {
    expect(shellEscape("hello")).toBe("'hello'")
  })

  test("escapes internal single quotes", () => {
    expect(shellEscape("it's")).toBe("'it'\\''s'")
  })

  test("escapes multiple single quotes", () => {
    expect(shellEscape("it's a 'test'")).toBe("'it'\\''s a '\\''test'\\'''")
  })

  test("prevents $() expansion", () => {
    expect(shellEscape("$(whoami)")).toBe("'$(whoami)'")
  })

  test("prevents backtick expansion", () => {
    expect(shellEscape("`rm -rf ~`")).toBe("'`rm -rf ~`'")
  })

  test("handles empty string", () => {
    expect(shellEscape("")).toBe("''")
  })

  test("preserves spaces and special characters", () => {
    expect(shellEscape("a b\tc\nd")).toBe("'a b\tc\nd'")
  })
})

describe("run", () => {
  test("executes a command and returns stdout", async () => {
    const result = await run("echo", ["hello"])
    expect(result.trim()).toBe("hello")
  })

  test("throws on error", async () => {
    await expect(run("false", [])).rejects.toThrow(/failed/)
  })
})

test("sleep waits for a duration", async () => {
  const start = Date.now()
  await sleep(10)
  const end = Date.now()
  expect(end - start).toBeGreaterThanOrEqual(9)
})
