import api from "../api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { CLI_COMMANDS } from "../constants/cli.js";
import { getEnv } from "../helpers/config.js";
import spawnPiholeCommand from "../helpers/spawnPiholeCommand.js";

export async function authorize() {
  const response = await api.post(API_ENDPOINTS.AUTH, {
    password: getEnv("PIHOLE_PASSWORD"),
  });
  const sid = response?.session?.sid;

  if (!sid) {
    return false;
  }

  api.setHeader("sid", sid);
  return true;
}

export async function logout() {
  await api.delete(API_ENDPOINTS.AUTH);
  api.setHeader("sid", "");
}

export async function getMessages() {
  const response = await api.get(API_ENDPOINTS.INFO.MESSAGES);
  return Array.isArray(response?.messages) ? response.messages : null;
}

export function getStatus(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.STATUS], onOutput);
}

export function enable(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.ENABLE], onOutput);
}

export function disable(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.DISABLE], onOutput);
}

export function getVersion(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.VERSION], onOutput);
}

export function update(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.UPDATE], onOutput);
}

export function updateGravity(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.UPGRAVITY], onOutput);
}

export default {
  authorize,
  logout,
  getMessages,
  getStatus,
  enable,
  disable,
  getVersion,
  update,
  updateGravity,
};
