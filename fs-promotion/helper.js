// @ts-check

var PromotionNames = /** @type {const} */ ({
  FreeSpin: 'freespin',
  Tournament: 'tournament'
})

var PromotionStates = /** @type {const} */ ({
  Registering: 'registering',
  Live: 'live',
  Ended: 'ended'
})

var PromotionEvents = {
  BannerComponentUpdate: 'promotion:banner-component-update',
  TipComponentUpdate: 'promotion:tip-component-update',
  BetChanged: 'promotion:bet-changed',

  OpenCategory: 'promotion:open:category',

  CloseBanner: 'promotion:close:banner'
}

/**
 * @class
 */
function Emitter() {
  /**
   * @type {Map<string, { handler: (...args: any[]) => void, thisArg?: any }[]>}
   */
  this.container = new Map()
}

/**
 * @param {string} eventName 
 * @param {(...args: any[]) => void} handler
 * @param {any} [thisArg]
 */
Emitter.prototype.on = function (eventName, handler, thisArg) {
  var handlers = this.container.get(eventName)
  if (!handlers) (handlers = [], this.container.set(eventName, handlers))

  handlers.push({
    handler: handler,
    thisArg: thisArg
  })
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

  var willRemoveIndex = promotionUtils.findIndex(handlers, function (item) {
    return item.handler === handler
  })
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

  handlers.slice(0).forEach(function (handler) {
    handler.handler.apply(handler.thisArg, params)
  })
}

var promotionResourceLoader = {
  /**
   * @type {{ [p: string]: boolean | (() => void)[] }}
   */
  state: {
    "common": false,
    "freespin": false,
    "tournament": false,
  },
  /**
   * 
   * @param {string} name 
   * @param {string[] | undefined} languages 
   * @param {() => void} callback
   */
  load: function (name, languages, callback) {
    var self = this;
    this.loadPromotion("common", languages, function () {
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
  ticker: {
    /**
     * @type {number=}
     */
    tid: undefined,
    /**
     * @type {{ handle: () => void, context?: any }[]}
     */
    handles: [],
    /**
     * @this {typeof promotionUtils.ticker}
     * @param {() => void} cb 
     * @param {any} [context] 
     */
    add: function (cb, context) {
      if (typeof cb == 'function') {
        this.handles.push({
          handle: cb,
          context: context
        });
      } else {
        throw new Error('缺少回调函数');
      };

      //handles不为空，启动定时器
      if (this.handles.length > 0 && !this.tid) {
        this._run();
      }
    },
    /**
     * @this {typeof promotionUtils.ticker}
     * @param {() => void} cb 
     * @param {any} [context] 
     */
    remove: function (cb, context) {
      var len = this.handles.length;

      for (var i = len - 1; i >= 0; i--) {
        if (this.handles[i].handle == cb && this.handles[i].context == context) {
          this.handles.splice(i, 1);
          break;
        }
      }

      if (this.handles.length === 8 && this.tid) {
        window.clearInterval(this.tid)
        this.tid = undefined
      }
    },

    /**
     * @this {typeof promotionUtils.ticker}
     */
    _run: function () {
      var self = this;
      this.tid = window.setInterval(function () {
        self.handles.forEach(function (item) {
          var handle = item.handle, context = item.context;
          handle.call(context);
        });
      }, 500)
    }
  },
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

  NOOP: function () { },

  /**
   * @param {number | string} val
   * @param {number} maxLength
   * @param {string} fillString
   * @return {string}
   */
  padStart: function padStart(val, maxLength, fillString) {
    if (typeof val === 'number') val = String(val)
    if (val.length >= maxLength) return val
    while (val.length < maxLength) {
      val = fillString + val
    }
    return val
  },

  /**
   * @param {number} time 
   * @return {[string, string, string, string]}
   */
  getTimes: function getTimes(time) {
    var day = promotionUtils.padStart(Math.floor(time / 1000 / 60 / 60 / 24), 2, '0')
    var hour = promotionUtils.padStart(Math.floor(time / 1000 / 60 / 60 % 24), 2, '0')
    var minute = promotionUtils.padStart(Math.floor(time / 1000 / 60 % 60), 2, '0')
    var seconds = promotionUtils.padStart(Math.floor(time / 1000 % 60), 2, '0')

    return [
      day,
      hour,
      minute,
      seconds
    ]
  },

  /**
   * @param {string} date 
   * @returns 
   */
  getDate: function (date) {
    if (typeof date == "string") {
      date = date.replace(/[-]/g, "/");
    }
    var dateObj = new Date(date);
    if (dateObj.toString() === "Invalid Date")
      return new Date();

    return dateObj;
  },


  /**
   * @type {<T>(options: T & PromotionComponent) => T & PromotionComponent} 
   */
  defineComponent: function (options) {
    return options
  },

  /**
   * @param {string} startDate
   * @param {string} endDate
   * @returns {PromotionState}
   */
  getPromotionState: function (startDate, endDate) {
    var startTime = +promotionUtils.getDate(startDate)
    var endTime = +promotionUtils.getDate(endDate)
    var now = Date.now()
    if (now < startTime) return PromotionStates.Registering
    else if (now < endTime) return PromotionStates.Live
    else return PromotionStates.Ended
  },

  /**
   * @param {string} targetDate
   * @param {{ timeZone: string, onUpdate?: (remainingTime: number) => void, onComplete?: () => void }} options
   */
  createCountdown: function (targetDate, options) {
    var targetTime = +promotionUtils.getDate(targetDate)

    var destroy = function () {
      promotionUtils.ticker.remove(handler)
    }

    var handler = function () {
      var remainingTime = Math.max(0, targetTime - (Date.now() + SlotUtils.getTimeZoneMillDiff(options.timeZone)))
      if (options.onUpdate) options.onUpdate(remainingTime)
      if (remainingTime === 0) {
        destroy()
        if (options.onComplete) options.onComplete()
      }
    }

    handler()
    promotionUtils.ticker.add(handler)

    return destroy
  },

  state2RequestStatus: {
    [PromotionStates.Registering]: 1,
    [PromotionStates.Live]: 2,
    [PromotionStates.Ended]: 3,
  },

  /**
   * @param {string[]} supportedLanguages 
   * @param {string} [defaultLanguage] 
   */
  getLanguage: function (supportedLanguages, defaultLanguage) {
    defaultLanguage = defaultLanguage || 'en_US'
    return supportedLanguages.indexOf(spade.content.language) ? spade.content.language : defaultLanguage
  },

  /**
   * @typedef {object} NormalizedData
   * @property {string} openDate
   * @property {string} beginDate
   * @property {string} endDate
   * @property {string} closeDate
   */
  /**
   * @type {<T extends Promotion | PromotionData>(data: T) => NormalizedData}
   */
  normalizePeriodDate: function (promotion) {
    /**
     * @param {Promotion} promotion
     * @returns {NormalizedData}
     */
    var handlePromotion = function (promotion) {
      switch (promotion.name) {
        case PromotionNames.Tournament:
          var _t = /** @type {TournamentPromotion} */ (promotion).data
          return {
            openDate: _t.countDownDate,
            beginDate: _t.beginDate,
            endDate: _t.endDate,
            closeDate: _t.bufferZone,
          }
        case PromotionNames.FreeSpin:
          var _p = /** @type {FreeSpinPromotion} */ (promotion).data
          return {
            openDate: _p.cd,
            beginDate: _p.beginDate,
            endDate: _p.endDate,
            closeDate: _p.forfeitDate,
          }
      }
    }

    /**
     * 
     * @param {PromotionData} promotionData
     * @returns {NormalizedData}
     */
    var handlePromotionData = function (promotionData) {
      switch (promotion.name) {
        case PromotionNames.Tournament:
          var _td = /** @type {TournamentPromotionData} */ (promotionData).data
          return {
            openDate: _td.mainInfo.countDownDate,
            beginDate: _td.mainInfo.beginDate,
            endDate: _td.mainInfo.endDate,
            closeDate: _td.mainInfo.closeDate,
          }
        case PromotionNames.FreeSpin:
          var _fd = /** @type {FreeSpinPromotionData} */ (promotionData).data
          // TODO
          return {
            openDate: '',
            beginDate: '',
            endDate: '',
            closeDate: '',
          }
      }
    }

    if ('__d' in promotion) return handlePromotionData(promotion)
    else return handlePromotion(promotion)
  },

  /**
   * @param {number} remainingTime
   * @param {number} totalTime
   * @param {JQuery<HTMLElement>} $time 时分秒冒号分割的倒计时
   * @param {JQuery<HTMLElement>} $progress 设置百分比宽度
   */
  updateElementsCountdown: function (remainingTime, totalTime, $time, $progress) {
    var times = promotionUtils.getTimes(remainingTime)
    if (times[0] === '00') times.shift()
    var percent = Math.floor(remainingTime / totalTime * 100) + '%'
    if ($progress.css('width') !== percent) $progress.css('width', percent)
    $time.text(times.join(':'))
  },

  /**
   * @param {object} o 
   * @param {string} k 
   * @param {any} v 
   */
  define(o, k, v) {
    return Object.defineProperty(o, k, {
      value: v,
      configurable: true,
      writable: true,
      enumerable: true
    })
  }
}
