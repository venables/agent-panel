import { expect, test } from "vitest"

import { createCmuxTerminal } from "./cmux.ts"

test("cmux terminal has correct name and current pane", () => {
  const terminal = createCmuxTerminal("test-surface")
  expect(terminal.name).toBe("cmux")
  expect(terminal.currentPane().id).toBe("test-surface")
})

test("cmux createSplit fails without cmux binary", async () => {
  const terminal = createCmuxTerminal("test-surface")
  await expect(terminal.createSplit()).rejects.toThrow(/cmux|ENOENT/)
})

test("cmux sendText fails without cmux binary", async () => {
  const terminal = createCmuxTerminal("test-surface")
  await expect(terminal.sendText({ id: "1" }, "hello")).rejects.toThrow(
    /cmux|ENOENT/
  )
})

test("cmux sendKey fails without cmux binary", async () => {
  const terminal = createCmuxTerminal("test-surface")
  await expect(terminal.sendKey({ id: "1" }, "enter")).rejects.toThrow(
    /cmux|ENOENT/
  )
})
