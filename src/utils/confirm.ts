/**
 * Prompts the user for a yes/no confirmation via stdin.
 */

import { createInterface } from "node:readline"

/**
 * Asks the user a yes/no question on the terminal.
 *
 * Returns true for "y" or Enter (default yes), false otherwise.
 * Falls back to `true` when stdin is not a TTY (non-interactive).
 *
 * @param question - The question to display (without trailing space)
 * @returns Whether the user confirmed
 */
export async function confirm(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return true
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })

  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question(`${question} [Y/n] `, resolve)
    })

    const normalized = answer.trim().toLowerCase()
    return normalized === "" || normalized === "y" || normalized === "yes"
  } finally {
    rl.close()
  }
}
