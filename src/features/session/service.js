import { endSession, refreshSession } from "../../pihole/session.js";

export async function authorize() {
  await refreshSession();
}

export async function logout({ signal } = {}) {
  await endSession({ signal });
}
