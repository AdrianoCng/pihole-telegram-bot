import { Markup } from "telegraf";
import { COMMANDS } from "../constants/commands.js";
import { PAUSE_ACTION_PREFIX, PAUSE_CUSTOM_ACTION, PAUSE_PRESETS } from "../constants/pause.js";

export const getMainMenu = () => {
  return Markup.keyboard(
    COMMANDS.reduce((acc, command) => {
      if (command.showInKeyboard === false) {
        return acc;
      }

      const trigger = Array.isArray(command.trigger)
        ? command.trigger[0]
        : command.trigger;
      return [...acc, `/${trigger}`];
    }, []),
    { columns: 2 }
  ).resize();
};

export const pauseKeyboard = () =>
  Markup.inlineKeyboard(
    [
      ...PAUSE_PRESETS.map(({ label, seconds }) =>
        Markup.button.callback(label, `${PAUSE_ACTION_PREFIX}${seconds}`)
      ),
      Markup.button.callback("Custom…", PAUSE_CUSTOM_ACTION),
    ],
    { columns: 2 }
  );