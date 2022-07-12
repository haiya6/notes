var _rAF: Function | undefined = typeof requestAnimationFrame !== 'undefined' 
  ? requestAnimationFrame : undefined

export function setRAF(r: Function) {
  _rAF = r
}

export default function rAF(callback: Function) {
  if (!_rAF) {
    throw new Error('Not called setup')
  }
  _rAF(callback)
}
