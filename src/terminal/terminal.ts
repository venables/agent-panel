/**
 * Abstract terminal interface for agent orchestration.
 *
 * Each backend (cmux, Ghostty, etc.) implements this interface.
 */

/** A handle to a terminal pane/surface. */
export interface PaneHandle {
  readonly id: string
}

/** Operations a terminal backend must support. */
export interface Terminal {
  /** Human-readable name of the backend (e.g. "cmux", "ghostty"). */
  readonly name: string

  /** Returns a handle to the current pane the CLI was launched from. */
  currentPane(): PaneHandle

  /** Creates a new right-side split and returns a handle to it. */
  createSplit(): Promise<PaneHandle>

  /** Creates a new tab and returns a handle to it. */
  createTab(): Promise<PaneHandle>

  /** Sends text to a pane (does not press Enter). */
  sendText(pane: PaneHandle, text: string): Promise<void>

  /** Sends a keypress to a pane. */
  sendKey(pane: PaneHandle, key: string): Promise<void>
}
