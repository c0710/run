const webpack = require('webpack')
const merge = require('webpack-merge')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const webpackCommonConf = require('./webpack.common.js')
const { distPath } = require('./paths')

module.exports = merge(webpackCommonConf, {
    mode: 'production',
    output: {
        filename: 'js/[name].[contentHash:8].js',
        path: distPath,
        publicPath:'/'
    },
    plugins: [
        new CleanWebpackPlugin(), // 会默认清空 output.path 文件夹
        new webpack.DefinePlugin({
            ENV: JSON.stringify('production')
        })
    ]
});
