import { describe, expect, test } from "bun:test"

import { mergeOptions } from "./options.ts"
import type { CliFlags, ConfigOptions } from "./options.ts"

const DEFAULT_CONFIG: ConfigOptions = {
  layout: "splits",
  preserveActivePane: false
}

const NO_FLAGS: CliFlags = {
  tabs: false,
  preserve: false,

  file: undefined
}

describe("mergeOptions", () => {
  test("returns config defaults when no flags are passed", () => {
    const result = mergeOptions(DEFAULT_CONFIG, NO_FLAGS)

    expect(result).toEqual({
      layout: "splits",
      preserveActivePane: false
    })
  })

  test("--tabs overrides layout to tabs", () => {
    const result = mergeOptions(DEFAULT_CONFIG, {
      tabs: true,
      preserve: false,

      file: undefined
    })

    expect(result.layout).toBe("tabs")
  })

  test("--preserve overrides preserveActivePane to true", () => {
    const result = mergeOptions(DEFAULT_CONFIG, {
      tabs: false,
      preserve: true,

      file: undefined
    })

    expect(result.preserveActivePane).toBe(true)
  })

  test("both flags override both options", () => {
    const result = mergeOptions(DEFAULT_CONFIG, {
      tabs: true,
      preserve: true,

      file: undefined
    })

    expect(result).toEqual({
      layout: "tabs",
      preserveActivePane: true
    })
  })

  test("config with tabs layout is preserved when --tabs not passed", () => {
    const config: ConfigOptions = { layout: "tabs", preserveActivePane: true }
    const result = mergeOptions(config, NO_FLAGS)

    expect(result).toEqual({
      layout: "tabs",
      preserveActivePane: true
    })
  })

  test("--tabs has no effect when config already uses tabs", () => {
    const config: ConfigOptions = { layout: "tabs", preserveActivePane: false }
    const result = mergeOptions(config, {
      tabs: true,
      preserve: false,

      file: undefined
    })

    expect(result.layout).toBe("tabs")
  })
})
