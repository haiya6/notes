import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { Plugin, normalizePath, send } from 'vite'

function buildPHPDoc(filename: string): Promise<string> {
  const { PHP_EXE } = process.env
  if (!PHP_EXE) {
    console.log(`找不到 php 可执行文件`)
    process.exit(1)
  }
  return new Promise((resolve, reject) => {
    let html = ''
    const cp = spawn(PHP_EXE, [filename])
    cp.stdout.on('data', chunk => {
      html += chunk.toString()
    })
    cp.stdout.on('end', () => {
      resolve(html)
    })
    cp.on('error', err => reject(err))
  })
}

function toPHPExt(id: string) {
  return id.replace(/\.php$/i, '.html')
}

function toHTMLExt(id: string) {
  return id.replace(/\.html$/i, '.php')
}

const vitePluginTransformPHP = (): Plugin => {
  return {
    name: 'vite-plugin-transform-php',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (res.writableEnded) return next()
        const url = req.url!.replace(/\?.*$/s, '')
        if (url.endsWith('.php')) {
          const filename = decodeURIComponent(normalizePath(path.join(server.config.root, url.slice(1))))
          if (fs.existsSync(filename)) {
            try {
              let html = await buildPHPDoc(filename)
              html = await server.transformIndexHtml(url, html, req.originalUrl)
              return send(req, res, html, 'html', {
                headers: server.config.server.headers
              })
            } catch (e) {
              return next(e)
            }
          }
        }
        next()
      })
    },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.php')) {
        server.ws.send({ type: 'full-reload' })
      }
    },
    resolveId(id) {
      if (id.endsWith('.php')) {
        // 将 php 后缀修改为 html，以便利用 vite 内置的 html 模块处理
        return toPHPExt(id)
      }
    },
    load(id) {
      // 经过 resolveId 后，php 会变成 html 后缀，尝试解析真实的 php 文件
      if (id.endsWith('.html')) {
        const phpId = toHTMLExt(id)
        if (fs.existsSync(phpId)) {
          return buildPHPDoc(phpId)
        }
      }
    },
  }
}

export default vitePluginTransformPHP
