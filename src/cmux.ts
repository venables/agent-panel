/**
 * Thin wrapper around cmux CLI commands.
 */

/** Result of creating a new split. */
export interface SplitResult {
  readonly surfaceId: string
}

/**
 * Creates a new right-side split in the current workspace.
 *
 * @returns The surface ID of the newly created split
 */
export async function createSplit(): Promise<SplitResult> {
  const proc = Bun.spawn(["cmux", "new-split", "right"], {
    stdout: "pipe",
    stderr: "pipe"
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(`cmux new-split failed (exit ${exitCode}): ${stderr}`)
  }

  // cmux outputs "OK surface:N workspace:N" -- extract the surface ref
  const match = output.match(/surface:\d+/)

  if (!match) {
    throw new Error(`Could not parse surface ref from cmux output: ${output}`)
  }

  return { surfaceId: match[0] }
}

/**
 * Sends text input to a specific cmux surface.
 *
 * @param surfaceId - The surface to send text to
 * @param text - The text to send
 */
export async function sendToSurface(
  surfaceId: string,
  text: string
): Promise<void> {
  const proc = Bun.spawn(["cmux", "send", "--surface", surfaceId, text], {
    stdout: "pipe",
    stderr: "pipe"
  })

  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(`cmux send failed (exit ${exitCode}): ${stderr}`)
  }
}

/**
 * Sends a keypress to a specific cmux surface.
 *
 * @param surfaceId - The surface to send the key to
 * @param key - The key to send (e.g. "Enter")
 */
export async function sendKeyToSurface(
  surfaceId: string,
  key: string
): Promise<void> {
  const proc = Bun.spawn(["cmux", "send-key", "--surface", surfaceId, key], {
    stdout: "pipe",
    stderr: "pipe"
  })

  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(`cmux send-key failed (exit ${exitCode}): ${stderr}`)
  }
}
