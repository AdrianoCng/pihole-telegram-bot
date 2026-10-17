import { it, expect } from "vitest";
import {
  requireArray,
  requireCount,
  requirePercentage,
  requireString,
  requireTimestamp,
} from "../validators.js";

const invalid = "Pi-hole returned an invalid response";

it("returns valid values unchanged", () => {
  expect(requireCount(0)).toBe(0);
  expect(requirePercentage(42.5)).toBe(42.5);
  expect(requireString("a.com")).toBe("a.com");
  expect(requireArray([])).toEqual([]);
  expect(requireTimestamp(1758801600.5)).toBe(1758801600.5);
});

it("rejects invalid values without coercing", () => {
  expect(() => requireCount("1")).toThrow(invalid);
  expect(() => requireCount(1.5)).toThrow(invalid);
  expect(() => requirePercentage(101)).toThrow(invalid);
  expect(() => requireString("")).toThrow(invalid);
  expect(() => requireArray({})).toThrow(invalid);
  expect(() => requireTimestamp(0)).toThrow(invalid);
  expect(() => requireTimestamp("1")).toThrow(invalid);
  expect(() => requireTimestamp(Number.POSITIVE_INFINITY)).toThrow(invalid);
});
