var Utils = {
  clamp: function(min: number, max: number, val: number) {
    return Math.max(min, Math.min(max, val))
  }
}

export default Utils
