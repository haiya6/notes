// @ts-check

/**
 * @type {PromotionNS}
 */
var Tournament = /** @type {PromotionNS} */ ({})

;(function () {
  var assert = promotionUtils.assert
  var getDate = promotionUtils.getDate
  var getPromotionState = promotionUtils.getPromotionState
  var getTimes = promotionUtils.getTimes
  var defineComponent = promotionUtils.defineComponent
  var normalizePeriodDate = promotionUtils.normalizePeriodDate

  // banner component
  Tournament.createBannerComponent = function (/** @type {TournamentPromotion} */ promotion, api) {
    var normalizedDate = normalizePeriodDate(promotion)
    var state = getPromotionState(normalizedDate.beginDate, normalizedDate.endDate)

    if (state === PromotionStates.Registering) {
      
    }

    var component = api.defineBannerComponent({
      initialRender: function () {
        return promotionTemplate.createBannerItemElementForTournament(promotion)
      },
      onMounted: function () {

      }
    })

    return component

    // return defineComponent({
    //   shouldMount: function () {
    //     return getPromotionState(promotion.data.beginDate, promotion.data.endDate) === PromotionStates.Live
    //   },
    //   initialRender: function () {
    //     return promotionTemplate.createBannerItemElementForTournament(promotion)
    //   },
    //   onMounted: function () {
    //     this.startCountdown()
    //     // 绑定关闭事件
    //     assert(this.$$el).find('.single-btn .tournament_btn')[0].addEventListener('click', function () {
    //       emitter.emit(PromotionEvents.CloseBanner)
    //     })
    //   },
    //   onActivated: function () {
    //     this.startCountdown()
    //   },
    //   onDeactivated: function () {
    //     timerDestructor()
    //   },
    //   onBeforeUnmount: function () {
    //     timerDestructor()
    //   },
    //   startCountdown: function () {
    //     var ctx = this
        
    //     timerDestructor = promotionUtils.createCountdown(normalizePeriodDate(promotion).endDate, {
    //       timeZone: promotion.data.timeZone,
    //       onUpdate: function (remainingTime) {
    //         var times = getTimes(remainingTime)
    //         assert(ctx.$$el).find('.single-duration b').each(function (index, item) {
    //           var $item = $(item)
    //           if ($item.text() !== times[index]) $(item).text(times[index])
    //         })
    //       },
    //       onComplete: function () {
    //         emitter.emit(PromotionEvents.BannerComponentUpdate, ctx)
    //       }
    //     })
    //   }
    // })
  }

  // tip component
  Tournament.createTipComponent = function (/** @type {TournamentPromotion} */ promotion, api) {
    /** @type {() => void} */
    var timerDestructor

    return defineComponent({
      shouldMount: function () {
        return getPromotionState(promotion.data.beginDate, promotion.data.endDate) === PromotionStates.Live && spade.betInfo.totalBet < promotion.data.minBet
      },
      initialRender: function () {
        return promotionTemplate.createTipItemForTournament(promotion)
      },
      onMounted: function () {
        var ctx = this
        var normalizedData = normalizePeriodDate(promotion)

        timerDestructor = promotionUtils.createCountdown(normalizedData.endDate, {
          timeZone: promotion.data.timeZone,
          onUpdate: function (remainingTime) {
            promotionUtils.updateElementsCountdown(
              remainingTime,
              +getDate(normalizedData.endDate) - +getDate(normalizedData.beginDate),
              assert(ctx.$$el).find('.tips_times span:first-child'),
              assert(ctx.$$el).find('.tips_times p b')
            )
          },
          onComplete: function () {
            emitter.emit(PromotionEvents.TipComponentUpdate, ctx)
          }
        })
      },
      onBeforeUnmount: function () {
        timerDestructor()
      }
    })
  }

  // main component
  Tournament.createMainComponent = function (/** @type {TournamentMainComponentData} */ mainData, api) {
    var promotionData = mainData.promotionData

    /** @type {() => void} */
    var timerDestructor

    var showDetailPanel = function () {
      /** @type {Record<string, any>} */
      var params = {
        gameCode: spade.content.game,
        tranId: promotionData.tranId,
        language: spade.content.language,
        promotionCode: 'B-TD01'
      }
      Service.create().getTournamentDetail(params, function (/** @type {TournamentDetailRequestResult} */ result) {
        if (result.code !== 0) return
        api.openDetailModal(PromotionNames.Tournament, $('<h1 style="width: 100%; height: 100%; background: pink;">TODO</h1>'))
      })
    }

    return defineComponent({
      initialRender: function () {
        return promotionTemplate.createMainForTournament(
          promotionData,
          mainData.maxRankCount,
          getPromotionState(promotionData.data.mainInfo.beginDate, promotionData.data.mainInfo.endDate)
        )
      },
      onMounted: function () {
        this.startCountdown()

        // 绑定打开更多详情事件
        assert(this.$$el)[0].addEventListener('click', function () {
          showDetailPanel()
        })
      },
      onBeforeUnmount: function () {
        timerDestructor && timerDestructor()
      },
      startCountdown: function () {
        var ctx = this
        var state = getPromotionState(promotionData.data.mainInfo.beginDate, promotionData.data.mainInfo.endDate)
        var normalizedData = normalizePeriodDate(mainData.promotionData)

        /**
         * 当前阶段的开始时间
         * @type {string | undefined}
         */
        var currentStageBeginDate
        /**
         * 当前阶段的结束时间
         * @type {string | undefined} 
         */
        var currentStageEndDate

        if (state === PromotionStates.Registering) {
          currentStageBeginDate = normalizedData.openDate
          currentStageEndDate = normalizedData.beginDate
        } else if (state === PromotionStates.Live) {
          currentStageBeginDate = normalizedData.beginDate
          currentStageEndDate = normalizedData.endDate
        }

        if (!currentStageBeginDate || !currentStageEndDate) return

        var endTime = +getDate(currentStageEndDate)
        var totalTime = endTime - +getDate(currentStageBeginDate)

        timerDestructor = promotionUtils.createCountdown(currentStageEndDate, {
          timeZone: mainData.timeZone,
          onUpdate: function (remainingTime) {
            promotionUtils.updateElementsCountdown(
              remainingTime,
              totalTime,
              assert(ctx.$$el).find('.box_times > span:eq(0)'),
              assert(ctx.$$el).find('.box_times > p > b')
            )
          }
        })
      }
    })
  }
})();
