import { describe, expect, test } from "bun:test"

import { assertNoDashDash, DASH_DASH_ERROR, extractWords } from "./args.ts"

describe("assertNoDashDash", () => {
  test("does nothing when -- is absent", () => {
    expect(() => assertNoDashDash([])).not.toThrow()
    expect(() => assertNoDashDash(["review", "123"])).not.toThrow()
    expect(() => assertNoDashDash(["ask", "foo", "--tabs"])).not.toThrow()
    expect(() => assertNoDashDash(["-m", "hello"])).not.toThrow()
  })

  test("throws with the documented error on bare --", () => {
    expect(() => assertNoDashDash(["--"])).toThrow(DASH_DASH_ERROR)
  })

  test("throws on panel -- <command> <arg> (the old escape hatch)", () => {
    expect(() => assertNoDashDash(["--", "review", "429"])).toThrow(
      DASH_DASH_ERROR
    )
  })

  test("throws when -- appears after other args", () => {
    expect(() => assertNoDashDash(["ask", "--", "foo"])).toThrow(
      DASH_DASH_ERROR
    )
  })

  test("throws when -- is mixed with real flags", () => {
    expect(() => assertNoDashDash(["--tabs", "--", "hello"])).toThrow(
      DASH_DASH_ERROR
    )
  })

  test("does not throw on tokens that only contain --", () => {
    // "--foo" is a flag, not a bare --
    expect(() => assertNoDashDash(["--foo", "bar"])).not.toThrow()
    // "x--y" is a positional with dashes inside
    expect(() => assertNoDashDash(["x--y"])).not.toThrow()
  })

  test("error message points users at the real alternatives", () => {
    expect(DASH_DASH_ERROR).toContain("'panel ask <prompt>'")
    expect(DASH_DASH_ERROR).toContain("'panel --message <prompt>'")
  })
})

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
