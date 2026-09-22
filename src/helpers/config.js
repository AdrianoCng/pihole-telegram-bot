/** Read required configuration when it is needed. Empty strings remain valid. */
export function getEnv(key) {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
