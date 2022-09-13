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
 * @typedef {import('./promotionsDialog').RedpacketData} RedpacketData
 * @typedef {import('./promotionsDialog').RedpacketNewData} RedpacketNewData
 * @typedef {import('./promotionsDialog').TournamentData} TournamentData
 * @typedef {import('./promotionsDialog').Promotion} Promotion
 */

 ; void function () {
  // @ts-expect-error
  var mm = window.mm
  // @ts-expect-error
  var Service = window.Service
  // @ts-expect-error
  var promotionResource = window.resource_promotion
  // @ts-expect-error
  var spade = window.spade
  // @ts-expect-error
  var Locale = window.Locale
  // @ts-expect-error
  var TweenMax = window.TweenMax

  var emitter = mm.emitter
  var fadeDuration = 500
  /**
   * @type {MaybeNull<number>}
   */
  var swiperTimer = null
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
   * 切换指示器
   * @type {MaybeNull<JQuery<HTMLElement>>}
   */
  var $promotionsIndicators = null
  /**
   * @type {MaybeNull<JQuery<HTMLElement>>}
   */
  var $promotionsTips = null
   /**
   * @type {MaybeNull<JQuery<HTMLElement>>}
   */
  var $promotionsTipsMask = null
  /**
   * 当前正在展示的 promotion instance
   * @type {MaybeNull<PromotionInstance>}
   */
  var currentInstance = null

  /**
   * assertDefinedAndNonNull
   * 类型工具函数，没有实际逻辑作用，在 jsdoc 中使用类似 ts 的非空断言
   * @template T
   * @param {T} value
   * @returns {T extends null | undefined ? never : T}
   */
  function assert(value) {
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
   * @param {any[]} targetArr 
   * @param {any[]} sourceArr 
   */
  function copy(targetArr, sourceArr) {
    targetArr.push.apply(targetArr, sourceArr.slice(0))
  }

  /**
   * @param {number} time 
   */
  function getTimes(time) {
    var day = padStart(Math.floor(time / 1000 / 60 / 60 / 24), 2, '0')
    var hour = padStart(Math.floor(time / 1000 / 60 / 60 % 24), 2, '0')
    var minute = padStart(Math.floor(time / 1000 / 60 % 60), 2, '0')
    var seconds = padStart(Math.floor(time / 1000 % 60), 2, '0')
    
    return [
      day,
      hour,
      minute,
      seconds
    ]
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
   * promotion 自动切换
   */
  function startAutoToggle() {
    if (swiperTimer) destroyAutoToggle()
    swiperTimer = window.setInterval(function () {
      var currentIndex = findIndex(promotions, function (p) {
        return p.instance === currentInstance
      })
      if (currentIndex === -1) destroyAutoToggle()
      togglePromotion(
        (currentIndex + 1) % promotions.length
      )
    }, 5000)
  }

  /**
   * 停止 promotion 自动切换
   */
  function destroyAutoToggle() {
    if (swiperTimer) {
      window.clearInterval(swiperTimer)
      swiperTimer = null
    }
  }

  /**
   * 挂载弹框根容器
   */
  function mountPromotionsDialog() {
    $promotionsDialogMask = $('<div class="promotion_mask"></div>').hide().fadeIn(fadeDuration)
    $promotionsDialog = $('<div class="promotions"></div>').hide().fadeIn(fadeDuration)

    // 指示器
    $promotionsIndicators = $('<ul class="promotions-indicators"></ul>')
    promotions.forEach(function () {
      assert($promotionsIndicators).append('<li class="indicator"></li>')
    })
    $promotionsIndicators[0].addEventListener('click', function (event) {
      var target = /** @type {HTMLElement} */ (event.target)
      if (!$(target).hasClass('indicator')) {
        return
      }
      destroyAutoToggle()
      togglePromotion($(target).index())
      startAutoToggle()
    })
    $promotionsDialog.append($promotionsIndicators)

    $('.controlbar_component').addClass('above-tips')
    $('.controlbar_component_main').append($promotionsDialogMask).append($promotionsDialog)

    preventAndStopClick($promotionsDialog[0])
    $promotionsDialogMask[0].addEventListener('click', unmountPromotionsDialog)

    // 自动切换
    startAutoToggle()
  }

  /**
   * 卸载弹框跟容器
   */
  function unmountPromotionsDialog() {
    var currentPromotionName = currentInstance && currentInstance.promotionName

    assert($promotionsDialogMask).fadeOut(fadeDuration, function () {
      assert($promotionsDialogMask).remove()
      $promotionsDialogMask = null
    })

    assert($promotionsDialog).fadeOut(fadeDuration, function () {
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
      assert($promotionsDialog).remove()
      $promotionsDialog = null

      if (currentPromotionName) {
        showPromotionTips(currentPromotionName)
      }
    })

    currentInstance = null
  }

  /**
   * @param {PromotionName} name 
   * @return {JQuery<HTMLElement>}
   */
  function createPromotionContent(name) {
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
    var $el = createPromotionContent('luckywheel')
    var instance = promotion.instance = /** @type {PromotionInstance} */ ({
      $el: $el,
      promotionName: promotion.name,
      mounted: [],
      beforeUnmount: [],
      activated: [],
      deactivated: [],
      update: []
    })
    /** @type {number} */
    var countdownTimer

    var startCountdown = function () {
      var data = /** @type {LuckywheelData} */ (promotion.data)
      if (countdownTimer) destroyCountdown()
      var start = +toDate(data.serverTime)
      var delay = Date.now() - start
      var end = +toDate(data.info.endTime) + delay

      var handler = function () {
        var now = Date.now()
        var diff = end - now
        
        if (diff <= 0) {
          destroyCountdown()
          destroyPromotion(promotion.tranId)
          return
        }

        var times = getTimes(diff)
        $el.find('.cont_times li').each(function (index, element) {
          if (index <= 3) {
            $(element).text(times[index])
          }
        })
      }

      handler()
      countdownTimer = window.setInterval(handler, 500)
    }

    var destroyCountdown = function () {
      window.clearInterval(countdownTimer)
    }

    var updateRules = function () {
      var data = /** @type {LuckywheelData} */ (promotion.data)

      $el.find('.cont_units p').html(
        promotionResource.getImgNums(data.tu, 'lucky_units_num', 'luckywheel')
      )

      $el.find('.cont_prize .prize_total').html(
        promotionResource.getImgNums(spade.betInfo.currency + ' ' + mm.formatAmount(data.tr), 'lucky_prize_num', 'luckywheel')
      )

      var topPrizeNums = data.info.prizes.slice(0).sort(function (a, b) {
        return b - a
      }).shift()
      $el.find('.cont_prize .prize_top').html(
        promotionResource.getImgNums(spade.betInfo.currency + ' ' + mm.formatAmount(topPrizeNums), 'lucky_prize_num', 'luckywheel')
      )

      $el.find('.cont_turn .prize_turnover').text(
        spade.betInfo.currency + ' ' + mm.formatAmount(data.info.turnover)
      )
    }

    instance.mounted.push(function () {
      startCountdown()
      updateRules()
    })
    instance.beforeUnmount.push(destroyCountdown)

    // 当前场景同 mounted 操作
    copy(instance.activated, instance.mounted)
    // 当前场景同 beforeUnmount 操作
    copy(instance.deactivated, instance.beforeUnmount)

    instance.update.push(function () {
      if (instance === currentInstance) {
        startCountdown()
        updateRules()
      }
    })

    return instance
  }

  /**
   * Freespin
   * @param {Promotion} promotion
   * @return {PromotionInstance}
   */
  function createFreespinPromotionInstance(promotion) {
    var $el = createPromotionContent('freespinpromotion')
    var instance = promotion.instance = /** @type {PromotionInstance} */ ({
      $el: $el,
      promotionName: promotion.name,
      mounted: [],
      beforeUnmount: [],
      activated: [],
      deactivated: [],
      update: []
    })
    /** @type {number} */
    var countdownTimer

    var startCountdown = function () {
      var data = /** @type {FreespinpromotionData} */ (promotion.data)
      if (countdownTimer) destroyCountdown()
      var start = +toDate(data.serverTime)
      var delay = Date.now() - start
      var end = +toDate(data.endDate) + delay

      var handler = function () {
        var now = Date.now()
        var diff = end - now
        
        if (diff <= 0) {
          destroyCountdown()
          destroyPromotion(promotion.tranId)
          return
        }

        var times = getTimes(diff)
        $el.find('.cont_times li').each(function (index, element) {
          if (index <= 3) {
            $(element).text(times[index])
          }
        })
      }

      handler()
      countdownTimer = window.setInterval(handler, 500)
    }
    
    var destroyCountdown = function () {
      window.clearInterval(countdownTimer)
    }

    var updateRules = function () {
      var data = /** @type {FreespinpromotionData} */ (promotion.data)

      $el.find('.cont_units p').html(
        promotionResource.getImgNums(data.tu, 'freespin_num', 'freespinpromotion')
      )

      $el.find('.cont_turn .prize_turnover').html(
        promotionResource.getImgNums(
          data.turnover ? 
            (spade.betInfo.currency + ' ' + mm.formatAmount(data.turnover)) 
            : '-',
          'freespin_turn_num',
          'freespinpromotion'
        )
      )
    }

    instance.mounted.push(function () {
      startCountdown()
      updateRules()
    })
    instance.beforeUnmount.push(destroyCountdown)

    // 当前场景同 mounted 操作
    copy(instance.activated, instance.mounted)
    // 当前场景同 beforeUnmount 操作
    copy(instance.deactivated, instance.beforeUnmount)

    instance.update.push(function () {
      if (instance === currentInstance) {
        startCountdown()
        updateRules()
      }
    })

    return instance
  }

  /**
   * Redpacket
   * @param {Promotion} promotion
   * @return {PromotionInstance}
   */
  function createRedpacketPromotionInstance(promotion) {
    var $el = createPromotionContent('redpacket')
    var instance = promotion.instance = /** @type {PromotionInstance} */ ({
      $el: $el,
      promotionName: promotion.name,
      mounted: [],
      beforeUnmount: [],
      activated: [],
      deactivated: [],
      update: []
    })
    /** @type {number} */
    var countdownTimer

    var startCountdown = function () {
      var data = /** @type {RedpacketData} */ (promotion.data)
      if (countdownTimer) destroyCountdown()
      var start = +toDate(data.serverTime)
      var delay = Date.now() - start
      var end = +toDate(data.resultedTime) + delay

      var handler = function () {
        var now = Date.now()
        var diff = end - now
        
        if (diff <= 0) {
          destroyCountdown()
          destroyPromotion(promotion.tranId)
          return
        }

        var times = getTimes(diff)
        $el.find('.cont_times li').each(function (index, element) {
          if (index <= 3) {
            $(element).html(promotionResource.getImgNums(times[index], 'red_sec_num', 'redpacket'))
          }
        })
      }

      handler()
      countdownTimer = window.setInterval(handler, 500)
    }
    
    var destroyCountdown = function () {
      window.clearInterval(countdownTimer)
    }

    var updateRules = function () {
      var data = /** @type {RedpacketData} */ (promotion.data)

      $('.cont_units p').html(
        promotionResource.getImgNums(data.tu, 'red_units_num', 'redpacket')
      )

      $('.cont_prize .prize_total').html(
        promotionResource.getImgNums(spade.betInfo.currency + ' ' + mm.formatAmount(data.tr), 'lucky_prize_num', 'redpacket')
      )

      $('.cont_prize .prize_top').html(
        promotionResource.getImgNums(spade.betInfo.currency + ' ' + mm.formatAmount(data.lma), 'lucky_prize_num', 'redpacket')
      )

      $('.cont_turn .prize_turnover').text(
        spade.betInfo.currency + ' ' + mm.formatAmount(data.turnover)
      )
    }

    instance.mounted.push(function () {
      // _initUnitsHtml
      $el.find('.cont_units').html(
        // 泰语数字在文案中间
        spade.content.language === 'th_TH'
          ? '<span class="bgimgredpacket_lan promotion_subtitle"></span><p></p><span class="bgimgredpacket_lan promotion_subtitle_2">'
          : '<p></p><span class="bgimgredpacket_lan promotion_subtitle"></span><span class="bgimgredpacket_lan promotion_subtitle_2">'
      )
      startCountdown()
      updateRules()
    })

    instance.beforeUnmount.push(destroyCountdown)

    instance.activated.push(function () {
      startCountdown()
      updateRules()
    })

    copy(instance.deactivated, instance.beforeUnmount)

    instance.update.push(function () {
      if (instance === currentInstance) {
        startCountdown()
        updateRules()
      }
    })

    return instance
  }

  /**
   * RedpacketNew
   * @param {Promotion} promotion
   * @return {PromotionInstance}
   */
  function createRedpacketNewPromotionInstance(promotion) {
    var $el = createPromotionContent('redpacketnew')
    var instance = promotion.instance = /** @type {PromotionInstance} */ ({
      $el: $el,
      promotionName: promotion.name,
      mounted: [],
      beforeUnmount: [],
      activated: [],
      deactivated: [],
      update: []
    })
    /** @type {number} */
    var countdownTimer

    var startCountdown = function () {
      var data = /** @type {RedpacketNewData} */ (promotion.data)
      if (countdownTimer) destroyCountdown()
      if (!data.serverTime) return
      var start = +toDate(data.serverTime)
      var delay = Date.now() - start
      var end = +toDate(data.packetInfo.resultedTime) + delay

      var handler = function () {
        var now = Date.now()
        var diff = end - now
        
        if (diff <= 0) {
          destroyCountdown()
          destroyPromotion(promotion.tranId)
          return
        }

        var times = getTimes(diff)
        $el.find('.cont_times li').each(function (index, element) {
          if (index <= 3) {
            $(element).html(
              promotionResource.getImgNums(times[index], 'red_sec_num', 'redpacketnew')
            )
          }
        })
      }

      handler()
      countdownTimer = window.setInterval(handler, 500)
    }
    
    var destroyCountdown = function () {
      window.clearInterval(countdownTimer)
    }

    var updateRules = function () {
      var data = /** @type {RedpacketNewData} */ (promotion.data)

      $('.cont_units p').html(
        promotionResource.getImgNums(data.packetInfo.tu, 'red_units_num', 'redpacketnew')
      )

      $('.cont_prize .prize_total').html(
        promotionResource.getImgNums(spade.betInfo.currency + ' ' + mm.formatAmount(data.packetInfo.tr, ''), 'lucky_prize_num', 'redpacketnew')
      )

      $('.cont_prize .prize_top').html(
        promotionResource.getImgNums(spade.betInfo.currency + ' ' + mm.formatAmount(data.packetInfo.lma, ''), 'lucky_prize_num', 'redpacketnew')
      )
      
      $('.cont_turn .prize_turnover').text(
        spade.betInfo.currency + ' ' + mm.formatAmount(data.packetInfo.turnovers[0], '')
      )
    }

    instance.mounted.push(function () {
      // _initUnitsHtml
      $el.find('.cont_units').html(
        '<span class="bgimgredpacketnew_lan promotion_subtitle"></span><p></p><span class="bgimgredpacketnew_lan promotion_subtitle_2">'
      )
      startCountdown()
      updateRules()
    })

    instance.beforeUnmount.push(destroyCountdown)

    instance.activated.push(function () {
      startCountdown()
      updateRules()
    })

    copy(instance.deactivated, instance.beforeUnmount)

    instance.update.push(function () {
      if (instance === currentInstance) {
        startCountdown()
        updateRules()
      }
    })

    return instance
  }

  /**
   * RedpacketNew
   * @param {Promotion} promotion
   * @return {PromotionInstance}
   */
  function createTournamentPromotionInstance(promotion) {
    var $el = createPromotionContent('tournament')
    var instance = promotion.instance = /** @type {PromotionInstance} */ ({
      $el: $el,
      promotionName: promotion.name,
      mounted: [],
      beforeUnmount: [],
      activated: [],
      deactivated: [],
      update: []
    })
    /** @type {number} */
    var countdownTimer

    var startCountdown = function () {
      var data = /** @type {TournamentData} */ (promotion.data)
      if (countdownTimer) destroyCountdown()
      var start = +toDate(data.serverTime)
      var delay = Date.now() - start
      var end = +toDate(data.endDate) + delay

      var handler = function () {
        var now = Date.now()
        var diff = end - now
        
        if (diff <= 0) {
          destroyCountdown()
          destroyPromotion(promotion.tranId)
          return
        }

        var times = getTimes(diff)
        $el.find('.cont_times li').each(function (index, element) {
          if (index <= 3) {
            $(element).text(times[index])
          }
        })
      }

      handler()
      countdownTimer = window.setInterval(handler, 500)
    }

    var destroyCountdown = function () {
      window.clearInterval(countdownTimer)
    }

    var updateRules = function () {
      var data = /** @type {TournamentData} */ (promotion.data)

      $el.find('.cont_units p').html(
        promotionResource.getImgNums(data.cp, 'tour_units_num', 'tournament')
      )

      $el.find('.cont_prize .prize_total').html(
        promotionResource.getImgNums(spade.betInfo.currency + ' ' + mm.formatAmount(data.ttlp), 'tour_prize_num', 'tournament')
      )

      $el.find('.cont_prize .prize_top').html(
        promotionResource.getImgNums(spade.betInfo.currency + ' ' + mm.formatAmount(data.tpp), 'tour_prize_num', 'tournament')
      )

      /**
       * @type {number}
       */
      var minBetNow = 0
      for(var i = 0; i < data.tournamentCurrencyIntegrals.length; i++) {
        var item = data.tournamentCurrencyIntegrals[i]
        if (item.minBet && item.currId == spade.content.currency) {
          minBetNow = mm.parseAmount(item.minBet)
          break
        }
      }
      $el.find('.cont_turn .prize_turnover').text(
        minBetNow
         ? spade.betInfo.currency + ' ' + minBetNow
         : '-'
      )
    }

    instance.mounted.push(function () {
      // _initUnitsHtml
      $el.find('.cont_units').html(
        '<p></p><span class="bgimgtournament_lan promotion_subtitle"></span><span class="bgimgtournament_lan promotion_subtitle_2">'
      )
      startCountdown()
      updateRules()
    })

    instance.beforeUnmount.push(destroyCountdown)

    instance.activated.push(function () {
      startCountdown()
      updateRules()
    })

    copy(instance.deactivated, instance.beforeUnmount)

    instance.update.push(function () {
      if (instance === currentInstance) {
        startCountdown()
        updateRules()
      }
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
      currentInstance.$el.fadeOut(fadeDuration, function () {
        if (!currentInstance || currentInstance.promotionName !== promotionName) {
          $('.controlbar_component_main').removeClass('component_' + promotionName)
        }
      })
      currentInstance = null
    }

    var promotion = promotions[index]

    if (!promotion) {
      console.warn('错误的 promotion index：' + index)
      console.warn('promotions len:', promotions.length)
      unmountPromotionsDialog()
      return
    }

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
      } else if (promotion.name === 'freespinpromotion') {
        newInstance = createFreespinPromotionInstance(promotion)
      } else if (promotion.name === 'redpacket') {
        newInstance = createRedpacketPromotionInstance(promotion)
      } else if (promotion.name === 'redpacketnew') {
        newInstance = createRedpacketNewPromotionInstance(promotion)
      } else if (promotion.name === 'tournament') {
        newInstance = createTournamentPromotionInstance(promotion)
      }
      if (newInstance) {
        assert($promotionsDialog).append(newInstance.$el)
        callLifeCycle(newInstance, 'mounted')
      }
    }
    // Show DOM
    if (newInstance) {
      $('.controlbar_component_main').addClass('component_' + newInstance.promotionName)
      newInstance.$el.hide().fadeIn(fadeDuration)
      // 切换指示器
      assert($promotionsIndicators).find('.indicator').each(function (indicatorIndex, indicatorEl) {
        if (indicatorIndex === index) {
          $(indicatorEl).addClass('active')
        } else {
          $(indicatorEl).removeClass('active')
        }
      })
      currentInstance = newInstance
    }
  }

  /**
   * 收到一个 promotion
   * @param {PromotionName} name 
   * @param {Promotion['data']} data 
   */
  function pushPromotion(name, data) {
    if (!$promotionsDialog) mountPromotionsDialog()

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
    } else if (name === 'redpacket') {
      var tranId = /** @type {RedpacketData} */ (data).tranId
      if (!updateIfExists(tranId, data)) {
        promotions.push({
          name: name,
          tranId: tranId,
          data: /** @type {RedpacketData} */ (data)
        })
      }
    } else if (name === 'redpacketnew') {
      var tranId = /** @type {RedpacketNewData} */ (data).packetInfo.tranId
      if (!updateIfExists(tranId, data)) {
        promotions.push({
          name: name,
          tranId: tranId,
          data: /** @type {RedpacketNewData} */ (data)
        })
      }
    } else {
      // tournament
      var tranId = /** @type {TournamentData} */ (data).tranId
      if (!updateIfExists(tranId, data)) {
        promotions.push({
          name: name,
          tranId: tranId,
          data: /** @type {TournamentData} */ (data)
        })
      }
    }

    assert($promotionsIndicators).append('<li class="indicator"></li>')
    if (promotions.length === 1) togglePromotion(0)
  }

  /**
   * 销毁指定的 promotion，并在有下一个 promotion 时候切换到下一个，没有下一个时关闭整个弹框
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
    // 删除指示器
    assert($promotionsIndicators).find('.indicator').eq(willDestroyIndex).remove()
    // 移除 DOM
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
          $el.fadeOut(function () {
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

  /**
   * @param {PromotionName} name 
   * @returns 
   */
  function showPromotionTips(name) {
    // isRemainCount
    if ((spade.content.setting.freeGame && spade.content.setting.freeGame.remainingCount != undefined && spade.content.setting.freeGame.remainingCount != 0) || (spade.content.remainingCount != undefined && spade.content.remainingCount != 0)) return
    if(spade.betInfo.isAuto || spade.betInfo.isFree) return
    // _promotionDisable
    if (!spade.content.setting.freeGame && !spade.betInfo.isFree && !spade.content.setting.bonusGame) return
    spade.content.canTouchSpace = false

    var getString = function () {
      /** @type {string} */
      var str = Locale.getString("TXT_PROMOTION_TIPS_" + name.toUpperCase())
      var reg = new RegExp("\\[\\[.+\\]\\]", "g")
      str = str.replace(reg, function (word) {
        word = word.substring(2, word.length - 2)
        return '<span>' + word + '</span>'
      })
      str = str.replace("{0}", 'TODO').replace(/%d/g, "<br>")
      return str
    }

    $promotionsTipsMask = $('<div class="controlbar_promotiontips_mask controlbar_quit_mask"></div>')
    $promotionsTips = $(
      '<div class="controlbar_promotiontips controlbar_quit clearfix">' +
      '    <div class="quit_text">' +
      '        <p>' + getString() + '</p>' +
      '    </div>' +
      '    <div class="quit_btn">' +
      '        <div class="btn_no">' + Locale.getString("TXT_CHNAGECREDIT_NO") + '</div>' +
      '        <div class="btn_yes">' + Locale.getString("TXT_CHNAGECREDIT_YES") + '</div>' +
      '    </div>' +
      '</div>'
    )
    
    $promotionsTips.find('.btn_no')[0].addEventListener('click', function () {
      destroyPromotionTips()
    })
    $promotionsTips.find('.btn_yes')[0].addEventListener('click', function () {
      destroyPromotionTips(function () {
        // TODO: emit
      })
    })

    $('TODO').append($promotionsTipsMask).append($promotionsTips)

    new TweenMax.to({ scale: 0, opacity: 0 }, 0.2, {
      scale: 1,
      opacity: 1,
      onUpdate: function () {
        assert($promotionsTipsMask).css({
          opacity: this.target.opacity
        })
        assert($promotionsTips).css({
          transform: 'translate(-50%,-50%) scale(' + this.target.scale + ')',
          'transform-origin': 'center center',
          opacity: this.target.opacity
        })
      }
    })
  }

  /**
   * @param {() => void} [callback]
   */
  function destroyPromotionTips(callback) {
    if (!$promotionsTips) return

    new TweenMax.to({ scale: 1, alpha: 1 }, 0.2, {
      scale: 0,
      alpha: 0,
      onUpdate: function () {
        assert($promotionsTips).css({
          transform: 'translate(-50%,-50%) scale(' + this.target.scale + ')',
          'transform-origin': 'center center',
          opacity: this.target.opacity
        })
        assert($promotionsTipsMask).css({
          opacity: this.target.opacity
        })
      },
      onComplete: function () {
        assert($promotionsTips).remove()
        assert($promotionsTipsMask).remove()
        $promotionsTips = null
        $promotionsTipsMask = null
        spade.content.canTouchSpace = true
        callback && callback()
      }
    })
  }

  // -25轮盘推送
  emitter.on(Service._Commands.WHEEL_OPEN, function (/** @type {LuckywheelData} */ data) {
    pushPromotion('luckywheel', data)
  })
  // -26 轮盘关闭
  emitter.on(Service._Commands.WHEEL_CLOSE, function (/** @type {any}*/ data) {
    destroyPromotion(data.tranId)
  })

  // freespin 推送开启
  emitter.on(Service._Commands.FREESPIN_PROMOTION_OPEN, function (/** @type {FreespinpromotionData} */ data) {
    pushPromotion('freespinpromotion', data)
  })
  // freespin 推送关闭
  emitter.on(Service._Commands.FREESPIN_PROMOTION_CLOSE, function (/** @type {any} */ data) {
    destroyPromotion(data.tranId)
  })

  // -13 红包推送
  emitter.on(Service._Commands.DRAW_MSG, function (/** @type {RedpacketData} */ data) {
    pushPromotion('redpacket', data)
  })
  // -14 红包关闭推送
  emitter.on(Service._Commands.DRAW_CLOSE, function (/** @type {any} */ data) {
    destroyPromotion(data.tranId)
  })

  // -38 红包推送
  emitter.on(Service._Commands.REDPACKETNEW_OPEN, function (/** @type {RedpacketNewData} */ data) {
    pushPromotion('redpacketnew', data)
  })
  // -39 红包关闭推送
  emitter.on(Service._Commands.REDPACKETNEW_CLOSE, function (/** @type {any} */ data) {
    destroyPromotion(data.tranId)
  })

  // 排行榜推送开启
  emitter.on(Service._Commands.TOUR_OPEN, function (/** @type {TournamentData} */ data) {
    pushPromotion('tournament', data)
  })
  // 排行榜推送关闭
  emitter.on(Service._Commands.TOUR_CLOSE, function (/** @type {any} */ data) {
    destroyPromotion(data.tranId)
  })

  // TODO: REMOVE
  window.promotions = promotions
  window.togglePromotion = togglePromotion
  window.destroyPromotion = destroyPromotion
}()