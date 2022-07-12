import { to } from './core'
import { setRAF } from './adapters/rAF'

function setup(ins: any) {
  setRAF(ins.requestAnimationFrame)
}


export default {
  setup,
  to,
}