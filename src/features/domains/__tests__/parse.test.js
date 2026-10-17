import { describe, it, expect } from "vitest";
import { PIHOLE_ERROR_CODES } from "../../../shared/errors/PiholeError.js";
import { parseAddResult, parseDomainTarget } from "../parse.js";

const exact = (domain) => ({ kind: "exact", domain, display: domain });

describe("parseDomainTarget", () => {
  it("accepts an exact domain", () => {
    expect(parseDomainTarget("example.com")).toEqual(exact("example.com"));
    expect(parseDomainTarget("  ads.tracker-1.example.co.uk ")).toEqual(
      exact("ads.tracker-1.example.co.uk")
    );
    expect(parseDomainTarget("_dmarc.example.com")).toEqual(exact("_dmarc.example.com"));
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

  it("rejects missing or extra arguments", () => {
    expect(parseDomainTarget(undefined)).toBeNull();
    expect(parseDomainTarget("   ")).toBeNull();
    expect(parseDomainTarget("example.com other.com")).toBeNull();
  });

  it("rejects wildcards other than a leading *.", () => {
    expect(parseDomainTarget("*")).toBeNull();
    expect(parseDomainTarget("*.")).toBeNull();
    expect(parseDomainTarget("*.com")).toBeNull();
    expect(parseDomainTarget("ads.*.com")).toBeNull();
    expect(parseDomainTarget("a*.example.com")).toBeNull();
    expect(parseDomainTarget("*example.com")).toBeNull();
    expect(parseDomainTarget("*.*.example.com")).toBeNull();
  });

  it("rejects invalid hostnames", () => {
    expect(parseDomainTarget("localhost")).toBeNull();
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
