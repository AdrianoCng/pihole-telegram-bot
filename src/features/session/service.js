import { endSession, refreshSession } from "../../pihole/session.js";
import { PIHOLE_ERROR_CODES } from "../../shared/errors/PiholeError.js";

export async function authorize() {
  try {
    await refreshSession();
    return true;
  } catch (error) {
    if (error?.code === PIHOLE_ERROR_CODES.INVALID_SESSION) return false;
    throw error;
  }
}

export async function logout({ signal } = {}) {
  await endSession({ signal });
}
