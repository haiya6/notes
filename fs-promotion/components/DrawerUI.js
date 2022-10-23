// @ts-check

/**
 * @typedef {Object} DrawerOpenOptions
 * @property {string[]} [wrapperClassNames]
 * @property {string} [height]
 */

/**
 * @typedef {Object} DrawerCloseOptions
 * @property {() => void} [onComplete]
 */

/**
 * @typedef {Object} ItemData
 * @property {JQuery<HTMLElement>} $el
 * @property {any} tween
 */

var DrawerUI = {
  nextID: 1,
  nextZIndex: 5,
  /**
   * @type {Map<number, ItemData>}
   */
  container: new Map(),
  /**
   * @param {JQuery<HTMLElement>} $content
   * @param {DrawerOpenOptions} [options]
   * @return {number}
   */
  open: function ($content, options) {
    options = options || {}

    var id = DrawerUI.nextID++
    var height = options.height || '100%'

    var $container = $('<div class="drawer-ui"><div>')

    $container
      .css('z-index', DrawerUI.nextZIndex++)
      .css('height', height)
    
    
    if (options.wrapperClassNames) {
      options.wrapperClassNames.forEach(function (i) {
        $container.addClass(i)
      })
    }

    $container.append($content)
    $('#controlbarH5 .controlbar_component').append($container)

    var tween = new TweenMax.to($container[0], 0.2, {
      y: 0,
      ease: 'none',
      onComplete: function () {
        data.tween = undefined
      }
    })
    /**
     * @type {ItemData}
     */
    var data = { $el: $container, tween: tween }
    DrawerUI.container.set(id, data)
    return id
  },

  /**
   * @param {number} id
   * @param {DrawerCloseOptions} [options]
   */
  close: function (id, options) {
    var data = DrawerUI.container.get(id)
    DrawerUI.container.delete(id)
    if (!data) return
    if (data.tween) data.tween.kill()

    new TweenMax.to(data.$el[0], 0.2, {
      y: '100%',
      ease: 'none',
      onComplete: function () {
        options = options || {}
        promotionUtils.assert(data).$el.remove()
        if (options.onComplete) options.onComplete()
      }
    })
  }
}