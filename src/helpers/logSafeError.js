/**
 * Log a Pi-hole failure using an allowlist of fields. Never pass headers,
 * payloads, credentials, or raw error objects to the console.
 */
export function logSafeError({ operation, path, error, afterRetry = error?.afterRetry === true }) {
  const details = { operation, path, afterRetry };

  if (error?.status !== undefined) details.status = error.status;
  if (error?.name !== undefined) details.name = error.name;
  if (error?.code !== undefined) details.code = error.code;

  console.error("[pihole] Request failed:", details);
}
