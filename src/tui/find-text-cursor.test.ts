/**
 * Tests for findTextCursor.
 *
 * Verifies cursor navigation across multi-line text for all four directions
 * plus edge cases (start/end of text, line wrap-around, clamping).
 */

import { describe, expect, test } from "bun:test"

import { findTextCursor } from "./find-text-cursor.ts"

describe("findTextCursor", () => {
  describe("horizontal movement", () => {
    test("moves right within a line", () => {
      expect(findTextCursor(0, 1, 0, "hello")).toBe(1)
      expect(findTextCursor(3, 1, 0, "hello")).toBe(4)
    })

    test("moves left within a line", () => {
      expect(findTextCursor(3, -1, 0, "hello")).toBe(2)
      expect(findTextCursor(1, -1, 0, "hello")).toBe(0)
    })

    test("wraps right past end of line to next line", () => {
      // "hello\nworld" — cursor at 5 is end of line 0, +1 wraps to start of line 1
      expect(findTextCursor(5, 1, 0, "hello\nworld")).toBe(6)
    })

    test("wraps left past start of line to previous line", () => {
      // "hello\nworld" — cursor at 6 is start of line 1, -1 wraps to end of line 0
      expect(findTextCursor(6, -1, 0, "hello\nworld")).toBe(5)
    })

    test("stays at start of text", () => {
      expect(findTextCursor(0, -1, 0, "hello")).toBe(0)
    })

    test("stays at end of text", () => {
      expect(findTextCursor(5, 1, 0, "hello")).toBe(5)
    })
  })

  describe("vertical movement", () => {
    test("moves down preserving column", () => {
      // "hello\nworld" — from col 3 on line 0, down → col 3 on line 1
      expect(findTextCursor(3, 0, 1, "hello\nworld")).toBe(9)
    })

    test("moves up preserving column", () => {
      // "hello\nworld" — from col 3 on line 1 (index 9), up → col 3 on line 0
      expect(findTextCursor(9, 0, -1, "hello\nworld")).toBe(3)
    })

    test("clamps column when moving to shorter line", () => {
      // "hello\nhi" — from col 4 on line 0, down → end of line 1 (col 2)
      expect(findTextCursor(4, 0, 1, "hello\nhi")).toBe(8)
    })

    test("clamps column when moving up to shorter line", () => {
      // "hi\nhello" — from col 4 on line 1, up → end of line 0 (col 2)
      expect(findTextCursor(7, 0, -1, "hi\nhello")).toBe(2)
    })

    test("stays on first line when moving up", () => {
      expect(findTextCursor(3, 0, -1, "hello\nworld")).toBe(3)
    })

    test("stays on last line when moving down", () => {
      expect(findTextCursor(9, 0, 1, "hello\nworld")).toBe(9)
    })
  })

  describe("empty and single-character text", () => {
    test("handles empty text", () => {
      expect(findTextCursor(0, 1, 0, "")).toBe(0)
      expect(findTextCursor(0, -1, 0, "")).toBe(0)
      expect(findTextCursor(0, 0, 1, "")).toBe(0)
    })

    test("handles single character", () => {
      expect(findTextCursor(0, 1, 0, "a")).toBe(1)
      expect(findTextCursor(1, -1, 0, "a")).toBe(0)
    })
  })

  describe("three lines", () => {
    const text = "one\ntwo\nthree"
    // positions: o=0 n=1 e=2 \n=3 t=4 w=5 o=6 \n=7 t=8 h=9 r=10 e=11 e=12

    test("moves down twice through middle line", () => {
      // from col 1 on line 0 (pos 1), down → col 1 on line 1 (pos 5)
      expect(findTextCursor(1, 0, 1, text)).toBe(5)
      // from col 1 on line 1 (pos 5), down → col 1 on line 2 (pos 9)
      expect(findTextCursor(5, 0, 1, text)).toBe(9)
    })

    test("moves up twice back through middle line", () => {
      expect(findTextCursor(9, 0, -1, text)).toBe(5)
      expect(findTextCursor(5, 0, -1, text)).toBe(1)
    })
  })
})
