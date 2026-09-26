import { ERROR_KINDS } from "../../constants/errorMessages.js";
import CommandError from "../CommandError.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../PiholeError.js";
import { classifyError } from "../classifyError.js";

const piholeError = (code, status) =>
  new PiholeError({ code, message: "Static failure", status });

describe("classifyError", () => {
  it.each([
    ["a 401 response", piholeError(PIHOLE_ERROR_CODES.HTTP, 401), ERROR_KINDS.AUTHENTICATION],
    ["an invalid session", piholeError(PIHOLE_ERROR_CODES.INVALID_SESSION), ERROR_KINDS.AUTHENTICATION],
    ["an invalid response", piholeError(PIHOLE_ERROR_CODES.INVALID_RESPONSE), ERROR_KINDS.INVALID_RESPONSE],
    ["another Pi-hole error", piholeError(PIHOLE_ERROR_CODES.HTTP, 500), ERROR_KINDS.REQUEST_FAILED],
    ["a command failure", new CommandError(2), ERROR_KINDS.COMMAND_FAILED],
    ["a network failure", new TypeError("fetch failed"), ERROR_KINDS.NOT_RESPONDING],
    ["a timeout", new DOMException("timed out", "TimeoutError"), ERROR_KINDS.NOT_RESPONDING],
    ["an abort", new DOMException("aborted", "AbortError"), ERROR_KINDS.NOT_RESPONDING],
    ["an ordinary error", new Error("unexpected"), ERROR_KINDS.UNEXPECTED],
    ["a non-error value", null, ERROR_KINDS.UNEXPECTED],
  ])("classifies %s", (_case, error, expected) => {
    expect(classifyError(error)).toBe(expected);
  });
});
