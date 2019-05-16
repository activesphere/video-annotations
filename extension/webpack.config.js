const path = require('path');

module.exports = {
    entry: './inject.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'inject.bundled.js',
    },
};
