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
