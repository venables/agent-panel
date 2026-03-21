/**
 * The `panel init` command.
 *
 * Creates the default config file at ~/.config/panel/config.jsonc.
 */

import { defineCommand } from "citty"

import { init } from "../init.ts"

export default defineCommand({
  meta: {
    name: "init",
    description: "Create default config file"
  },
  run: () => init()
})
