import { expect, test } from "vitest"

import { run, sleep } from "./exec.ts"

test("run executes a command and returns stdout", async () => {
  const result = await run("echo", ["hello"])
  expect(result.trim()).toBe("hello")
})

test("run throws on error", async () => {
  await expect(run("false", [])).rejects.toThrow(/failed/)
})

test("sleep waits for a duration", async () => {
  const start = Date.now()
  await sleep(10)
  const end = Date.now()
  expect(end - start).toBeGreaterThanOrEqual(9)
})
