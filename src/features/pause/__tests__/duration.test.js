import { it, expect } from "vitest";
import { parseDuration } from "../duration.js";

it("parses seconds, minutes and hours, treating bare numbers as seconds", () => {
  expect(parseDuration("45")).toBe(45);
  expect(parseDuration("45s")).toBe(45);
  expect(parseDuration(" 5M ")).toBe(300);
  expect(parseDuration("1h")).toBe(3600);
  expect(parseDuration("24h")).toBe(86400);
});

it("rejects invalid, empty, zero and out-of-range durations", () => {
  for (const input of ["0", "0m", "-5", "abc", "5d", "1.5m", "25h", "", undefined]) {
    expect(parseDuration(input)).toBeNull();
  }
});
