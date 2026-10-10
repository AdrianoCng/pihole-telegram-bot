import { it, expect } from "vitest";
import { parseTopClients, parseTopDomains } from "../topParsers.js";

it("parses top domains and caps them at ten", () => {
  const domains = Array.from({ length: 12 }, (_, i) => ({ domain: `d${i}.com`, count: i }));

  const parsed = parseTopDomains({ domains });

  expect(parsed).toHaveLength(10);
  expect(parsed[0]).toEqual({ domain: "d0.com", count: 0 });
});

it("parses top clients with optional names and caps them at five", () => {
  const clients = Array.from({ length: 7 }, (_, i) => ({ ip: `10.0.0.${i}`, count: i }));
  clients[1].name = "phone";

  const parsed = parseTopClients({ clients });

  expect(parsed).toHaveLength(5);
  expect(parsed[0]).toEqual({ ip: "10.0.0.0", name: "", count: 0 });
  expect(parsed[1].name).toBe("phone");
});

it("rejects malformed payloads", () => {
  expect(() => parseTopDomains({})).toThrow(expect.objectContaining({ code: "INVALID_RESPONSE" }));
  expect(() => parseTopDomains({ domains: [{ domain: "", count: 1 }] })).toThrow(
    "Pi-hole returned an invalid response"
  );
  expect(() => parseTopDomains({ domains: [{ domain: "a.com", count: -1 }] })).toThrow(
    "Pi-hole returned an invalid response"
  );
  expect(() => parseTopClients({ clients: [{ count: 1 }] })).toThrow(
    "Pi-hole returned an invalid response"
  );
  expect(() => parseTopClients(null)).toThrow("Pi-hole returned an invalid response");
});
