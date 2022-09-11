import { add } from './helper'

console.log(add(1, 2, 4))

if (import.meta.webpackHot) {
  // 接受指定的依赖更新
  import.meta.webpackHot.accept(['./helper'], function () {
    console.log(add(5, 6))
  })

  // 接受自身模块的更新，会重新运行当前这个文件
  import.meta.webpackHot.accept()
}