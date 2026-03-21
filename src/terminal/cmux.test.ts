import { expect, test } from "vitest"

import { createCmuxTerminal } from "./cmux.ts"

test("createCmuxTerminal", async () => {
  const terminal = createCmuxTerminal("test-surface")
  expect(terminal.name).toBe("cmux")
  expect(terminal.currentPane().id).toBe("test-surface")

  // Try calling createSplit, assuming cmux isn't available in this CI it will throw
  try {
    await terminal.createSplit()
  } catch (e: any) {
    expect(e.message).toMatch(/cmux|ENOENT/)
  }

  try {
    await terminal.sendText({ id: "1" }, "hello")
  } catch (e: any) {
    expect(e.message).toMatch(/cmux|ENOENT/)
  }

  try {
    await terminal.sendKey({ id: "1" }, "enter")
  } catch (e: any) {
    expect(e.message).toMatch(/cmux|ENOENT/)
  }
})
