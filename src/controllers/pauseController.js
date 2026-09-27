import piholeService from "../services/piholeService.js";
import { sendMessage } from "../helpers/index.js";
import { parseDuration } from "../helpers/duration.js";
import { pauseKeyboard } from "../helpers/keyboard.js";

const USAGE_MESSAGE =
  "Send /pause <time>, e.g. /pause 90s, /pause 15m or /pause 1h (max 24h).";

async function runPause(ctx, seconds) {
  await piholeService.pause(seconds, (output) => sendMessage(ctx, output));
}

export async function pauseController(ctx) {
  const payload = ctx.payload?.trim();

  if (!payload) {
    await sendMessage(ctx, "Pause blocking for how long?", pauseKeyboard());
    return;
  }

  const seconds = parseDuration(payload);

  if (seconds === null) {
    await sendMessage(ctx, `❌ Invalid duration. ${USAGE_MESSAGE}`);
    return;
  }

  await runPause(ctx, seconds);
}

export async function pauseActionController(ctx) {
  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined);

  const choice = ctx.match[1];

  if (choice === "custom") {
    await sendMessage(ctx, USAGE_MESSAGE);
    return;
  }

  const seconds = parseDuration(choice);

  if (seconds === null) {
    await sendMessage(ctx, `❌ Invalid duration. ${USAGE_MESSAGE}`);
    return;
  }

  await runPause(ctx, seconds);
}

export default { pauseController, pauseActionController };
