// @ts-check

/**
 * @class
 * @param {TournamentPromotion} promotion
 * @param {Emitter} emitter
 */
function TournamentPromotion(promotion, emitter) {
  this.promotion = promotion
  this.emitter = emitter
  this.state = PromotionStates.Registering

  /**
   * @type {PromotionComponent}
   */
  this.bannerComponent = {
    shouldMount: function () {
      return true
    },
    render: function () {
      var $el = promotionTemplate.createBannerItemElement(promotion)
      return $el
    }
  }

  /**
   * @type {PromotionComponent}
   */
  this.tipComponent = {
    shouldMount: function () {
      return true
    },
    render: function () {
      return promotionTemplate.createTipItemForTournament(promotion)
    }
  }

  /**
   * @type {PromotionComponent}
   */
  this.contentComponent = {
    render: function () {
      return $('<h1>tournament</h1>')
    }
  }
}

TournamentPromotion.prototype.setup = function () {
  this.emitter.emit(PromotionEvents.SelfUpdate, this.promotion)
}
