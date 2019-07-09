const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'yt-inject': './yt-inject.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundled.js',
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },

  plugins: [
    new CopyPlugin([
      { from: './manifest.json', to: 'manifest.json' },
      { from: './va.png', to: 'va.png' },
      { from: './yt-override.css', to: 'yt-override.css' },
    ]),
  ],
};
