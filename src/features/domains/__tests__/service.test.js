import { it, expect, beforeEach, vi } from "vitest";
import { authenticatedPost } from "../../../pihole/session.js";
import { PiholeError, PIHOLE_ERROR_CODES } from "../../../shared/errors/PiholeError.js";
import { DOMAIN_LISTS } from "../constants.js";
import { addDomain } from "../service.js";

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
  new PiholeError({
    code: PIHOLE_ERROR_CODES.HTTP,
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
