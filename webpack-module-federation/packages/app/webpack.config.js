const { ModuleFederationPlugin } = require('webpack').container
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

/**
 * @type {import('webpack').Configuration & import('webpack-dev-server').Configuration}
 */
const config = {
  mode: 'development',
  entry: path.resolve(__dirname, './src/index.js'),
  devtool: false,
  output: {
    path: path.resolve(__dirname, './dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'index.html')
    }),
    new ModuleFederationPlugin({
      remotes: {
        modulea: 'modulea@http://localhost:8080/dist/modulea.js'
      }
    })
  ],
  devServer: {
    port: 8081,
  }
}

module.exports = config
