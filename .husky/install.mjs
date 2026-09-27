if (process.env.NODE_ENV !== "production") {
  const { default: husky } = await import("husky");
  husky();
}
