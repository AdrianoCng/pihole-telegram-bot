import MessageSender from "../MessageSender.js";
import { createMockContext } from "../../__tests__/helpers/testUtils.js";

describe("MessageSender", () => {
  let sender;
  let ctx;

  beforeEach(() => {
    sender = new MessageSender();
    ctx = createMockContext();
  });

  it("sends a plain message", () => {
    sender.send(ctx, "Hello");
    expect(ctx.reply).toHaveBeenCalledWith("Hello", undefined);
  });

  it("replaces [✓] with ✅", () => {
    sender.send(ctx, "[✓] Done");
    expect(ctx.reply).toHaveBeenCalledWith("✅ Done", undefined);
  });

  it("replaces [✗] with ❌", () => {
    sender.send(ctx, "[✗] Failed");
    expect(ctx.reply).toHaveBeenCalledWith("❌ Failed", undefined);
  });

  it("replaces [i] with ℹ️", () => {
    sender.send(ctx, "[i] Info");
    expect(ctx.reply).toHaveBeenCalledWith("ℹ️ Info", undefined);
  });

  it("replaces multiple occurrences", () => {
    sender.send(ctx, "[✓] First [✗] Second [i] Third");
    expect(ctx.reply).toHaveBeenCalledWith("✅ First ❌ Second ℹ️ Third", undefined);
  });

  it("passes extra options to ctx.reply", () => {
    const extra = { parse_mode: "HTML" };
    sender.send(ctx, "Hello", extra);
    expect(ctx.reply).toHaveBeenCalledWith("Hello", extra);
  });

  it("accepts a custom emoji map", () => {
    const customMap = new Map([["[OK]", "👍"]]);
    const customSender = new MessageSender({ emojiMap: customMap });

    customSender.send(ctx, "[OK] Great");
    expect(ctx.reply).toHaveBeenCalledWith("👍 Great", undefined);
  });
});
