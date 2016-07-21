var path = require("path");
var webpack = require("webpack");
var BowerWebpackPlugin = require("bower-webpack-plugin");
var production = process.env.NODE_ENV === 'production';
var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");

configObj = {
  entry:  {
    videoDetection: 'videoDetectionService',
    oauth: 'chrome_oauth_receiver',
    background: 'background',
    shareApp: 'ShareApp',
  },
  output: {
    path:     'builds/extension/bundles',
    filename: '[name].bundle.js',
  },
  resolve: {
    root: [
      path.join(__dirname, "js"),
      path.join(__dirname, "js/share_app"),
      path.join(__dirname, "bower_components"),
      path.join(__dirname, "styles")
    ],
    extensions: ['', '.js', '.jsx']
  },
  module: {
    preLoaders: [{
      test: /\.js$|\.jsx$/,
      exclude: /node_modules|bower_components|vendor/,
      loader: 'eslint-loader'
    }],
    loaders: [
    {
      test:   /\.jsx?$/,
      loader: 'babel',
      include: __dirname + '/js',
      exclude: /node_modules|bower_components/,
      query: {
        presets: ['react', 'es2015']
      },
    },
    {
      test: /\.less/,
      loaders: ['style', 'css', 'less']
    },
    { test: /\.(woff(2)?|ttf|eot|svg)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000000mimetype=application/font-woff" },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    new BowerWebpackPlugin(),
    new CommonsChunkPlugin('commons.chunk.js')
  ],
};

if (!production) {
  configObj.devtool = '#eval-source-map';
} else {
  configObj.plugins.push(new webpack.optimize.UglifyJsPlugin());
}

module.exports = configObj;
