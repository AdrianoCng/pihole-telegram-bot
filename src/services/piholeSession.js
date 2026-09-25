import api from "../api.js";
import { API_ENDPOINTS, REQUEST_TIMEOUT_MS } from "../constants/api.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../errors/PiholeError.js";
import { getEnv } from "../helpers/config.js";

/**
 * Internal to the service layer: owns the Pi-hole API session lifecycle.
 * Controllers must go through piholeService instead of importing this module.
 */

let refreshInFlight = null;
let generation = 0;

function requestSignal(signal) {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  return signal ? AbortSignal.any([timeout, signal]) : timeout;
}

function isUnauthorized(error) {
  return error?.isApiError === true && error.status === 401;
}

async function authenticate(signal) {
  const response = await api.post(
    API_ENDPOINTS.AUTH,
    { password: getEnv("PIHOLE_PASSWORD") },
    { signal: requestSignal(signal) }
  );
  const session = response?.session;

  if (session?.valid !== true || typeof session.sid !== "string" || session.sid === "") {
    throw new PiholeError(PIHOLE_ERROR_CODES.INVALID_SESSION);
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

/** Reuse the current session, or authenticate when none exists. */
export async function ensureSession({ signal } = {}) {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  if (api.hasSession()) {
    return;
  }

  return refreshSession({ signal });
}

/** GET with transparent authentication and exactly one retry after a 401. */
export async function authenticatedGet(path, { signal } = {}) {
  await ensureSession({ signal });
  const startGeneration = generation;

  try {
    return await api.get(path, { signal: requestSignal(signal) });
  } catch (error) {
    if (!isUnauthorized(error)) {
      throw error;
    }
  }

  if (generation === startGeneration) {
    await refreshSession({ signal });
  } else {
    await ensureSession({ signal });
  }

  try {
    return await api.get(path, { signal: requestSignal(signal) });
  } catch (error) {
    if (error !== null && typeof error === "object") {
      error.afterRetry = true;
    }
    throw error;
  }
}

/** End the Pi-hole session; keep the local SID if Pi-hole did not confirm. */
export async function endSession({ signal } = {}) {
  await api.delete(API_ENDPOINTS.AUTH, { signal: requestSignal(signal) });
  api.clearSession();
  generation += 1;
}

/** Tests only: forget module-level session bookkeeping. */
export function resetSessionState() {
  refreshInFlight = null;
  generation = 0;
}
