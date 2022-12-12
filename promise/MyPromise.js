const PENDING = Symbol('PENDING')
const FULFILLED = Symbol('FULFILLED')
const REJECTED = Symbol('REJECTED')

function resolvePromise(myPromise2, x, resolve, reject) {
  // 2.3.1 如果 myPromise2 和 x 指向同一对象，则以一个 TypeError 为 reason 来 reject myPromise1
  if (x === myPromise2) {
    return reject(new TypeError('巴拉巴拉'))
  }
  // 2.3.2 如果 x 是 MyPromise 实例，则使 myPromise2 采用 x 的状态，具体如下
  if (x instanceof MyPromise) {
    // 2.3.2.1 如果 x 处于 pending， myPromise2 需保持挂起，直到 x 被 fulfilled 或 rejected
    if (x.state === PENDING) {
      x.then(
        y => {
          // 将 value: y 再调用 resolvePromise
          resolvePromise(myPromise2, y, resolve, reject)
        },
        reject
      )
    } else if (x.state === FULFILLED) {
      // 2.3.2.2 当 x 状态为 fulfilled 时，以 x.result 为 value 来 resolve myPromise1
      resolve(x.result)
    } else {
      // rejected
      // 2.3.2.3 当 x 状态为 rejected, ，以 x.result 为 reason 来 reject myPromise1
      reject(x.result)
    }
  } else if (typeof x === 'function' || (x !== null && typeof x === 'object')) {
    // 2.3.3 如果是 object or function

    // 2.3.3.1 定义变量 `then`，尝试赋值为 `x.then`
    // 2.3.3.2 如果取 `x.then` 的值时抛出异常 `e` ，则以 `e` 为据因 reject myPromise1
    let then
    try {
      then = x.then
    } catch (e) {
      return reject(e)
    }
    // 2.3.3.3 如果 `then` 是一个函数，调用 `then` 并修改 this 为 `x`，第一个参数为 _resolvePromise，第二个参数为 _rejectPromise
    if (typeof then === 'function') {
      let called = false

      try {
        then.call(
          x,
          // 2.3.3.3.1 如果 _resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](myPromise2, y)
          y => {
            // 2.3.3.3.3 如果 _resolvePromise 和 _rejectPromise 均被调用，
            // 或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
            if (!called) {
              called = true
              resolvePromise(myPromise2, y, resolve, reject)
            }
          },
          // 2.3.3.3.2 如果 _rejectPromise 以值 r 为参数被调用，则以 r 为拒因 reject myPromise1
          r => {
            // 2.3.3.3.3 如果 _resolvePromise 和 _rejectPromise 均被调用，
            // 或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
            if (!called) {
              called = true
              reject(r)
            }
          }
        )
      } catch (e) {
        // 2.3.3.3.4 如果调用 then 方法抛出了异常 e
        // 2.3.3.3.4.1 如果 _resolvePromise 或 _rejectPromise 已经被调用，则忽略之
        if (called) return
        // 2.3.3.3.4.2 否则以 `e` 为据因 reject myPromise1
        reject(e)
      }
    } else {
      // 2.3.3.4 如果 `then` 不是函数，以 x 为参数 resolve myPromise1
      resolve(x)
    }
  } else {
    // 2.3.4 如果 x 不为对象或者函数，以 x 为参数 resolve myPromise1
    resolve(x)
  }
}

class MyPromise {
  state = PENDING

  // value or reason
  result

  onFulfilledCallbacks = []
  onRejectedCallbacks = []

  constructor(func) {
    this.resolve = this.resolve.bind(this)
    this.reject = this.reject.bind(this)

    try {
      func(this.resolve, this.reject)
    } catch (e) {
      this.reject(e)
    }
  }

  resolve(value) {
    if (this.state === PENDING) {
      // 2.2.4
      process.nextTick(() => {
        this.result = value
        this.state = FULFILLED
        this.onFulfilledCallbacks.splice(0).forEach(cb => cb(value))
      })
    }
  }

  reject(reason) {
    if (this.state === PENDING) {
      // 2.2.4
      process.nextTick(() => {
        this.result = reason
        this.state = REJECTED
        this.onRejectedCallbacks.splice(0).forEach(cb => cb(reason))
      })
    }
  }

  then(onFulfilled, onRejected) {
    // 2.2.7.3
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
    // 2.2.7.4
    onRejected = typeof onRejected === 'function' ? onRejected : e => { throw e }

    const myPromise2 = new MyPromise((resolve, reject) => {
      const handleFulfilled = value => {
        try {
          const x = onFulfilled(value)
          // 2.2.7.1
          resolvePromise(myPromise2, x, resolve, reject)
        } catch (e) {
          // 2.2.7.2
          reject(e)
        }
      }

      const handleRejected = reason => {
        try {
          const x = onRejected(reason)
          // 2.2.7.1
          resolvePromise(myPromise2, x, resolve, reject)
        } catch (err) {
          // 2.2.7.2
          reject(err)
        }
      }

      if (this.state === PENDING) {
        this.onFulfilledCallbacks.push(handleFulfilled)
        this.onRejectedCallbacks.push(handleRejected)
      } else if (this.state === FULFILLED) {
        // 2.2.4
        process.nextTick(() => {
          handleFulfilled(this.result)
        })
      } else {
        // rejected

        // 2.2.4
        process.nextTick(() => {
          handleRejected(this.result)
        })
      }
    })

    // 2.2.7
    return myPromise2
  }
}

module.exports = MyPromise
