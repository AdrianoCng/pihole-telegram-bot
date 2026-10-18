export const UNEXPECTED_ERROR_MESSAGE = "❌ Something went wrong. Check the bot logs.";

const MAX_CAUSE_DEPTH = 3;

/**
 * Base for every error the bot throws on purpose. Never instantiated directly.
 * Messages must be static strings because errors are logged in full.
 * `cause` keeps the original error for DEBUG output only.
 */
export class AppError extends Error {
  constructor(message, { code, cause } = {}) {
    if (new.target === AppError) throw new TypeError("AppError is abstract");
    super(message, cause === undefined ? undefined : { cause });
    this.name = new.target.name;
    this.code = code;
  }

  /** The fixed reply shown in Telegram. Subclasses override. */
  get userMessage() {
    return UNEXPECTED_ERROR_MESSAGE;
  }

  /** Allowlisted fields shown when DEBUG is enabled. Undefined values are skipped. */
  debugFields() {
    return { code: this.code, afterRetry: this.afterRetry === true ? true : undefined };
  }

  /** The chain of underlying errors, nearest first, at most MAX_CAUSE_DEPTH deep. */
  debugCauses() {
    const causes = [];
    let cause = this.cause;
    while (cause !== undefined && causes.length < MAX_CAUSE_DEPTH) {
      causes.push(cause);
      cause = cause?.cause;
    }
    return causes;
  }
}
