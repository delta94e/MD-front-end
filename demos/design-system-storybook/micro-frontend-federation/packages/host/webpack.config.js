const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  entry: "./src/index",
  mode: "development",
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    headers: { "Access-Control-Allow-Origin": "*" },
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    alias: {
      "@mfe-demo/shared-ui": path.resolve(__dirname, "../shared-ui/src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "automatic" }],
              "@babel/preset-typescript",
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "host",
      // ✅ Host CONSUMES remotes
      remotes: {
        remoteProducts: "products@http://localhost:3001/remoteEntry.js",
        remoteCart: "cart@http://localhost:3002/remoteEntry.js",
      },
      // ✅ Shared dependencies — loaded ONCE, used by all
      shared: {
        react: { singleton: true, requiredVersion: "^18.0.0", eager: true },
        "react-dom": { singleton: true, requiredVersion: "^18.0.0", eager: true },
      },
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};
