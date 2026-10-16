import { afterEach, describe, expect, it } from "vitest";
import { getBooleanEnv, REQUIRED_ENV, validateConfig } from "../config.js";

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

describe("validateConfig", () => {
  const complete = Object.fromEntries(REQUIRED_ENV.map((key) => [key, "value"]));

  it("accepts a complete configuration, including empty strings", () => {
    expect(() => validateConfig({ ...complete, PIHOLE_PASSWORD: "" })).not.toThrow();
  });

  it("names every missing variable", () => {
    const { BOT_TOKEN: _token, ALLOWED_USER: _user, ...partial } = complete;
    expect(() => validateConfig(partial)).toThrow(
      "Missing required environment variables: BOT_TOKEN, ALLOWED_USER"
    );
  });
});
