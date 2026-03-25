import { describe, expect, test } from "bun:test"

import type { CliFlags } from "./options.ts"
import { resolveRoute } from "./route.ts"

const NO_FLAGS: CliFlags = { tabs: false, preserve: false }
const TABS_FLAG: CliFlags = { tabs: true, preserve: false }
const COMMANDS = ["review", "explain", "fix"]

describe("resolveRoute", () => {
  describe("help route", () => {
    test("no args returns help", () => {
      const route = resolveRoute([], NO_FLAGS, COMMANDS)

      expect(route).toEqual({ type: "help" })
    })

    test("only flags returns help", () => {
      const route = resolveRoute(["--tabs"], NO_FLAGS, COMMANDS)

      expect(route).toEqual({ type: "help" })
    })
  })

  describe("config routes", () => {
    test("config create", () => {
      const route = resolveRoute(["config", "create"], NO_FLAGS, COMMANDS)

      expect(route).toEqual({ type: "config", action: "create" })
    })

    test("config edit", () => {
      const route = resolveRoute(["config", "edit"], NO_FLAGS, COMMANDS)

      expect(route).toEqual({ type: "config", action: "edit" })
    })

    test("config delete", () => {
      const route = resolveRoute(["config", "delete"], NO_FLAGS, COMMANDS)

      expect(route).toEqual({ type: "config", action: "delete" })
    })

    test("config with unknown action throws", () => {
      expect(() =>
        resolveRoute(["config", "reset"], NO_FLAGS, COMMANDS)
      ).toThrow('Unknown config action: "reset"')
    })

    test("config with no action throws", () => {
      expect(() => resolveRoute(["config"], NO_FLAGS, COMMANDS)).toThrow(
        'Unknown config action: ""'
      )
    })
  })

  describe("command routes (panel run <command>)", () => {
    test("run review 123 triggers command route", () => {
      const route = resolveRoute(["run", "review", "123"], NO_FLAGS, COMMANDS)

      expect(route).toEqual({
        type: "command",
        name: "review",
        arg: "123",
        flags: NO_FLAGS
      })
    })

    test("run review with no arg passes undefined", () => {
      const route = resolveRoute(["run", "review"], NO_FLAGS, COMMANDS)

      expect(route).toEqual({
        type: "command",
        name: "review",
        arg: undefined,
        flags: NO_FLAGS
      })
    })

    test("run review 123 --tabs passes tabs flag", () => {
      const route = resolveRoute(
        ["run", "review", "123", "--tabs"],
        TABS_FLAG,
        COMMANDS
      )

      expect(route).toEqual({
        type: "command",
        name: "review",
        arg: "123",
        flags: TABS_FLAG
      })
    })
  })

  describe("run as prompt (no config command match)", () => {
    test("run with unknown first word becomes prompt including 'run'", () => {
      const route = resolveRoute(
        ["run", "an", "experiment", "on", "something"],
        NO_FLAGS,
        COMMANDS
      )

      expect(route).toEqual({
        type: "prompt",
        prompt: "run an experiment on something",
        flags: NO_FLAGS
      })
    })

    test("run with no following words includes 'run' in prompt", () => {
      const route = resolveRoute(["run"], NO_FLAGS, COMMANDS)

      expect(route).toEqual({
        type: "prompt",
        prompt: "run",
        flags: NO_FLAGS
      })
    })

    test("run with non-matching words includes 'run' in prompt", () => {
      const route = resolveRoute(
        ["run", "an", "experiment"],
        NO_FLAGS,
        COMMANDS
      )

      expect(route).toEqual({
        type: "prompt",
        prompt: "run an experiment",
        flags: NO_FLAGS
      })
    })
  })

  describe("root prompt routes", () => {
    test("unquoted multi-word prompt", () => {
      const route = resolveRoute(["build", "an", "app"], NO_FLAGS, COMMANDS)

      expect(route).toEqual({
        type: "prompt",
        prompt: "build an app",
        flags: NO_FLAGS
      })
    })

    test("prompt with --tabs flag", () => {
      const route = resolveRoute(
        ["build", "an", "app", "--tabs"],
        TABS_FLAG,
        COMMANDS
      )

      expect(route).toEqual({
        type: "prompt",
        prompt: "build an app",
        flags: TABS_FLAG
      })
    })

    test("single word prompt", () => {
      const route = resolveRoute(["hello"], NO_FLAGS, COMMANDS)

      expect(route).toEqual({
        type: "prompt",
        prompt: "hello",
        flags: NO_FLAGS
      })
    })
  })
})
