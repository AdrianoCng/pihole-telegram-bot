import { it, expect, beforeEach, vi } from "vitest";
import { refreshSession } from "../../../pihole/session.js";
import { ApiAuthError } from "../../../shared/errors/ApiError.js";
import { authorize } from "../service.js";

vi.mock("../../../pihole/session.js");

beforeEach(() => {
  vi.resetAllMocks();
});

it("refreshes the session", async () => {
  refreshSession.mockResolvedValue();

  await expect(authorize()).resolves.toBeUndefined();
  expect(refreshSession).toHaveBeenCalledTimes(1);
});

it("propagates authentication failures to the error boundary", async () => {
  const error = new ApiAuthError({ message: "Pi-hole returned an invalid session" });
  refreshSession.mockRejectedValue(error);

  await expect(authorize()).rejects.toBe(error);
});
