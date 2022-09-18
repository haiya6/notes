// @ts-check

; void function () {
  /**
   * @template T
   * @typedef {import('./promotion').MaybeNull<T>} MaybeNull
   */

  /**
   * @typedef {import('./promotion').LifeCycle} LifeCycle
   * @typedef {import('./promotion').PromotionInstance} PromotionInstance
   * @typedef {import('./promotion').PromotionName} PromotionName
   * @typedef {import('./promotion').PromotionConfig} PromotionConfig
   * @typedef {import('./promotion').PromotionDataMap} PromotionDataMap
   * @typedef {import('./promotion').Promotion} Promotion
   */

  // @ts-expect-error
  var mm = window.mm
  // @ts-expect-error
  var promotionResource = window.resource_promotion
  // @ts-expect-error
  var spade = window.spade
  // @ts-expect-error
  var Locale = window.Locale
  // @ts-expect-error
  var pushProxy = window.pushProxy
  var promotionUtils = window.promotionUtils
  // @ts-expect-error
  var TweenMax = window.TweenMax
  // @ts-expect-error
  var LuckWheel2 = window.LuckWheel2

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
  var promotions = pushProxy.promotions
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
   * 获取当前示例所在的索引，不存在返回 -1
   */
  function getCurrentIndex() {
    return findIndex(promotions, function (p) {
      return p.textInstance === currentInstance
    })
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
   * @param {JQuery<HTMLElement>} $el
   * @param {Promotion} promotion
   * @return {PromotionInstance}
   */
  function initInstance($el, promotion) {
    var instance = {
      $el: $el,
      promotion: promotion,
      mounted: [],
      beforeUnmount: [],
      activated: [],
      deactivated: [],
      update: []
    }
    promotion.textInstance = instance
    return instance
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
      var currentIndex = getCurrentIndex()
      if (currentIndex === -1) destroyAutoToggle()
      togglePromotion((currentIndex + 1) % promotions.length)
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

    // 关闭按钮
    var $btnClose = $('<div class="btn-close">x</div>')
    $promotionsDialog.append($btnClose)
    $btnClose[0].addEventListener('click', unmountPromotionsDialog)

    // 指示器
    $promotionsIndicators = $('<ul class="promotions-indicators"></ul>')
    // 绑定指示器点击事件
    $promotionsIndicators[0].addEventListener('click', function (event) {
      var target = /** @type {HTMLElement} */ (event.target)
      if (!$(target).hasClass('indicator')) {
        return
      }
      togglePromotion($(target).index())
    })
    $promotionsDialog.append($promotionsIndicators)

    $('.controlbar_component').addClass('above-tips')
    $('.controlbar_component_main').append($promotionsDialogMask).append($promotionsDialog)

    preventAndStopClick($promotionsDialog[0])
    $promotionsDialogMask[0].addEventListener('click', unmountPromotionsDialog)
  }

  /**
   * 卸载弹框跟容器
   */
  function unmountPromotionsDialog() {
    var currentPromotion = assert(currentInstance).promotion

    assert($promotionsDialogMask).fadeOut(fadeDuration, function () {
      assert($promotionsDialogMask).remove()
      $promotionsDialogMask = null
    })

    assert($promotionsDialog).fadeOut(fadeDuration, function () {
      promotions.forEach(function (promotion) {
        if (promotion.textInstance) {
          callLifeCycle(promotion.textInstance, 'beforeUnmount')
          promotion.textInstance = undefined
        }
      })
      $('.controlbar_component').removeClass('above-tips')
      $('.controlbar_component_main').removeClass('component_' + currentPromotion.name)
      assert($promotionsDialog).remove()
      $promotionsDialog = null
      judgShowPromotionTips(currentPromotion)
    })

    destroyAutoToggle()
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
    var instance = initInstance($el, promotion)
    var data = /** @type {PromotionDataMap['luckywheel']} */ (promotion.data)
    var /** @type {number} */ start, /** @type {number} */ end

    /**
     * @param {string[]} times 
     */
    var update = function (times) {
      $el.find('.cont_times li').each(function (index, element) {
        if (index <= 3) {
          $(element).text(times[index])
        }
      })
    }

    var countdownHandler = function () {
      var diff = end - Date.now()
      if (diff <= 0) {
        destroyCountdown()
        update(getTimes(0))
        return
      }
      update(getTimes(diff))
    }

    var startCountdown = function () {
      start = +toDate(data.serverTime)
      end = +toDate(data.info.endTime) + (Date.now() - start)
      destroyCountdown()
      promotionUtils.ticker.add(countdownHandler)
    }

    var destroyCountdown = function () {
      promotionUtils.ticker.remove(countdownHandler)
    }

    var updateRules = function () {
      $el.find('.cont_units p').html(
        promotionResource.getImgNums(data.tu, 'lucky_units_num', 'luckywheel')
      )
      $el.find('.cont_prize .prize_total').html(
        promotionResource.getImgNums(spade.betInfo.currency + ' ' + mm.formatAmount(data.tr), 'lucky_prize_num', 'luckywheel')
      )
      var topPrizeNums = data.info.prizes.slice(0).sort(function (a, b) { return b - a }).shift()
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
    var instance = initInstance($el, promotion)
    var data = /** @type {PromotionDataMap['freespinpromotion']} */ (promotion.data)
    var /** @type {number} */ start, /** @type {number} */ end

    /**
     * @param {string[]} times 
     */
    var update = function (times) {
      $el.find('.cont_times li').each(function (index, element) {
        if (index <= 3) {
          $(element).text(times[index])
        }
      })
    }

    var countdownHandler = function () {
      var diff = end - Date.now()
      if (diff <= 0) {
        destroyCountdown()
        update(getTimes(0))
        return
      }
      update(getTimes(diff))
    }

    var startCountdown = function () {
      start = +toDate(data.list[0].serverTime)
      end = +toDate(data.list[0].endDate) + (Date.now() - start)
      destroyCountdown()
      promotionUtils.ticker.add(countdownHandler)
    }
    
    var destroyCountdown = function () {
      promotionUtils.ticker.remove(countdownHandler)
    }

    var updateRules = function () {
      $el.find('.cont_units p').html(
        promotionResource.getImgNums(data.list[0].tu, 'freespin_num', 'freespinpromotion')
      )
      $el.find('.cont_turn .prize_turnover').html(
        promotionResource.getImgNums(
          data.list[0].turnover ? 
            (spade.betInfo.currency + ' ' + mm.formatAmount(data.list[0].turnover)) 
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
    var instance = initInstance($el, promotion)
    var data = /** @type {PromotionDataMap['redpacket']} */ (promotion.data)
    var /** @type {number} */ start, /** @type {number} */ end

    /**
     * @param {string[]} times 
     */
    var update = function (times) {
      $el.find('.cont_times li').each(function (index, element) {
        if (index <= 3) {
          $(element).html(promotionResource.getImgNums(times[index], 'red_sec_num', 'redpacket'))
        }
      })
    }

    var countdownHandler = function () {
      var diff = end - Date.now()
      if (diff <= 0) {
        destroyCountdown()
        update(getTimes(0))
        return
      }
      update(getTimes(diff))
    }

    var startCountdown = function () {
      start = +toDate(data.serverTime)
      end = +toDate(data.resultedTime) + Date.now() - start
      destroyCountdown()
      promotionUtils.ticker.add(countdownHandler)
    }
    
    var destroyCountdown = function () {
      promotionUtils.ticker.remove(countdownHandler)
    }

    var updateRules = function () {
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
    var instance = initInstance($el, promotion)
    var data = /** @type {PromotionDataMap['redpacketnew']} */ (promotion.data)
    var /** @type {number} */ start, /** @type {number} */ end

    /**
     * @param {string[]} times 
     */
    var update = function (times) {
      $el.find('.cont_times li').each(function (index, element) {
        if (index <= 3) {
          $(element).html(
            promotionResource.getImgNums(times[index], 'red_sec_num', 'redpacketnew')
          )
        }
      })
    }

    var countdownHandler = function () {
      var diff = end - Date.now()
      if (diff <= 0) {
        destroyCountdown()
        update(getTimes(0))
        return
      }
      update(getTimes(diff))
    }

    var startCountdown = function () {
      start = +toDate(data.serverTime)
      end = +toDate(data.packetInfo.resultedTime) + (Date.now() - start)
      destroyCountdown()
      promotionUtils.ticker.add(countdownHandler)
    }
    
    var destroyCountdown = function () {
      promotionUtils.ticker.remove(countdownHandler)
    }

    var updateRules = function () {
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
    var instance = initInstance($el, promotion)
    var data = /** @type {PromotionDataMap['tournament']} */ (promotion.data)
    var /** @type {number} */ start, /** @type {number} */ end

    /**
     * @param {string[]} times 
     */
     var update = function (times) {
      $el.find('.cont_times li').each(function (index, element) {
        if (index <= 3) {
          $(element).text(times[index])
        }
      })
    }

    var countdownHandler = function () {
      var diff = end - Date.now()
      if (diff <= 0) {
        destroyCountdown()
        update(getTimes(0))
        return
      }
      update(getTimes(diff))
    }

    var startCountdown = function () {
      start = +toDate(data.serverTime)
      end = +toDate(data.endDate) + (Date.now() - start)
      destroyCountdown()
      promotionUtils.ticker.add(countdownHandler)
    }

    var destroyCountdown = function () {
      promotionUtils.ticker.remove(countdownHandler)
    }

    var updateRules = function () {
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
    var targetPromotion = promotions[index]

    if (!targetPromotion) {
      console.warn('错误的 promotion index：' + index)
      console.warn('promotions len:', promotions.length)
      unmountPromotionsDialog()
      return
    }

    if (targetPromotion.textInstance === currentInstance) {
      return
    }

    // 隐藏当前的 Promotion
    if (currentInstance) {
      var promotionName = currentInstance.promotion.name
      callLifeCycle(currentInstance, 'deactivated')
      assert(currentInstance.$el).fadeOut(fadeDuration, function () {
        if (!currentInstance || currentInstance.promotion.name !== promotionName) {
          $('.controlbar_component_main').removeClass('component_' + promotionName)
        }
      })
      currentInstance = null
    }

    /**
     * @type {MaybeNull<PromotionInstance>}
     */
    var newInstance = null
    if (targetPromotion.textInstance) {
      newInstance = targetPromotion.textInstance
      callLifeCycle(newInstance, 'activated')
    } else {
      if (targetPromotion.name === 'luckywheel') {
        newInstance = createLuckywheelPromotionInstance(targetPromotion)
      } else if (targetPromotion.name === 'freespinpromotion') {
        newInstance = createFreespinPromotionInstance(targetPromotion)
      } else if (targetPromotion.name === 'redpacket') {
        newInstance = createRedpacketPromotionInstance(targetPromotion)
      } else if (targetPromotion.name === 'redpacketnew') {
        newInstance = createRedpacketNewPromotionInstance(targetPromotion)
      } else if (targetPromotion.name === 'tournament') {
        newInstance = createTournamentPromotionInstance(targetPromotion)
      }
      if (newInstance) {
        assert($promotionsDialog).append(assert(newInstance.$el))
        callLifeCycle(newInstance, 'mounted')
      }
    }
    // Show DOM
    if (newInstance) {
      $('.controlbar_component_main').addClass('component_' + newInstance.promotion.name)
      assert(newInstance.$el).hide().fadeIn(fadeDuration)
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
   * @param {Promotion} promotion 
   * @returns 
   */
  function judgShowPromotionTips(promotion) {
    // isRemainCount
    if ((spade.content.setting.freeGame && spade.content.setting.freeGame.remainingCount != undefined && spade.content.setting.freeGame.remainingCount != 0) || (spade.content.remainingCount != undefined && spade.content.remainingCount != 0)) return
    if(spade.betInfo.isAuto || spade.betInfo.isFree) return

    spade.content.canTouchSpace = false

    var times = 0
    if (promotion.name === 'luckywheel') {
      times = promotion.data.spinRemain
    } else if (promotion.name === 'redpacket') {
      if (promotion.data.access) times = 1
    } else if (promotion.name === 'redpacketnew') {
      var canReceive = promotion.data.packetAcctInfo.canReceive
      if (canReceive && canReceive.length > 0) {
        times = 1
      }
    } else if (promotion.name === 'freespinpromotion') {
      times = promotion.data.list.reduce(function (total, current) {
        total += current.freeSpin.spinCount
        return total
      }, 0)
    }

    if (times === 0) return

    var getString = function () {
      /** @type {string} */
      var str = Locale.getString("TXT_PROMOTION_TIPS_" + promotion.name.toUpperCase())
      var reg = new RegExp("\\[\\[.+\\]\\]", "g")
      str = str.replace(reg, function (word) {
        word = word.substring(2, word.length - 2)
        return '<span>' + word + '</span>'
      })
      str = str.replace("{0}", times + '').replace(/%d/g, "<br>")
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
      var afterDestroy = function () {
        var openData
        if (promotion.name === 'luckywheel') {
          openData = new LuckWheel2({ tranId: promotion.tranId })
        }
        if (openData) {
          emitter.emit('promotion-open', openData)
        }
      }
      destroyPromotionTips(afterDestroy)
    })

    $('#controlbarH5').append($promotionsTipsMask).append($promotionsTips)

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

  emitter.on('promotion:new', function () {
    // 挂载容器
    if (!$promotionsDialog) {
      mountPromotionsDialog()
      // 添加已存在的 promotion 对应的指示器
      promotions.slice(1).forEach(function () {
        assert($promotionsIndicators).append('<li class="indicator"></li>')
      })
    }
    // 添加当前的指示器点
    assert($promotionsIndicators).append('<li class="indicator"></li>')

    // ADJUST: 可能会产生连续的闪烁
    togglePromotion(0)
    startAutoToggle()
  })

  emitter.on('promotion:updated', function (/** @type {Promotion} */ promotion) {
    if (promotion.textInstance) {
      callLifeCycle(promotion.textInstance, 'update')
    }
  })

  /**
   * promotion 是删除的 promotion
   * index 是删除前所在的索引
   */
  emitter.on('promotion:removed', function (/** @type {Promotion} */ promotion, /** @type {number} */ index) {
    if (!$promotionsDialog) return
    if (!promotion.textInstance) return
    // 删除指示器
    assert($promotionsIndicators).find('.indicator[data-id="' + promotion.tranId +'"]').remove()
    // 移除 DOM
    if (promotion.textInstance) {
      callLifeCycle(promotion.textInstance, 'beforeUnmount')
      var $el = assert(promotion.textInstance.$el)
      // 需要销毁的是当前正在展示的
      if (promotion.textInstance === currentInstance) {
        // 且只有这一个 Promotion
        if (promotions.length === 0) {
          unmountPromotionsDialog()
        } else {
          // 卸载 DOM 后切换到下一个
          $el.fadeOut(function () { $el.remove() })
          togglePromotion(index > promotions.length - 1 ? 0 : index)
        }
      } else {
        $el.remove()
      }
    }
  })
}()