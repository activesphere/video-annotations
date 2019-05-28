const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        worker: './worker.js',
        control: './control.js',
        background: './background.js',
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