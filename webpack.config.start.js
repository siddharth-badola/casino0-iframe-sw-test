const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const { getConfig } = require("./config");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  plugins: [
    new webpack.DefinePlugin({
      "process.env": getConfig("./.env.local"),
    }),
    new HtmlWebpackPlugin({
      template: "./index.html",
      scriptLoading: "defer",
      minify: false,
    }),
  ],
  devServer: {
    liveReload: true,
    hot: true,
    open: true,
    static: ["./"],
    port: 8090,
    proxy: [
      {
        context: ["/api"],
        target: new URL(atob(process.env.API_URL)).origin,
        changeOrigin: true,
      },
    ],
  },
});
