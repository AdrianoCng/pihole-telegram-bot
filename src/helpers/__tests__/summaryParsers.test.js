import { PIHOLE_ERROR_CODES } from "../../errors/PiholeError.js";
import {
  parseBlockingState,
  parseMessageCount,
  parseSummaryResponse,
} from "../summaryParsers.js";

const PAYLOAD = {
  queries: {
    total: 52491, blocked: 8643, percent_blocked: 16.465679, cached: 17952, forwarded: 25896,
    unique_domains: 3000, types: {},
  },
  clients: { active: 23, total: 40 },
  gravity: { domains_being_blocked: 1234567, last_update: 1758700000 },
  took: 0.001,
};

const withField = (section, key, value) => ({
  ...PAYLOAD,
  [section]: { ...PAYLOAD[section], [key]: value },
});

const withoutField = (section, key) => {
  const { [key]: _removed, ...rest } = PAYLOAD[section];
  return { ...PAYLOAD, [section]: rest };
};

const INVALID = expect.objectContaining({ code: PIHOLE_ERROR_CODES.INVALID_RESPONSE });

describe("parseSummaryResponse", () => {
  it("maps a valid installed-API payload to the domain model", () => {
    expect(parseSummaryResponse(PAYLOAD)).toEqual({
      queries: { total: 52491, blocked: 8643, percentBlocked: 16.465679, cached: 17952, forwarded: 25896 },
      activeClients: 23,
      gravityDomains: 1234567,
      gravityLastUpdate: 1758700000,
    });
  });

  it("accepts zero counts and passes gravity.last_update through unvalidated", () => {
    const payload = {
      queries: { total: 0, blocked: 0, percent_blocked: 0, cached: 0, forwarded: 0 },
      clients: { active: 0 },
      gravity: { domains_being_blocked: 0, last_update: "garbage" },
    };

    expect(parseSummaryResponse(payload)).toMatchObject({ gravityLastUpdate: "garbage" });
    expect(parseSummaryResponse({ ...payload, gravity: { domains_being_blocked: 0 } }))
      .toMatchObject({ gravityLastUpdate: undefined });
  });

  const COUNT_FIELDS = [
    ["queries", "total"], ["queries", "blocked"], ["queries", "cached"],
    ["queries", "forwarded"], ["clients", "active"], ["gravity", "domains_being_blocked"],
  ];

  describe.each(COUNT_FIELDS)("%s.%s", (section, key) => {
    it("rejects a missing value", () => {
      expect(() => parseSummaryResponse(withoutField(section, key))).toThrow(INVALID);
    });

    it.each([["a string", "10"], ["negative", -1], ["non-integer", 1.5], ["non-finite", Infinity], ["NaN", NaN], ["null", null]])(
      "rejects %s", (_label, value) => {
        expect(() => parseSummaryResponse(withField(section, key, value))).toThrow(INVALID);
      }
    );
  });

  it.each([["missing", undefined], ["a string", "16.5"], ["negative", -0.1], ["above 100", 100.1], ["NaN", NaN], ["Infinity", Infinity]])(
    "rejects queries.percent_blocked when %s", (_label, value) => {
      expect(() => parseSummaryResponse(withField("queries", "percent_blocked", value))).toThrow(INVALID);
    }
  );

  it.each([0, 100])("accepts percent_blocked at the bound %s", (value) => {
    expect(parseSummaryResponse(withField("queries", "percent_blocked", value)).queries.percentBlocked)
      .toBe(value);
  });

  it.each([null, undefined, {}, { queries: {} }, "text"])("rejects malformed payload %#", (payload) => {
    expect(() => parseSummaryResponse(payload)).toThrow(INVALID);
  });
});

describe("parseBlockingState", () => {
  it.each([
    [{ blocking: "enabled" }, "active"],
    [{ blocking: "disabled" }, "disabled"],
    [{ blocking: "failed" }, "unavailable"],
    [{ blocking: "unknown" }, "unavailable"],
    [{}, "unavailable"],
    [{ blocking: true }, "unavailable"],
    [{ blocking: "ENABLED" }, "unavailable"],
    [null, "unavailable"],
    ["enabled", "unavailable"],
  ])("maps %p to %s", (payload, state) => {
    expect(parseBlockingState(payload)).toBe(state);
  });
});

describe("parseMessageCount", () => {
  it.each([[{ count: 3 }, 3], [{ count: 0 }, 0]])("accepts %p", (payload, count) => {
    expect(parseMessageCount(payload)).toBe(count);
  });

  it.each([{ count: -1 }, { count: 1.5 }, { count: "2" }, {}, null])("rejects %p", (payload) => {
    expect(() => parseMessageCount(payload)).toThrow(INVALID);
  });
});
