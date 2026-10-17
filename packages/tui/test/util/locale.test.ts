import { expect, test } from "bun:test"
import { Locale } from "../../src/util/locale"

test("rolls compact counts over at the million rounding boundary", () => {
  expect(Locale.number(999949)).toBe("999.9K")
  expect(Locale.number(999950)).toBe("1.0M")
  expect(Locale.number(1000000)).toBe("1.0M")
})

test("preserves small counts and ordinary compact counts", () => {
  expect(Locale.number(0)).toBe("0")
  expect(Locale.number(999)).toBe("999")
  expect(Locale.number(1000)).toBe("1.0K")
  expect(Locale.number(12500)).toBe("12.5K")
  expect(Locale.number(1500000)).toBe("1.5M")
})
