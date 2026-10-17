import { it, expect, beforeEach, vi } from "vitest";
import { refreshSession } from "../../../pihole/session.js";
import { PiholeError, PIHOLE_ERROR_CODES } from "../../../shared/errors/PiholeError.js";
import { authorize } from "../service.js";

vi.mock("../../../pihole/session.js");

beforeEach(() => {
  vi.resetAllMocks();
});

it("treats an invalid session differently from rejected credentials", async () => {
  refreshSession.mockRejectedValueOnce(
    new PiholeError({
      code: PIHOLE_ERROR_CODES.INVALID_SESSION,
      message: "invalid session",
    })
  );
  await expect(authorize()).resolves.toBe(false);

  refreshSession.mockRejectedValueOnce(
    new PiholeError({
      code: PIHOLE_ERROR_CODES.HTTP,
      message: "unauthorized",
      status: 401,
    })
  );
  await expect(authorize()).rejects.toMatchObject({ status: 401 });
});
