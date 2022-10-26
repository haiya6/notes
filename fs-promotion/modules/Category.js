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
  this.$content
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

  this.pageIndex = 0
  this.pageSize = 10
  this.hasMore = true

  /** @type {JQuery<HTMLElement> | undefined} */
  this.$detailModal
}

PromotionCategory.prototype.open = function () {
  var ctx = this
  var TXT_TOURNAMENT_STATUS = Locale.getString('TXT_TOURNAMENT_STATUS').split("%n%")

  this.$root = $(
    '<div class="promotion-category">' +
    '    <div class="btn-close">' +
    '       <span baseimg="bgimgpromotion " tag="promotion_close" class="bgimgpromotion  promotion_close_up"></span>' + 
      '</div>' +
    '   <div class="top-bar">' +
    '       <div class="title"></div>' +
    '   </div>' +
    '   <ul class="tabs">' +
    '       <li class="tab-item" data-state="' + PromotionStates.Registering + '">' + TXT_TOURNAMENT_STATUS[0] + '</li>' +
    '       <li class="tab-item" data-state="' + PromotionStates.Live + '">' + TXT_TOURNAMENT_STATUS[1] + '</li>' +
    '       <li class="tab-item" data-state="' + PromotionStates.Ended + '">' + TXT_TOURNAMENT_STATUS[2] + '</li>' +
    '   </ul>' +
    SlotUtils.getLoadingHtml(false) +
    '   <div class="scroll-container">' +
    '       <div class="content"></div>' +
    '   </div>' +
    '</div>'
  )
  this.$root.find('.loading-circle').hide()
  this.$content = this.$root.find('.content')
  this.drawerID = DrawerUI.open(this.$root)

  // 绑定关闭事件
  this.$root.find('.btn-close')[0].addEventListener('click', function () {
    ctx.destroy()
  })

  // 绑定 tab 切换事件
  this.$root.find('.tabs')[0].addEventListener('click', function (event) {
    var target = /** @type {HTMLElement} */ (event.target)
    if (!$(target).hasClass('tab-item')) return
    ctx.toggleTab(/** @type {PromotionState} */($(target).attr('data-state')))
  })

  this.mounted = true
  this.updateTitle()
  this.initScroll()
  this.toggleTab(PromotionStates.Registering)
}

/**
 * @param {PromotionName} [promotionName] 
 */
PromotionCategory.prototype.updateTitle = function (promotionName) {
  if (!this.mounted) return
  var assert = promotionUtils.assert

  var text = ''
  if (promotionName === PromotionNames.Tournament) {
    text = Locale.getString('TXT_TOURNAMENT')
  } else if (promotionName === PromotionNames.FreeSpin) {
    text = Locale.getString('TXT_FREESPIN')
  } else {
    text = Locale.getString('TXT_PROMOTION')
  }

  assert(this.$root).find('.top-bar .title').text(text)
}

/**
 * @type {PromotionAPI['useCategoryDetailModal']}
 */
PromotionCategory.prototype.useCategoryDetailModal = function (promotionName, $content, options) {
  if (!this.mounted) return promotionUtils.NOOP
  if (this.$detailModal) this.destroyDetailModal({ animation: false })
  var ctx = this
  var assert = promotionUtils.assert
  // 默认值为 true
  var animation = true
  if (options && options.animation) animation = options.animation

  this.updateTitle(promotionName)
  this.$detailModal = $('<div class="category__promotion-modal"></div>').append($content)
  if (options && options.wrapperClassNames) {
    options.wrapperClassNames.forEach(function (i) {
      assert(ctx.$detailModal).addClass(i)
    })
  }
  assert(this.$root).append(this.$detailModal)

  // 绑定图标事件
  promotionUtils.addIconEvents(this.$detailModal)

  // 国际化替换
  promotionUtils.localize(this.$detailModal)

  if (animation) {
    new TweenMax.fromTo(this.$detailModal[0], 0.2, { scale: 0 }, {
      scale: 1,
      ease: 'none'
    })
  }

  return this.destroyDetailModal.bind(this)
}

/**
 * @type {ReturnType<PromotionAPI['useCategoryDetailModal']>}
 */
PromotionCategory.prototype.destroyDetailModal = function (options) {
  var ctx = this
  if (!this.mounted || !this.$detailModal) return

  this.updateTitle()

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
  var assert = promotionUtils.assert
  this.scrollIns = new IScroll(assert(this.$root).find(".scroll-container")[0], {
    moveScale: 1 / gameSize.scale,
    mouseWheel: true,
    useTransform: !(mm.device.isIos() && !mm.device.isIpad()),
    scrollbars: true,
    interactiveScrollbars: true,
    click: true
  })
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

  assert(this.$root).find('.loading-circle').show()
}

PromotionCategory.prototype.hideLoading = function () {
  if (!this.mounted) return
  var assert = promotionUtils.assert

  assert(this.$root).find('.loading-circle').hide()
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
  this.removeAll(true, false)

  this.showLoading()

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

  if (this.activeState === PromotionStates.Ended || true) {
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
  this.hideLoading()
  if (result.code !== 0) return

  var assert = promotionUtils.assert

  var tournamentResult = result.map['B-TD01']
  var freeSpinResult = result.map['B-FS00']

  if (tournamentResult && tournamentResult.code === 0) {
    tournamentResult = assert(Service.create()._uncompressData(Service._Commands.TOUR_GAMES_LIST, tournamentResult))
    if (!tournamentResult || !Tournament.createMainComponent) return
    tournamentResult.list.forEach(function (item) {
      /** @type {TournamentMainComponentData} */
      var data = {
        promotionData: {
          __d: true,
          name: PromotionNames.Tournament,
          data: item,
          tranId: item.mainInfo.tranId
        },
        maxRankCount: assert(tournamentResult).maxRankCount,
        timeZone: assert(tournamentResult).timeZone
      }
      ctx.appendItem(
        assert(Tournament.createMainComponent)(data, ctx.api)
      )
    })
  }

  if (freeSpinResult && freeSpinResult.code === 0) {
    if (!FreeSpin.createMainComponent) return
    freeSpinResult.list.forEach(function (item) {
      /** @type {FreeSpinMainComponentData} */
      var data = {
        promotionData: {
          __d: true,
          name: PromotionNames.FreeSpin,
          data: item,
          tranId: item.tranId
        }
      }
      ctx.appendItem(
        assert(FreeSpin.createMainComponent)(data, ctx.api)
      )
    })
  }
}

/**
 * @param {PromotionComponent} component
 */
PromotionCategory.prototype.appendItem = function (component) {
  var assert = promotionUtils.assert
  this.components.push(component)
  component.$$el = component.initialRender()
  assert(this.$content).append(component.$$el)
  this.delayRefreshScroll()
  if (component.onMounted) component.onMounted()
}

/**
 * @param {PromotionComponent} component
 * @param {boolean} [removeDOM] 默认值为 true
 * @param {boolean} [destroyWhenEmply] 默认值为 true
 */
PromotionCategory.prototype.removeItem = function (component, removeDOM, destroyWhenEmply) {
  if (!this.mounted) return

  removeDOM = typeof removeDOM === 'undefined' ? true : removeDOM
  destroyWhenEmply = typeof destroyWhenEmply === 'undefined' ? true : destroyWhenEmply

  var willRemoveIndex = this.components.indexOf(component)
  if (willRemoveIndex === -1) return

  // 删除数据
  this.components.splice(willRemoveIndex, 1)
  // 若没有挂载
  var $$el = component.$$el
  component.$$el = undefined
  if (!$$el) return

  if (component.onBeforeUnmount) component.onBeforeUnmount()

  if (this.components.length === 0 && destroyWhenEmply) {
    this.destroy()
  } else {
    if (removeDOM) $$el.remove()
    this.delayRefreshScroll()
  }
}

/**
 * 
 * @param {boolean} [removeDOM] 默认为 true
 * @param {boolean} [destroyWhenEmply] 默认值为 true
 */
PromotionCategory.prototype.removeAll = function (removeDOM, destroyWhenEmply) {
  var ctx = this
  // removeComponent 方法里面会修改 components，因此需要拷贝后遍历
  this.components.slice(0).forEach(function (component) {
    ctx.removeItem(component, removeDOM, destroyWhenEmply)
  })
}

PromotionCategory.prototype.destroy = function () {
  var ctx = this
  if (!this.mounted) return

  this.destroyScroll()
  this.removeAll(false)

  DrawerUI.close(this.drawerID, {
    onComplete: function () {
      ctx.$root = ctx.$content = ctx.$detailModal = undefined
      ctx.drawerID = -1
      ctx.activeState = undefined
      ctx.mounted = false
    }
  })
}
