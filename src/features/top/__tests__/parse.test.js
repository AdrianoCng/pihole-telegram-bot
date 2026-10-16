import { it, expect } from "vitest";
import { parseTopClients, parseTopDomains } from "../parse.js";
import { TOP_BLOCKED_DOMAINS_COUNT, TOP_CLIENTS_COUNT } from "../constants.js";

it("parses top domains and caps them at the configured count", () => {
  const domains = Array.from({ length: TOP_BLOCKED_DOMAINS_COUNT + 1 }, (_, i) => ({
    domain: `d${i}.com`,
    count: i,
  }));

  const parsed = parseTopDomains({ domains });

  expect(parsed).toHaveLength(TOP_BLOCKED_DOMAINS_COUNT);
  expect(parsed[0]).toEqual({ domain: "d0.com", count: 0 });
});

it("parses top clients with optional names and caps them at the configured count", () => {
  const clients = Array.from({ length: TOP_CLIENTS_COUNT + 1 }, (_, i) => ({
    ip: `10.0.0.${i}`,
    count: i,
  }));
  clients[1].name = "phone";

  const parsed = parseTopClients({ clients });

  expect(parsed).toHaveLength(TOP_CLIENTS_COUNT);
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
