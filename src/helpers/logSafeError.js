/**
 * Log a Pi-hole failure using only allowlisted fields. Never pass headers,
 * session IDs, passwords, payloads, or raw error objects to the console.
 */
export function logSafeError({
  operation,
  error,
  path = error?.path,
  afterRetry = error?.afterRetry === true,
}) {
  const details = { operation, path };

  if (error?.status !== undefined) details.status = error.status;
  if (error?.name !== undefined) details.name = error.name;
  if (error?.code !== undefined) details.code = error.code;
  if (error?.exitCode !== undefined) details.exitCode = error.exitCode;
  details.afterRetry = afterRetry;

  console.error(JSON.stringify(details));
}

export default logSafeError;
