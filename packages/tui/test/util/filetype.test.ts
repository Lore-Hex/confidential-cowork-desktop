import { describe, expect, test } from "bun:test"
import { filetype } from "../../src/util/filetype"

describe("util.filetype", () => {
  test.each(["cppm", "ccm", "cxxm", "c++m", "ixx"])("recognizes C++ module .%s", (extension) => {
    expect(filetype(`module.${extension}`)).toBe("cpp")
  })

  test("maps filenames to presentation languages", () => {
    expect(filetype("component.tsx")).toBe("typescript")
    expect(filetype("script.js")).toBe("typescript")
    expect(filetype("main.py")).toBe("python")
    expect(filetype("README.unknown")).toBeUndefined()
  })

  test("uses none for missing filenames", () => {
    expect(filetype()).toBe("none")
    expect(filetype("")).toBe("none")
  })
})
