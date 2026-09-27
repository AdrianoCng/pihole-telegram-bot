import { Markup } from "telegraf";
import piholeService from "../services/piholeService.js";
import { sendMessage } from "../helpers/index.js";
import { formatDuration, parseDuration } from "../helpers/duration.js";
import {
  PAUSE_ACTION_PREFIX,
  PAUSE_CUSTOM_ACTION,
  PAUSE_PRESETS,
} from "../constants/pause.js";

const USAGE_MESSAGE =
  "Send /pause <time>, e.g. /pause 90s, /pause 15m or /pause 1h (max 24h).";

const pauseKeyboard = () =>
  Markup.inlineKeyboard(
    [
      ...PAUSE_PRESETS.map(({ label, seconds }) =>
        Markup.button.callback(label, `${PAUSE_ACTION_PREFIX}${seconds}`)
      ),
      Markup.button.callback("Custom…", PAUSE_CUSTOM_ACTION),
    ],
    { columns: 2 }
  );

async function runPause(ctx, seconds) {
  await piholeService.pause(seconds, (output) => sendMessage(ctx, output));
  await sendMessage(
    ctx,
    `⏸ Blocking paused for ${formatDuration(seconds)}. It will resume automatically, or send /enable to resume now.`
  );
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
