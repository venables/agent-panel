/**
 * The `panel list` command.
 *
 * Shows available commands from the user's config.
 */

import { defineCommand } from "citty"

import { list } from "../list.ts"

export default defineCommand({
  meta: {
    name: "list",
    description: "List configured commands and agents"
  },
  run: () => list()
})
