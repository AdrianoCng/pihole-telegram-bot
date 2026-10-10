import { it, expect } from "vitest";
import { renderTop } from "../topFormat.js";

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
      "🚫 Top blocked domains",
      "1. doubleclick.net — 1,234",
      "2. ads.example.com — 5",
      "",
      "💻 Top clients",
      "1. laptop (192.168.1.10) — 5,678",
      "2. 192.168.1.20 — 900",
      "3. 192.168.1.30 — 1",
    ].join("\n")
  );
});

it("shows unavailable and empty sections", () => {
  expect(renderTop({ topDomains: null, topClients: [] })).toBe(
    ["⚠️ Top blocked domains unavailable", "", "💻 Top clients", "No client activity yet"].join(
      "\n"
    )
  );
  expect(renderTop({ topDomains: [], topClients: null })).toBe(
    ["🚫 Top blocked domains", "No blocked domains yet", "", "⚠️ Top clients unavailable"].join(
      "\n"
    )
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
  expect(output).toContain(`1. ${"a".repeat(59)}… — 1,000,000,000`);
});
