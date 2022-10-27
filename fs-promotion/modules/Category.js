// @ts-check

/**
 * @class
 * @param {PromotionAPI} api
 */
function PromotionCategory(api) {
  this.api = api

  this.mounted = false
  this.drawerID = -1
  /**
   * @type {PromotionState | undefined}
   */
  this.activeState
  /**
   * @type {JQuery<HTMLElement> | undefined}
   */
  this.$root
  /**
   * @type {JQuery<HTMLElement> | undefined}
   */
  this.$contentList
  /**
   * @type {any}
   */
  this.scrollIns
  /**
   * @type {number | undefined}
   */
  this.delayRefreshScrollTimer
  /**
   * @type {PromotionComponent[]}
   */
  this.components = []
  /**
   * @type {Map<PromotionComponent, PromotionData>}
   */
  this.components2PromotionData = new Map()

  this.pageIndex = 0
  this.pageSize = 10
  this.hasMore = true
  // 是否处理滚动容器触底事件，如已经在触底加载了，可设置为 false 避免重复加载数据
  this.handleScrollEndEvent = true

  /** @type {JQuery<HTMLElement> | undefined} */
  this.$detailModal

  /**
   * 记录在渲染 list 之后是否有其它操作
   * @type {(() => void) | undefined}
   */
  this.afterRenderListCallback
  /**
   * @type {boolean | undefined}
   */
  this.nextOpenDetailModalUseAnimation
}

/**
 * @param {OpenCategoryOptions} [options] 
 */
PromotionCategory.prototype.open = function (options) {
  var ctx = this
  var assert = promotionUtils.assert
  var TXT_TOURNAMENT_STATUS = Locale.getString('TXT_TOURNAMENT_STATUS').split("%n%")

  this.$root = $(
    '<div class="promotion-category">' +
    '    <div class="btn-close">' +
    '       <span baseimg="bgimgpromotion " tag="promotion_close" class="bgimgpromotion  promotion_close_up"></span>' +
    '</div>' +
    '   <div class="top-bar">' +
    '       <div class="top-bar-icon bgimgpromotion gifts"></div>' +
    '       <div class="title">' + Locale.getString('TXT_PROMOTION') + '</div>' +
    '   </div>' +
    '   <ul class="tabs">' +
    '       <li class="tab-item" data-state="' + PromotionStates.Registering + '">' + TXT_TOURNAMENT_STATUS[0] + '</li>' +
    '       <li class="tab-item" data-state="' + PromotionStates.Live + '">' + TXT_TOURNAMENT_STATUS[1] + '</li>' +
    '       <li class="tab-item" data-state="' + PromotionStates.Ended + '">' + TXT_TOURNAMENT_STATUS[2] + '</li>' +
    '   </ul>' +
    SlotUtils.getLoadingHtml(false) +
    '   <div class="scroll-container">' +
    '       <div class="content">' +
    '         <div class="content__list"></div>' +
    '         <div class="loading-more">'+ SlotUtils.getLoadingHtml(false) +'</div>' +
    '       </div>' +
    '   </div>' +
    '</div>'
  )
  this.$contentList = this.$root.find('.content .content__list')

  this.drawerID = DrawerUI.open(this.$root)

  // 绑定关闭事件
  this.$root.find('.btn-close')[0].addEventListener('click', function () {
    promotionUtils.soundTick('info')
    ctx.destroy()
  })

  // 绑定 tab 切换事件
  this.$root.find('.tabs')[0].addEventListener('click', function (event) {
    var target = /** @type {HTMLElement} */ (event.target)
    if (!$(target).hasClass('tab-item')) return
    ctx.toggleTab(/** @type {PromotionState} */($(target).attr('data-state')))
  })

  this.mounted = true
  this.initScroll()

  if (options && options.openDetail) {
    var tranId = options.openDetail.tranId
    this.afterRenderListCallback = function () {
      var $target = assert(ctx.$contentList).children('[data-tran-id="' + tranId + '"]')
      if (!$target.length) {
        ctx.hideLoading()
        console.warn('找不到目标元素，tranId: ', tranId)
        return
      }
      ctx.nextOpenDetailModalUseAnimation = false
      // 触发 iscroll 的自定义事件
      $target[0].dispatchEvent(new Event('tap'))
      ctx.afterRenderListCallback = undefined
    }
    this.$root.children('.loading-circle').addClass('colored')
    this.toggleTab(options.openDetail.activeState)
  } else {
    this.toggleTab(PromotionStates.Live)
  }
}

/**
 * @type {PromotionAPI['useCategoryDetailModal']}
 */
PromotionCategory.prototype.useCategoryDetailModal = function (callback) {
  var ctx = this

  /**
   * @type {Parameters<typeof callback>[0]}
   */
  var doOpen = function ($content, options) {
    ctx.hideLoading()
    if (!ctx.mounted) return promotionUtils.NOOP
    if (ctx.$detailModal) ctx.destroyDetailModal({ animation: false })
    var assert = promotionUtils.assert
    // 默认值为 true
    var animation = true
    if (options && options.animation) animation = options.animation
    if (typeof ctx.nextOpenDetailModalUseAnimation !== 'undefined' && !ctx.nextOpenDetailModalUseAnimation) {
      animation = false
    }
    ctx.nextOpenDetailModalUseAnimation = undefined

    ctx.$detailModal = $('<div class="category__promotion-modal"></div>').append($content)
    if (options && options.wrapperClassNames) {
      options.wrapperClassNames.forEach(function (i) {
        assert(ctx.$detailModal).addClass(i)
      })
    }
    assert(ctx.$root).append(ctx.$detailModal)

    // 绑定图标事件
    promotionUtils.addIconEvents(ctx.$detailModal)

    // 国际化替换
    promotionUtils.localize(ctx.$detailModal)

    if (animation) {
      new TweenMax.fromTo(ctx.$detailModal[0], 0.2, { scale: 0 }, {
        scale: 1,
        ease: 'none'
      })
    }

    return ctx.destroyDetailModal.bind(ctx)
  }

  this.showLoading()
  callback(doOpen)
}

/**
 * @type {DestoryCategoryDetailModalFunction}
 */
PromotionCategory.prototype.destroyDetailModal = function (options) {
  var ctx = this
  if (!this.mounted || !this.$detailModal) return

  // 默认值为 true
  var animation = true
  if (options && options.animation) animation = options.animation

  var remove = function () {
    if (ctx.$detailModal) {
      ctx.$detailModal.remove()
      ctx.$detailModal = undefined
    }
  }

  if (animation) {
    new TweenMax.to(this.$detailModal[0], 0.2, {
      scale: 0,
      onComplete: remove
    })
  } else {
    remove()
  }
}

PromotionCategory.prototype.initScroll = function () {
  var ctx = this

  var assert = promotionUtils.assert
  this.scrollIns = new IScroll(assert(this.$root).find(".scroll-container")[0], {
    moveScale: 1 / gameSize.scale,
    mouseWheel: true,
    useTransform: !(mm.device.isIos() && !mm.device.isIpad()),
    scrollbars: true,
    interactiveScrollbars: true,
    tap: true
  })
  
  /**
   * @this {any}
   */
  var scrollEndHanlder = function () {
    if (!ctx.handleScrollEndEvent) return
    if (Math.abs(this.maxScrollY) - Math.abs(this.y) <= 10) {
      if (ctx.hasMore) {
        ctx.handleScrollEndEvent = false
        ctx.loadPromotionList()
      }
    }
  }

  this.scrollIns.on('scrollEnd', scrollEndHanlder)
}

PromotionCategory.prototype.destroyScroll = function () {
  if (this.scrollIns) {
    this.scrollIns.destroy()
    this.scrollIns = undefined
  }
}

PromotionCategory.prototype.delayRefreshScroll = function () {
  var ctx = this

  window.clearTimeout(this.delayRefreshScrollTimer)
  this.delayRefreshScrollTimer = window.setTimeout(function () {
    ctx.delayRefreshScrollTimer = undefined
    if (ctx.scrollIns) ctx.scrollIns.refresh()
  })
}

PromotionCategory.prototype.showLoading = function () {
  if (!this.mounted) return
  var assert = promotionUtils.assert

  assert(this.$root).children('.loading-circle').show()
}

PromotionCategory.prototype.hideLoading = function () {
  if (!this.mounted) return
  var assert = promotionUtils.assert

  assert(this.$root).children('.loading-circle').hide().removeClass('colored')
}

PromotionCategory.prototype.showLoadMoreLoading = function () {
  if (!this.mounted) return
  var assert = promotionUtils.assert
  
  assert(this.$root).find('> .scroll-container > .content > .loading-more').show()
}

PromotionCategory.prototype.hideLoadMoreLoading = function () {
  if (!this.mounted) return
  var assert = promotionUtils.assert
  
  assert(this.$root).find('> .scroll-container > .content > .loading-more').hide()
}

/**
 * @param {PromotionState} state 
 */
PromotionCategory.prototype.toggleTab = function (state) {
  if (!this.mounted) return
  var assert = promotionUtils.assert

  this.activeState = state

  // // 切换 tab
  assert(this.$root).find('.tabs .tab-item').removeClass('on')
  assert(this.$root).find('.tabs .tab-item[data-state="' + state + '"]').addClass('on')

  // 移除当前的组件
  this.removeAll(true)

  this.showLoading()
  this.hideLoadMoreLoading()

  // 加载新的数据
  this.pageIndex = 0
  this.hasMore = true
  this.loadPromotionList()
}

PromotionCategory.prototype.loadPromotionList = function () {
  if (!this.activeState) return
  var ctx = this

  var getBeginDate = function () {
    var now = new Date();
    var fullYear = now.getFullYear();
    var month = now.getMonth() + 1;
    month = month - 2;
    if (month < 1) {
      month += 12;
      fullYear -= 1;
    }
    return fullYear + "-" + (month < 10 ? "0" + month : month) + "-01";
  }

  /** @type {Record<string, any>} */
  var params = {
    merchantCode: spade.content.merchant,
    acctId: spade.content.acctId,
    currency: spade.content.currency,
    language: spade.content.language,
    beginDate: getBeginDate(),
    // @ts-expect-error
    endDate: new Date().format("yyyy-MM-dd"),
    status: promotionUtils.state2RequestStatus[this.activeState],
  }

  if (this.activeState === PromotionStates.Ended) {
    params.pageNo = ++this.pageIndex
    params.pageSize = this.pageSize
  }

  Service.create().getTournamentGamesList(params, function (/** @type {any} */ res) {
    ctx.handlePromotionListResult(res)
  })
}

/**
 * @param {GameListRequestResult} result 
 */
PromotionCategory.prototype.handlePromotionListResult = function (result) {
  var ctx = this
  if (result.code !== 0) return

  var assert = promotionUtils.assert

  // 目前在 ended 阶段只有 tournament 的数据，且是有分页的
  var hasMore = false
  var tournamentResult = result.map['B-TD01']
  var freeSpinResult = result.map['B-FS00']
  var now = Date.now()

  ;(function () {
    if (tournamentResult && tournamentResult.code === 0) {
      tournamentResult = assert(Service.create()._uncompressData(Service._Commands.TOUR_GAMES_LIST, tournamentResult))
      if (!tournamentResult || !Tournament.createMainComponent) return
      var serverTime = tournamentResult.st

      tournamentResult.list.forEach(function (item) {
        /** @type {TournamentMainComponentData} */
        var data = {
          promotionData: {
            __d: true,
            $receiveTimestamp: now,
            name: PromotionNames.Tournament,
            data: item,
            tranId: item.mainInfo.tranId
          },
          maxRankCount: assert(tournamentResult).maxRankCount,
          activeState: assert(ctx.activeState)
        }

        // ！！ 手动给每个数据添加 serverTime
        data.promotionData.data.mainInfo.serverTime = serverTime
        var component = assert(Tournament.createMainComponent)(data, ctx.api)
        ctx.components2PromotionData.set(component, data.promotionData)
        promotionUtils.setupComponent(component)
      })
      if (ctx.activeState === PromotionStates.Ended) {
        var tournamentPage = assert(tournamentResult.page)
        hasMore = tournamentPage.pageNo * tournamentPage.pageSize < tournamentPage.resultCount
      }
    }
  })()

  ;(function () {
    if (freeSpinResult && freeSpinResult.code === 0) {
      if (!FreeSpin.createMainComponent) return
      freeSpinResult.list.forEach(function (item) {
        /** @type {FreeSpinMainComponentData} */
        var data = {
          promotionData: {
            __d: true,
            $receiveTimestamp: now,
            name: PromotionNames.FreeSpin,
            data: item,
            tranId: item.tranId
          },
          activeState: assert(ctx.activeState)
        }
        var component = assert(FreeSpin.createMainComponent)(data, ctx.api)
        ctx.components2PromotionData.set(component, data.promotionData)
        promotionUtils.setupComponent(component)
      })
    }
  })()

  this.hasMore = hasMore
  if (this.hasMore) {
    this.showLoadMoreLoading()
    this.handleScrollEndEvent = true
  }
  else this.hideLoadMoreLoading()

  if (this.afterRenderListCallback) this.afterRenderListCallback()
  else this.hideLoading()
}

/**
 * @param {PromotionComponent} component
 */
PromotionCategory.prototype.appendItem = function (component) {
  var assert = promotionUtils.assert
  this.components.push(component)
  var promotionData = assert(this.components2PromotionData.get(component))
  component.$$el = component.initialRender()
  component.$$el.attr('data-tran-id', promotionData.tranId)
  assert(this.$contentList).append(component.$$el)
  this.delayRefreshScroll()
  if (component.onMounted) component.onMounted()
}

/**
 * @param {PromotionComponent} component
 * @param {boolean} [removeDOM] 默认值为 true
 */
PromotionCategory.prototype.removeItem = function (component, removeDOM) {
  if (!this.mounted) return

  removeDOM = typeof removeDOM === 'undefined' ? true : removeDOM

  var willRemoveIndex = this.components.indexOf(component)
  if (willRemoveIndex === -1) return

  // 删除数据
  this.components2PromotionData.delete(
    this.components.splice(willRemoveIndex, 1)[0]
  )
  // 若没有挂载
  var $$el = component.$$el
  component.$$el = undefined
  if (!$$el) return

  if (component.onBeforeUnmount) component.onBeforeUnmount()

  if (removeDOM) $$el.remove()
  this.delayRefreshScroll()
}

/**
 * 
 * @param {boolean} [removeDOM] 默认为 true
 */
PromotionCategory.prototype.removeAll = function (removeDOM) {
  var ctx = this
  // removeComponent 方法里面会修改 components，因此需要拷贝后遍历
  this.components.slice(0).forEach(function (component) {
    ctx.removeItem(component, removeDOM)
  })
}

PromotionCategory.prototype.destroy = function () {
  var ctx = this
  if (!this.mounted) return

  this.destroyScroll()
  this.removeAll(false)

  DrawerUI.close(this.drawerID, {
    onComplete: function () {
      ctx.$root = ctx.$contentList = ctx.$detailModal = undefined
      ctx.drawerID = -1
      ctx.activeState = undefined
      ctx.mounted = false
    }
  })
}
