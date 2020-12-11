const path = require('path')
const webpack = require('webpack')
const webpackCommonConf = require('./webpack.common.js')
const { merge } = require('webpack-merge')
const { srcPath, distPath } = require('./paths');
module.exports = merge(webpackCommonConf, {
    mode: 'development',
    entry: {
        index: path.join(srcPath, 'main.ts')
    },
    plugins: [
        new webpack.DefinePlugin({
            ENV: JSON.stringify('development')
        })
    ],
    devServer: {
        port: 8088,
        progress: true,
        contentBase: distPath,
        open: true,
        compress: true,
        hot: true,
        historyApiFallback:true
    },
});
