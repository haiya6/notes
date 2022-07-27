const PENDING = Symbol('PENDING')
const FULFILLED = Symbol('FULFILLED')
const REJECTED = Symbol('REJECTED')

function resolvePromise(promise, x, resolve, reject) {
  // 2.3.1 如果 promise 和 x 指向同一对象，以 TypeError 为据因拒绝执行 promise
  if (x === promise) {
    return reject(new TypeError('巴拉巴拉'))
  }
  // 2.3.2 如果 x 为 Promise ，则使 promise 接受 x 的状态
  if (x instanceof MyPromise) {
    if (x.state === PENDING) {
      // 2.3.2.1 如果 x 处于等待态， promise 需保持为等待态直至 x 被执行或拒绝（继续处理结果）
      x.then(
        y => {
          resolvePromise(promise, y, resolve, reject)
        },
        reject
      )
    } else if (x.state === FULFILLED) {
      // 2.3.2.2 如果 x 处于执行态，用相同的值执行 promise
      resolve(x.result)
    } else {
      // rejected
      // 2.3.2.3 如果 x 处于拒绝态，用相同的据因拒绝 promise
      reject(x.result)
    }
  } else if (typeof x === 'function' || (x !== null && typeof x === 'object')) {
    // 2.3.3 如果 x 为对象或者函数
    let then
    try {
      // 2.3.3.1 把 x.then 赋值给 then
      then = x.then
    } catch (e) {
      // 2.3.3.2 如果取 x.then 的值时抛出错误 e ，则以 e 为据因拒绝 promise
      return reject(e)
    }
    // 2.3.3.3 
    // If then is a function, call it with x as this, 
    // first argument resolvePromise, and second argument rejectPromise
    if (typeof then === 'function') {
      let called = false

      try {
        then.call(
          x,
          // 2.3.3.3.1 如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)
          y => {
            if (!called) {
              // 2.3.3.3.3 如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
              called = true
              resolvePromise(promise, y, resolve, reject)
            }
          },
          // 2.3.3.3.2 如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise
          r => {
            if (!called) {
              // 2.3.3.3.3 如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
              called = true
              reject(r)
            }
          }
        )
      } catch (e) {
        // 2.3.3.3.4 如果调用 then 方法抛出了异常 e

        // 2.3.3.3.4.1 如果 resolvePromise 或 rejectPromise 已经被调用，则忽略之
        if (called) return
        // 2.3.3.3.4.2 否则以 e 为据因拒绝 promise
        reject(e)
      }
    } else {
      // 2.3.3.4 如果 then 不是函数，以 x 为参数 resolve promise
      resolve(x)
    }
  } else {
    // 2.3.4 如果 x 不为对象或者函数，以 x 为参数 resolve promise
    resolve(x)
  }

}

class MyPromise {
  state = PENDING
  result
  onFulfilledCallbacks = []
  onRejectedCallbacks = []

  constructor(func) {
    this.resolve = this.resolve.bind(this)
    this.reject = this.reject.bind(this)

    try {
      func(this.resolve, this.reject)
    } catch (err) {
      this.reject(err)
    }
  }

  resolve(result) {
    if (this.state === PENDING) {
      // 在 Node 环境中实现，借助 API 实现微任务
      process.nextTick(() => {
        this.result = result
        this.state = FULFILLED
        this.onFulfilledCallbacks.splice(0).forEach(cb => cb(this.result))
      })
    }
  }

  reject(reason) {
    if (this.state = PENDING) {
      // 在 Node 环境中实现，借助 API 实现微任务
      process.nextTick(() => {
        this.state = REJECTED
        this.result = reason
        this.onRejectedCallbacks.splice(0).forEach(cb => cb(this.result))
      })
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
    onRejected = typeof onRejected === 'function' ? onRejected : e => { throw e }

    const promise2 = new MyPromise((resolve, reject) => {
      const handleFulfilled = result => {
        try {
          const x = onFulfilled(result)
          // 2.2.7.1：如果 onFulfilled 或 onRejected 返回一个值 x （resolvePromise 处理）
          resolvePromise(promise2, x, resolve, reject)
        } catch (err) {
          // 2.2.7.2 如果 onFulfilled 或者 onRejected 抛出一个异常 e ，则 promise2 必须拒绝执行，并返回拒因 e
          reject(err)
        }
      }

      const handleRejected = reason => {
        try {
          // 2.2.7.2 如果 onFulfilled 或者 onRejected 抛出一个异常 e ，则 promise2 必须拒绝执行，并返回拒因 e
          const x = onRejected(reason)
          // 2.2.7.1：如果 onFulfilled 或 onRejected 返回一个值 x （resolvePromise 处理）
          resolvePromise(promise2, x, resolve, reject)
        } catch (err) {
          reject(err)
        }
      }

      if (this.state === FULFILLED) {
        // 在 Node 环境中实现，借助 API 实现微任务
        process.nextTick(() => {
          handleFulfilled(this.result)
        })
      } else if (this.state === REJECTED) {
        // 在 Node 环境中实现，借助 API 实现微任务
        process.nextTick(() => {
          handleRejected(this.result)
        })
      } else {
        // pending
        this.onFulfilledCallbacks.push(handleFulfilled)
        this.onRejectedCallbacks.push(handleRejected)
      }
    })

    return promise2
  }
}

module.exports = MyPromise
