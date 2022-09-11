const { ModuleFederationPlugin } = require('webpack').container
const path = require('path')

/**
 * @type {import('webpack').Configuration & import('webpack-dev-server').Configuration}
 */
const config = {
  mode: 'development',
  entry: path.resolve(__dirname, './src/index.js'),
  devtool: false,
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: 'http://localhost:8080/dist/'
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'modulea',
      filename: 'modulea.js',
      exposes: {
        './add': path.resolve(__dirname, 'src/add.js'),
        './say': path.resolve(__dirname, 'src/say.js')
      }
    })
  ],
  devServer: {
    port: 8080,
  }
}

module.exports = config
