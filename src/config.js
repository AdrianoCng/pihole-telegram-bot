/** Read required configuration when it is needed. Empty strings remain valid. */
export function getEnv(key) {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/** Read an optional boolean flag. Only "true" or "1" enable it. */
export function getBooleanEnv(key) {
  const value = process.env[key]?.trim().toLowerCase();
  return value === "true" || value === "1";
}

export const REQUIRED_ENV = ["BOT_TOKEN", "PIHOLE_IP", "PIHOLE_PASSWORD", "ALLOWED_USER"];

/** Fail fast at startup instead of on the first command that needs a value. */
export function validateConfig(env = process.env) {
  const missing = REQUIRED_ENV.filter((key) => env[key] === undefined);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
