import { Markup } from "telegraf";
import sendMessage, { sendOutputTo } from "../../shared/telegram/sendMessage.js";
import {
  PAUSE_ACTION_PATTERN,
  PAUSE_ACTION_PREFIX,
  PAUSE_CUSTOM_ACTION,
  PAUSE_PRESETS,
} from "./constants.js";
import { parseDuration } from "./duration.js";
import { pause } from "./service.js";

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

const USAGE_MESSAGE = "Send /pause <time>, e.g. /pause 90s, /pause 15m or /pause 1h (max 24h).";

async function pauseFor(ctx, text) {
  const seconds = parseDuration(text);

  if (seconds === null) {
    await sendMessage(ctx, `❌ Invalid duration. ${USAGE_MESSAGE}`);
    return;
  }

  await pause(seconds, sendOutputTo(ctx));
}

export const pauseCommand = {
  trigger: ["pause", "p"],
  description: "Temporarily disable blocking",
  async handler(ctx) {
    const payload = ctx.payload?.trim();

    if (!payload) {
      await sendMessage(ctx, "Pause blocking for how long?", pauseKeyboard());
      return;
    }

    await pauseFor(ctx, payload);
  },
};

/** Handles the inline keyboard sent by /pause without a duration. */
export const pauseAction = {
  trigger: PAUSE_ACTION_PATTERN,
  async handler(ctx) {
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined);

    const choice = ctx.match[1];

    if (choice === "custom") {
      await sendMessage(ctx, USAGE_MESSAGE);
      return;
    }

    await pauseFor(ctx, choice);
  },
};
