var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'eval',
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    './index'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  resolve: {
    extensions: ['', '.js', '.styl', '.woff'],
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['react-hot', 'babel'],
      exclude: /node_modules/
    }, {
      test: /\.styl$/,
      loaders: [
        'style-loader',
        'css',
        'autoprefixer?browsers=last 2 version',
        'stylus'
      ]
    }, {
      test: /\.css$/,
        loaders: [
          'style-loader',
          'css',
          'autoprefixer?browsers=last 2 version'
        ]
    },
    { test: /\.woff$/, loader: "url-loader?limit=10000&minetype=application/font-woff" }
    ]
  }
};
