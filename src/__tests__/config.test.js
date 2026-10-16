import { afterEach, describe, expect, it } from "vitest";
import { getBooleanEnv } from "../config.js";

describe("getBooleanEnv", () => {
  afterEach(() => {
    delete process.env.TEST_FLAG;
  });

  it.each([
    ["true", true],
    ["TRUE", true],
    [" 1 ", true],
    ["false", false],
    ["0", false],
    ["yes", false],
    ["", false],
  ])("parses %j as %s", (value, expected) => {
    process.env.TEST_FLAG = value;
    expect(getBooleanEnv("TEST_FLAG")).toBe(expected);
  });

  it("is false when unset", () => {
    expect(getBooleanEnv("TEST_FLAG")).toBe(false);
  });
});
