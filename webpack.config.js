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
    waartaa: path.join(__dirname, staticPrefix, 'app/index.jsx'),
    bootstrap: path.join(__dirname, staticPrefix, 'scss/waartaa.scss'),
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
    modulesDirectories: ['node_modules'],
    root: [
        path.resolve(__dirname, staticPrefix, 'app')
    ]
  },
  resolveLoader: {
    root: path.resolve(__dirname, 'node_modules')
  },
  output: {
    path: distPath,
    filename: '[name].js',
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
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new ExtractTextPlugin('styles.css'),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        },
      }),
    ]
  });
}

if (TARGET === 'build') {
  module.exports = merge(common, {});
}
