import { sendMessage } from "../index.js";
import { createMockContext } from "../../__tests__/helpers/testUtils";

describe("sendMessage", () => {
  const mockCtx = createMockContext();

  it("forwards reply options and returns the reply promise", () => {
    const result = Promise.resolve({ message_id: 1 });
    const extra = { reply_markup: { keyboard: [["/status"]] } };
    mockCtx.reply.mockReturnValueOnce(result);
    expect(sendMessage(mockCtx, "[i] Ready", extra)).toBe(result);
    expect(mockCtx.reply).toHaveBeenCalledWith("ℹ️ Ready", extra);
  });

  it('Should replace all "[✓]" with "✅"', () => {
    const message = `[✓] This is a success message \n [✓] This is another success message`;

    sendMessage(mockCtx, message);

    expect(mockCtx.reply).toHaveBeenCalledWith(message.replaceAll("[✓]", "✅"), undefined);
  });

  it('Should replace all "[✗]" with "❌"', () => {
    const message = `[✗] This is a success message \n [✗] This is another success message`;

    sendMessage(mockCtx, message);

    expect(mockCtx.reply).toHaveBeenCalledWith(message.replaceAll("[✗]", "❌"), undefined);
  });

  it('Should replace all "[i]" with "ℹ️"', () => {
    const message = `[i] This is a success message \n [i] This is another success message`;

    sendMessage(mockCtx, message);

    expect(mockCtx.reply).toHaveBeenCalledWith(message.replaceAll("[i]", "ℹ️"), undefined);
  });
});
