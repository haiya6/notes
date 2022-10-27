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
    openCategory: function (options) {
      promotionCategory.open(options)
    },
    closeCategory: function () {
      promotionCategory.destroy()
    },
    useCategoryDetailModal: function (doOpen) {
      return promotionCategory.useCategoryDetailModal(doOpen)
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
  function notifyComponentUpdates(promotion) {
    var bannerComponent = promotion2BannerComponent.get(promotion)
    var tipComponent = promotion2TipComponent.get(promotion)

    if (bannerComponent && bannerComponent.onUpdated) bannerComponent.onUpdated()
    if (tipComponent && tipComponent.onUpdated) tipComponent.onUpdated()
  }

  /**
   * @param {Promotion} promotion
   */
  function addOrUpdatePromotion(promotion) {
    var existingIndex = promotionUtils.findIndex(promotions, function (p) {
      return p.tranId === promotion.tranId
    })
    if (existingIndex !== -1) {
      // update
      promotions[existingIndex].$receiveTimestamp = promotion.$receiveTimestamp
      promotions[existingIndex].data = promotion.data
      notifyComponentUpdates(promotions[existingIndex])
    } else {
      // create
      promotions.push(promotion)
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

    updateTag()
  }



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
      return prev + Number(promotionUtils.getPromotionState(promotion) === PromotionStates.Live)
    }, 0)
    var $tag = $('#controlbarH5 .tools_component')
    var $count = $tag.find('.gift_count')
    $count.text(count)
    if (count == 0) $tag.hide()
    else $tag.show()
  }

  // freespin
  service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_OPEN, function (/** @type {any} */ data) {
    var $receiveTimestamp = Date.now()
    promotionResourceLoader.load(PromotionNames.FreeSpin, data.languages, function () {
      addOrUpdatePromotion({
        $receiveTimestamp: $receiveTimestamp,
        name: PromotionNames.FreeSpin,
        tranId: data.tranId,
        data: data
      })
    })
  })
  service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_ACCESS, function (/** @type {any} */ data) {
    var $receiveTimestamp = Date.now()
    promotionResourceLoader.load(PromotionNames.FreeSpin, data.languages, function () {
      addOrUpdatePromotion({
        $receiveTimestamp: $receiveTimestamp,
        name: PromotionNames.FreeSpin,
        tranId: data.tranId,
        data: data
      })
    });
  })
  service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_CLOSE, function (/** @type {any} */ data) {
    removePromotion(data.tranId)
  })

  // tournament
  service.bindPushEvent(Service._Commands.TOUR_OPEN, function (/** @type {any} */data) {
    var $receiveTimestamp = Date.now()
    promotionResourceLoader.load(PromotionNames.Tournament, data.languages, function () {
      addOrUpdatePromotion({
        $receiveTimestamp: $receiveTimestamp,
        name: PromotionNames.Tournament,
        tranId: data.tranId,
        data: data
      })
    })
  })
  service.bindPushEvent(Service._Commands.TOUR_CLOSE, function (/** @type {any} */data) {
    removePromotion(data.tranId)
  })
})();
