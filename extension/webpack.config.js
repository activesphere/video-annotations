const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'yt-inject': './yt-inject.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundled.js',
  },

  plugins: [
    new CopyPlugin([
      { from: './manifest.json', to: 'manifest.json' },
      { from: './va.png', to: 'va.png' },
    ]),
  ],
};
