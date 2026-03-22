import { expect, test } from "bun:test"

import { detectTerminal } from "./detect.ts"

test("detectTerminal finds cmux", () => {
  const oldEnv = process.env["CMUX_SURFACE_ID"]
  process.env["CMUX_SURFACE_ID"] = "123"
  const result = detectTerminal()
  expect(result.kind).toBe("cmux")
  expect(result.terminal.name).toBe("cmux")
  process.env["CMUX_SURFACE_ID"] = oldEnv
})

test("detectTerminal finds ghostty", () => {
  const oldEnv1 = process.env["CMUX_SURFACE_ID"]
  const oldEnv2 = process.env["TERM_PROGRAM"]
  delete process.env["CMUX_SURFACE_ID"]
  process.env["TERM_PROGRAM"] = "ghostty"
  const result = detectTerminal()
  expect(result.kind).toBe("ghostty")
  expect(result.terminal.name).toBe("ghostty")
  process.env["CMUX_SURFACE_ID"] = oldEnv1
  process.env["TERM_PROGRAM"] = oldEnv2
})

test("detectTerminal throws on unsupported", () => {
  const oldEnv1 = process.env["CMUX_SURFACE_ID"]
  const oldEnv2 = process.env["TERM_PROGRAM"]
  delete process.env["CMUX_SURFACE_ID"]
  delete process.env["TERM_PROGRAM"]
  expect(() => detectTerminal()).toThrow(/No supported terminal/)
  process.env["CMUX_SURFACE_ID"] = oldEnv1
  process.env["TERM_PROGRAM"] = oldEnv2
})
