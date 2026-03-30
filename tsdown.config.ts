import { readFileSync } from "node:fs"

import { defineConfig } from "tsdown"

const { version } = JSON.parse(readFileSync("package.json", "utf-8")) as {
  version: string
}

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  banner: { js: "#!/usr/bin/env node" },
  define: {
    __VERSION__: JSON.stringify(version)
  }
})
