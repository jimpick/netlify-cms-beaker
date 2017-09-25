/* global module, __dirname, require */
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const HOST = 'localhost';
const PORT = '8080';

module.exports = merge.smart(require('./webpack.base.js'), {
  entry: {
    cms: [
      './index'
    ],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    // publicPath: `http://${ HOST }:${ PORT }/`,
    publicPath: `dat://828f4816e6dddd6fb45a1d6ae697e030aaf23ab9bac588f46b26407d61879383/`,
    library: 'netlify-cms',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  context: path.join(__dirname, 'src'),
  module: {
    noParse: /localforage\.js/,
    loaders: [
      {
        loader: path.resolve(__dirname, './node_modules/babel-loader'),
        test: /\.js?$/,
        exclude: /node_modules/,
        query: {
          plugins: [path.resolve(__dirname, './node_modules/react-hot-loader/babel')],
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
    }),
    new webpack.DefinePlugin({
      NETLIFY_CMS_VERSION: JSON.stringify(require("./package.json").version + "-dev"),
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new ExtractTextPlugin({
      filename: '[name].css',
      // disable: true,
      allChunks: true
    }),
    new CopyWebpackPlugin([
      {
        from: '../example/config.yml'
      },
      {
        from: '../example/site/',
        to: 'site/'
      }
    ]),
    new webpack.SourceMapDevToolPlugin({
      // asset matching
      test: /\.js?$/,
      exclude: /node_modules/,

      // file and reference
      filename: '[file].map',
    }),
  ],
  // devtool: 'source-map'
  /*,
  devServer: {
    hot: true,
    contentBase: 'example/',
    historyApiFallback: true,
    disableHostCheck: true,
    headers: {"Access-Control-Allow-Origin": "*"},
  }, */
});
