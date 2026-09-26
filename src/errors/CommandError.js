export const COMMAND_ERROR_CODE = "COMMAND_FAILED";

/**
 * A host command that exited with a nonzero status.
 * The message is static because errors are logged in full.
 */
class CommandError extends Error {
  constructor(exitCode) {
    super("Command failed");
    this.name = "CommandError";
    this.code = COMMAND_ERROR_CODE;
    this.exitCode = exitCode;
  }
}

export default CommandError;
