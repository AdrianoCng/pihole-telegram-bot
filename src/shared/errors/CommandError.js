import { AppError } from "./AppError.js";

/**
 * A host command that failed to start or exited unsuccessfully.
 * `command` is the static command line, never user input.
 * `signal` is set when the process was killed by a signal.
 */
export class CommandError extends AppError {
  constructor({
    message = "Command failed",
    code = "COMMAND_FAILED",
    command,
    exitCode,
    signal,
    cause,
  } = {}) {
    super(message, { code, cause });
    this.command = command;
    this.exitCode = exitCode;
    this.signal = signal;
  }

  get userMessage() {
    return typeof this.exitCode === "number"
      ? `❌ Command failed with exit code ${this.exitCode}`
      : "❌ Command failed.";
  }

  debugFields() {
    return {
      ...super.debugFields(),
      command: this.command,
      exitCode: this.exitCode,
      signal: this.signal,
    };
  }
}

/** A host command killed after COMMAND_TIMEOUT_MS. */
export class CommandTimeoutError extends CommandError {
  constructor(options = {}) {
    super({ message: "Command timed out", code: "COMMAND_TIMEOUT", ...options });
  }

  get userMessage() {
    return "❌ Command timed out.";
  }
}
