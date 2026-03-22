import { describe, expect, test } from "bun:test"

import { createGhosttyTerminal } from "./ghostty.ts"

test("ghostty terminal has correct name and current pane", () => {
  const terminal = createGhosttyTerminal()
  expect(terminal.name).toBe("ghostty")
  expect(terminal.currentPane().id).toBe("__CURRENT__")
})

describe.skipIf(process.platform === "darwin")(
  "ghostty without osascript",
  () => {
    test("createSplit fails", async () => {
      const terminal = createGhosttyTerminal()
      await expect(terminal.createSplit()).rejects.toThrow(
        /osascript|failed|Ghostty/
      )
    })

    test("sendText fails", async () => {
      const terminal = createGhosttyTerminal()
      await expect(terminal.sendText({ id: "1" }, "hello")).rejects.toThrow(
        /osascript|failed|Ghostty/
      )
    })

    test("sendKey fails", async () => {
      const terminal = createGhosttyTerminal()
      await expect(terminal.sendKey({ id: "1" }, "enter")).rejects.toThrow(
        /osascript|failed|Ghostty/
      )
    })
  }
)
