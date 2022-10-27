// @ts-check

/**
 * @class
 * @param {PromotionAPI} api
 */
function PromotionBanner(api) {
  this.api = api
  /**
   * @type {JQuery<HTMLElement> | undefined}
   */
  this.$root = undefined
  /**
   * @type {JQuery<HTMLElement> | undefined}
   */
  this.$mask = undefined
  /**
   * @type {JQuery<HTMLElement> | undefined}
   */
  this.$body = undefined
  /**
   * @type {JQuery<HTMLElement> | undefined}
   */
  this.$indicators = undefined

  this.mounted = false
  /**
   * @type {PromotionComponent[]}
   */
  this.components = []
  this.currentIndex = -1
  /**
   * @type {number | undefined}
   */
  this.autoToggerTimer
}

PromotionBanner.prototype.mountContainer = function () {
  var ctx = this
  this.$root = $('<div class="controlbar_promotion_box" id="controlbar_promotion_box"></div>')
  this.$mask = $('<div class="promotion_box_mask"></div>')
  this.$body = $(
    '<div class="promotion_box_container">' +
    ' <div class="p_area">' +
    '   <div class="area-btn"></div>' +
    '   <div class="area-cont">' +
    '   </div>' +
    '   <div class="area-buttons">' +
    '   </div>' +
    ' </div>' +
    '</div>'
  )
  this.$root.append(this.$mask).append(this.$body)

  this.$indicators = this.$body.find('.area-buttons')
  // 绑定指示器点击事件
  this.$indicators[0].addEventListener('click', function (event) {
    var target = /** @type {HTMLElement} */ (event.target)
    if (!$(target).hasClass('indicator')) return
    promotionUtils.soundTick('info')
    ctx.toggleBanner($(target).index())
    ctx.startOrRestartAutoToggleTimer()
  })
  // 绑定关闭事件
  this.$body.find('.area-btn')[0].addEventListener('click', function () {
    ctx.unmount()
    ctx.api.openCategory()
  })
  // 滑动切换事件
  var moved = false
  var startX = 0
  interact(this.$body.find('.area-cont')[0])
    .draggable({
      onstart: function (/** @type {any} */ event) {
        startX = event.pageX
      },
      onmove: function () {
        moved = true
      },
      onend: function (/** @type {any} */ event) {
        if (!moved) return
        moved = false
        var distance = (event.pageX - startX) / gameSize.scale
        var bannerCount = ctx.components.length

        if (distance >= 30) {
          ctx.toggleBanner((bannerCount + ctx.currentIndex - 1) % bannerCount)
        } else if (distance <= -30) {
          ctx.toggleBanner((ctx.currentIndex + 1) % bannerCount)
        }
      }
    })

  $('.controlbar_mobile_info').append(this.$root)
  this.mounted = true
}

PromotionBanner.prototype.unmountContainer = function () {
  if (!this.mounted) return
  var assert = promotionUtils.assert
  
  interact(assert(this.$body).find('.area-cont')[0]).unset()
  assert(this.$root).remove()
  assert(this.$mask).remove()
  this.$root = this.$mask = this.$body = undefined
  this.mounted = false
  this.destroyAutoToggleTimer()
  this.currentIndex = -1
  this.components.length = 0
}

/**
 * 卸载所有组件和容器
 */
PromotionBanner.prototype.unmount = function () {
  this.components.forEach(function (component) {
    if (component.$$el && component.onBeforeUnmount) component.onBeforeUnmount()
  })
  this.unmountContainer()
}

/**
 * @param {PromotionComponent} component
 */
PromotionBanner.prototype.appendBanner = function (component) {
  var assert = promotionUtils.assert
  var thisTimeMountedContainer = false
  if (!this.mounted) {
    this.mountContainer()
    thisTimeMountedContainer = true
  }
  this.components.push(component)
  assert(this.$indicators).append('<b class="bgimgpromotion indicator"></b>')

  if (thisTimeMountedContainer) {
    this.toggleBanner(0)
    this.startOrRestartAutoToggleTimer()
  }
}

/**
 * @param {PromotionComponent} component
 */
PromotionBanner.prototype.removeBanner = function (component) {
  var assert = promotionUtils.assert

  if (!this.mounted) return
  var willRemoveIndex = this.components.indexOf(component)
  if (willRemoveIndex === -1) return

  var currentComponent = this.components[this.currentIndex]
  // 删除数据
  this.components.splice(willRemoveIndex, 1)
  this.currentIndex = -1
  // 删除轮播指示器
  assert(this.$indicators).find('.indicator').eq(willRemoveIndex).remove()

  // 若没有挂载
  if (!component.$$el) return

  if (component.onBeforeUnmount) component.onBeforeUnmount()
  // 若销毁的是当前正在展示的 banner
  if (component === currentComponent) {
    if (this.components.length === 0) {
      // 且没有更多了
      this.unmountContainer()
    } else {
      // 有更多，切换至下一个
      this.toggleBanner(willRemoveIndex > this.components.length - 1 ? 0 : willRemoveIndex)
      this.startOrRestartAutoToggleTimer()
    }
  } else {
    // 需要销毁的不是不是正在展示的 banner，直接删除 DOM 即可
    component.$$el.remove()
  }
  
  component.$$el = undefined
}

/**
 * @param {number} targetIndex 
 */
PromotionBanner.prototype.toggleBanner = function (targetIndex) {
  if (targetIndex === this.currentIndex) return
  var targetComponent = this.components[targetIndex]
  if (!targetComponent) return

  var assert = promotionUtils.assert

  // 隐藏当前的 Promotion banner
  var currentComponent = this.components[this.currentIndex]
  if (currentComponent) {
    // onDeactivated hook
    if (currentComponent.onDeactivated) currentComponent.onDeactivated()
    assert(currentComponent.$$el).hide()
    this.currentIndex = -1
  }

  // 显示新的 Promotion banner
  if (!targetComponent.$$el) {
    targetComponent.$$el = targetComponent.initialRender()
    assert(this.$body).find('.area-cont').append(targetComponent.$$el)
    if (targetComponent.onMounted) targetComponent.onMounted()
  } else {
    targetComponent.$$el.show()
    if (targetComponent.onActivated) targetComponent.onActivated()
  }

  // 切换指示器
  assert(this.$indicators)
    .find('.indicator')
    .removeClass('on')
    .eq(targetIndex)
    .addClass('on')
  
  this.currentIndex = targetIndex
}

PromotionBanner.prototype.startOrRestartAutoToggleTimer = function () {
  return
  var ctx = this
  this.destroyAutoToggleTimer()
  this.autoToggerTimer = window.setInterval(function () {
    if (ctx.currentIndex === -1) return ctx.destroyAutoToggleTimer()
    ctx.toggleBanner((ctx.currentIndex + 1) % ctx.components.length)
  }, 5000)
}

PromotionBanner.prototype.destroyAutoToggleTimer = function () {
  if (typeof this.autoToggerTimer !== 'undefined') {
    window.clearInterval(this.autoToggerTimer)
  }
}
