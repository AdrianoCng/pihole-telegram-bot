import execCommandWithOutput from "../helpers/execCommandWithOutput.js";

export function reboot(onOutput) {
  return execCommandWithOutput("reboot", [], onOutput);
}

export async function upgradeHost(onOutput) {
  await execCommandWithOutput("apt-get", ["update"], onOutput);
  await execCommandWithOutput("apt-get", ["full-upgrade", "-y"], onOutput);
  await execCommandWithOutput("apt-get", ["autoremove", "-y"], onOutput);
  await execCommandWithOutput("apt-get", ["clean"], onOutput);
}

export default { reboot, upgradeHost };
