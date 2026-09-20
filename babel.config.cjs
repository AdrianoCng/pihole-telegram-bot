module.exports = {
  presets: [["@babel/preset-env", { targets: { node: "current" } }]],
  // Jest runs CommonJS; preserve module-relative URLs when transforming ESM.
  plugins: [({ types }) => ({
    visitor: {
      MemberExpression(path, state) {
        const { object, property, computed } = path.node;
        if (types.isMetaProperty(object) && object.meta.name === "import" &&
            object.property.name === "meta" && !computed && property.name === "url") {
          path.replaceWith(types.stringLiteral(require("url").pathToFileURL(state.filename).href));
        }
      },
    },
  })],
};
