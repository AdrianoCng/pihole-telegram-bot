import piholeService from "../services/piholeService.js";
import sendMessage from "../helpers/sendMessage.js";
import { renderSummary } from "../helpers/summaryFormat.js";

export async function summaryController(ctx) {
  const summary = await piholeService.getSummary();
  await sendMessage(ctx, renderSummary(summary, Date.now()));
}

export default { summaryController };
