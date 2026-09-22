import piholeService from "../services/piholeService.js";
import systemService from "../services/systemService.js";
import { sendMessage } from "../helpers/index.js";

const sendOutputTo = (ctx) => (output) => sendMessage(ctx, output);

export async function statusController(ctx) {
  await piholeService.getStatus(sendOutputTo(ctx));
}

export async function enableController(ctx) {
  await piholeService.enable(sendOutputTo(ctx));
}

export async function disableController(ctx) {
  await piholeService.disable(sendOutputTo(ctx));
}

export async function versionController(ctx) {
  await piholeService.getVersion(sendOutputTo(ctx));
}

export async function updatePiholeController(ctx) {
  await piholeService.update(sendOutputTo(ctx));
}

export async function upgravityController(ctx) {
  await piholeService.updateGravity(sendOutputTo(ctx));
}

export async function rebootController(ctx) {
  await systemService.reboot(sendOutputTo(ctx));
}

export async function upgradeController(ctx) {
  await systemService.upgradeHost(sendOutputTo(ctx));
}

export default {
  statusController,
  enableController,
  disableController,
  versionController,
  updatePiholeController,
  upgravityController,
  rebootController,
  upgradeController,
};
