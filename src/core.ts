import Easing, { EasingFunction } from './Easing'
import Utils from './Utils'

interface Target {
  [p: string]: any
}

type TweenVars = [string, number][]

interface TweenOptions {
  duration?: number
  easing?: EasingFunction
  position?: number
  onUpdate?(): void
  onComplete?(): void
}

export function to(target: Target, vars: TweenVars, options?: TweenOptions) {
  options = options || {}
  var startTime = Date.now()
  var duration = options.duration || 0.5
  var easing = options.easing || Easing.linear

  var initVars = {} as Record<string, number>
  var targetVars = {} as Record<string, number>

  for(var i = 0; i < vars.length; i++) {
    var [key, value] = vars[i]
    if (typeof target[key] === 'undefined') {
      continue
    }

    initVars[key] = target[key]
    targetVars[key] = value
  }

  var ticker = function () {
    var p = easing(Utils.clamp(0, 1, (Date.now() - startTime) / duration))
    
    vars.forEach(([key]) => {
      if (typeof initVars[key] === 'undefined') return
      target[key] = initVars[key] + (targetVars[key] - initVars[key]) * p
    })
  }
}
