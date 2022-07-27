const MyPromise = require('./MyPromise')

MyPromise.deferred = () => {
  const result = {}

  result.promise = new MyPromise((resolve, reject) => {
    result.resolve = resolve
    result.reject = reject
  })

  return result
}

module.exports = MyPromise
