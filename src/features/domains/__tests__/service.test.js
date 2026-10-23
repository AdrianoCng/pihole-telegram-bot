import { it, expect, beforeEach, vi } from "vitest";
import {
  authenticatedDelete,
  authenticatedGet,
  authenticatedPost,
} from "../../../pihole/session.js";
import { ApiError } from "../../../shared/errors/ApiError.js";
import { DOMAIN_LISTS, SEARCH_LIMIT } from "../constants.js";
import { addDomain, checkDomain, listDomains, removeDomain } from "../service.js";

vi.mock("../../../pihole/session.js");

beforeEach(() => {
  vi.resetAllMocks();
});

it("adds an exact domain to the allowlist", async () => {
  authenticatedPost.mockResolvedValue({
    processed: { success: [{ item: "example.com" }], errors: [] },
  });

  await expect(
    addDomain(DOMAIN_LISTS.allow, { kind: "exact", domain: "example.com" })
  ).resolves.toBe("added");
  expect(authenticatedPost).toHaveBeenCalledWith("/domains/allow/exact", {
    domain: "example.com",
  });
});

it("adds a wildcard regex to the denylist", async () => {
  const domain = "(\\.|^)example\\.com$";
  authenticatedPost.mockResolvedValue({
    processed: { success: [], errors: [{ item: domain, error: "The item is already present" }] },
  });

  await expect(addDomain(DOMAIN_LISTS.deny, { kind: "regex", domain })).resolves.toBe("exists");
  expect(authenticatedPost).toHaveBeenCalledWith("/domains/deny/regex", { domain });
});

const badRequest = (hint) =>
  new ApiError({
    message: "Bad Request",
    status: 400,
    apiError: { key: "database_error", hint },
  });

it("reports an entry Pi-hole rejects as already present", async () => {
  authenticatedPost.mockRejectedValue(badRequest("The item is already present"));

  await expect(
    addDomain(DOMAIN_LISTS.allow, { kind: "exact", domain: "example.com" })
  ).resolves.toBe("exists");
});

it("propagates other bad requests", async () => {
  const error = badRequest("Invalid regex");
  authenticatedPost.mockRejectedValue(error);

  await expect(addDomain(DOMAIN_LISTS.deny, { kind: "regex", domain: "(" })).rejects.toBe(error);
});

it("propagates a failed request", async () => {
  const error = new TypeError("fetch failed");
  authenticatedPost.mockRejectedValue(error);

  await expect(
    addDomain(DOMAIN_LISTS.allow, { kind: "exact", domain: "example.com" })
  ).rejects.toBe(error);
});

it("removes an exact domain from the allowlist", async () => {
  authenticatedDelete.mockResolvedValue(null);

  await expect(
    removeDomain(DOMAIN_LISTS.allow, { kind: "exact", domain: "example.com" })
  ).resolves.toBe("removed");
  expect(authenticatedDelete).toHaveBeenCalledWith("/domains/allow/exact/example.com");
});

it("encodes a wildcard regex in the delete path", async () => {
  authenticatedDelete.mockResolvedValue(null);

  await expect(
    removeDomain(DOMAIN_LISTS.deny, { kind: "regex", domain: "(\\.|^)example\\.com$" })
  ).resolves.toBe("removed");
  expect(authenticatedDelete).toHaveBeenCalledWith(
    "/domains/deny/regex/(%5C.%7C%5E)example%5C.com%24"
  );
});

it("reports an entry that is not on the list", async () => {
  authenticatedDelete.mockRejectedValue(new ApiError({ message: "Not Found", status: 404 }));

  await expect(
    removeDomain(DOMAIN_LISTS.allow, { kind: "exact", domain: "example.com" })
  ).resolves.toBe("missing");
});

it("propagates a failed delete", async () => {
  const error = new ApiError({ message: "Internal Server Error", status: 500 });
  authenticatedDelete.mockRejectedValue(error);

  await expect(
    removeDomain(DOMAIN_LISTS.deny, { kind: "exact", domain: "example.com" })
  ).rejects.toBe(error);
});

it("lists every domain entry", async () => {
  authenticatedGet.mockResolvedValue({
    domains: [{ domain: "example.com", type: "deny", kind: "exact", enabled: true }],
  });

  await expect(listDomains()).resolves.toEqual([
    { domain: "example.com", type: "deny", kind: "exact", enabled: true },
  ]);
  expect(authenticatedGet).toHaveBeenCalledWith("/domains");
});

it("propagates a failed list request", async () => {
  const error = new TypeError("fetch failed");
  authenticatedGet.mockRejectedValue(error);

  await expect(listDomains()).rejects.toBe(error);
});

it("checks a domain against rules and subscribed lists", async () => {
  authenticatedGet.mockImplementation(async (path) =>
    path === "/groups"
      ? { groups: [{ id: 0, name: "Default", enabled: true }] }
      : {
          search: {
            domains: [
              { domain: "example.com", type: "allow", kind: "exact", enabled: true, groups: [0] },
            ],
            gravity: [],
          },
        }
  );

  await expect(checkDomain("example.com")).resolves.toEqual({
    domain: "example.com",
    rules: [{ domain: "example.com", type: "allow", kind: "exact", enabled: true, groups: [0] }],
    lists: [],
    truncated: false,
    groups: new Map([[0, { name: "Default", enabled: true }]]),
  });
  expect(authenticatedGet).toHaveBeenCalledWith(
    `/search/example.com?partial=false&N=${SEARCH_LIMIT + 1}`
  );
  expect(authenticatedGet).toHaveBeenCalledWith("/groups");
});

it("propagates a failed check", async () => {
  const error = new TypeError("fetch failed");
  authenticatedGet.mockRejectedValue(error);

  await expect(checkDomain("example.com")).rejects.toBe(error);
});
