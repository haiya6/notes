// @ts-check
/**
 * @class
 * @param {FreeSpinPromotion} promotion
 * @param {Emitter} emitter
 */
function FreeSpinPromotion(promotion, emitter) {
  this.promotion = promotion
  this.state = PromotionStates.Live
  /**
   * @type {PromotionComponent}
   */
  this.bannerComponent = {
    render: function () {
      return $('')
    }
  }

  /**
   * @type {PromotionComponent}
   */
  this.tipComponent = {
    render: function () {
      return $('')
    }
  }

  /**
   * @type {PromotionComponent}
   */
   this.contentComponent = {
    render: function () {
      return $('<h1>freespin</h1>')
    }
  }
}

FreeSpinPromotion.prototype.setup = promotionUtils.NOOP
