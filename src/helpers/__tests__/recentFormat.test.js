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

it("renders the unfiltered list when the filter is all", () => {
  const entries = [{ domain: "ads.example.com", time: ago(10), ip: "10.0.0.2", name: "" }];
  expect(renderRecent(entries, now, { type: "all" })).toBe(renderRecent(entries, now));
  expect(renderRecent([], now, { type: "all" })).toBe(renderRecent([], now));
});

it("names the client filter in the title", () => {
  expect(
    renderRecent(
      [{ domain: "tracker.example.net", time: ago(60), ip: "192.168.1.5", name: "my-phone" }],
      now,
      { type: "client", value: "192.168.1.5" }
    )
  ).toBe(
    [
      "<b>🚫 Recently blocked · client 192.168.1.5</b>",
      "1. <code>tracker.example.net</code> — 1 minute ago · my-phone (<code>192.168.1.5</code>)",
    ].join("\n")
  );
});

it("names the domain filter in the title", () => {
  expect(
    renderRecent(
      [
        { domain: "ads.example.com", time: ago(120), ip: "192.168.1.10", name: "laptop" },
        { domain: "ads.example.com", time: ago(300), ip: "192.168.1.20", name: "" },
      ],
      now,
      { type: "domain", value: "ads.example.com" }
    )
  ).toBe(
    [
      "<b>🚫 Recently blocked · domain ads.example.com</b>",
      "1. <code>ads.example.com</code> — 2 minutes ago · laptop (<code>192.168.1.10</code>)",
      "2. <code>ads.example.com</code> — 5 minutes ago · <code>192.168.1.20</code>",
    ].join("\n")
  );
});

it("renders a filtered empty list", () => {
  expect(renderRecent([], now, { type: "client", value: "192.168.1.5" })).toBe(
    "<b>🚫 Recently blocked · client 192.168.1.5</b>\nNo blocked queries for client 192.168.1.5"
  );
  expect(renderRecent([], now, { type: "domain", value: "ads.example.com" })).toBe(
    "<b>🚫 Recently blocked · domain ads.example.com</b>\nNo blocked queries for domain ads.example.com"
  );
});

it("escapes and truncates the filter value in the title and empty message", () => {
  const message = renderRecent([], now, { type: "client", value: "<b>&" });
  expect(message).toBe(
    "<b>🚫 Recently blocked · client &lt;b&gt;&amp;</b>\nNo blocked queries for client &lt;b&gt;&amp;"
  );

  const long = renderRecent([], now, { type: "domain", value: "a".repeat(253) });
  expect(long).not.toContain("a".repeat(253));
  expect(long).toContain("…</b>");
});
