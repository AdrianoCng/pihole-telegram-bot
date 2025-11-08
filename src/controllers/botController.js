import { sendMessage } from "../helpers/index.js";
import fs from "fs/promises";
import path from "path";

const botVersionController = async (ctx) => {
  const packageJson = await fs.readFile(
    path.resolve(process.cwd(), "package.json"),
    "utf8"
  );
  const version = JSON.parse(packageJson).version;

  sendMessage(ctx, `The bot version is v${version}`);
};

export default {
  botVersionController,
};
