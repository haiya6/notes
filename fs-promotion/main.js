// @ts-check

;(function () {
  var service = Service.create()

  /**
   * @type PromotionSource[]
   */
  var sources = []
  var emitter = new Emitter()
  
  var promotionBanner = new PromotionBanner(sources, emitter)
  var promotionTip = new PromotionTip(sources, emitter)
  var promotionCategory = new PromotionCategory(sources, emitter)

  /**
   * @param {Promotion} promotion
   */
  function addSource(promotion) {
    /**
     * @type {PromotionInstance}
     */
    var instance
    if (promotion.name === PromotionNames.FreeSpin) {
      instance = /** @type {any} */ (new FreeSpinPromotion(/** @type {FreeSpinPromotion} */ (promotion), emitter))
    } else if (promotion.name === PromotionNames.Tournament) {
      instance = /** @type {any} */ (new TournamentPromotion(/** @type {TournamentPromotion} */ (promotion), emitter))
    } else {
      throw new Error('未知的 Promotion name')
    }
    /**
     * @type {PromotionSource}
     */
    var source = { promotion: promotion, instance: instance }
    sources.push(source)
    // 避免在 Promotion 的构造函数中执行逻辑，因为构造函数执行时，上面的 push 方法还没有执行
    // 其它地方在使用 sources 时候，就会查询不到导致异常
    source.instance.setup()
  }

  /**
   * @param {PromotionSource} source 
   */
  function notifyComponentUpdates(source) {
    /**
     * @param {PromotionComponent} [component]
     */
    var callUpdateHookIfMounted = function (component) {
      if (component && component.$$el) {
        if (component.onUpdated) component.onUpdated()
      }
    }
    if (!source || !source.instance) return
    callUpdateHookIfMounted(source.instance.bannerComponent)
    callUpdateHookIfMounted(source.instance.tipComponent)
    callUpdateHookIfMounted(source.instance.contentComponent)
  }

  /**
   * @param {Promotion['tranId']} tranId
   */
  function removeSource(tranId) {
    var source = promotionUtils.find(sources, function (item) {
      return item.promotion.tranId === tranId
    })
    if (!source) return
    if (promotionBanner.mounted && source.instance.bannerComponent) {
      promotionBanner.removeBanner(source.instance.bannerComponent)
    }
    if (promotionTip.mounted && source.instance.tipComponent) {
      promotionTip.removeTip(source.instance.tipComponent)
    }
    if (promotionCategory.mounted && source.instance.contentComponent) {
      promotionCategory.removeItem(source.instance.contentComponent)
    }
  }

  // freespin
  service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_OPEN, function (/** @type {any} */ data) {
    promotionResourceLoader.load(PromotionNames.FreeSpin, data.languages, function () {
      addSource({
        $receiveTimestamp: Date.now(),
        name: PromotionNames.FreeSpin,
        tranId: data.tranId,
        data: data
      })
    })
  })
  service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_ACCESS, function (/** @type {any} */ data) {
    // TODO update
  })
  service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_CLOSE, function (/** @type {any} */ data) {
    // TODO: 校验 tranId 正确性
    removeSource(data.tranId)
  })

  // tournament
  service.bindPushEvent(Service._Commands.TOUR_OPEN, function (/** @type {any} */data) {
    promotionResourceLoader.load(PromotionNames.Tournament, data.languages, function () {
      addSource({
        $receiveTimestamp: Date.now(),
        name: PromotionNames.Tournament,
        tranId: data.tranId,
        data: data
      })
    })
  })
  service.bindPushEvent(Service._Commands.TOUR_CLOSE, function (/** @type {any} */data) {
    // TODO: 校验 tranId 正确性
    removeSource(data.tranId)
  })
})();
