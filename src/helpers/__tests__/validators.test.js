import { it, expect } from "vitest";
import { requireArray, requireCount, requirePercentage, requireString } from "../validators.js";

const invalid = "Pi-hole returned an invalid response";

it("returns valid values unchanged", () => {
  expect(requireCount(0)).toBe(0);
  expect(requirePercentage(42.5)).toBe(42.5);
  expect(requireString("a.com")).toBe("a.com");
  expect(requireArray([])).toEqual([]);
});

it("rejects invalid values without coercing", () => {
  expect(() => requireCount("1")).toThrow(invalid);
  expect(() => requireCount(1.5)).toThrow(invalid);
  expect(() => requirePercentage(101)).toThrow(invalid);
  expect(() => requireString("")).toThrow(invalid);
  expect(() => requireArray({})).toThrow(invalid);
});
