import { getMainMenu } from "../keyboard.js";

jest.mock("telegraf", () => ({
  Markup: {
    keyboard: jest.fn((buttons, options) => ({
      resize: jest.fn(() => ({ buttons, options })),
    })),
  },
}));

describe("getMainMenu", () => {
  it("generates keyboard from commands with first trigger", () => {
    const commands = [
      { trigger: ["authorize", "a"], description: "Auth", showInKeyboard: true },
      { trigger: ["status", "s"], description: "Status" },
    ];

    const result = getMainMenu(commands);

    expect(result.buttons).toEqual(["/authorize", "/status"]);
    expect(result.options).toEqual({ columns: 2 });
  });

  it("excludes commands with showInKeyboard false", () => {
    const commands = [
      { trigger: ["authorize", "a"], description: "Auth" },
      { trigger: ["menu"], description: "Menu", showInKeyboard: false },
    ];

    const result = getMainMenu(commands);

    expect(result.buttons).toEqual(["/authorize"]);
  });

  it("handles string triggers", () => {
    const commands = [{ trigger: "help", description: "Help" }];

    const result = getMainMenu(commands);

    expect(result.buttons).toEqual(["/help"]);
  });
});
