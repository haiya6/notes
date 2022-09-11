const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

/**
 * @type {import('webpack').Configuration & import('webpack-dev-server').Configuration}
 */
const config = {
  mode: 'development',
  entry: path.resolve(__dirname, './src/index.js'),
  devtool: false,
  plugins: [
    new HtmlWebpackPlugin(),
  ],
}

module.exports = config
