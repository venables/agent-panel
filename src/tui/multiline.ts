/**
 * Multi-line text prompt built on @clack/core's Prompt base class.
 *
 * Vendored/adapted from the unreleased @clack/prompts textarea implementation
 * (commit 814ab9ade277387b97d9ab812586247125df53c4). When clack publishes
 * the feature, this file can be replaced with a direct import from
 * `@clack/prompts`.
 *
 * Because @clack/core 1.1.0 does not yet expose the `_shouldSubmit` hook
 * that the upstream implementation relies on, this version vetoes the
 * base class's submit-on-return by briefly setting `state = 'error'`.
 * The base class automatically resets that state on the next keypress,
 * and our render function treats 'error' as 'active' so the user sees
 * no flicker.
 */

import type { Key } from "node:readline"
import { styleText } from "node:util"

import { Prompt, wrapTextWithPrefix } from "@clack/core"
import type { PromptOptions } from "@clack/core"

import { findTextCursor } from "./find-text-cursor.ts"

/** Box-drawing characters matching clack's visual style. */
const S_BAR = "\u2502" // │
const S_BAR_END = "\u2514" // └
const S_STEP_ACTIVE = "\u25c6" // ◆
const S_STEP_SUBMIT = "\u25c7" // ◇
const S_STEP_CANCEL = "\u25a0" // ■

/** Block cursor character for end-of-line and end-of-newline positions. */
const BLOCK_CURSOR = "\u2588" // █

type RenderState = "initial" | "active" | "submit" | "cancel"

/**
 * Returns the clack-style state symbol for the header line.
 *
 * @param state - The prompt state (error is treated as active)
 * @returns The styled symbol character
 */
function stateSymbol(state: RenderState): string {
  switch (state) {
    case "submit":
      return styleText("green", S_STEP_SUBMIT)
    case "cancel":
      return styleText("red", S_STEP_CANCEL)
    default:
      return styleText("cyan", S_STEP_ACTIVE)
  }
}

/** User-facing options for {@link multiline}. */
export interface MultiLineOptions {
  readonly message: string
  readonly placeholder?: string
  readonly defaultValue?: string
  readonly initialValue?: string
  readonly hint?: string
}

/** Kitty keyboard protocol: push flag 1 (disambiguate escape codes). */
const KITTY_KEYBOARD_ENABLE = "\x1b[>1u"
/** Kitty keyboard protocol: pop the most recent enhancement flags. */
const KITTY_KEYBOARD_DISABLE = "\x1b[<u"
/** Raw sequence sent by Ghostty/Kitty for Shift+Enter when CSI u mode is active. */
const SHIFT_ENTER_SEQUENCE = "\x1b[13;2u"

/**
 * Multi-line text prompt.
 *
 * Pressing return submits; pressing Shift+Enter (or Alt+Enter) inserts a
 * newline without submitting. Shift+Enter detection requires the kitty
 * keyboard protocol, which is enabled automatically while the prompt runs.
 */
class MultiLinePrompt extends Prompt<string> {
  /**
   * True when a Shift+Enter was just consumed by the stdin data listener.
   * Set synchronously in {@link insertNewlineAndRender} and cleared on
   * the next tick, so any keypress event that readline synchronously
   * emits for the same sequence will see this flag and skip submission.
   */
  private swallowNextReturn = false

  /** Returns the user input with a visible cursor marker inserted. */
  get userInputWithCursor(): string {
    if (this.state === "submit") {
      return this.userInput
    }
    const input = this.userInput
    if (this.cursor >= input.length) {
      return `${input}${BLOCK_CURSOR}`
    }
    const before = input.slice(0, this.cursor)
    const at = input[this.cursor]!
    const after = input.slice(this.cursor + 1)
    if (at === "\n") {
      return `${before}${BLOCK_CURSOR}\n${after}`
    }
    return `${before}${styleText("inverse", at)}${after}`
  }

  get cursor(): number {
    return this._cursor
  }

  private insertAtCursor(char: string): void {
    if (this.userInput.length === 0) {
      this._setUserInput(char)
      return
    }
    this._setUserInput(
      this.userInput.slice(0, this.cursor) +
        char +
        this.userInput.slice(this.cursor)
    )
  }

  private handleCursor(action: string): void {
    const text = this.userInput
    switch (action) {
      case "up":
        this._cursor = findTextCursor(this._cursor, 0, -1, text)
        return
      case "down":
        this._cursor = findTextCursor(this._cursor, 0, 1, text)
        return
      case "left":
        this._cursor = findTextCursor(this._cursor, -1, 0, text)
        return
      case "right":
        this._cursor = findTextCursor(this._cursor, 1, 0, text)
        return
    }
  }

  /**
   * Inserts a newline at the cursor and immediately redraws the prompt.
   *
   * Called by the stdin data interceptor in {@link multiline} when the
   * kitty keyboard Shift+Enter sequence is received. Sets
   * {@link swallowNextReturn} so that any synchronous keypress event
   * readline emits for the same sequence is treated as already-handled.
   */
  public insertNewlineAndRender(): void {
    this.insertAtCursor("\n")
    this._cursor++
    this.swallowNextReturn = true
    // Trigger a redraw via the base class's private render method. This
    // is normally called only at the tail of onKeypress, but we need it
    // now because we're handling the keystroke outside that flow.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error render is TS-private on the base class
    this.render()
    // Clear the swallow flag after the current synchronous chain so any
    // subsequent, genuinely new Enter presses submit normally.
    process.nextTick(() => {
      this.swallowNextReturn = false
    })
  }

  private handleReturn(key: Key): void {
    // Shift+Enter was already handled by the stdin data interceptor;
    // swallow the synchronous keypress readline may fire for the same bytes.
    if (this.swallowNextReturn) {
      this.swallowNextReturn = false
      this.state = "error"
      return
    }

    // Alt+Enter fallback for terminals without kitty keyboard support.
    // (Also catches Shift+Enter on terminals where readline parses kitty
    // sequences natively and reports key.shift.)
    if (key.meta || key.shift) {
      this.insertAtCursor("\n")
      this._cursor++
      this.state = "error"
      return
    }

    // Plain Enter — let the base class submit.
  }

  private handlePrintable(key: Key): void {
    const seq = key.sequence
    if (!seq || seq.length !== 1) {
      return
    }
    if (key.ctrl || key.meta) {
      return
    }
    const code = seq.charCodeAt(0)
    // Only printable ASCII. 127 = DEL.
    if (code < 32 || code === 127) {
      return
    }
    this.insertAtCursor(seq)
    this._cursor++
  }

  constructor(opts: PromptOptions<string, MultiLinePrompt>) {
    super(opts, false)

    // Enable kitty keyboard protocol so Shift+Enter sends a distinct
    // sequence we can intercept. Disabled again on finalize.
    if (process.stdout.isTTY) {
      process.stdout.write(KITTY_KEYBOARD_ENABLE)
    }

    this.on("key", (_char, key) => {
      if (!key) {
        return
      }

      if (
        key.name === "up" ||
        key.name === "down" ||
        key.name === "left" ||
        key.name === "right"
      ) {
        this.handleCursor(key.name)
        return
      }

      if (key.name === "return") {
        this.handleReturn(key)
        return
      }

      if (key.name === "backspace" && this.cursor > 0) {
        this._setUserInput(
          this.userInput.slice(0, this.cursor - 1) +
            this.userInput.slice(this.cursor)
        )
        this._cursor--
        return
      }

      if (key.name === "delete" && this.cursor < this.userInput.length) {
        this._setUserInput(
          this.userInput.slice(0, this.cursor) +
            this.userInput.slice(this.cursor + 1)
        )
        return
      }

      this.handlePrintable(key)
    })

    this.on("userInput", (input) => {
      this._setValue(input)
    })

    this.on("finalize", () => {
      if (process.stdout.isTTY) {
        process.stdout.write(KITTY_KEYBOARD_DISABLE)
      }
      if (this.value === undefined || this.value === "") {
        this.value = ""
      }
    })
  }
}

/**
 * Shows a multi-line text prompt styled like clack's text prompt.
 *
 * Plain Enter submits. Shift+Enter (via kitty keyboard protocol) or
 * Alt+Enter (reliable fallback) inserts a newline.
 *
 * @param opts - Prompt options
 * @returns The submitted string, or a cancel symbol if cancelled
 */
export async function multiline(
  opts: MultiLineOptions
): Promise<string | symbol> {
  const { message, placeholder, defaultValue, initialValue, hint } = opts

  const prompt = new MultiLinePrompt({
    initialValue,
    render(this: Omit<MultiLinePrompt, "prompt">): string {
      // Treat 'error' as 'active' — we use error state as a submit-veto signal.
      const rawState = this.state
      const effective: RenderState = rawState === "error" ? "active" : rawState

      const topBar = styleText("gray", S_BAR)
      const title = `${topBar}\n${stateSymbol(effective)}  ${message}\n`

      // Placeholder: first char inverted to double as the cursor marker,
      // rest dimmed. When no placeholder, use a hidden inverse underscore
      // so there's still a visible cursor block.
      const renderedPlaceholder = placeholder
        ? styleText("inverse", placeholder[0]!) +
          styleText("dim", placeholder.slice(1))
        : styleText(["inverse", "hidden"], "_")

      const bodyText =
        this.userInput.length === 0
          ? renderedPlaceholder
          : this.userInputWithCursor

      const value = this.value ?? ""

      if (effective === "submit") {
        const prefix = `${styleText("gray", S_BAR)}  `
        const styled = value ? styleText("dim", value) : ""
        const lines = wrapTextWithPrefix(undefined, styled, prefix)
        return `${title}${lines}\n`
      }

      if (effective === "cancel") {
        const prefix = `${styleText("gray", S_BAR)}  `
        const styled = value ? styleText(["strikethrough", "dim"], value) : ""
        const lines = wrapTextWithPrefix(undefined, styled, prefix)
        return `${title}${lines}${value ? "\n" : ""}${styleText("gray", S_BAR)}\n`
      }

      // initial/active/error(→active)
      const activePrefix = `${styleText("cyan", S_BAR)}  `
      const lines = wrapTextWithPrefix(undefined, bodyText, activePrefix)
      const endBar = styleText("cyan", S_BAR_END)
      const hintLine = hint ? `  ${styleText("dim", hint)}` : ""
      return `${title}${lines}\n${endBar}${hintLine}\n`
    }
  })

  // Intercept Shift+Enter at the raw stdin level so we catch it regardless
  // of whether Node's readline recognizes the kitty keyboard u-suffix.
  // Prepend so we fire before readline's internal data handler parses
  // the chunk into a (possibly missing) keypress event.
  const decoder = new TextDecoder()
  const dataHandler = (chunk: Uint8Array | string): void => {
    const str = typeof chunk === "string" ? chunk : decoder.decode(chunk)
    if (str === SHIFT_ENTER_SEQUENCE) {
      prompt.insertNewlineAndRender()
    }
  }
  process.stdin.prependListener("data", dataHandler)

  try {
    const result = await prompt.prompt()
    if (typeof result === "symbol") {
      return result
    }
    return result || defaultValue || ""
  } finally {
    process.stdin.off("data", dataHandler)
  }
}
