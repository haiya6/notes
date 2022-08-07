import path from 'path'
import { defineConfig } from 'vite'
import vitePluginTransformPHP from './vitePluginTransformPHP'

export default defineConfig({
  plugins: [
    vitePluginTransformPHP()
  ],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.php')
      }
    }
  }
})