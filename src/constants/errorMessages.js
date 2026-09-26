export const ERROR_KINDS = {
  AUTHENTICATION: "AUTHENTICATION",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  NOT_RESPONDING: "NOT_RESPONDING",
  REQUEST_FAILED: "REQUEST_FAILED",
  COMMAND_FAILED: "COMMAND_FAILED",
  UNEXPECTED: "UNEXPECTED",
};

export const NETWORK_ERROR_NAMES = new Set(["TypeError", "TimeoutError", "AbortError"]);

export const DEFAULT_ERROR_MESSAGES = {
  [ERROR_KINDS.AUTHENTICATION]: "❌ Pi-hole authentication failed. Check the configured credentials.",
  [ERROR_KINDS.INVALID_RESPONSE]: "❌ Pi-hole returned an invalid response.",
  [ERROR_KINDS.NOT_RESPONDING]: "❌ Pi-hole is not responding. Try again shortly.",
  [ERROR_KINDS.REQUEST_FAILED]: "❌ Pi-hole request failed.",
  [ERROR_KINDS.COMMAND_FAILED]: (error) => `❌ Command failed with exit code ${error.exitCode}`,
  [ERROR_KINDS.UNEXPECTED]: "❌ Something went wrong. Check the bot logs.",
};
