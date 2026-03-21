/**
 * The `panel config` command.
 *
 * Opens the config file in the user's preferred editor.
 */

import { defineCommand } from "citty"

import { editConfig } from "../edit-config.ts"

export default defineCommand({
  meta: {
    name: "config",
    description: "Open config in $EDITOR"
  },
  run: () => editConfig()
})
