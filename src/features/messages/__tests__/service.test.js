import { it, expect, vi } from "vitest";
import { authenticatedGet } from "../../../pihole/session.js";
import { getMessages } from "../service.js";

vi.mock("../../../pihole/session.js");

it("returns null for malformed Pi-hole messages", async () => {
  authenticatedGet.mockResolvedValue({ messages: "invalid" });
  await expect(getMessages()).resolves.toBeNull();
});
