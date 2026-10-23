import { describe, it, expect } from "vitest";
import { ApiError, ApiResponseError } from "../../../shared/errors/ApiError.js";
import {
  displayDomain,
  isDuplicateError,
  isNotFoundError,
  parseAddResult,
  parseCheckTarget,
  parseDomainTarget,
  parseDomains,
  parseGroups,
  parseSearch,
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
        name: "ApiRejectedError",
        code: "API_REJECTED",
        message: "Pi-hole rejected the domain",
      })
    );
  });

  it("throws an invalid response for a malformed payload", () => {
    const invalid = expect.objectContaining({ code: "API_INVALID_RESPONSE" });

    expect(() => parseAddResult(null, "example.com")).toThrow(invalid);
    expect(() => parseAddResult({ processed: { success: [] } }, "example.com")).toThrow(invalid);
    expect(() => parseAddResult(processed([{ item: "other.com" }]), "example.com")).toThrow(
      invalid
    );
  });
});

describe("isDuplicateError", () => {
  const httpError = (status, apiError) =>
    new ApiError({ message: "Bad Request", status, apiError });
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

describe("isNotFoundError", () => {
  it("recognizes a 404 from Pi-hole", () => {
    expect(isNotFoundError(new ApiError({ status: 404 }))).toBe(true);
  });

  it("ignores other failures", () => {
    expect(isNotFoundError(new ApiError({ status: 400 }))).toBe(false);
    expect(isNotFoundError(Object.assign(new Error("x"), { status: 404 }))).toBe(false);
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
      expect.objectContaining({ code: "API_INVALID_RESPONSE" })
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

describe("parseCheckTarget", () => {
  it("accepts one domain, lowercased without a trailing dot", () => {
    expect(parseCheckTarget(" Ads.Example.COM. ")).toBe("ads.example.com");
  });

  it.each([undefined, "", "*.example.com", "a b", "bad_domain-.com"])("rejects %j", (payload) => {
    expect(parseCheckTarget(payload)).toBeNull();
  });
});

const searchRule = (overrides = {}) => ({
  domain: "example.com",
  type: "deny",
  kind: "exact",
  enabled: true,
  groups: [0],
  comment: null,
  id: 1,
  ...overrides,
});

const searchList = (overrides = {}) => ({
  domain: "example.com",
  address: "https://lists.example/hosts",
  type: "block",
  enabled: true,
  groups: [0, 2],
  id: 3,
  ...overrides,
});

describe("parseSearch", () => {
  it("keeps the fields /check shows", () => {
    expect(parseSearch({ search: { domains: [searchRule()], gravity: [searchList()] } })).toEqual({
      rules: [{ domain: "example.com", type: "deny", kind: "exact", enabled: true, groups: [0] }],
      lists: [
        { address: "https://lists.example/hosts", type: "block", enabled: true, groups: [0, 2] },
      ],
      truncated: false,
    });
  });

  it("is not truncated at exactly the limit", () => {
    const { truncated } = parseSearch({
      search: {
        domains: Array.from({ length: 20 }, () => searchRule()),
        gravity: Array.from({ length: 20 }, (_, i) => searchList({ address: `https://l/${i}` })),
      },
    });
    expect(truncated).toBe(false);
  });

  it("flags and drops results past the limit", () => {
    const { rules, lists, truncated } = parseSearch({
      search: {
        domains: Array.from({ length: 21 }, () => searchRule()),
        gravity: Array.from({ length: 21 }, (_, i) => searchList({ address: `https://l/${i}` })),
      },
    });
    expect(truncated).toBe(true);
    expect(rules).toHaveLength(20);
    expect(lists).toHaveLength(20);
  });

  it("flags when only the lists exceed the limit", () => {
    const { truncated } = parseSearch({
      search: {
        domains: [],
        gravity: Array.from({ length: 21 }, (_, i) => searchList({ address: `https://l/${i}` })),
      },
    });
    expect(truncated).toBe(true);
  });

  it("shows a list that matches more than once a single time", () => {
    const { lists } = parseSearch({
      search: { domains: [], gravity: [searchList(), searchList({ domain: "||example.com^" })] },
    });
    expect(lists).toHaveLength(1);
  });

  it.each([
    ["missing search", {}],
    ["missing gravity", { search: { domains: [] } }],
    ["unknown rule type", { search: { domains: [searchRule({ type: "block" })], gravity: [] } }],
    ["non-boolean enabled", { search: { domains: [searchRule({ enabled: 1 })], gravity: [] } }],
    ["invalid group id", { search: { domains: [searchRule({ groups: ["0"] })], gravity: [] } }],
    ["unknown list type", { search: { domains: [], gravity: [searchList({ type: "deny" })] } }],
    ["missing address", { search: { domains: [], gravity: [searchList({ address: "" })] } }],
  ])("rejects %s", (_, payload) => {
    expect(() => parseSearch(payload)).toThrow(ApiResponseError);
  });
});

describe("parseGroups", () => {
  it("maps group IDs to name and state", () => {
    expect(
      parseGroups({ groups: [{ id: 0, name: "Default", enabled: true, comment: null }] })
    ).toEqual(new Map([[0, { name: "Default", enabled: true }]]));
  });

  it.each([
    {},
    { groups: [{ id: -1, name: "x", enabled: true }] },
    { groups: [{ id: 0, name: "x" }] },
  ])("rejects %j", (payload) => {
    expect(() => parseGroups(payload)).toThrow(ApiResponseError);
  });
});
