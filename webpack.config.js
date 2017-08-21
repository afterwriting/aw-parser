const path = require('path');

module.exports = {
    entry: {
        index: './index.js'
    },
    output: {
        filename: 'aw-parser.amd.js',
        libraryTarget: "umd",
        library: 'awParser',
        path: path.resolve(__dirname, 'dist')
    }
};