import { homedir } from "node:os"
import { join } from "node:path"

import { expect, test } from "vitest"

import { configPath, loadConfig } from "./config.ts"

test("configPath uses XDG_CONFIG_HOME when available", () => {
  const oldEnv = process.env["XDG_CONFIG_HOME"]
  process.env["XDG_CONFIG_HOME"] = "/tmp/xdg"
  expect(configPath()).toBe(join("/tmp/xdg", "agent-panel", "config.jsonc"))
  process.env["XDG_CONFIG_HOME"] = oldEnv
})

test("configPath falls back to homedir/.config", () => {
  const oldEnv = process.env["XDG_CONFIG_HOME"]
  delete process.env["XDG_CONFIG_HOME"]
  expect(configPath()).toBe(
    join(homedir(), ".config", "agent-panel", "config.jsonc")
  )
  process.env["XDG_CONFIG_HOME"] = oldEnv
})

test("loadConfig throws nice error when file missing", async () => {
  const oldEnv = process.env["XDG_CONFIG_HOME"]
  process.env["XDG_CONFIG_HOME"] = "/tmp/does-not-exist-" + Math.random()

  await expect(loadConfig()).rejects.toThrow(/Config file not found/)

  process.env["XDG_CONFIG_HOME"] = oldEnv
})
