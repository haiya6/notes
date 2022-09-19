import { Plugin, send, ViteDevServer } from 'vite'
import posthtml from 'posthtml'
import fs from 'fs-extra'
import path from 'node:path'
import { transformAsync, parseAsync } from '@babel/core'
import traverse from '@babel/traverse'
import generator from '@babel/generator'
import * as types from '@babel/types'
import { v4 as uuidv4 } from 'uuid'

type CacheConfig = Record<string, string>

const POLYFILL_PATH = '/@iedev/polyfill'
// fetch polyfill 不包含在 core-js 中
// https://github.com/zloirock/core-js/blob/b61f3c334f7a3010f376eae4fc465e68232da102/README.md#missing-polyfills
const FETCH_POLYFILL_PATH = '/@iedev/polyfill-fetch'
const SYSTEMJS_PATH = '/@iedev/systemjs'
const NODE_MODULES_DIR = path.join(process.cwd(), 'node_modules')
// babel transform 后的缓存目录
const CACHE_DIR = path.join(NODE_MODULES_DIR, '.iedev')
const CACHE_CONFIG_PATH = path.resolve(CACHE_DIR, 'cache.json')

const isViteClientPath = (url: string) => url.includes('@vite') || url.includes('vite/dist/client')

const loadCacheContent = (id: string) => {
  if (!fs.pathExistsSync(CACHE_CONFIG_PATH)) return null
  const cacheConfig: CacheConfig = fs.readJSONSync(CACHE_CONFIG_PATH)
  if (id in cacheConfig && fs.pathExistsSync(path.resolve(CACHE_DIR, cacheConfig[id]))) {
    return (fs.readFileSync(path.resolve(CACHE_DIR, cacheConfig[id]))).toString()
  }
  return null
}

const cacheContent = (id: string, content: string) => {
  let config: CacheConfig = {}
  if (fs.pathExistsSync(CACHE_CONFIG_PATH)) {
    config = fs.readJSONSync(CACHE_CONFIG_PATH)
  }
  config[id] = uuidv4()
  fs.outputJSONSync(CACHE_CONFIG_PATH, config),
  fs.outputFileSync(path.resolve(CACHE_DIR, config[id]), content)
}

const transformViteClient = async (code: string) => {
  const ast = await parseAsync(code)
  
  traverse(ast, {
    ClassDeclaration(path) {
      // 删除 ErrorOverlay 相关的不兼容 IE 定义
      if (path.node.id.name === 'ErrorOverlay') {
        if (path.node.superClass) {
          path.node.superClass = types.classExpression(null, null, types.classBody([]))
        }
      }
    }
  })
  
  return generator(ast).code
}

const transformESMToSystemjs = (code: string, filename: string, { ast }: { ast: boolean}) => {
  return transformAsync(code, {
    presets: [
      [
        '@babel/preset-env',
        {
          modules: 'systemjs',
          useBuiltIns: false
        }
      ]
    ],
    filename,
    ast,
  })
}

const vitePluginIEDev = (): Plugin => {
  let server: ViteDevServer

  const vitePluginIEDevPostTransform: Plugin = {
    name: 'vite-plugin-ie-dev-post-transform',

    async transform(code, id) {
      if (new URLSearchParams(id.split('?')[1] || '').has('direct')) return

      if (isViteClientPath(id)) {
        code = await transformViteClient(code)
      }

      const cached = loadCacheContent(id)
      if (cached) return { code: cached, map: { mappings: '' } }

      const transformResult = await transformESMToSystemjs(code, id, { ast: true })

      if (!isViteClientPath(id) && /node_modules/.test(id)) {
        // cache
        cacheContent(id, transformResult.code)
      }

      return {
        code: transformResult.code,
        map: { mappings: '' }
      }
    },
  }

  return {
    name: 'vite-plugin-ie-dev',
    apply: 'serve',
    enforce: 'post',

    configResolved(config) {
      // @ts-ignore 非正常使用
      config.plugins.push(vitePluginIEDevPostTransform)
    },

    configureServer(_server) {
      server = _server

      server.middlewares.use(async (req, res, next) => {
        // core-js
        if (req.url === POLYFILL_PATH) {
          const content = await fs.readFile(
            path.resolve(NODE_MODULES_DIR, 'core-js-bundle/index.js'),
            'utf-8'
          )
          return send(req, res, content.toString(), 'js', {})
        }

        // fetch-polyfill
        if (req.url === FETCH_POLYFILL_PATH) {
          const content = await fs.readFile(
            path.resolve(NODE_MODULES_DIR, 'whatwg-fetch/dist/fetch.umd.js'),
            'utf-8'
          )
          return send(req, res, content.toString(), 'js', {})
        }

        // systemjs
        if (req.url === SYSTEMJS_PATH) {
          const content = await fs.readFile(
            path.resolve(NODE_MODULES_DIR, 'systemjs/dist/system.js'),
            'utf-8'
          )
          return send(req, res, content.toString(), 'js', {})
        }

        next()
      })
    },

    transformIndexHtml: {
      enforce: 'post',

      async transform(html) {
        const result = await posthtml([
          tree => {
            tree.match({ tag: 'script' }, node => {
              const attrs = node.attrs as Record<string, string> | undefined

              if (attrs && attrs.type === 'module') {
                attrs.type = 'systemjs-module'
              }

              return node
            })
          }
        ])
          .process(html)

        return {
          html: result.html,
          tags: [
            {
              tag: 'script',
              injectTo: 'head-prepend',
              attrs: {
                src: POLYFILL_PATH
              }
            },
            {
              tag: 'script',
              injectTo: 'head-prepend',
              attrs: {
                src: FETCH_POLYFILL_PATH
              }
            },
            {
              tag: 'script',
              injectTo: 'head-prepend',
              children: `;window.HTMLElement.prototype.after = function after(node) {
                this.parentNode.insertBefore(node, this.nextSibling)
              };
              window.HTMLElement.prototype.remove = function remove() {
                this.parentNode.removeChild(this)
              };`
            },
            {
              tag: 'script',
              injectTo: 'head-prepend',
              attrs: {
                src: SYSTEMJS_PATH
              }
            }
          ]
        }
      }
    },
  }
}

export default vitePluginIEDev
