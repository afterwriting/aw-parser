const path = require('path');

module.exports = {
    entry: {
        index: './index.js'
    },
    output: {
        filename: 'aw-parser.js',
        libraryTarget: "umd",
        path: path.resolve(__dirname, 'dist')
    }
};