import { it, expect, beforeEach, vi } from "vitest";
import { authenticatedPost } from "../../../pihole/session.js";
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
    processed: { success: [], errors: [{ item: domain, error: "UNIQUE constraint failed" }] },
  });

  await expect(addDomain(DOMAIN_LISTS.deny, { kind: "regex", domain })).resolves.toBe("exists");
  expect(authenticatedPost).toHaveBeenCalledWith("/domains/deny/regex", { domain });
});

it("propagates a failed request", async () => {
  const error = new TypeError("fetch failed");
  authenticatedPost.mockRejectedValue(error);

  await expect(
    addDomain(DOMAIN_LISTS.allow, { kind: "exact", domain: "example.com" })
  ).rejects.toBe(error);
});
