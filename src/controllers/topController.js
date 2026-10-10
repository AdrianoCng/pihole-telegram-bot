import piholeService from "../services/piholeService.js";
import { sendMessage } from "../helpers/index.js";
import { renderTop } from "../helpers/topFormat.js";

export async function topController(ctx) {
  const top = await piholeService.getTop();
  await sendMessage(ctx, renderTop(top));
}

export default { topController };
