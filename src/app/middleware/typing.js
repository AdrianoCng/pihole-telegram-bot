export async function typing(ctx, next) {
  await ctx.persistentChatAction("typing", async () => {
    await next();
  });
}
