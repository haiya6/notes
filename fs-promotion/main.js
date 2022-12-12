// @ts-check

; (function () {
  var define = promotionUtils.define
  var setupComponent = promotionUtils.setupComponent

  var service = Service.create()
  var emitter = new Emitter()

  /** @type {Promotion[]} */
  var promotions = []
  /** @type {Map<Promotion, PromotionState>} */
  var promotion2State = new Map()
  // live 阶段的 promotion 数量
  var livePromotionCount = 0

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
      options.unmount = function (/** @type {CustomData=} */ data) {
        options._unmountCustomData = data
        promotionCategory.removeItem(options)
      }
      return options
    },
    closeBanner: function () {
      promotionBanner.unmount()
    },
    closeTip: function () {
      promotionTip.unmount()
    },
    openCategory: function (options) {
      if (!options || typeof options.categoryName === 'undefined') {
        options = options || {}
        options.categoryName = livePromotionCount > 0 ? PromotionCategoryNames.Live : PromotionCategoryNames.Registering
      }
      promotionCategory.open(options)
    },
    closeCategory: function () {
      promotionCategory.destroy()
    },
    useCategoryDetailModal: function (callback) {
      return promotionCategory.useCategoryDetailModal(callback)
    }
  }

  // expose ---
  define(window, 'promotionAPI', api)

  var promotionBanner = new PromotionBanner(api)
  var promotionTip = new PromotionTip(api)
  var promotionCategory = new PromotionCategory(api)

  /**
   * @param {string[]} languages 
   */
  function setLanguage(languages) {
    if (!promotionResourceLoader.language) {
      promotionResourceLoader.language = languages.indexOf(spade.content.language) > -1 ? spade.content.language : 'en_US'
    }
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

      var bannerComponent = promotion2BannerComponent.get(promotions[existingIndex])
      if (bannerComponent) promotionBanner.updateBanner(bannerComponent)

      var tipComponent = promotion2TipComponent.get(promotions[existingIndex])
      if (tipComponent) promotionTip.updateTip(tipComponent)
    } else {
      // create
      var state = promotionUtils.getPromotionState(promotion)
      promotions.push(promotion)
      promotion2State.set(promotion, state)

      // 尝试刷新分类列表
      promotionCategory.refreshList(promotionUtils.getPromotionCategoryName(promotion, state))

      var ns = PromotionName2PromotionNS.get(promotion.name)
      if (ns) {
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
    }
    // 尝试更新 category 面板中已经展示的组件，这些组件没有单独的更新接口，借助这个推送来更新
    promotionCategory.handlePromotionChange(promotion)
    updateLivePromotionCountTag()
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
    promotion2State.delete(promotion)
    promotion2BannerComponent.delete(promotion)
    promotion2TipComponent.delete(promotion)
    promotionCategory.removeItemByTranId(tranId)
    
    updateLivePromotionCountTag()
  }

  function updateLivePromotionCountTag() {
    var iter = promotion2State.entries()
    var registeringCount = 0
    livePromotionCount = 0

    for(;;) {
      var v = iter.next()
      if (v.done) break
      var categoryName = promotionUtils.getPromotionCategoryName(v.value[0], v.value[1])
      if (categoryName) {
        if (categoryName === PromotionCategoryNames.Registering) registeringCount++
        else if (categoryName === PromotionCategoryNames.Live) livePromotionCount++
      }
    }
    var $tag = $('#controlbarH5 .tools_component')
    if (registeringCount || livePromotionCount) $tag.show()
    else $tag.hide()

    var $count = $tag.find('.gift_count')
    $count.text(livePromotionCount)
    if (livePromotionCount == 0) $count.hide()
    else $count.show()
  }

  // freespin
  service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_OPEN, function (/** @type {any} */ data) {
    var $receiveTimestamp = Date.now()
    setLanguage(data.languages)
    promotionResourceLoader.load(PromotionNames.FreeSpin, function () {
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
    setLanguage(data.languages)
    promotionResourceLoader.load(PromotionNames.FreeSpin, function () {
      addOrUpdatePromotion({
        $receiveTimestamp: $receiveTimestamp,
        name: PromotionNames.FreeSpin,
        tranId: data.tranId,
        data: data
      })
    });
  })
  service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_CLOSE, function (/** @type {any} */ data) {
    removePromotion(data.tranId);

    var isCommonTranId=data.tranId==spade.content.luckyTranId && data.promotionCode==spade.content.luckyCode && data.promotionGroup==spade.content.luckyGroup;
    if(isCommonTranId){
      scene._controlBar.hideFreeTips({
        luckySpins: data.info.luckySpins - data.info.remainLuckySpin,
        lstw: data.info.gameWin
      });
      if(spade.betInfo.slotStatus==SlotStatus.NORMAL) scene._controlBar.showFreeSpinWins(SlotStatus.NORMAL);
    }
  })

  // tournament
  service.bindPushEvent(Service._Commands.TOUR_OPEN, function (/** @type {any} */data) {
    var $receiveTimestamp = Date.now()
    setLanguage(data.languages)

    promotionResourceLoader.load(PromotionNames.Tournament, function () {
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

  // promotion 仅发生阶段变化
  // st === 1：从第一阶段到第二阶段
  // st === 2：第二阶段到第三阶段
  service.bindPushEvent(Service._Commands.PROMOTION_STAGE_CHANGE, function (/** @type {{ tid: number, st: number }} */ data) {
    var promotion = promotionUtils.find(promotions, function (p) {
      return p.tranId === data.tid
    })
    if (!promotion) return
    if (data.st === 1) {
      promotion2State.set(promotion, PromotionStates.EndIn)
      promotionCategory.refreshList(
        promotionUtils.getPromotionCategoryName(promotion, PromotionStates.EndIn)
      )
    } else if (data.st === 2) {
      promotion2State.set(promotion, PromotionStates.ExpiredIn)
    }
    updateLivePromotionCountTag()
  })
})();
