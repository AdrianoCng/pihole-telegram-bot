import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import createContainer from "./src/container.js";
import createBot from "./src/bot.js";
import Config from "./src/services/Config.js";
import PiholeApiClient from "./src/services/PiholeApiClient.js";
import MessageSender from "./src/services/MessageSender.js";
import CommandExecutor from "./src/services/CommandExecutor.js";
import PiholeCommandExecutor from "./src/services/PiholeCommandExecutor.js";
import { commandFactories } from "./src/commands/index.js";
import createAuthMiddleware from "./src/middlewares/authenticate.js";
import { getMainMenu } from "./src/ui/keyboard.js";
import typing from "./src/middlewares/typing.js";

// Composition root: all wiring happens here
const container = createContainer();

container.register("config", () => new Config(process.env));
container.register(
  "httpClient",
  (c) =>
    new PiholeApiClient({
      baseUrl: `${c.resolve("config").get("PIHOLE_IP")}/api`,
    })
);
container.register("messageSender", () => new MessageSender());
container.register(
  "commandExecutor",
  (c) => new CommandExecutor({ messageSender: c.resolve("messageSender") })
);
container.register(
  "piholeExecutor",
  (c) =>
    new PiholeCommandExecutor({
      commandExecutor: c.resolve("commandExecutor"),
    })
);

const config = container.resolve("config");
const httpClient = container.resolve("httpClient");
const messageSender = container.resolve("messageSender");
const commandExecutor = container.resolve("commandExecutor");
const piholeExecutor = container.resolve("piholeExecutor");

// Build command definitions from factories
const readVersion = async () => {
  const packageJson = await fs.readFile(
    path.resolve(__dirname, "package.json"),
    "utf8"
  );
  return JSON.parse(packageJson).version;
};
const deps = { httpClient, messageSender, config, piholeExecutor, commandExecutor, readVersion };
const commands = commandFactories.map((factory) => {
  // The menu command has a circular dependency: it needs the command list that is
  // still being built. We detect it via the `needsMenu` flag on the factory and
  // pass `getMainMenu` as a lazy function so it resolves after the array is complete.
  if (factory.needsMenu) {
    return factory({ ...deps, getMainMenu: () => getMainMenu(commands) });
  }
  return factory(deps);
});

const authMiddleware = createAuthMiddleware({ config, messageSender });
const mainMenu = getMainMenu(commands);

const bot = createBot({
  botToken: config.get("BOT_TOKEN"),
  commands,
  middlewares: [authMiddleware, typing],
  messageSender,
  mainMenu,
});

const telegramCommands = commands.map((cmd) => ({
  command: Array.isArray(cmd.trigger) ? cmd.trigger[0] : cmd.trigger,
  description: cmd.description,
}));

await bot.telegram.setMyCommands(telegramCommands).catch((err) => {
  console.error("[warn] Failed to register commands with Telegram:", err.message);
});
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
