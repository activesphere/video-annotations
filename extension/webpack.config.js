const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './inject.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'inject.bundled.js',
    },

    plugins: [
        new CopyPlugin([
            { from: './background.js', to: 'background.js' },
            { from: './manifest.json', to: 'manifest.json' },
            { from: './va.png', to: 'va.png' },
        ]),
    ],
};
