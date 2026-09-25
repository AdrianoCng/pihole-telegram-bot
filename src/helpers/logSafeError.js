/**
 * Log a Pi-hole failure using only allowlisted fields. Never pass headers,
 * session IDs, passwords, payloads, or raw error objects to the console.
 */
export function logSafeError({ operation, path, error, afterRetry = error?.afterRetry === true }) {
  const details = { operation, path };

  if (error?.status !== undefined) details.status = error.status;
  if (error?.name !== undefined) details.name = error.name;
  if (error?.code !== undefined) details.code = error.code;
  details.afterRetry = afterRetry;

  console.error("[pihole] Request failed:", JSON.stringify(details));
}

export default logSafeError;
