var path = require('path'),
    merge = require('webpack-merge'),
    webpack = require('webpack'),
	  ExtractTextPlugin = require('extract-text-webpack-plugin');

var staticPrefix = 'waartaa/static/',
    distPath = staticPrefix + '/dist';

const TARGET = process.env.npm_lifecycle_event;
process.env.BABEL_ENV = TARGET;

const common = {
  entry: {
    app: path.join(__dirname, staticPrefix, 'app'),
    'waartaa': path.join(__dirname, staticPrefix, 'scss/waartaa.scss'),
  },
  context: path.join(__dirname, staticPrefix),
  resolve: {
    extensions: ['', '.js', '.jsx'],
    modulesDirectories: ['node_modules']
  },
  resolveLoader: {
    root: path.resolve(__dirname, 'node_modules')
  },
  output: {
    path: distPath,
    filename: 'waartaa.js',
    sourceMapFilename: '[name].js.map',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: true,
          presets: ['react', 'es2015', 'stage-0']
        },
      },
      {
        test: /\.scss$/,
        include: path.join(__dirname, staticPrefix, 'scss'),
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader!sass-loader')
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
      contentBase: distPath,
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
      new ExtractTextPlugin('styles.css'),
    ]
  });
}

if (TARGET === 'build') {
  module.exports = merge(common, {
    plugins: [
      new ExtractTextPlugin('styles.css'),
    ]
  });
}
