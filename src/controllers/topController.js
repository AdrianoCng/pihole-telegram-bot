import piholeService from "../services/piholeService.js";
import sendMessage from "../helpers/sendMessage.js";
import { renderTop } from "../helpers/topFormat.js";

export async function topController(ctx) {
  const top = await piholeService.getTop();
  await sendMessage(ctx, renderTop(top), { parse_mode: "HTML" });
}

export default { topController };
