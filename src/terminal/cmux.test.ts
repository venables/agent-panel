import { describe, expect, test } from "bun:test"
import { execFileSync } from "node:child_process"

import { createCmuxTerminal } from "./cmux.ts"

function hasCmux(): boolean {
  try {
    execFileSync("which", ["cmux"])
    return true
  } catch {
    return false
  }
}

test("cmux terminal has correct name and current pane", () => {
  const terminal = createCmuxTerminal("test-surface")
  expect(terminal.name).toBe("cmux")
  expect(terminal.currentPane().id).toBe("test-surface")
})

describe.skipIf(hasCmux())("cmux without binary", () => {
  test("createSplit fails", async () => {
    const terminal = createCmuxTerminal("test-surface")
    await expect(terminal.createSplit()).rejects.toThrow(/cmux|ENOENT/)
  })

  test("createTab fails", async () => {
    const terminal = createCmuxTerminal("test-surface")
    await expect(terminal.createTab()).rejects.toThrow(/cmux|ENOENT/)
  })

  test("sendText fails", async () => {
    const terminal = createCmuxTerminal("test-surface")
    await expect(terminal.sendText({ id: "1" }, "hello")).rejects.toThrow(
      /cmux|ENOENT/
    )
  })

  test("sendKey fails", async () => {
    const terminal = createCmuxTerminal("test-surface")
    await expect(terminal.sendKey({ id: "1" }, "enter")).rejects.toThrow(
      /cmux|ENOENT/
    )
  })
})
