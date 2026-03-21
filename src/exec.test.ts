import { describe, expect, test } from "bun:test"

import { shellEscape } from "./exec.ts"

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
