import { it, expect } from "vitest";
import { parseRecentFilter } from "../recentFilter.js";

const client = (param, value) => ({ type: "client", param, value });
const domain = (value) => ({ type: "domain", param: "domain", value });

it("treats an empty or whitespace-only payload as all clients", () => {
  expect(parseRecentFilter(undefined)).toEqual({ type: "all" });
  expect(parseRecentFilter("")).toEqual({ type: "all" });
  expect(parseRecentFilter("   \t ")).toEqual({ type: "all" });
});

it("filters by client IP", () => {
  expect(parseRecentFilter(" 192.168.1.5 ")).toEqual(client("client_ip", "192.168.1.5"));
  expect(parseRecentFilter("fd00::1")).toEqual(client("client_ip", "fd00::1"));
  expect(parseRecentFilter("::ffff:192.168.1.5")).toEqual(
    client("client_ip", "::ffff:192.168.1.5")
  );
});

it("rejects IPv6 zone IDs", () => {
  expect(parseRecentFilter("fe80::1%eth0")).toBeNull();
});

it("filters by client name as typed", () => {
  expect(parseRecentFilter("My-Phone")).toEqual(client("client_name", "My-Phone"));
  expect(parseRecentFilter("laptop.lan")).toEqual(client("client_name", "laptop.lan"));
  expect(parseRecentFilter("_host")).toEqual(client("client_name", "_host"));
});

it("filters by client IP with wildcards", () => {
  expect(parseRecentFilter("192.168.1.*")).toEqual(client("client_ip", "192.168.1.*"));
  expect(parseRecentFilter("10.*")).toEqual(client("client_ip", "10.*"));
  expect(parseRecentFilter("fd00::*")).toEqual(client("client_ip", "fd00::*"));
});

it("filters by client name with wildcards", () => {
  expect(parseRecentFilter("*phone*")).toEqual(client("client_name", "*phone*"));
  expect(parseRecentFilter("Laptop-*")).toEqual(client("client_name", "Laptop-*"));
});

it("filters by domain with wildcards", () => {
  expect(parseRecentFilter("domain *.Example.com.")).toEqual(domain("*.example.com"));
  expect(parseRecentFilter("domain *doubleclick*")).toEqual(domain("*doubleclick*"));
});

it("filters by domain, lowercased without a trailing dot", () => {
  expect(parseRecentFilter("domain ads.example.com")).toEqual(domain("ads.example.com"));
  expect(parseRecentFilter("DOMAIN  Ads.Example.COM.")).toEqual(domain("ads.example.com"));
  expect(parseRecentFilter("Domain localhost")).toEqual(domain("localhost"));
});

it("never treats the domain keyword as a client name", () => {
  expect(parseRecentFilter("domain")).toBeNull();
  expect(parseRecentFilter("Domain")).toBeNull();
});

it.each([
  ["a b"],
  ["domain a b"],
  ["client 192.168.1.5"],
  ["a&b"],
  ["x<y>"],
  ["a=b"],
  ["a/b"],
  ["-host"],
  [".host"],
  ["a".repeat(254)],
  ["domain ."],
  ["domain a&b=c"],
  ["domain -ads.example.com"],
  ["192.168.1.5:53"],
  ["*"],
  ["**"],
  ["*.*"],
  ["domain *"],
  ["domain *.*"],
  ["fe80::*%eth0"],
  ["*?"],
])("rejects %j", (payload) => {
  expect(parseRecentFilter(payload)).toBeNull();
});

it("accepts names up to 253 characters", () => {
  const name = "a".repeat(253);
  expect(parseRecentFilter(name)).toEqual(client("client_name", name));
});
