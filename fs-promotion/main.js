// @ts-check

; (function () {
  var define = promotionUtils.define
  var setupComponent = promotionUtils.setupComponent

  var service = Service.create()
  var emitter = new Emitter()

  /** @type {Promotion[]} */
  var promotions = []

  /** @type {Map<Promotion, PromotionComponent>} */
  var promotion2BannerComponent = new Map()

  /** @type {Map<Promotion, PromotionComponent>} */
  var promotion2TipComponent = new Map()

  /** @type {Map<PromotionName, PromotionNS>} */
  var PromotionName2PromotionNS = new Map([
    [PromotionNames.Tournament, Tournament],
    [PromotionNames.FreeSpin, FreeSpin],
  ])

  /**
   * @type {PromotionAPI}
   */
  var api = {
    emitter: emitter,
    defineBannerComponent: function (/** @type {any} */ options) {
      options.mount = function () {
        promotionBanner.appendBanner(options)
      }
      options.unmount = function () {
        promotionBanner.removeBanner(options)
      }
      return options
    },
    defineTipComponent: function (/** @type {any} */ options) {
      options.mount = function () {
        promotionTip.appendTip(options)
      }
      options.unmount = function () {
        promotionTip.removeTip(options)
      }
      return options
    },
    defineMainComponent: function (/** @type {any} */ options) {
      options.mount = function () {
        promotionCategory.appendItem(options)
      }
      options.unmount = function () {
        promotionCategory.removeItem(options)
      }
      return options
    },
    closeBanner: function () {
      promotionBanner.unmount()
    },
    openCategory: function () {
      promotionCategory.open()
    },
    useCategoryDetailModal: function (promotionName, $content, options) {
      return promotionCategory.useCategoryDetailModal(promotionName, $content, options)
    }
  }

  // expose ---
  define(window, 'promotionAPI', api)

  var promotionBanner = new PromotionBanner(api)
  var promotionTip = new PromotionTip(api)
  var promotionCategory = new PromotionCategory(api)

  /**
   * @param {Promotion} promotion
   */
  function addPromotion(promotion) {
    promotions.push(promotion)
    updateTag()
    var ns = PromotionName2PromotionNS.get(promotion.name)
    if (!ns) return

    if (ns.createBannerComponent) {
      var component = ns.createBannerComponent(promotion, api)
      setupComponent(component)
      promotion2BannerComponent.set(promotion, component)
    }
    
    if (ns.createTipComponent) {
      var component = ns.createTipComponent(promotion, api)
      setupComponent(component)
      promotion2TipComponent.set(promotion, component)
    }
  }

  // function notifyComponentUpdates(source) {
  //   /**
  //    * @param {PromotionComponent} [component]
  //    */
  //   var callUpdateHookIfMounted = function (component) {
  //     if (component && component.$$el) {
  //       if (component.onUpdated) component.onUpdated()
  //     }
  //   }
  //   if (!source || !source.instance) return
  //   callUpdateHookIfMounted(source.instance.bannerComponent)
  //   callUpdateHookIfMounted(source.instance.tipComponent)
  // }

  /**
   * @param {Promotion['tranId']} tranId
   */
  function removePromotion(tranId) {
    var willRemoveIndex = promotionUtils.findIndex(promotions, function (item) {
      return item.tranId === tranId
    })
    if (willRemoveIndex === -1) return
    var promotion = promotions[willRemoveIndex]

    var bannerComponent = promotion2BannerComponent.get(promotion)
    if (bannerComponent) {
      promotionBanner.removeBanner(bannerComponent)
      if (bannerComponent.onBeforeRemove) bannerComponent.onBeforeRemove()
    }

    var tipComponent = promotion2TipComponent.get(promotion)
    if (tipComponent) {
      promotionTip.removeTip(tipComponent)
      if (tipComponent.onBeforeRemove) tipComponent.onBeforeRemove()
    }

    // 移除数据
    promotions.splice(willRemoveIndex, 1)
    promotion2BannerComponent.delete(promotion)
    promotion2TipComponent.delete(promotion)
    updateTag()
  }

  function updateTag() {
    var count = promotions.reduce(function (prev, promotion) {
      var normalizedDate = promotionUtils.normalizePeriodDate(promotion)
      return prev + Number(promotionUtils.getPromotionState(normalizedDate.beginDate, normalizedDate.endDate) === PromotionStates.Live)
    }, 0)
    var $tag = $('#controlbarH5 .tools_component')
    var $count = $tag.find('.gift_count')
    $count.text(count)
    if (count == 0) $tag.hide()
    else $tag.show()
  }

  // freespin
  service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_OPEN, function (/** @type {any} */ data) {
    promotionResourceLoader.load(PromotionNames.FreeSpin, data.languages, function () {
      addPromotion({
        $receiveTimestamp: Date.now(),
        name: PromotionNames.FreeSpin,
        tranId: data.tranId,
        data: data
      })
    })
  })
  service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_ACCESS, function (/** @type {any} */ data) {
    promotionResourceLoader.load(PromotionNames.FreeSpin, data.languages, function () {
      // TODO update or add
    });
  })
  service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_CLOSE, function (/** @type {any} */ data) {
    // TODO: 校验 tranId 正确性
    removePromotion(data.tranId)
  })

  // tournament
  service.bindPushEvent(Service._Commands.TOUR_OPEN, function (/** @type {any} */data) {
    promotionResourceLoader.load(PromotionNames.Tournament, data.languages, function () {
      addPromotion({
        $receiveTimestamp: Date.now(),
        name: PromotionNames.Tournament,
        tranId: data.tranId,
        data: data
      })
    })
  })
  service.bindPushEvent(Service._Commands.TOUR_CLOSE, function (/** @type {any} */data) {
    // TODO: 校验 tranId 正确性
    removePromotion(data.tranId)
  })
})();
