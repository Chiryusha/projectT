const viteEnvPlugin = () => ({
  visitor: {
    MemberExpression(path) {
      const { node } = path;
      const object = node.object;

      const isImportMetaEnv =
        object &&
        object.type === "MemberExpression" &&
        object.object &&
        object.object.type === "MetaProperty" &&
        object.object.meta.name === "import" &&
        object.object.property.name === "meta" &&
        object.property &&
        object.property.type === "Identifier" &&
        object.property.name === "env";

      if (!isImportMetaEnv || node.property.type !== "Identifier") {
        return;
      }

      path.replaceWithSourceString(`process.env.${node.property.name}`);
    },
  },
});

module.exports = {
  plugins: [viteEnvPlugin],
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
    ["@babel/preset-typescript", { allowDeclareFields: true }],
  ],
};
