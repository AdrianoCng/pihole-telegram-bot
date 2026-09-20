import { COMMANDS } from "../../constants/commands";
import { registerCommands, validateCommands } from "../botCommands";

describe("registerCommands utility function", () => {
  it("Should register all commands to the bot", () => {
    const mockBot = {
      command: jest.fn(),
    };

    registerCommands(mockBot);

    COMMANDS.forEach(({ trigger, handler }) => {
      expect(mockBot.command).toHaveBeenCalledWith(trigger, handler);
    });
  });
});

describe("validateCommands utility function", () => {
  it("rejects aliases that collide with another command", () => {
    expect(() => validateCommands([{ trigger: ["status", "s"] }, { trigger: "s" }]))
      .toThrow("Duplicate command triggers found: s");
  });
  it("Should return true if there are not duplicated commands", () => {
    const commands = [{ trigger: "/a" }, { trigger: "/b" }, { trigger: "/c" }];

    const result = validateCommands(commands);

    expect(result).toBe(true);
  });

  it("Should throw an error if there are duplicate commands", () => {
    const commands = [{ trigger: "/a" }, { trigger: "/a" }, { trigger: "/c" }];

    expect(() => validateCommands(commands)).toThrow();
  });
});
