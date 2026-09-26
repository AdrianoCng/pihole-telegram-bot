import CommandError, { COMMAND_ERROR_CODE } from "../CommandError.js";

describe("CommandError", () => {
  it("carries a static message and the command exit code", () => {
    const error = new CommandError(7);

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: "CommandError",
      message: "Command failed",
      code: COMMAND_ERROR_CODE,
      exitCode: 7,
    });
  });
});
