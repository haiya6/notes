// @ts-check

/**
* @type {PromotionNS}
*/
var FreeSpin = /** @type {PromotionNS} */ ({})

;(function() {
  var assert = promotionUtils.assert
  var getDate = promotionUtils.getDate
  var getPromotionState = promotionUtils.getPromotionState
  var getTimes = promotionUtils.getTimes
  var defineComponent = promotionUtils.defineComponent

  FreeSpin.createBannerComponent = function (/** @type {FreeSpinPromotion} */ promotion, emitter) {
    /** @type {() => void} */
    var timerDestructor

    return defineComponent({
      shouldMount: function() {
        return getPromotionState(promotion.data.beginDate, promotion.data.endDate) === PromotionStates.Live && promotion.data.freeSpin != undefined;
      },
      initialRender: function() {
        return promotionTemplate.createBannerItemElementForFreeSpin(promotion);
      },
      onMounted: function() {
        this.startCountdown()
        // 绑定关闭事件
        assert(this.$$el).find('.single-btn .freespin_btn')[0].addEventListener('click', function () {
          emitter.emit(PromotionEvents.CloseBanner)
        })
      },
      onUpdated: function() {

      },
      onActivated: function () {
        this.startCountdown()
      },
      onDeactivated: function () {
        timerDestructor()
      },
      onBeforeUnmount: function () {
        timerDestructor()
      },
      startCountdown: function () {
        var ctx = this;

        timerDestructor = promotionUtils.createCountdown(promotion.data.endDate, {
          timeZone: "+0800",
          onUpdate: function (remainingTime) {
            var times = getTimes(remainingTime)
            assert(ctx.$$el).find('.single-duration b').each(function (index, item) {
              var $item = $(item)
              if ($item.text() !== times[index]) $(item).text(times[index])
            })
          },
          onComplete: function () {
            emitter.emit(PromotionEvents.BannerComponentUpdate, ctx)
          }
        })
      }
    })
  }

  FreeSpin.createTipComponent = function (/** @type {FreeSpinPromotion} */ promotion, emitter) {
    /** @type {() => void} */
    var timerDestructor

    return defineComponent({
      shouldMount: function() {
        return promotion.data.freeSpin != undefined
      },
      initialRender: function() {
        return promotionTemplate.createTipItemForFreeSpin(promotion);
      },
      onMounted: function() {
        this.startCountdown();

        assert(this.$$el).find('.freespin-btn')[0].addEventListener('click', function() {
          console.log('直接打开freespin详情')
        });
      },
      onBeforeUnmount: function() {

      },
      startCountdown: function () {
        var isEndIn = promotionUtils.getPromotionState(promotion.data.beginDate, promotion.data.endDate) === PromotionStates.Live;
        var isExpireIn = promotionUtils.getPromotionState(promotion.data.endDate, promotion.data.forfeitDate) === PromotionStates.Live;

        if (isEndIn) this.countdownFn(promotion.data.endDate,1);
        if (isExpireIn) {
          this.countdownFn(promotion.data.forfeitDate, 2)
        }
      },
      /**
      * @param {string} date
      * @param {number} countdownType
      */
      countdownFn: function(date, countdownType) {
        var ctx = this;
        var data = promotion.data;
        var periodEndIn = (+getDate(data.endDate) - +getDate(data.beginDate));
        var periodExpireIn = (+getDate(data.forfeitDate) - +getDate(data.endDate));

        timerDestructor = promotionUtils.createCountdown(date, {
          timeZone: "+0800",
          onUpdate: function (remainingTime) {
            var period = countdownType == 1 ? periodEndIn : periodExpireIn;
            var percent = remainingTime / period * 100
            var times = promotionUtils.getTimes(remainingTime)
            if (times[0] === '00') times.shift()
            assert(ctx.$$el).find('.tips_times span:first-child').text(times.join(':'))
            assert(ctx.$$el).find('.tips_times p b').css("width", percent + "%")
          },
          onComplete: function () {
            if (countdownType == 1) 
              assert(ctx.$$el).find('.state').text(Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")[2])
            else 
              emitter.emit(PromotionEvents.BannerComponentUpdate, ctx)
          }
        })
      }
    })
  }

})();

