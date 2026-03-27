import { describe, expect, test } from "bun:test"

import { resolvePrepareCommand, runPrepare } from "./prepare.ts"

describe("resolvePrepareCommand", () => {
  test("substitutes {{arg}} when arg is provided", () => {
    expect(
      resolvePrepareCommand(
        "resolve-repo.sh {{arg}}",
        "https://github.com/a/b/pull/1"
      )
    ).toBe("resolve-repo.sh https://github.com/a/b/pull/1")
  })

  test("strips {{arg}} placeholder when no arg", () => {
    expect(resolvePrepareCommand("resolve-repo.sh {{arg}}", undefined)).toBe(
      "resolve-repo.sh"
    )
  })

  test("strips ' {{arg}}' with leading space when no arg", () => {
    expect(resolvePrepareCommand("script {{arg}}", undefined)).toBe("script")
  })

  test("substitutes multiple {{arg}} placeholders", () => {
    expect(resolvePrepareCommand("echo {{arg}} {{arg}}", "hi")).toBe(
      "echo hi hi"
    )
  })

  test("returns template as-is when no placeholder and no arg", () => {
    expect(resolvePrepareCommand("just-a-script.sh", undefined)).toBe(
      "just-a-script.sh"
    )
  })
})

describe("runPrepare", () => {
  test("returns empty result when script produces no output", async () => {
    const result = await runPrepare("printf ''", undefined)
    expect(result).toEqual({ workdir: undefined, arg: undefined })
  })

  test("parses workdir from JSON output", async () => {
    const result = await runPrepare(
      'echo \'{"workdir": "/tmp/test-dir"}\'',
      undefined
    )
    expect(result).toEqual({ workdir: "/tmp/test-dir", arg: undefined })
  })

  test("parses arg override from JSON output", async () => {
    const result = await runPrepare(
      'echo \'{"arg": "modified-arg"}\'',
      undefined
    )
    expect(result).toEqual({ workdir: undefined, arg: "modified-arg" })
  })

  test("parses both workdir and arg from JSON output", async () => {
    const result = await runPrepare(
      'echo \'{"workdir": "/tmp/review", "arg": "#42"}\'',
      undefined
    )
    expect(result).toEqual({ workdir: "/tmp/review", arg: "#42" })
  })

  test("substitutes arg into prepare command", async () => {
    const result = await runPrepare('echo \'{"arg": "{{arg}}"}\'', "hello")
    expect(result).toEqual({ workdir: undefined, arg: "hello" })
  })

  test("throws on non-zero exit", async () => {
    await expect(runPrepare("exit 1", undefined)).rejects.toThrow(
      "Prepare command failed"
    )
  })

  test("throws on invalid JSON output", async () => {
    await expect(runPrepare("echo 'not json'", undefined)).rejects.toThrow(
      "not valid JSON"
    )
  })

  test("throws on unexpected fields in JSON output", async () => {
    await expect(
      runPrepare("echo '{\"unexpected\": true}'", undefined)
    ).rejects.toThrow("failed validation")
  })
})
