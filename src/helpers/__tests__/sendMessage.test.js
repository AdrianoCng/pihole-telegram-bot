import { sendMessage } from "../index.js";
import { createMockContext } from "../../__tests__/helpers/testUtils";

describe("sendMessage", () => {
  const mockCtx = createMockContext();

  it('Should replace all "[✓]" with "✅"', () => {
    const message = `[✓] This is a success message \n [✓] This is another success message`;

    sendMessage(mockCtx, message);

    expect(mockCtx.reply).toHaveBeenCalledWith(message.replaceAll("[✓]", "✅"));
  });

  it('Should replace all "[✗]" with "❌"', () => {
    const message = `[✗] This is a success message \n [✗] This is another success message`;

    sendMessage(mockCtx, message);

    expect(mockCtx.reply).toHaveBeenCalledWith(message.replaceAll("[✗]", "❌"));
  });

  it('Should replace all "[i]" with "ℹ️"', () => {
    const message = `[i] This is a success message \n [i] This is another success message`;

    sendMessage(mockCtx, message);

    expect(mockCtx.reply).toHaveBeenCalledWith(message.replaceAll("[i]", "ℹ️"));
  });
});
