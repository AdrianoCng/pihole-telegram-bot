import Config from "../Config.js";

describe("Config", () => {
  it("returns the value for an existing key", () => {
    const config = new Config({ FOO: "bar" });
    expect(config.get("FOO")).toBe("bar");
  });

  it("throws for a missing key", () => {
    const config = new Config({});
    expect(() => config.get("MISSING")).toThrow(
      "Missing required environment variable: MISSING"
    );
  });

  it("returns empty string values without throwing", () => {
    const config = new Config({ EMPTY: "" });
    expect(config.get("EMPTY")).toBe("");
  });

  it("does not expose the env object directly", () => {
    const env = { SECRET: "value" };
    const config = new Config(env);
    expect(config.env).toBeUndefined();
  });
});
