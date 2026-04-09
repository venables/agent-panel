/**
 * Cursor navigation utility for multi-line text.
 *
 * Vendored from @clack/core's upcoming textarea prompt
 * (commit 814ab9ade277387b97d9ab812586247125df53c4).
 *
 * Converts between a linear cursor position (byte offset into the text)
 * and a visual (row, column) position, applies a delta, and converts back.
 */

/**
 * Moves a linear cursor by (deltaX, deltaY) over multi-line text.
 *
 * The input cursor is an offset into `value` treated as a flat string.
 * The function maps it to (row, col), applies the deltas, clamps the
 * result to the text bounds (wrapping across lines if needed), then
 * converts back to a linear offset.
 *
 * @param cursor - Current linear cursor position
 * @param deltaX - Horizontal movement (-1, 0, or 1)
 * @param deltaY - Vertical movement (-1, 0, or 1)
 * @param value - The full multi-line text
 * @returns The new linear cursor position
 */
export function findTextCursor(
  cursor: number,
  deltaX: number,
  deltaY: number,
  value: string
): number {
  const lines = value.split("\n")
  let cursorY = 0
  let cursorX = cursor

  // Find current (y, x) from linear cursor position
  for (const line of lines) {
    if (cursorX <= line.length) {
      break
    }
    cursorX -= line.length + 1
    cursorY++
  }

  // Apply Y delta, clamped to line range
  cursorY = Math.max(0, Math.min(lines.length - 1, cursorY + deltaY))
  // Clamp X to new line length, then apply X delta
  cursorX = Math.min(cursorX, lines[cursorY]!.length) + deltaX

  // Handle X underflow (cursor moved left past start of line)
  while (cursorX < 0 && cursorY > 0) {
    cursorY--
    cursorX += lines[cursorY]!.length + 1
  }
  // Handle X overflow (cursor moved right past end of line)
  while (cursorX > lines[cursorY]!.length && cursorY < lines.length - 1) {
    cursorX -= lines[cursorY]!.length + 1
    cursorY++
  }
  cursorX = Math.max(0, Math.min(lines[cursorY]!.length, cursorX))

  // Convert (y, x) back to linear position
  let newCursor = 0
  for (let i = 0; i < cursorY; i++) {
    newCursor += lines[i]!.length + 1
  }
  return newCursor + cursorX
}
