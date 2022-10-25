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
  var ctx = this
  this.$root = $('<div class="controlbar_promotion_tips" id="controlbar_promotion_tips"></div>')
  this.$body = $(
    '<div class="promotion_tips_container">' +
    ' <div class="p_tips">' +
    '   <div class="p_tips_info">' +
    '     <div class="tips-close-btn"><span class="bgimgStyle close_up"></span></div>' +
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
  $('.controlbar_mobile_info').append(this.$root)

  this.tryInitOrRefreshScroll()

  // 绑定关闭事件
  this.$body.find('.tips-close-btn')[0].addEventListener('click', function () {
    // TODO: self._soundTick("info");
    ctx.unmount()
  })

  this.mounted = true
}

PromotionTip.prototype.unmountContainer = function () {
  var assert = promotionUtils.assert
  this.destroyScroll()
  assert(this.$root).remove()
  this.$root = this.$body = undefined
  this.mounted = false
  this.components.length = 0
}

PromotionTip.prototype.tryInitOrRefreshScroll = function () {
  var assert = promotionUtils.assert
  var itemCount = assert(this.$body).find('.tips-single')

  if (itemCount.length > 4) {
    if (this.scrollIns) this.scrollIns.refresh()
    else {
      assert(this.$body).find('.tips-content').addClass('scroll')
      this.scrollIns = new IScroll(assert(this.$body).find('.scroll-container')[0], {
        moveScale: 1,
        mouseWheel: true,
        useTransform: !mm.device.isIos(),
        scrollbars: true,
        bounce: false
      })
    }
  } else {
    this.destroyScroll()
  }
}

PromotionTip.prototype.destroyScroll = function () {
  var assert = promotionUtils.assert
  if (this.scrollIns) {
    this.scrollIns.destroy()
    this.scrollIns = undefined
    assert(this.$body).find('.tips-content').removeClass('scroll')
    assert(this.$body).find('.scroll-container').attr('style', '')
  }
}

/**
 * @param {PromotionComponent} component 
 */
PromotionTip.prototype.appendTip = function (component) {
  var assert = promotionUtils.assert
  if (!this.mounted) this.mountContainer()
  this.components.push(component)
  component.$$el = component.initialRender()
  assert(this.$body).find('.tips-info').append(component.$$el)
  this.tryInitOrRefreshScroll()
  if (component.onMounted) component.onMounted()
}

/**
 * @param {PromotionComponent} component 
 */
PromotionTip.prototype.removeTip = function (component) {
  if (!this.mounted) return
  var willRemoveIndex = this.components.indexOf(component)
  if (willRemoveIndex === -1) return
  // 移除数据
  this.components.splice(willRemoveIndex, 1)

  // 若没有挂载
  if (!component.$$el) return

  // onBeforeUnmount hook
  if (component.onBeforeUnmount) component.onBeforeUnmount()
  // 仅这一条数据，直接卸载容器
  if (this.components.length === 0) {
    this.unmountContainer()
  } else {
    // 还有其它数据，移动 DOM 即可
    component.$$el.remove()
    this.tryInitOrRefreshScroll()
  }

  component.$$el = undefined
}

PromotionTip.prototype.unmount = function () {
  this.components.forEach(function (component) {
    if (component.onBeforeUnmount) component.onBeforeUnmount()
  })
  this.unmountContainer()
}
