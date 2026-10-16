import { it, expect } from "vitest";
import { formatCount, formatPercentage } from "../number.js";

it("formats counts with thousands separators", () => {
  expect(formatCount(0)).toBe("0");
  expect(formatCount(1234567)).toBe("1,234,567");
});

it("formats percentages with one decimal place", () => {
  expect(formatPercentage(0)).toBe("0.0%");
  expect(formatPercentage(16.46)).toBe("16.5%");
});
