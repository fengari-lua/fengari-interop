"use strict";

const webpack = require('webpack');
const path = require('path');

module.exports = [
  {
    entry: './src/jslib.js',
    target: 'web',
    node: false,
    output: {
      path: path.resolve(__dirname, 'dist'),
      libraryTarget: 'umd',
      filename: 'fengari_interop.js',
      library: 'fengari_interop'
    },
    externals: {
      fengari: {
        commonjs: 'fengari',
        commonjs2: 'fengari',
        amd: 'fengari',
        root: 'fengari'
      }
    },
    module: {
      rules: [
        {
          test: [/\.js$/],
          loader: 'babel-loader',
          options: {
            presets: [['env', {
              "targets": {
                "browsers": ["last 2 versions", "safari >= 7"]
              }
            }]]
          }
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        WEB: JSON.stringify(true),
      })
    ]
  }
];
