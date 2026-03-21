import { expect, test } from "vitest"

import { createGhosttyTerminal } from "./ghostty.ts"

test("ghostty terminal basic", async () => {
  const terminal = createGhosttyTerminal()
  expect(terminal.name).toBe("ghostty")
  expect(terminal.currentPane().id).toBe("__CURRENT__")

  try {
    await terminal.createSplit()
  } catch (e: any) {
    expect(e.message).toMatch(/osascript|failed|Ghostty/)
  }

  try {
    await terminal.sendText({ id: "1" }, "hello")
  } catch (e: any) {
    expect(e.message).toMatch(/osascript|failed|Ghostty/)
  }

  try {
    await terminal.sendKey({ id: "1" }, "enter")
  } catch (e: any) {
    expect(e.message).toMatch(/osascript|failed|Ghostty/)
  }
})
