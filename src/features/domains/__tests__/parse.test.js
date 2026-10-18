import { describe, it, expect } from "vitest";
import { PiholeError, PIHOLE_ERROR_CODES } from "../../../shared/errors/PiholeError.js";
import {
  displayDomain,
  isDuplicateError,
  parseAddResult,
  parseDomainTarget,
  parseDomains,
} from "../parse.js";

const exact = (domain) => ({ kind: "exact", domain, display: domain });

describe("parseDomainTarget", () => {
  it("accepts an exact domain", () => {
    expect(parseDomainTarget("example.com")).toEqual(exact("example.com"));
    expect(parseDomainTarget("  ads.tracker-1.example.co.uk ")).toEqual(
      exact("ads.tracker-1.example.co.uk")
    );
    expect(parseDomainTarget("_dmarc.example.com")).toEqual(exact("_dmarc.example.com"));
  });

  it("accepts a single-label domain", () => {
    expect(parseDomainTarget("nas")).toEqual(exact("nas"));
    expect(parseDomainTarget("localhost")).toEqual(exact("localhost"));
    expect(parseDomainTarget("Printer.")).toEqual(exact("printer"));
  });

  it("lowercases and strips a trailing dot", () => {
    expect(parseDomainTarget("Ads.Example.COM.")).toEqual(exact("ads.example.com"));
  });

  it("turns *.domain into the wildcard regex Pi-hole uses", () => {
    expect(parseDomainTarget("*.Example.com")).toEqual({
      kind: "regex",
      domain: "(\\.|^)example\\.com$",
      display: "*.example.com",
    });
  });

  it("accepts a wildcard on a single-label base", () => {
    expect(parseDomainTarget("*.lan")).toEqual({
      kind: "regex",
      domain: "(\\.|^)lan$",
      display: "*.lan",
    });
  });

  it("rejects missing or extra arguments", () => {
    expect(parseDomainTarget(undefined)).toBeNull();
    expect(parseDomainTarget("   ")).toBeNull();
    expect(parseDomainTarget("example.com other.com")).toBeNull();
  });

  it("rejects wildcards other than a leading *.", () => {
    expect(parseDomainTarget("*")).toBeNull();
    expect(parseDomainTarget("*.")).toBeNull();
    expect(parseDomainTarget("ads.*.com")).toBeNull();
    expect(parseDomainTarget("a*.example.com")).toBeNull();
    expect(parseDomainTarget("*example.com")).toBeNull();
    expect(parseDomainTarget("*.*.example.com")).toBeNull();
  });

  it("rejects invalid hostnames", () => {
    expect(parseDomainTarget("exa mple.com")).toBeNull();
    expect(parseDomainTarget("example..com")).toBeNull();
    expect(parseDomainTarget("-example.com")).toBeNull();
    expect(parseDomainTarget("example-.com")).toBeNull();
    expect(parseDomainTarget("ex<b>.com")).toBeNull();
    expect(parseDomainTarget("https://example.com")).toBeNull();
    expect(parseDomainTarget(`${"a".repeat(64)}.com`)).toBeNull();
    expect(parseDomainTarget(`${"a.".repeat(126)}com`)).toBeNull();
  });
});

describe("parseAddResult", () => {
  const processed = (success = [], errors = []) => ({ processed: { success, errors } });

  it("reports an added domain", () => {
    expect(parseAddResult(processed([{ item: "example.com" }]), "example.com")).toBe("added");
  });

  it("reports a domain that is already listed", () => {
    const payload = processed(
      [],
      [
        {
          item: "example.com",
          error: "UNIQUE constraint failed: domainlist.domain, domainlist.type",
        },
      ]
    );

    expect(parseAddResult(payload, "example.com")).toBe("exists");
    expect(
      parseAddResult(
        processed([], [{ item: "example.com", error: "The item is already present" }]),
        "example.com"
      )
    ).toBe("exists");
  });

  it("throws a static rejection for other errors", () => {
    const payload = processed([], [{ item: "example.com", error: "Invalid domain example.com" }]);

    expect(() => parseAddResult(payload, "example.com")).toThrow(
      expect.objectContaining({
        code: PIHOLE_ERROR_CODES.REJECTED,
        message: "Pi-hole rejected the domain",
      })
    );
  });

  it("throws an invalid response for a malformed payload", () => {
    const invalid = expect.objectContaining({ code: PIHOLE_ERROR_CODES.INVALID_RESPONSE });

    expect(() => parseAddResult(null, "example.com")).toThrow(invalid);
    expect(() => parseAddResult({ processed: { success: [] } }, "example.com")).toThrow(invalid);
    expect(() => parseAddResult(processed([{ item: "other.com" }]), "example.com")).toThrow(
      invalid
    );
  });
});

describe("isDuplicateError", () => {
  const httpError = (status, apiError) =>
    new PiholeError({ code: PIHOLE_ERROR_CODES.HTTP, message: "Bad Request", status, apiError });
  const duplicate = { key: "database_error", hint: "The item is already present" };

  it("recognizes Pi-hole's duplicate entry error", () => {
    expect(isDuplicateError(httpError(400, duplicate))).toBe(true);
  });

  it("ignores other failures", () => {
    expect(isDuplicateError(httpError(400, { ...duplicate, hint: "Invalid regex" }))).toBe(false);
    expect(isDuplicateError(httpError(400, { ...duplicate, key: "bad_request" }))).toBe(false);
    expect(isDuplicateError(httpError(500, duplicate))).toBe(false);
    expect(isDuplicateError(httpError(400))).toBe(false);
    expect(
      isDuplicateError(Object.assign(new Error("x"), { status: 400, apiError: duplicate }))
    ).toBe(false);
  });
});

describe("parseDomains", () => {
  const entry = (overrides) => ({
    domain: "example.com",
    type: "allow",
    kind: "exact",
    enabled: true,
    comment: null,
    id: 1,
    ...overrides,
  });

  it("keeps the fields the list needs", () => {
    expect(
      parseDomains({ domains: [entry(), entry({ type: "deny", kind: "regex", enabled: false })] })
    ).toEqual([
      { domain: "example.com", type: "allow", kind: "exact", enabled: true },
      { domain: "example.com", type: "deny", kind: "regex", enabled: false },
    ]);
  });

  it("accepts an empty list", () => {
    expect(parseDomains({ domains: [] })).toEqual([]);
  });

  it.each([
    ["a missing list", {}],
    ["an unknown type", { domains: [entry({ type: "block" })] }],
    ["an unknown kind", { domains: [entry({ kind: "wildcard" })] }],
    ["an empty domain", { domains: [entry({ domain: "" })] }],
    ["a missing enabled flag", { domains: [entry({ enabled: undefined })] }],
  ])("rejects %s", (_, payload) => {
    expect(() => parseDomains(payload)).toThrow(
      expect.objectContaining({ code: PIHOLE_ERROR_CODES.INVALID_RESPONSE })
    );
  });
});

describe("displayDomain", () => {
  it("shows the wildcard regex /allow stores as *.domain", () => {
    const { domain, kind } = parseDomainTarget("*.ads.example.com");
    expect(displayDomain({ kind, domain })).toBe("*.ads.example.com");
  });

  it("shows other regexes and exact domains as stored", () => {
    expect(displayDomain({ kind: "regex", domain: "^ads[0-9]+\\." })).toBe("^ads[0-9]+\\.");
    expect(displayDomain({ kind: "regex", domain: "(\\.|^)a.b\\.com$" })).toBe("(\\.|^)a.b\\.com$");
    expect(displayDomain({ kind: "exact", domain: "example.com" })).toBe("example.com");
  });
});
