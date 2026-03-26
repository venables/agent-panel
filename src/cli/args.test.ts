import { describe, expect, test } from "bun:test"

import { extractWords } from "./args.ts"

describe("extractWords", () => {
  test("returns all words when no flags present", () => {
    expect(extractWords(["build", "an", "app"])).toEqual(["build", "an", "app"])
  })

  test("filters out boolean flags", () => {
    expect(extractWords(["build", "--tabs", "an", "app"])).toEqual([
      "build",
      "an",
      "app"
    ])
  })

  test("filters out short flags", () => {
    expect(extractWords(["-t", "build", "an", "app"])).toEqual([
      "build",
      "an",
      "app"
    ])
  })

  test("returns empty array for no args", () => {
    expect(extractWords([])).toEqual([])
  })

  test("returns empty array when only flags", () => {
    expect(extractWords(["--tabs", "--preserve"])).toEqual([])
  })

  test("handles mixed flags and words", () => {
    expect(
      extractWords(["run", "review", "123", "--tabs", "--preserve"])
    ).toEqual(["run", "review", "123"])
  })
})
