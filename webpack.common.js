const path = require("path");

module.exports = {
  entry: {
    app: "./js/app.js",
    sw: "./js/sw.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    clean: true,
    filename: (pathData) => {
      if (pathData.chunk.name === "sw") {
        return "sw.js";
      }
      return "./js/[name].js";
    },
  },
};
