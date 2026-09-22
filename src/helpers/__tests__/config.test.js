import { getEnv } from "../config.js";

describe("getEnv", () => {
  const originalEnv = process.env;
  beforeEach(() => { process.env = {}; });
  afterEach(() => { process.env = originalEnv; });

  it("reads current values, including empty strings", () => {
    process.env.VALUE = "configured";
    expect(getEnv("VALUE")).toBe("configured");
    process.env.VALUE = "";
    expect(getEnv("VALUE")).toBe("");
  });

  it("throws only when a missing value is requested", () => {
    expect(() => getEnv("MISSING")).toThrow("Missing required environment variable: MISSING");
  });
});
