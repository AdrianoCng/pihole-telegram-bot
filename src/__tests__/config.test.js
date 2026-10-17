import { afterEach, expect, it, vi } from "vitest";

async function loadConfig(values) {
  vi.resetModules();
  vi.stubEnv("PIHOLE_URL", undefined);
  vi.stubEnv("PIHOLE_IP", undefined);
  for (const [key, value] of Object.entries(values)) vi.stubEnv(key, value);
  return import("../config.js");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("falls back to the deprecated PIHOLE_IP with a warning", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const { env } = await loadConfig({ PIHOLE_IP: "http://old.test" });
  expect(env.PIHOLE_URL).toBe("http://old.test");
  expect(warn).toHaveBeenCalledWith(expect.stringContaining("PIHOLE_IP is deprecated"));
});

it("prefers PIHOLE_URL over PIHOLE_IP without warning", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const { env } = await loadConfig({
    PIHOLE_URL: "http://new.test",
    PIHOLE_IP: "http://old.test",
  });
  expect(env.PIHOLE_URL).toBe("http://new.test");
  expect(warn).not.toHaveBeenCalled();
});
