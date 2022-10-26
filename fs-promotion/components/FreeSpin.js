// @ts-check

/**
* @type {PromotionNS}
*/
var FreeSpin = /** @type {PromotionNS} */ ({})

; (function () {
  var assert = promotionUtils.assert
  var getDate = promotionUtils.getDate
  var getPromotionState = promotionUtils.getPromotionState
  var getTimes = promotionUtils.getTimes
  var normalizePeriodDate = promotionUtils.normalizePeriodDate

  FreeSpin.createBannerComponent = function (/** @type {FreeSpinPromotion} */ promotion, api) {
    var normalizedDate = normalizePeriodDate(promotion)

    /** @type {() => void} */
    var timerDestructor;

    return api.defineBannerComponent({
      setup: function () {
        /** @type {number} */
        var toMountTimer

        var currentState = getPromotionState(normalizedDate.beginDate, normalizedDate.endDate)
        if (currentState === PromotionStates.Live) this.mount()
        else if (currentState === PromotionStates.Registering) {
          var timeout = +getDate(normalizedDate.beginDate) - Date.now()
          toMountTimer = window.setTimeout(this.mount.bind(this), timeout)
        }

        return function () {
          if (toMountTimer) window.clearTimeout(toMountTimer)
        }

      },
      initialRender: function () {
        return promotionTemplate.createBannerItemElementForFreeSpin(promotion);
      },
      onMounted: function () {
        this.startCountdown()
        // 绑定关闭事件
        assert(this.$$el).find('.single-btn .freespin_btn')[0].addEventListener('click', function () {
          api.closeBanner();
        });
      },
      onActivated: function () {
        this.startCountdown()
      },
      onDeactivated: function () {
        timerDestructor && timerDestructor()
      },
      onBeforeUnmount: function () {
        timerDestructor && timerDestructor()
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
            ctx.unmount()
          }
        })
      }
    })
  }

  FreeSpin.createTipComponent = function (/** @type {FreeSpinPromotion} */ promotion, api) {
    /** @type {() => void} */
    var timerDestructor

    return api.defineTipComponent({
      setup: function () {
        if (promotion.data.freeSpin) this.mount();
      },
      initialRender: function () {
        return promotionTemplate.createTipItemForFreeSpin(promotion);
      },
      onMounted: function () {
        this.startCountdown();

        assert(this.$$el).find('.freespin-btn')[0].addEventListener('click', function () {
          console.log('直接打开freespin详情')
        });
      },
      onBeforeUnmount: function () {
        timerDestructor && timerDestructor()
      },
      startCountdown: function () {
        var isEndIn = promotionUtils.getPromotionState(promotion.data.beginDate, promotion.data.endDate) === PromotionStates.Live;
        var isExpireIn = promotionUtils.getPromotionState(promotion.data.endDate, promotion.data.forfeitDate) === PromotionStates.Live;

        if (isEndIn) this.countdownFn(promotion.data.endDate, 1);
        if (isExpireIn) {
          this.countdownFn(promotion.data.forfeitDate, 2)
        }
      },
      /**
      * @param {string} date
      * @param {number} countdownType
      */
      countdownFn: function (date, countdownType) {
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
            if (countdownType == 1) {
              assert(ctx.$$el).find('.state').text(Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")[2])
            } else {
              ctx.unmount()
            }
          }
        })
      }
    })
  }

  FreeSpin.createMainComponent = function (/** @type {FreeSpinMainComponentData} */ mainData, api) {
    var promotionData = mainData.promotionData;

    /** @type {() => void} */
    var timerDestructor

    var showDetailPanel = function() {
      var $content = promotionTemplate.createDetailForFreespin(promotionData)
      api.useCategoryDetailModal(PromotionNames.FreeSpin, $content, {
        wrapperClassNames: ["component_freespin"]
      });
    }

    return api.defineMainComponent({
      initialRender: function() {
        return promotionTemplate.createMainForFreeSpin(
          promotionData,
          getPromotionState(promotionData.data.beginDate, promotionData.data.endDate)
        );
      },
      onMounted: function() {
        this.startCountdown();
        assert(this.$$el)[0].addEventListener('click', function() {
          showDetailPanel();
        })
      },
      onBeforeUnmount: function() {
        timerDestructor && timerDestructor()
      },
      startCountdown: function() {

      }
    })
  }
  })();

