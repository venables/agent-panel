/**
 * Resolves the CLI version.
 *
 * In production builds, `__VERSION__` is replaced at build time by tsdown.
 * In dev mode (unbundled), falls back to reading package.json.
 */

import { readFileSync } from "node:fs"
import { resolve } from "node:path"

function readPackageVersion(): string {
  const path = resolve(import.meta.dirname, "../../package.json")
  const pkg = JSON.parse(readFileSync(path, "utf-8")) as { version: string }
  return pkg.version
}

export const VERSION =
  typeof __VERSION__ !== "undefined" ? __VERSION__ : readPackageVersion()
