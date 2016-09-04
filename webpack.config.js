var path = require('path'),
    merge = require('webpack-merge'),
    webpack = require('webpack'),
	ExtractTextPlugin = require('extract-text-webpack-plugin');

var staticPrefix = 'waartaa/static/';

const TARGET = process.env.npm_lifecycle_event;
const PATHS = {
  app: path.join(__dirname, staticPrefix, '/app'),
  build: path.join(__dirname, staticPrefix, '/js')
};

process.env.BABEL_ENV = TARGET;

const common = {
  entry: {
    app: PATHS.app
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  output: {
    path: PATHS.build,
    filename: 'waartaa.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel',
        query: {
          cacheDirectory: true,
          presets: ['react', 'es2015', 'stage-0']
        },
        include: PATHS.app
      },
      {
        test: /\.scss$/,
        loaders: ['style', 'css', 'scss'],
      },
    ]
  }
};

if (TARGET === 'start' || !TARGET) {
  module.exports = merge(common, {
    watchOptions: {
      poll: true
    },
    devtool: 'eval-source-map',
    devServer: {
      contentBase: PATHS.build,
      historyApiFallback: true,
      hot: true,
      inline: true,
      progress: true,
      stats: 'errors-only',
      host: process.env.HOST,
      port: process.env.PORT
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
    ]
  });
}

if (TARGET === 'build') {
  module.exports = merge(common, {});
}
