'use strict';

var webpack = require('webpack');
var baseConfig = require('./webpack.config');

var config = Object.create(baseConfig);

config.plugins = [
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoErrorsPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('development')
  })
];

config.devtool = 'eval';
config.entry = [
  'webpack-dev-server/client?http://localhost:3000',
  'webpack/hot/only-dev-server',
  './index'
]


console.log(config);


module.exports = config;
