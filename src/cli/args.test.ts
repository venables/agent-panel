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

  test("skips value after a known string flag (--long)", () => {
    const flags = [{ long: "file", short: "f" }]
    expect(extractWords(["ask", "--file", "prompt.md"], flags)).toEqual(["ask"])
  })

  test("skips value after a known string flag (-short)", () => {
    const flags = [{ long: "file", short: "f" }]
    expect(extractWords(["review", "-f", "prompt.md"], flags)).toEqual([
      "review"
    ])
  })

  test("skips string flag value mixed with other args", () => {
    const flags = [{ long: "file", short: "f" }]
    expect(
      extractWords(["ask", "--file", "prompt.md", "--tabs", "extra"], flags)
    ).toEqual(["ask", "extra"])
  })

  test("handles string flag with no short alias", () => {
    const flags = [{ long: "output", short: undefined }]
    expect(extractWords(["build", "--output", "dist"], flags)).toEqual([
      "build"
    ])
  })
})
