// @ts-check

var PromotionNames = /** @type {const} */ ({
  FreeSpin: 'freespinpromotion',
  Tournament: 'tournament'
})

var PromotionStates = /** @type {const} */ ({
  Registering: 'registering',
  Live: 'live',
  Ended: 'ended'
})

var PromotionEvents = {
  SelfUpdate: 'self_update'
}

/**
 * @class
 */
function Emitter() {
  /**
   * @type {Map<string, ((...args: any[]) => void)[]>}
   */
  this.container = new Map()
}

/**
 * @param {string} eventName 
 * @param {(...args: any[]) => void} handler 
 */
Emitter.prototype.on = function (eventName, handler) {
  var handlers = this.container.get(eventName)
  if (!handlers) (handlers = [], this.container.set(eventName, handlers))
  handlers.push(handler)
}

/**
 * @param {string} eventName 
 * @param {(...args: any[]) => void} [handler] 
 */
Emitter.prototype.off = function (eventName, handler) {
  if (typeof handler === 'undefined') {
    this.container.delete(eventName)
    return
  }
  var handlers = this.container.get(eventName)
  if (!handlers) return
  var willRemoveIndex = handlers.indexOf(handler)
  if (willRemoveIndex !== -1) handlers.splice(willRemoveIndex, 1)
}

/**
 * @type {(eventName: string, ...args: any) => void}
 */
Emitter.prototype.emit = function (eventName) {
  var handlers = this.container.get(eventName)
  if (!handlers) return
  /** @type {any[]} */
  var params = [].slice.call(arguments, 1)
  handlers.forEach(function (handler) {
    handler.apply(null, params)
  })
}

var promotionResourceLoader = {
  /**
   * @type {{ [p: string]: boolean | (() => void)[] }}
   */
  state: {
    "common": false,
    "freespinpromotion": false,
    "tournament": false,
  },
  /**
   * 
   * @param {string} name 
   * @param {string[] | undefined} languages 
   * @param {() => void} callback
   */
  load: function(name, languages, callback) {
    var self = this;
    this.loadPromotion("common", languages, function(){
      self.loadPromotion(name, languages, callback)
    });
  },
  /**
   * 
   * @param {string} name 
   * @param {string[] | undefined} languages 
   * @param {() => void} callback
   */
  loadPromotion: function (name, languages, callback) {
    var stateOrCallbacks = this.state[name]

    if (stateOrCallbacks === true) {
      return callback()
    } else if (Array.isArray(stateOrCallbacks)) {
      return stateOrCallbacks.push(callback)
    }
    
    this.state[name] = [callback]
    languages = languages || ['en_US', 'zh_CN']
    var language = languages.indexOf(spade.content.language) > -1 ? spade.content.language : 'en_US'
    var resources = resource_promotion.getResource(name, language)

    var cssHTML = ''
    var onComplete = function () {
      var style = document.createElement("style")
      style.innerHTML = cssHTML
      document.head.appendChild(style)

      var finalCallback = function () {
        var stateOrCallbacks = promotionResourceLoader.state[name]
        if (Array.isArray(stateOrCallbacks)) {
          stateOrCallbacks.forEach(function (callback) {
            callback()
          })
        }
        promotionResourceLoader.state[name] = true
      }

      // self._initJsonMap(lan, cb)
      if (Locale.getString("TXT_PROMOTION") != "TXT_PROMOTION" || name === "common") return finalCallback()
      Locale.initJsonMap('../../../fscommon/components/promotionlocale/' + language + '.json', finalCallback, mm.game.config["ver"])
    }
    /**
     * @param {string} url
     * @param {any} _
     * @param {string} name2
     */
    var onProgress = function (url, _, name2) {
      cssHTML += '.bgimg' + name2 + '{background-image:url("' + url + '");}'
    }
    mm.loader.loadH5Resource(resources, onComplete, onProgress)
  }
}

var promotionUtils = {
  /**
   * @template T
   * @param {ArrayLike<T>} arr 
   * @param {(item: T, index: number) => boolean} callback 
   * @return {number}
   */
  findIndex: function findIndex(arr, callback) {
    for (var i = 0; i < arr.length; i++) {
      if (callback(arr[i], i)) {
        return i
      }
    }
    return -1
  },

  /**
   * @template T
   * @param {ArrayLike<T>} arr 
   * @param {(item: T, index: number) => boolean} callback 
   * @return {T | null}
   */
  find: function find(arr, callback) {
    for (var i = 0; i < arr.length; i++) {
      if (callback(arr[i], i)) {
        return arr[i]
      }
    }
    return null
  },
  /**
   * assertDefinedAndNonNull
   * 类型工具函数，没有实际逻辑作用，在 jsdoc 中使用类似 ts 的非空断言
   * @template T
   * @param {T} value
   * @returns {T extends null | undefined ? never : T}
   */
  assert: function assert(value) {
    if (value === undefined || value === null) throw new Error()
    return /** @type {*} */ (value)
  },

  NOOP: function () {},

  /**
   * @param {PromotionComponent} component
   * @param {(component: PromotionComponent) => void} mountHandler
   * @param {(component: PromotionComponent) => void} unmountHandler
   */
  handleShouldMountComponent: function (component, mountHandler, unmountHandler) {
    var needMount = true
    if (component.shouldMount) needMount = component.shouldMount()
    if (needMount && !component.$$el) {
      mountHandler(component)
    } else if (!needMount && component.$$el) {
      unmountHandler(component)
    }
  }
}
