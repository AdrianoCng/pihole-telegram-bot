import { describe, it, expect } from "vitest";
import { AppError } from "../AppError.js";
import {
  ApiAuthError,
  ApiError,
  ApiRejectedError,
  ApiResponseError,
  ApiUnreachableError,
} from "../ApiError.js";
import { CommandError, CommandTimeoutError } from "../CommandError.js";

describe("AppError", () => {
  it("cannot be instantiated directly", () => {
    expect(() => new AppError("boom")).toThrow("AppError is abstract");
  });

  it.each([
    [ApiError, "API"],
    [ApiAuthError, "API_AUTH"],
    [ApiUnreachableError, "API_UNREACHABLE"],
    [ApiResponseError, "API_INVALID_RESPONSE"],
    [ApiRejectedError, "API_REJECTED"],
    [CommandError, "COMMAND_FAILED"],
    [CommandTimeoutError, "COMMAND_TIMEOUT"],
  ])("%o is an AppError with its own name, code and reply", (ErrorClass, code) => {
    const cause = new Error("root");
    const error = new ErrorClass({ cause });

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(ErrorClass.name);
    expect(error.code).toBe(code);
    expect(error.cause).toBe(cause);
    expect(error.userMessage).toMatch(/^❌ /);
    expect(error.debugCauses()).toEqual([cause]);
  });

  it("keeps Pi-hole subclasses catchable as ApiError and timeouts as CommandError", () => {
    expect(new ApiAuthError()).toBeInstanceOf(ApiError);
    expect(new CommandTimeoutError()).toBeInstanceOf(CommandError);
  });

  it("omits cause when none is given", () => {
    expect(new ApiResponseError()).not.toHaveProperty("cause");
    expect(new ApiResponseError().debugCauses()).toEqual([]);
  });
});
