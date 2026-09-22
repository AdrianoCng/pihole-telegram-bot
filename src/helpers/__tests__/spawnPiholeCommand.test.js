import execCommandWithOutput from "../execCommandWithOutput.js";
import spawnPiholeCommand from "../spawnPiholeCommand.js";

jest.mock("../execCommandWithOutput.js");

describe("spawnPiholeCommand", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to the command executor without a Telegram context", async () => {
    const onOutput = jest.fn();
    execCommandWithOutput.mockResolvedValue();

    await spawnPiholeCommand(["status"], onOutput);

    expect(execCommandWithOutput).toHaveBeenCalledWith(
      "pihole",
      ["status"],
      onOutput
    );
  });
});
