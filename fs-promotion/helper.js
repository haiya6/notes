// @ts-check

var PromotionNames = /** @type {const} */ ({
  FreeSpin: 'freespin',
  Tournament: 'tournament'
})

var PromotionStates = /** @type {const} */ ({
  Invalid: 'invalid',
  StartIn: 'startIn',
  EndIn: 'endIn',
  ExpiredIn: 'expiredIn',
  Expired: 'expired'
})

var PromotionCategoryNames = /** @type {const} */ ({
  Registering: 'registering',
  Live: 'live',
  Ended: 'ended'
})

var PromotionEvents = {
  BetChanged: 'promotion:bet-changed'
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
  language: '',
  /**
   * 获取当前设置的语言，默认为 en_US
   */
  getLanguage: function () {
    return promotionResourceLoader.language || 'en_US'
  },
  /**
   * @type {{ [p: string]: boolean | (() => void)[] }}
   */
  state: {
    "common": false,
    "freespin": false,
    "tournament": false,
  },
  jsonMapLoaded: false,
  /**
   * 
   * @param {string} name 
   * @param {() => void} callback
   */
  load: function (name, callback) {
    var self = this;
    this.loadPromotion("common", function () {
      self.loadPromotion(name, callback)
    });
  },
  /**
   * 
   * @param {string} name 
   * @param {() => void} callback
   */
  loadPromotion: function (name, callback) {
    var language = promotionResourceLoader.getLanguage()
    var stateOrCallbacks = this.state[name]

    if (stateOrCallbacks === true) {
      return callback()
    } else if (Array.isArray(stateOrCallbacks)) {
      return stateOrCallbacks.push(callback)
    }

    this.state[name] = [callback]
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

      if (name === 'common' || promotionResourceLoader.jsonMapLoaded) {
        return finalCallback()
      }
      promotionResourceLoader.jsonMapLoaded = true
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
   * @returns {NonNullable<T>}
   */
  assert: function assert(value) {
    if (value === undefined || value === null) throw new Error()
    return value
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
   * @param {Promotion | PromotionData} promotion
   * @returns {PromotionState}
   */
  getPromotionState: function (promotion) {
    var normalizedTime = promotionUtils.normalizePeriodTime(promotion)
    var now = Date.now()

    if (now < normalizedTime.openTime) return PromotionStates.StartIn
    else if (now < normalizedTime.beginTime) return PromotionStates.StartIn
    else if (now < normalizedTime.endTime) return PromotionStates.EndIn
    else if (now < normalizedTime.closeTime) return PromotionStates.ExpiredIn
    else return PromotionStates.Expired
  },

  /**
   * @param {number} targetTime
   * @param {{ onUpdate?: (remainingTime: number) => void, onComplete?: () => void }} options
   */
  createCountdown: function (targetTime, options) {
    /** @type {number} */
    var setupTimer

    var destroy = function () {
      window.clearTimeout(setupTimer)
      promotionUtils.ticker.remove(handler)
    }

    var handler = function () {
      var remainingTime = Math.max(0, targetTime - Date.now())
      if (options.onUpdate) options.onUpdate(remainingTime)
      if (remainingTime === 0) {
        destroy()
        if (options.onComplete) options.onComplete()
      }
    }

    setupTimer = window.setTimeout(handler, 0);
    promotionUtils.ticker.add(handler)

    return destroy
  },

  // ie11 不支持计算属性
  categoryName2RequestStatus: {
    registering: 1,
    live: 2,
    ended: 3
  },

  /**
   * @typedef {object} NormalizedTime
   * @property {number} openTime
   * @property {number} beginTime
   * @property {number} endTime
   * @property {number} closeTime
   */
  /**
   * @type {<T extends Promotion | PromotionData>(data: T) => NormalizedTime}
   */
  normalizePeriodTime: function (promotion) {
    var getDate = promotionUtils.getDate
    var serverTime = +getDate(promotionUtils.getServerTimeStr(promotion))
    var $receiveTimestamp = promotion.$receiveTimestamp
    var timeDiff = $receiveTimestamp - serverTime
    
    /**
     * @param {string} openDateStr
     * @param {string} beginDateStr
     * @param {string} endDateStr
     * @param {string} closeDateStr
     * @return {NormalizedTime}
     */
    var transform = function (openDateStr, beginDateStr, endDateStr, closeDateStr) {
      return {
        openTime: +getDate(openDateStr) + timeDiff,
        beginTime: +getDate(beginDateStr) + timeDiff,
        endTime: +getDate(endDateStr) + timeDiff,
        closeTime: +getDate(closeDateStr) + timeDiff
      }
    }

    /**
     * @param {Promotion} promotion
     * @returns {NormalizedTime}
     */
    var handlePromotion = function (promotion) {
      switch (promotion.name) {
        case PromotionNames.Tournament:
          var _t = /** @type {TournamentPromotion} */ (promotion).data
          return transform(_t.countDownDate, _t.beginDate, _t.endDate, _t.bufferZone)
        case PromotionNames.FreeSpin:
          var _p = /** @type {FreeSpinPromotion} */ (promotion).data
          return transform(_p.cd, _p.beginDate, _p.endDate, _p.forfeitDate)
      }
    }

    /**
     * 
     * @param {PromotionData} promotionData
     * @returns {NormalizedTime}
     */
    var handlePromotionData = function (promotionData) {
      switch (promotion.name) {
        case PromotionNames.Tournament:
          var _td = /** @type {TournamentPromotionData} */ (promotionData).data
          return transform(_td.mainInfo.countDownDate, _td.mainInfo.beginDate, _td.mainInfo.endDate, _td.mainInfo.closeDate)
        case PromotionNames.FreeSpin:
          var _fd = /** @type {FreeSpinPromotionData} */ (promotionData).data
          return transform(_fd.cd, _fd.beginDate, _fd.endDate, _fd.forfeitDate)
      }
    }

    if ('__d' in promotion) return handlePromotionData(promotion)
    else return handlePromotion(promotion)
  },

  /**
   * @type {<T extends Promotion | PromotionData>(data: T) => string}
   */
  getServerTimeStr: function (promotion) {
    /**
     * @param {Promotion} promotion
     * @returns {string}
     */
     var handlePromotion = function (promotion) {
      switch (promotion.name) {
        case PromotionNames.Tournament:
          return /** @type {TournamentPromotion} */ (promotion).data.serverTime
        case PromotionNames.FreeSpin:
          return /** @type {FreeSpinPromotion} */ (promotion).data.serverTime
      }
     }

    /**
     * 
     * @param {PromotionData} promotionData
     * @returns {string}
     */
     var handlePromotionData = function (promotionData) {
      switch (promotion.name) {
        case PromotionNames.Tournament:
          return /** @type {TournamentPromotionData} */ (promotionData).data.mainInfo.serverTime
        case PromotionNames.FreeSpin:
          return /** @type {FreeSpinPromotionData} */ (promotionData).data.serverTime
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
    var day = promotionUtils.assert(times.shift())
    // 将 day 计算在小时内
    times[0] = promotionUtils.padStart(Number.parseInt(times[0]) + Number.parseInt(day) * 24, 2, '0')
    var percent = Math.floor(remainingTime / totalTime * 100) + '%'
    if ($progress.css('width') !== percent) $progress.css('width', percent)
    $time.text(times.join(':'))
  },

  /**z
   * @param {object} o 
   * @param {string} k 
   * @param {any} v 
   */
  define: function (o, k, v) {
    return Object.defineProperty(o, k, {
      value: v,
      configurable: true,
      writable: true,
      enumerable: true
    })
  },

  /**
   * 
   * @param {PromotionComponent} component 
   */
  setupComponent: function (component) {
    if (component.setup) {
      var onBeforeRemove = component.setup()
      if (onBeforeRemove) component.onBeforeRemove = onBeforeRemove
    }
  },

  /**
   * @param {JQuery<HTMLElement>} $root 
   */
  addIconEvents: function ($root) {
    $root.find('*[tag]').each(function (_, el) {
      var tag = $(el).attr('tag')
      var baseImg = $(el).attr('baseImg') || 'bgimgStyle'

      var mousedown = mm.device.isPC() ? 'mousedown' : 'touchstart'
      var mouseup = mm.device.isPC() ? 'mouseup' : 'touchend'

      if (mm.device.isPC()) {
        el.addEventListener('mouseover', function () {
          $(el).attr('class', baseImg + ' ' + tag + '_over')
        })

        el.addEventListener('mouseout', function () {
          $(el).attr('class', baseImg + ' ' + tag + '_up')
        })
      }

      el.addEventListener(mousedown, function () {
        $(el).attr('class', baseImg + ' ' + tag + '_down')
      })

      el.addEventListener(mouseup, function () {
        $(el).attr('class', baseImg + ' ' + tag + '_up')
      })
    })
  },

  /**
   * @param {JQuery<HTMLElement>} $root 
   */
  localize: function ($root) {
    $root.find('[key]').each(function(_, item) {
      $(item).text(Locale.getString($(item).attr('key')))
    });
  },

  /**
   * @param {string} gameCode 
   * @param {boolean} [isLarge]
   * @returns 
   */
  getImgUrl: function (gameCode, isLarge) {
    var url = gameCode + ".png" + "?" + mm.game.config.ver;
    var language = promotionResourceLoader.getLanguage()
    if(!isLarge) return '../../../fscommon/thumbnail_min/' + url;
    return '../../../fscommon/thumbnail/' + (["en_US", "zh_CN", "th_TH"].indexOf(language) !== -1 ? language : 'en_US') + "/" + url;
  },
  /** @type {Record<string, string> | null} */
  _tournamentAllGamesCache: null,
  /**
   * @param {(data: Record<string, string>) => void} callback 
   */
  getTournamentAllGames: function (callback) {
    if (promotionUtils._tournamentAllGamesCache) return callback(promotionUtils._tournamentAllGamesCache)
    Service.create().getTournamentAllGames({
      language: promotionResourceLoader.getLanguage()
    }, function (/** @type {any} */ res) {
      if (res.code !== 0) return callback({})
      else {
        promotionUtils._tournamentAllGamesCache = {}
        res.list.forEach(function (/** @type {any} */ item) {
          promotionUtils.assert(promotionUtils._tournamentAllGamesCache)[item.gameCode] = item.gameName
        })
        return callback(promotionUtils._tournamentAllGamesCache)
      }
    })
  },
  
  soundTick: mm.Class.prototype._soundTick,

  /**
   * @param {JQuery<HTMLElement>} $el
   * @param {string} eventName
   * @param {boolean} sound
   * @param {() => void} callback
   */
  clickWithAnimation: function ($el, eventName, sound, callback) {
    if ($el.length !== 0) {
      var animationendHandler = function () {
        $el.removeClass('ani')
        $el[0].addEventListener('animationend', animationendHandler)
        callback()
      }

      $el[0].addEventListener(eventName, function () {
        if (sound) promotionUtils.soundTick()
        $el.addClass('ani')
        $el[0].addEventListener('animationend', animationendHandler)
      })
    }
  },

  /**
   * @template T
   * @param {IterableIterator<T>} iter 
   */
  iter2Array: function (iter) {
    /** @type T[] */
    var arr = []
    for(;;) {
      var v = iter.next()
      if (v.done) return arr
      arr.push(v.value)
    }
  },

  /**
   * @param {Promotion | PromotionData} promotion
   * @param {PromotionState} [state]
   * @returns {PromotionCategoryName | undefined}
   */
  getPromotionCategoryName: function (promotion, state) {
    if (!state) state = promotionUtils.getPromotionState(promotion)

    if (promotion.name === PromotionNames.FreeSpin) {
      if (state === PromotionStates.StartIn) {
        return PromotionCategoryNames.Registering
      } else if (state === PromotionStates.EndIn) {
        return PromotionCategoryNames.Live
      } else if (state === PromotionStates.ExpiredIn) {
        if (/** @type {FreeSpinPromotion} */ (promotion).data.freeSpin) {
          // 在此阶段，如果有领取资格，也会在 live 标签页展示
          return PromotionCategoryNames.Live
        }
      }
    } else  {
      // PromotionNames.Tournament
      if (state === PromotionStates.StartIn) return PromotionCategoryNames.Registering
      else if (state === PromotionStates.EndIn) return PromotionCategoryNames.Live
      else return PromotionCategoryNames.Ended
    }
  },

  /**
   * @param {PromotionState} state
   * @returns {string}
   */
  getPromotionStateLocaleString: function (state) {
    var typeArr = Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")
    if (state === PromotionStates.StartIn) {
      return typeArr[0]
    } else if (state === PromotionStates.EndIn) {
      return typeArr[1]
    } else if (state === PromotionStates.ExpiredIn) {
      return typeArr[2]
    } else if (state === PromotionStates.Expired) {
      return typeArr[3]
    } else {
      return ''
    }
  },

  /**
   * @param {((done: () => void) => void)[]} tasks
   * @param {() => void} callback
   */
  all: function (tasks, callback) {
    var total = tasks.length
    if (total === 0) return callback()
    
    var current = 0
    var done = function () {
      current++
      if (current >= total) callback()
    }
    tasks.forEach(function (task) {
      task(done)
    })
  }
}
