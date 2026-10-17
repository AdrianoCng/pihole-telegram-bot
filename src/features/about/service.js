import fs from "fs/promises";

export async function getBotVersion() {
  const packageJson = await fs.readFile(new URL("../../../package.json", import.meta.url), "utf8");

  return JSON.parse(packageJson).version;
}
