export type EasingFunction = (t: number) => number

var Easing = {
  linear: function (t: number) {
    return t
  }
}

export default Easing
