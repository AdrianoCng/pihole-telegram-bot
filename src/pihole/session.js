import { api } from "./client.js";
import { API_ENDPOINTS } from "./endpoints.js";
import { REQUEST_TIMEOUT_MS } from "../shared/timers.js";
import { ApiAuthError } from "../shared/errors/ApiError.js";
import { env } from "../config.js";

let refreshInFlight = null;
let generation = 0;

function requestSignal(signal) {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  return signal ? AbortSignal.any([timeout, signal]) : timeout;
}

function isUnauthorized(error) {
  return error instanceof ApiAuthError && error.status === 401;
}

async function authenticate(signal) {
  const response = await api.post(
    API_ENDPOINTS.AUTH,
    { password: env.PIHOLE_PASSWORD },
    { signal: requestSignal(signal) }
  );
  const session = response?.session;

  if (session?.valid !== true || typeof session.sid !== "string" || session.sid === "") {
    throw new ApiAuthError({
      message: "Pi-hole returned an invalid session",
      method: "POST",
      path: API_ENDPOINTS.AUTH,
    });
  }

  api.setSession(session.sid);
  generation += 1;
}

/** Authenticate, sharing one in-flight request between concurrent callers. */
export function refreshSession({ signal } = {}) {
  if (!refreshInFlight) {
    refreshInFlight = authenticate(signal).finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function ensureSession({ signal } = {}) {
  if (refreshInFlight) {
    await refreshInFlight;
    return;
  }

  if (api.hasSession()) return;

  await refreshSession({ signal });
}

/** Request with a session, re-authenticating and retrying once after a 401. */
async function authenticatedRequest(method, path, { body, signal } = {}) {
  await ensureSession({ signal });
  const startGeneration = generation;

  try {
    return await api.request(method, path, { body, signal: requestSignal(signal) });
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
  }

  if (startGeneration === generation) {
    await refreshSession({ signal });
  } else {
    await ensureSession({ signal });
  }

  try {
    return await api.request(method, path, { body, signal: requestSignal(signal) });
  } catch (error) {
    error.afterRetry = true;
    throw error;
  }
}

export function authenticatedGet(path, { signal } = {}) {
  return authenticatedRequest("GET", path, { signal });
}

/** A 401 means Pi-hole rejected the write before processing it, so the retry is safe. */
export function authenticatedPost(path, body, { signal } = {}) {
  return authenticatedRequest("POST", path, { body, signal });
}

export async function endSession({ signal } = {}) {
  try {
    await api.delete(API_ENDPOINTS.AUTH, { signal: requestSignal(signal) });
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
  } finally {
    api.clearSession();
    generation += 1;
  }
}
