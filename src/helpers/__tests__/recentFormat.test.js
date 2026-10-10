import { it, expect } from "vitest";
import { renderRecent } from "../recentFormat.js";

const now = Date.UTC(2026, 8, 25, 12);
const ago = (seconds) => now / 1000 - seconds;

it("renders recently blocked domains with age and client", () => {
  expect(
    renderRecent(
      [
        { domain: "doubleclick.net", time: ago(120), ip: "192.168.1.10", name: "laptop" },
        { domain: "ads.example.com", time: ago(300), ip: "192.168.1.20", name: "" },
        { domain: "t.example.com", time: ago(10), ip: "192.168.1.30", name: "192.168.1.30" },
      ],
      now
    )
  ).toBe(
    [
      "<b>🚫 Recently blocked</b>",
      "1. <code>doubleclick.net</code> — 2 minutes ago · laptop (<code>192.168.1.10</code>)",
      "2. <code>ads.example.com</code> — 5 minutes ago · <code>192.168.1.20</code>",
      "3. <code>t.example.com</code> — just now · <code>192.168.1.30</code>",
    ].join("\n")
  );
});

it("escapes HTML in domains and client names", () => {
  expect(
    renderRecent([{ domain: "a<b>", time: ago(10), ip: "10.0.0.2", name: "x&y" }], now)
  ).toContain("<code>a&lt;b&gt;</code> — just now · x&amp;y (<code>10.0.0.2</code>)");
});

it("renders an empty list", () => {
  expect(renderRecent([], now)).toBe("<b>🚫 Recently blocked</b>\nNo blocked queries yet");
});
