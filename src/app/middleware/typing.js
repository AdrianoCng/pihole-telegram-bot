export default async (ctx, next) => {
  await ctx.persistentChatAction("typing", async () => {
    await next();
  });
};
