// @ts-check

/**
 * @class
 * @param {PromotionAPI} api
 */
function PromotionTip(api) {
  this.api = api

  /**
   * @type {PromotionComponent[]}
   */
  this.components = []
  this.mounted = false
  /**
   * @type {JQuery<HTMLElement> | undefined}
   */
  this.$root
  /**
   * @type {JQuery<HTMLElement> | undefined}
   */
  this.$body

  /**
   * @type {any}
   */
  this.scrollIns
}

PromotionTip.prototype.mountContainer = function () {
  this.$root = $('<div class="controlbar_promotion_tips" id="controlbar_promotion_tips"></div>')
  this.$body = $(
    '<div class="promotion_tips_container">' +
    ' <div class="p_tips">' +
    '   <div class="p_tips_info">' +
    '     <div class="tips-content">' +
    '       <div class="scroll-container">' +
    '           <div class="main-scroll">' +
    '              <div class="tips-info"></div>' +
    '          </div>' +
    '       </div>' +
    '     </div>' +
    '   </div>' +
    ' </div>' +
    '</div>'
  )

  this.$root.append(this.$body)
  $('.controlbar_component').append(this.$root)

  this.tryInitOrRefreshScroll()
  this.mounted = true
}

PromotionTip.prototype.unmountContainer = function () {
  if (!this.mounted) return
  var assert = promotionUtils.assert
  this.destroyScroll()
  assert(this.$root).remove()
  this.$root = this.$body = undefined
  this.mounted = false
  this.components.length = 0
}

PromotionTip.prototype.tryInitOrRefreshScroll = function () {
  var ctx = this
  var assert = promotionUtils.assert

  var handler = function () {
    if (!ctx.mounted) return
    var $container = assert(ctx.$body).find('.scroll-container')
    var $containerParent = $container.parent('.tips-content')
    var maxHeight = 916
    var contentHeight = assert($container.find('.tips-info').height())

    if (contentHeight > maxHeight) {
      $containerParent.css('height', maxHeight + 'px')
      if (ctx.scrollIns) ctx.scrollIns.refresh()
      else {
        ctx.scrollIns = new IScroll($container[0], {
          moveScale: 1 / gameSize.scale,
          mouseWheel: true,
          useTransform: !mm.device.isIos(),
          scrollbars: true,
          bounce: false
        })
      }
    } else {
      $containerParent.css('height', 'auto')
      ctx.destroyScroll()
    }
  }

  window.setTimeout(handler, 0)
}

PromotionTip.prototype.destroyScroll = function () {
  var assert = promotionUtils.assert
  if (this.scrollIns) {
    this.scrollIns.destroy()
    this.scrollIns = undefined
    assert(this.$body).find('.scroll-container .main-scroll').attr('style', '')
  }
}

/**
 * @param {PromotionComponent} component 
 */
PromotionTip.prototype.appendTip = function (component) {
  var assert = promotionUtils.assert
  if (spade.content.luckyId || spade.betInfo.isFreeMode) return
  var existingIndex = this.components.indexOf(component)
  if (existingIndex !== -1) return
  if (!this.mounted) this.mountContainer()
  this.components.push(component)
  component.$$el = component.initialRender()
  promotionUtils.addIconEvents(component.$$el)
  assert(this.$body).find('.tips-info').append(component.$$el)
  if (component.onMounted) component.onMounted()
  this.tryInitOrRefreshScroll()
}

/**
 * @param {PromotionComponent} component 
 */
PromotionTip.prototype.updateTip = function (component) {
  if (component.onUpdated) component.onUpdated()
  this.tryInitOrRefreshScroll()
}

/**
 * @param {PromotionComponent} component 
 */
PromotionTip.prototype.removeTip = function (component) {
  var ctx = this
  if (!this.mounted) return
  var assert = promotionUtils.assert
  var willRemoveIndex = this.components.indexOf(component)
  if (willRemoveIndex === -1) return
  // 移除数据
  this.components.splice(willRemoveIndex, 1)

  // 若没有挂载
  if (!component.$$el) return

  new TweenMax(component.$$el[0], 0.2, {
    height: 0,
    padding: 0,
    opacity: 0,
    onUpdate: function () {
      ctx.tryInitOrRefreshScroll()
    },
    onComplete: function () {
      // onBeforeUnmount hook
      if (component.onBeforeUnmount) component.onBeforeUnmount()
      assert(component.$$el).remove()
      component.$$el = undefined
      // 仅这一条数据，卸载容器
      if (ctx.components.length === 0) {
        ctx.unmountContainer()
      } else {
        // 还有其它数据
        ctx.tryInitOrRefreshScroll()
      }
    }
  })
}

PromotionTip.prototype.unmount = function () {
  this.components.forEach(function (component) {
    if (component.onBeforeUnmount) component.onBeforeUnmount()
  })
  this.unmountContainer()
}
