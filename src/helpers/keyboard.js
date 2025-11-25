import { Markup } from "telegraf";
import { COMMANDS } from "../constants/commands.js";

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

