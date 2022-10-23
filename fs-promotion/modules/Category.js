// @ts-check

/**
 * @class
 * @param {PromotionSource[]} promotionSources
 * @param {Emitter} emitter
 */
function PromotionCategory(promotionSources, emitter) {
  this.promotionSources = promotionSources
  this.emitter = emitter

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

  this.setup()
}

PromotionCategory.prototype.setup = function () {
  var ctx = this

  this.emitter.on(PromotionEvents.SelfUpdate, function (/** @type {Promotion} */promotion) {
    if (!ctx.mounted) return

    var source = promotionUtils.find(ctx.promotionSources, function (source) {
      return source.promotion.tranId === promotion.tranId
    })

    if (!source || !source.instance || !source.instance.contentComponent) return
    var component = source.instance.contentComponent
    var componentMounted = !!component.$$el
    var sameState = source.instance.state === ctx.activeState

    // 如果状态是一致，但没有挂载
    if (sameState && !componentMounted) {
      promotionUtils.handleShouldMountComponent(
        component,
        ctx.appendItem.bind(ctx),
        ctx.removeItem.bind(ctx)
      )
    } else if (componentMounted && !sameState) {
      // 已挂载，但状态不同了
      ctx.removeItem(component)
    }
  })
}

PromotionCategory.prototype.open = function () {
  var ctx = this
  var TXT_TOURNAMENT_STATUS = Locale.getString('TXT_TOURNAMENT_STATUS').split("%n%")

  this.$root = $(
    '<div class="promotion-category">' +
    '   <div class="btn-close">' +
    '       <span class="icon-close"></span>' +
    '   </div>' +
    '   <div class="top-bar">' +
    '       <div class="title">PROMOTION</div>' +
    '   </div>' +
    '   <ul class="tabs">' +
    '       <li class="tab-item" data-state="' + PromotionStates.Registering + '">' + TXT_TOURNAMENT_STATUS[0] + '</li>' +
    '       <li class="tab-item" data-state="' + PromotionStates.Live + '">' + TXT_TOURNAMENT_STATUS[1] + '</li>' +
    '       <li class="tab-item" data-state="' + PromotionStates.Ended + '">' + TXT_TOURNAMENT_STATUS[2] + '</li>' +
    '   </ul>' +
    '   <div class="scroll-container">' +
    '       <div class="content"></div>' +
    '   </div>' +
    '</div>'
  )
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
  this.initScroll()
  this.toggleTab(PromotionStates.Registering)
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

/**
 * @param {PromotionState} state 
 */
PromotionCategory.prototype.toggleTab = function (state) {
  if (!this.mounted) return
  var ctx = this
  var assert = promotionUtils.assert

  this.activeState = state

  // 切换 tab
  assert(this.$root).find('.tabs .tab-item').removeClass('on')
  assert(this.$root).find('.tabs .tab-item[data-state="' + state + '"]').addClass('on')

  // 移除当前的组件
  this.removeAll(true, false)

  // 添加新的组件
  this.promotionSources.forEach(function (source) {
    if (!source.instance || source.instance.state !== state) return
    var component = source.instance.contentComponent
    if (!component) return
    ctx.appendItem(component)
  })
}

/**
 * @param {PromotionComponent} component
 */
PromotionCategory.prototype.appendItem = function (component) {
  var assert = promotionUtils.assert
  this.components.push(component)
  component.$$el = component.render()
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
      ctx.$root = ctx.$content = undefined
      ctx.drawerID = -1
      ctx.activeState = undefined
      ctx.mounted = false
    }
  })
}
