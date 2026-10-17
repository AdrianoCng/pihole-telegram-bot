import { it, expect } from "vitest";
import { formatAge } from "../time.js";

const now = Date.UTC(2026, 8, 25, 12);
const ago = (seconds) => now / 1000 - seconds;

it("formats relative ages", () => {
  expect(formatAge(ago(30), now)).toBe("just now");
  expect(formatAge(ago(60), now)).toBe("1 minute ago");
  expect(formatAge(ago(150), now)).toBe("2 minutes ago");
  expect(formatAge(ago(7200), now)).toBe("2 hours ago");
  expect(formatAge(ago(86400), now)).toBe("1 day ago");
});

it("returns unknown for invalid or future timestamps", () => {
  expect(formatAge(0, now)).toBe("unknown");
  expect(formatAge(Number.NaN, now)).toBe("unknown");
  expect(formatAge("1", now)).toBe("unknown");
  expect(formatAge(ago(-60), now)).toBe("unknown");
});
