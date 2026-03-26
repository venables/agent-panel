import { describe, expect, test } from "bun:test"

import { isInstalled } from "./detect.ts"

describe("isInstalled", () => {
  test("returns true for a binary that exists", async () => {
    const result = await isInstalled("node")
    expect(result).toBe(true)
  })

  test("returns false for a binary that does not exist", async () => {
    const result = await isInstalled("__nonexistent_binary_xyz__")
    expect(result).toBe(false)
  })
})
