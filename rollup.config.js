import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import replace from '@rollup/plugin-replace'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs',
    exports: 'default'
  },
  plugins: [
    typescript(),
    replace({
      preventAssignment: true,
      values: {
        __WXS__: `true`
      }
    })
  ]
})
