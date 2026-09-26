import api from "../api.js";
import { API_ENDPOINTS, REQUEST_TIMEOUT_MS } from "../constants/api.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../errors/PiholeError.js";
import { getEnv } from "../helpers/config.js";

// Internal to the service layer: controllers must not import this module.

let refreshInFlight = null;
let generation = 0;

function requestSignal(signal) {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  return signal ? AbortSignal.any([timeout, signal]) : timeout;
}

function isUnauthorized(error) {
  return error instanceof PiholeError && error.status === 401;
}

async function authenticate(signal) {
  const password = getEnv("PIHOLE_PASSWORD");
  const response = await api.post(
    API_ENDPOINTS.AUTH,
    { password },
    { signal: requestSignal(signal) }
  );
  const session = response?.session;

  if (session?.valid !== true || typeof session.sid !== "string" || session.sid === "") {
    throw new PiholeError({
      code: PIHOLE_ERROR_CODES.INVALID_SESSION,
      message: "Pi-hole returned an invalid session",
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

/** GET with a session, re-authenticating and retrying once after a 401. */
export async function authenticatedGet(path, { signal } = {}) {
  await ensureSession({ signal });
  const startGeneration = generation;

  try {
    return await api.get(path, { signal: requestSignal(signal) });
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
  }

  if (startGeneration === generation) {
    await refreshSession({ signal });
  } else {
    await ensureSession({ signal });
  }

  try {
    return await api.get(path, { signal: requestSignal(signal) });
  } catch (error) {
    error.afterRetry = true;
    throw error;
  }
}

export async function endSession({ signal } = {}) {
  await api.delete(API_ENDPOINTS.AUTH, { signal: requestSignal(signal) });
  api.clearSession();
  generation += 1;
}
