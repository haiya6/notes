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
   * 当前的分类名称
   * @type {PromotionCategoryName | undefined}
   */
  this.activeName
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
  this.shouldHandleScrollEndEvent = true

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
  if (this.mounted) return
  options = options || {}
  var ctx = this
  var assert = promotionUtils.assert

  spade.content.canTouchSpace = false

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
    '       <li class="tab-item" data-category-name="' + PromotionCategoryNames.Registering + '">' + TXT_TOURNAMENT_STATUS[0] + '</li>' +
    '       <li class="tab-item" data-category-name="' + PromotionCategoryNames.Live + '">' + TXT_TOURNAMENT_STATUS[1] + '</li>' +
    '       <li class="tab-item" data-category-name="' + PromotionCategoryNames.Ended + '">' + TXT_TOURNAMENT_STATUS[2] + '</li>' +
    '   </ul>' +
    SlotUtils.getLoadingHtml(false) +
    '   <div class="scroll-container">' +
    '       <div class="content">' +
    '         <div class="content__list"></div>' +
    '         <div class="loading-more">' + SlotUtils.getLoadingHtml(false) + '</div>' +
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
    ctx.toggleTab(/** @type {PromotionCategoryName} */($(target).attr('data-category-name')))
  })

  this.mounted = true
  this.initScroll()

  if (options.openDetail) {
    var tranId = options.openDetail.tranId
    this.afterRenderListCallback = function () {
      ctx.afterRenderListCallback = undefined
      var $target = assert(ctx.$contentList).children('[data-tran-id="' + tranId + '"]')
      if (!$target.length) {
        ctx.hideLoading()
        console.warn('找不到目标元素，tranId: ', tranId)
        return
      }
      ctx.nextOpenDetailModalUseAnimation = false
      // 触发 iscroll 的自定义事件
      $target[0].dispatchEvent(new Event('tap'))
    }
    this.$root.children('.loading-circle').addClass('colored')
    this.toggleTab(options.openDetail.activeCategoryName)
  } else {
    this.toggleTab(options.categoryName || PromotionCategoryNames.Live)
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
    if (!ctx.mounted) return promotionUtils.NOOP
    if (ctx.$detailModal) ctx.destroyDetailModal({ animation: false })
    var assert = promotionUtils.assert
    // 将 loading 设置透明但不关闭，可防止快速点击，直到内容区域完整动画展开后，再关闭此 loading
    assert(ctx.$root).children('.loading-circle').addClass('transparent')
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

    var onComplete = function () {
      ctx.hideLoading()
    }
    
    if (animation) {
      new TweenMax.fromTo(ctx.$detailModal[0], 0.2, { scale: 0 }, {
        scale: 1,
        ease: 'none',
        onComplete: onComplete
      })
    } else {
      onComplete()
    }

    return ctx.destroyDetailModal.bind(ctx)
  }

  this.showLoading()
  callback(doOpen)
}

/**
 * @type {DestroyCategoryDetailModalFunction}
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
    if (!ctx.shouldHandleScrollEndEvent) return
    if (Math.abs(this.maxScrollY) - Math.abs(this.y) <= 10) {
      if (ctx.hasMore) {
        ctx.shouldHandleScrollEndEvent = false
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

  assert(this.$root).children('.loading-circle')
    .hide()
    .removeClass('colored transparent')
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
 * @param {PromotionCategoryName} name
 */
PromotionCategory.prototype.toggleTab = function (name) {
  if (!this.mounted) return
  var assert = promotionUtils.assert

  this.activeName = name

  // // 切换 tab
  assert(this.$root).find('.tabs .tab-item').removeClass('on')
  assert(this.$root).find('.tabs .tab-item[data-category-name="' + name + '"]').addClass('on')

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
  if (!this.activeName) return
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
    language: promotionResourceLoader.getLanguage(),
    beginDate: getBeginDate(),
    endDate: new Date().format("yyyy-MM-dd"),
    status: promotionUtils.categoryName2RequestStatus[this.activeName],
  }

  if (this.activeName === PromotionCategoryNames.Ended) {
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
  /** @type {PromotionComponent[]} */
  var components = []
  /** @type {((done: () => void) => void)[]} */
  var beforeSetupTasks = []

    ; (function () {
      if (tournamentResult && tournamentResult.code === 0) {
        tournamentResult = assert(Service.create()._uncompressData(Service._Commands.TOUR_GAMES_LIST, tournamentResult))
        if (!tournamentResult || !Tournament.createMainComponent) return
        
        var serverTime = tournamentResult.st

        if (tournamentResult.list.length > 0) {
          beforeSetupTasks.push(function (done) {
            promotionResourceLoader.load(PromotionNames.Tournament, done)
          })
        }

        tournamentResult.list.forEach(function (item) {
          // 若存在此组件则忽略
          if (ctx.getComponentByTranId(item.mainInfo.tranId)) return
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
            activeCategoryName: assert(ctx.activeName)
          }
          // 手动给每个数据添加 serverTime
          data.promotionData.data.mainInfo.serverTime = serverTime
          var component = assert(Tournament.createMainComponent)(data, ctx.api)
          ctx.components2PromotionData.set(component, data.promotionData)
          components.push(component)
        })

        if (ctx.activeName === PromotionCategoryNames.Ended) {
          var tournamentPage = assert(tournamentResult.page)
          hasMore = tournamentPage.pageNo * tournamentPage.pageSize < tournamentPage.resultCount
        }
      }
    })()

    ; (function () {
      if (freeSpinResult && freeSpinResult.code === 0) {
        if (!FreeSpin.createMainComponent) return

        if (freeSpinResult.list.length > 0) {
          beforeSetupTasks.push(function (done) {
            promotionResourceLoader.load(PromotionNames.FreeSpin, done)
          })
        }

        freeSpinResult.list.forEach(function (item) {
          // 若存在此组件则忽略
          if (ctx.getComponentByTranId(item.tranId)) return
          /** @type {FreeSpinMainComponentData} */
          var data = {
            promotionData: {
              __d: true,
              $receiveTimestamp: now,
              name: PromotionNames.FreeSpin,
              data: item,
              tranId: item.tranId
            },
            activeCategoryName: assert(ctx.activeName)
          }
          var component = assert(FreeSpin.createMainComponent)(data, ctx.api)
          ctx.components2PromotionData.set(component, data.promotionData)
          components.push(component)
        })
      }
    })()

  promotionUtils.all(beforeSetupTasks, function () {
    components.forEach(function (comp) {
      promotionUtils.setupComponent(comp)
    })
    ctx.hasMore = hasMore

    if (hasMore) {
      ctx.showLoadMoreLoading()
      ctx.shouldHandleScrollEndEvent = true
    } else {
      ctx.hideLoadMoreLoading()
    }

    if (ctx.afterRenderListCallback) ctx.afterRenderListCallback()
    else ctx.hideLoading()
  })
}

/**
 * @param {PromotionComponent} component
 */
PromotionCategory.prototype.appendItem = function (component) {
  var assert = promotionUtils.assert
  var existingIndex = this.components.indexOf(component)
  if (existingIndex !== -1) return
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

  if (component.onBeforeUnmount) {
    component.onBeforeUnmount(component._unmountCustomData)
  }

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

  spade.content.canTouchSpace = true

  this.destroyScroll()
  this.removeAll(false)

  DrawerUI.close(this.drawerID, {
    onComplete: function () {
      ctx.$root = ctx.$contentList = ctx.$detailModal = undefined
      ctx.drawerID = -1
      ctx.activeName = undefined
      ctx.mounted = false
    }
  })
}

/**
 * 如 freeSpin 没有单独的更新接口，但数据结构和推送相同，因此借用外部推送的数据来更新组件
 * @param {Promotion} promotion 
 */
PromotionCategory.prototype.handlePromotionChange = function (promotion) {
  var entries = promotionUtils.iter2Array(this.components2PromotionData.entries())
  var index = promotionUtils.findIndex(entries, function (entry) {
    return entry[1].tranId === promotion.tranId
  })
  if (index === -1) return
  var component = entries[index][0]
  var promotionData = entries[index][1]

  promotionData.$receiveTimestamp = promotion.$receiveTimestamp
  promotionData.data = mm.clone(promotion.data)
  if (component.onUpdated) component.onUpdated()
}

/**
 * 根据 tranId 来移除组件
 * @param {number} tranId
 * @param {boolean} [removeDOM] 默认值为 true
 */
PromotionCategory.prototype.removeItemByTranId = function (tranId, removeDOM) {
  var component = this.getComponentByTranId(tranId)
  if (component) this.removeItem(component, removeDOM)
}

/**
 * 根据 tranId 来获取组件
 * @param {number} tranId 
 */
PromotionCategory.prototype.getComponentByTranId = function (tranId) {
  var entries = promotionUtils.iter2Array(this.components2PromotionData.entries())
  var entry = promotionUtils.find(entries, function (entry) {
    return entry[1].tranId === tranId
  })
  if (!entry) return
  return entry[0]
}

/**
 * 根据外部推送事件来调用此方法刷新列表
 * @param {PromotionCategoryName=} shouldRefreshCategoryName 需要刷新的 tab name
 */
PromotionCategory.prototype.refreshList = function (shouldRefreshCategoryName) {
  if (!this.mounted || !shouldRefreshCategoryName || this.activeName !== shouldRefreshCategoryName) return
  
  this.pageIndex = 0
  this.hasMore = true

  this.loadPromotionList()
}
