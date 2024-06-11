/* global __dirname, require, module */
const { resolve } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const mode = process.env.NODE_ENV || 'development';

module.exports = {
  target: 'web',
  mode,
  devtool: 'inline-source-map',
  entry: {
    background: './src/background/index.js',
    content_script: './src/content_script/index.js',
    popup: './src/popup/index.js',
  },
  module: {},
  output: {
    path: resolve(__dirname, 'out'),
    filename: '[name].js',
    library: {
      type: 'module',
    },
    chunkFormat: 'module',
  },
  experiments: {
    outputModule: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        PXE_URL: JSON.stringify(process.env.PXE_URL ?? 'http://127.0.0.1:8080'),
        ADDRESS: JSON.stringify(process.env.ADDRESS),
        PARTIAL_ADDRESS: JSON.stringify(process.env.PARTIAL_ADDRESS),
        PRIVATE_KEY: JSON.stringify(process.env.PRIVATE_KEY),
      },
    }),
    // new webpack.EnvironmentPlugin({
    //   NODE_ENV: 'development',
    // }),
    new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
    new HtmlWebpackPlugin({
      chunks: ['popup'],
    }),
  ],
  resolve: {
    alias: {
      // All node specific code, wherever it's located, should be imported as below.
      // Provides a clean and simple way to always strip out the node code for the web build.
      './node/index.js': false,
    },
    fallback: {
      crypto: false,
      os: false,
      fs: false,
      path: false,
      url: false,
      worker_threads: false,
      buffer: require.resolve('buffer'),
      util: require.resolve('util'),
      stream: require.resolve('stream-browserify'),
      tty: require.resolve('tty-browserify'),
    },
  },
};
