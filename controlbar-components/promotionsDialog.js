// @ts-check

/**
 * @template T
 * @typedef {import('./promotionsDialog').MaybeNull<T>} MaybeNull
 */

/**
 * @typedef {import('./promotionsDialog').LifeCycle} LifeCycle
 * @typedef {import('./promotionsDialog').PromotionInstance} PromotionInstance
 * @typedef {import('./promotionsDialog').PromotionName} PromotionName
 * @typedef {import('./promotionsDialog').PromotionConfig} PromotionConfig
 * @typedef {import('./promotionsDialog').LuckywheelData} LuckywheelData
 * @typedef {import('./promotionsDialog').FreespinpromotionData} FreespinpromotionData
 * @typedef {import('./promotionsDialog').Promotion} Promotion
 */

; void function () {
  // @ts-expect-error
  var Service = window.Service
  // @ts-expect-error
  var TweenMax = window.TweenMax
  /**
   * @type {PromotionConfig}
   */
  var promotionConfig = {
    freespinpromotion: {
      classBaseName: 'bgimgfreespinpromotion',
      maxWidth: 810
    },
    redpacket: {
      classBaseName: 'bgimgredpacket',
      maxWidth: 560,
    },
    luckywheel: {
      classBaseName: 'bgimgluckywheel',
      maxWidth: 660
    },
    redpacketnew: {
      classBaseName: 'bgimgredpacketnew',
      maxWidth: 560
    },
    tournament: {
      classBaseName: 'bgimgtournament',
      maxWidth: 650
    }
  }
  /**
   * @type {Promotion[]}
   */
  var promotions = []
  /**
   * @type {MaybeNull<JQuery<HTMLElement>>}
   */
  var $promotionsDialog = null
  /**
   * @type {MaybeNull<JQuery<HTMLElement>>}
   */
  var $promotionsDialogMask = null
  /**
   * 当前正在展示的 promotion instance
   * @type {MaybeNull<PromotionInstance>}
   */
  var currentInstance = null

  /**
   * 类型工具函数，没有实际逻辑作用，在 jsdoc 中使用类似 ts 的非空断言
   * @template T
   * @param {T} value
   * @returns {T extends null | undefined ? never : T}
   */
  function assertDefinedAndNonNull(value) {
    if (value === undefined || value === null) throw new Error()
    return /** @type {*} */ (value)
  }

  /**
   * @param {string | number | Date} val 
   */
  function toDate(val) {
    if (typeof val === 'string') {
      return new Date(val.replace(/-/g, '/'))
    } else if (typeof val === 'number') {
      return new Date(val)
    } else {
      return val
    }
  }

  /**
   * @param {number | string} val
   * @param {number} maxLength
   * @param {string} fillString
   * @return {string}
   */
  function padStart(val, maxLength, fillString) {
    if (typeof val === 'number') val = String(val)
    if (val.length >= maxLength) return val
    while(val.length < maxLength) {
      val = fillString + val
    }
    return val
  }

  /**
   * @template T
   * @param {T[]} arr 
   * @param {(item: T, index: number) => boolean} callback 
   * @return {number}
   */
  function findIndex(arr, callback) {
    for(var i = 0; i < arr.length; i++) {
      if (callback(arr[i], i)) {
        return i
      }
    }
    return -1
  }

  /**
   * @param {PromotionInstance} ins 
   * @param {LifeCycle} lifeCycle 
   */
  function callLifeCycle(ins, lifeCycle) {
    var cbs = ins[lifeCycle]
    if (cbs) {
      cbs.forEach(function (cb) {
        cb()
      })
    }
  }

  /**
   * @param {HTMLElement | HTMLElement[]} elOrEls
   */
  function preventAndStopClick(elOrEls) {
    if (!Array.isArray(elOrEls)) {
      elOrEls = [elOrEls]
    }
    elOrEls.forEach(function (item) {
      item.addEventListener('click', function (event) {
        event.stopPropagation()
        event.preventDefault()
      })
    })
  }

  /**
   * @param {MaybeNull<JQuery<HTMLElement>>} $el 
   * @param {() => void} [callback]
   */
  function fadeIn($el, callback) {
    if (!$el || !$el.length) return callback && callback()

    TweenMax.fromTo($el[0], 0.3, { opacity: 0 }, {
      opacity: 1,
      onComplete: callback
    })
  }

  /**
   * @param {MaybeNull<JQuery<HTMLElement>>} $el
   * @param {() => void} [callback]
   */
  function fadeOut($el, callback) {
    if (!$el || !$el.length) return callback && callback()

    TweenMax.to($el[0], 0.3, {
      opacity: 0,
      onComplete: callback
    })
  }

  /**
   * 挂载弹框根容器
   */
  function mountPromotionsDialog() {
    $promotionsDialogMask = $('<div class="promotion_mask"></div>')
    $promotionsDialog = $('<div class="promotions"></div>')
    
    $('.controlbar_component').addClass('above-tips')
    $('.controlbar_component_main').append($promotionsDialogMask).append($promotionsDialog)
    fadeIn($promotionsDialogMask)
    fadeIn($promotionsDialog)

    preventAndStopClick($promotionsDialog[0])
  }

  /**
   * 卸载弹框跟容器
   */
  function unmountPromotionsDialog() {
    var currentPromotionName = currentInstance && currentInstance.promotionName

    if ($promotionsDialogMask) {
      fadeOut($promotionsDialogMask, function () {
        assertDefinedAndNonNull($promotionsDialogMask).remove()
        $promotionsDialogMask = null
      }) 
    }

    if ($promotionsDialog) {
      fadeOut($promotionsDialog, function () {
        promotions.forEach(function (promotion) {
          if (promotion.instance) {
            callLifeCycle(promotion.instance, 'beforeUnmount')
            promotion.instance = undefined
          }
        })
        $('.controlbar_component').removeClass('above-tips')
        if (currentPromotionName) {
          $('.controlbar_component_main').removeClass('component_' + currentPromotionName)
        }
        assertDefinedAndNonNull($promotionsDialog).remove()
        $promotionsDialog = null
      })
    }

    currentInstance = null
  }

  /**
   * @param {PromotionName} name 
   * @return {JQuery<HTMLElement>}
   */
  function createContentFromTemplate(name) {
    var classBaseName = promotionConfig[name].classBaseName
    var maxWidth = promotionConfig[name].maxWidth
    var template =
      '<div class="promotion_text ' + (name + "_text") + '">' +
        '<div class="promotion_container">' +
        ' <div class="l_bg"><span class="' + classBaseName + '_bg promotion_bg"></span><span class="' + classBaseName + '_bg_p promotion_bg_p"></span></div>' +
        // @ts-expect-error
        ' <div class="l_logo' + (window.onlyPortraitGame ? ' none' : '') + '"><span class="' + classBaseName + ' promotion_logo"></span></span></div>' +
        ' <div class="coin"><span class="' + classBaseName + ' promotion_coin"></span><span class="' + classBaseName + ' promotion_coin_p"></span></div>' +
        ' <div class="l_content">' +
        '   <div class="flag promotion_flag ' + classBaseName + '"></div>' +
        '   <div class="flag_lan promotion_flag ' + classBaseName + '_lan"></div>' +
        '   <div class="cont_title"><span class="' + classBaseName + '_lan promotion_title"></span></div>' +
        '   <div class="cont_units">' +
        '     <span class="' + classBaseName + '_lan promotion_subtitle subtitle"></span>' +
        '     <span class="' + classBaseName + '_lan promotion_subtitle_p subtitle_p"></span>' +
        '     <p></p>' +
        '   </div>' +
        '   <div class="cont_prize" data="' + maxWidth + '">' +
        '     <p><span class="' + classBaseName + '_lan promotion_total_prize"></span><span class="prize_total"></span></p>' +
        '     <p><span class="' + classBaseName + '_lan promotion_top_prize"></span><span class="prize_top"></span></p>' +
        '   </div>' +
        '   <div class="cont_turn">' +
        '     <p><span class="' + classBaseName + '_lan promotion_requirement"></span><span class="prize_turnover"></span></p>' +
        '   </div>' +
        '   <div class="cont_times">' +
        '     <span class="counter ' + classBaseName + '_lan promotion_counter"></span>' +
        '     <span class="counter_p ' + classBaseName + '_lan promotion_counter_p"></span>' +
        '     <ul>' +
        '       <li></li>' +
        '       <li></li>' +
        '       <li></li>' +
        '       <li></li>' +
        '     </ul>' +
        '   </div>' +
        '   <div class="cont_btn ' + classBaseName + ' promotion_button">' +
        '     <span class="' + classBaseName + '_lan promotion_button_text"></span>' +
        '   </div>' +
        ' </div>' +
        '</div>' +
      '</div>'

    return $(template)
  }

  /**
   * Luckywheel
   * @param {Promotion} promotion
   * @return {PromotionInstance}
   */
  function createLuckywheelPromotionInstance(promotion) {
    var $el = createContentFromTemplate('luckywheel')
    var instance = promotion.instance = /** @type {PromotionInstance} */ ({
      $el: $el,
      promotionName: promotion.name,
      mounted: [],
      beforeUnmount: [],
      activated: [],
      deactivated: [],
      update: []
    })
    var data = /** @type {LuckywheelData} */ (promotion.data)
    /** @type {string} */
    var serverTimeStr
    /** @type {string} */
    var endTimeStr
    /** @type {number} */
    var countdownTimer

    var startCountdown = function () {
      if (countdownTimer) {
        window.clearInterval(countdownTimer)
      }
      var start = +toDate(serverTimeStr)
      var delay = Date.now() - start
      var end = +toDate(endTimeStr) + delay

      var handler = function () {
        var now = Date.now()
        var diff = end - now
        
        if (diff <= 0) {
          window.clearInterval(countdownTimer)
          destroyPromotion(promotion.tranId)
          return
        }

        var day = padStart(Math.floor(diff / 1000 / 60 / 60 / 24), 2, '0')
        var hour = padStart(Math.floor(diff / 1000 / 60 / 60 % 24), 2, '0')
        var minute = padStart(Math.floor(diff / 1000 / 60 % 60), 2, '0')
        var seconds = padStart(Math.floor(diff / 1000 % 60), 2, '0')

        $el.find('.cont_times li').each(function (index, element) {
          var val = ''
          if (index === 0) {
            val = day
          } else if (index === 1) {
            val = hour
          } else if (index === 2) {
            val = minute
          } else if (index === 3) {
            val = seconds
          }
          $(element).text(val)
        })
      }

      handler()
      countdownTimer = window.setInterval(handler, 500)
    }

    instance.mounted.push(function () {
      serverTimeStr = data.serverTime
      endTimeStr = data.info.endTime
      startCountdown()
    })

    instance.beforeUnmount.push(function () {
      window.clearInterval(countdownTimer)
    })

    return instance
  }

  /**
   * @param {number} index
   * @return
   */
  function togglePromotion(index) {
    // 隐藏当前的 Promotion
    if (currentInstance) {
      var promotionName = currentInstance.promotionName
      callLifeCycle(currentInstance, 'deactivated')
      fadeOut(currentInstance.$el, function () {
        $('.controlbar_component_main').removeClass('component_' + promotionName)
      })
      currentInstance = null
    }

    var promotion = promotions[index]
    if (!promotion) return

    /**
     * @type {MaybeNull<PromotionInstance>}
     */
    var newInstance = null
    if (promotion.instance) {
      newInstance = promotion.instance
      callLifeCycle(newInstance, 'activated')
    } else {
      if (promotion.name === 'luckywheel') {
        newInstance = createLuckywheelPromotionInstance(promotion)
      } else {
        throw new Error('not implemented')
      }
      if (newInstance) {
        assertDefinedAndNonNull($promotionsDialog).append(newInstance.$el)
        callLifeCycle(newInstance, 'mounted')
      }
    }
    // Show DOM
    if (newInstance) {
      $('.controlbar_component_main').addClass('component_' + newInstance.promotionName)
      fadeIn(newInstance.$el)
      currentInstance = newInstance
    }
  }

  /**
   * 收到一个 promotion
   * @param {PromotionName} name 
   * @param {Promotion['data']} data 
   */
  function pushPromotion(name, data) {
    /**
     * @param {number} tranId 
     * @param {Promotion['data']} data
     * @return {boolean}
     */
    var updateIfExists = function (tranId, data) {
      var existingIndex = findIndex(promotions, function (promotion) {
        return promotion.tranId === tranId
      })
      if (existingIndex !== -1) {
        promotions[existingIndex].data = data
        var instance = promotions[existingIndex].instance
        if (instance) {
          callLifeCycle(instance, 'update')
        }
        return true
      }
      return false
    }

    if (name === 'luckywheel') {
      var tranId = /** @type {LuckywheelData} */ (data).info.tranId
      if (!updateIfExists(tranId, data)) {
        promotions.push({
          name: name,
          tranId: tranId,
          data: /** @type {LuckywheelData} */ (data)
        })
      }
    } else if (name === 'freespinpromotion') {
      var tranId = /** @type {FreespinpromotionData} */ (data).tranId
      if (!updateIfExists(tranId, data)) {
        promotions.push({
          name: name,
          tranId: tranId,
          data: /** @type {FreespinpromotionData} */ (data)
        })
      }
    }

    if (!$promotionsDialog) {
      mountPromotionsDialog()
      togglePromotion(0)
    }
  }

  /**
   * 销毁指定的 promotion
   * @param {number} tranId
   */
  function destroyPromotion(tranId) {
    var willDestroyIndex = findIndex(promotions, function (item) {
      return item.tranId === tranId
    })

    var willDestroyPromotion = promotions[willDestroyIndex]
    if (!willDestroyPromotion) return

    // 删除数据
    promotions.splice(willDestroyIndex, 1)

    if (willDestroyPromotion.instance) {
      callLifeCycle(willDestroyPromotion.instance, 'beforeUnmount')
      var $el = willDestroyPromotion.instance.$el
      // 需要销毁的是当前正在展示的
      if (willDestroyPromotion.instance === currentInstance) {
        // 且只有这一个 Promotion
        if (promotions.length === 0) {
          unmountPromotionsDialog()
        } else {
          // 卸载 DOM 后切换到下一个
          fadeOut($el, function () {
            $el.remove()
          })
          togglePromotion(willDestroyIndex > promotions.length - 1 ? 0 : willDestroyIndex)
        }
      } else {
        // 需要销毁的不是正在展示的，移除 DOM
        $el.remove()
      }
    }
  }

  var service = Service.create()

  // -25轮盘推送
  service.bindPushEvent(Service._Commands.WHEEL_OPEN, function (/** @type {LuckywheelData} */ data) {
    debugger
    pushPromotion('luckywheel', data)
  })
  // -26 轮盘关闭
  service.bindPushEvent(Service._Commands.WHEEL_CLOSE, function (/** @type {any}*/ data) {
    destroyPromotion(data.tranId)
  })

  // freespin推送开启
  service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_OPEN, function (/** @type {FreespinpromotionData} */ data) {
    pushPromotion('freespinpromotion', data)
  })
  service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_CLOSE, function (/** @type {any} */ data) {
    // TODO
  })
}()
