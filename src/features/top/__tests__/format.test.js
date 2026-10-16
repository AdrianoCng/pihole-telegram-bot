import { it, expect } from "vitest";
import { renderTop } from "../format.js";

it("renders top blocked domains and clients", () => {
  expect(
    renderTop({
      topDomains: [
        { domain: "doubleclick.net", count: 1234 },
        { domain: "ads.example.com", count: 5 },
      ],
      topClients: [
        { ip: "192.168.1.10", name: "laptop", count: 5678 },
        { ip: "192.168.1.20", name: "", count: 900 },
        { ip: "192.168.1.30", name: "192.168.1.30", count: 1 },
      ],
    })
  ).toBe(
    [
      "<b>🚫 Top blocked domains</b>",
      "1. <code>doubleclick.net</code> — 1,234",
      "2. <code>ads.example.com</code> — 5",
      "",
      "<b>💻 Top clients</b>",
      "1. laptop (<code>192.168.1.10</code>) — 5,678",
      "2. <code>192.168.1.20</code> — 900",
      "3. <code>192.168.1.30</code> — 1",
    ].join("\n")
  );
});

it("escapes HTML in labels", () => {
  expect(renderTop({ topDomains: [{ domain: "a<b>&c", count: 1 }], topClients: [] })).toContain(
    "<code>a&lt;b&gt;&amp;c</code>"
  );
});

it("escapes HTML in client names", () => {
  expect(
    renderTop({ topDomains: [], topClients: [{ ip: "10.0.0.2", name: "a<b>&c", count: 1 }] })
  ).toContain("1. a&lt;b&gt;&amp;c (<code>10.0.0.2</code>) — 1");
});

it("truncates client names before escaping so entities are not cut", () => {
  const output = renderTop({
    topDomains: [],
    topClients: [{ ip: "10.0.0.2", name: "&".repeat(100), count: 1 }],
  });

  expect(output).toContain(`1. ${"&amp;".repeat(59)}… (<code>10.0.0.2</code>) — 1`);
});

it("shows unavailable and empty sections", () => {
  expect(renderTop({ topDomains: null, topClients: [] })).toBe(
    [
      "⚠️ Top blocked domains unavailable",
      "",
      "<b>💻 Top clients</b>",
      "No client activity yet",
    ].join("\n")
  );
  expect(renderTop({ topDomains: [], topClients: null })).toBe(
    [
      "<b>🚫 Top blocked domains</b>",
      "No blocked domains yet",
      "",
      "⚠️ Top clients unavailable",
    ].join("\n")
  );
});

it("truncates long labels and stays within the Telegram message limit", () => {
  const long = "a".repeat(253);
  const output = renderTop({
    topDomains: Array.from({ length: 10 }, () => ({ domain: long, count: 1e9 })),
    topClients: Array.from({ length: 5 }, () => ({ ip: "fe80::1", name: long, count: 1e9 })),
  });

  expect(output.length).toBeLessThanOrEqual(4096);
  expect(output).not.toContain(long);
  expect(output).toContain(`1. <code>${"a".repeat(59)}…</code> — 1,000,000,000`);
});
