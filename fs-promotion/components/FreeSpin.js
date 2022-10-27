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
  var normalizePeriodTime = promotionUtils.normalizePeriodTime

  FreeSpin.createBannerComponent = function (/** @type {FreeSpinPromotion} */ promotion, api) {
    var normalizedTime = normalizePeriodTime(promotion)

    /** @type {(() => void) | undefined} */
    var timerDestructor;

    return api.defineBannerComponent({
      setup: function () {
        /** @type {number} */
        var toMountTimer

        var currentState = getPromotionState(promotion)
        if (currentState === PromotionStates.Live) this.mount()
        else if (currentState === PromotionStates.Registering) {
          var timeout = normalizedTime.beginTime - Date.now()
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
          promotionUtils.soundTick('info')
          $(this).addClass('ani')
          this.addEventListener('animationend', function () {
            api.closeBanner()
          })
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

        timerDestructor = promotionUtils.createCountdown(normalizedTime.endTime, {
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
    /** @type {(() => void) | undefined} */
    var timerDestructor
    var normalizedTime = normalizePeriodTime(promotion)

    return api.defineTipComponent({
      setup: function () {
        if (promotion.data.freeSpin) this.mount();
      },
      initialRender: function () {
        return promotionTemplate.createTipItemForFreeSpin(promotion);
      },
      onMounted: function () {
        var ctx = this
        this.startCountdown();

        assert(this.$$el).find('.freespin-btn')[0].addEventListener('click', function () {
          api.openCategory({
            openDetail: {
              tranId: promotion.tranId,
              activeState: promotionUtils.getPromotionState(promotion)
            }
          })
        });

        // 绑定关闭事件
        assert(this.$$el).find('.btn-close')[0].addEventListener('click', function () {
          ctx.unmount()
        })
      },
      onBeforeUnmount: function () {
        timerDestructor && timerDestructor()
      },
      startCountdown: function () {
        var state = promotionUtils.getPromotionState(promotion)
        var isEndIn = state === PromotionStates.Live
        var isExpireIn = state === PromotionStates.Expired

        if (isEndIn) this.countdownFn(normalizedTime.endTime, 1);
        if (isExpireIn) {
          this.countdownFn(normalizedTime.closeTime, 2)
        }
      },
      /**
      * @param {number} time
      * @param {number} countdownType
      */
      countdownFn: function (time, countdownType) {
        var ctx = this;
        var data = promotion.data;
        var periodEndIn = (+getDate(data.endDate) - +getDate(data.beginDate));
        var periodExpireIn = (+getDate(data.forfeitDate) - +getDate(data.endDate));

        timerDestructor = promotionUtils.createCountdown(time, {
          onUpdate: function (remainingTime) {
            var period = countdownType == 1 ? periodEndIn : periodExpireIn;
            promotionUtils.updateElementsCountdown(
              remainingTime, 
              period,
              assert(ctx.$$el).find('.tips_times span:first-child'),
              assert(ctx.$$el).find('.tips_times p b')
            );
          },
          onComplete: function () {
            if (countdownType == 1) { //Ends in to Expire in
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
    var normalizedTime = normalizePeriodTime(mainData.promotionData)
    var typeStrs = Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")

    /**
     * 列表 item 的倒计时的定时器卸载器
     * @type {() => void}
     */
    var timerDestructor
    /**
     * 详情面板视图卸载器
     * @type {(() => void) | undefined}
     */
    var detailPanelDestructor

    var showDetailPanel = function() {
      /** @type {number | undefined} */
      var activeTabIndex = 0
      /** @type {JQuery<HTMLElement>|undefined} */
      var $content
      /**
       * 详情面板中倒计时的卸载器
       * @type {() => void}
       */
       var detailPanelTimerDestructor
      /**
       * CategoryDetailModal 的卸载器
       * @type {DestoryCategoryDetailModalFunction | undefined}
       */
      
      var destroyCategoryDetailModal

      /**
       * 切换每个 code 中的底部 tab
       * @param {number} index
       */
      var toggleTab = function(index) {
        if(!$content) return;
        if (activeTabIndex == index) return;
        $content.find('.tab1,.tab2').hide();
        $content.find('.tab' + (index + 1)).show()
        activeTabIndex = index;
        $content.find('.cont_nav1 > ul > li').removeClass('on').eq(index).addClass('on')
      }

      /**
      * @param {number} countdownTime
      * @param {number} countdownType
      */
      var countDownFn = function(countdownTime, countdownType) {
        var periodStartIn = normalizedTime.beginTime - normalizedTime.openTime;
        var periodEndIn = normalizedTime.endTime - normalizedTime.beginTime;
        var periodExpireIn = normalizedTime.closeTime - normalizedTime.endTime;
        var period = countdownType == 1 ? periodEndIn : (countdownType == 2 ? periodExpireIn : periodStartIn);
        var $status = assert($content).find('.box_times span:last-child')

        $status.text(Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")[countdownType])        

        detailPanelTimerDestructor = promotionUtils.createCountdown(countdownTime, {
          onUpdate: function(remainingTime) {
            promotionUtils.updateElementsCountdown(
              remainingTime,
              period,
              assert($content).find('.box_times span:first-child'),
              assert($content).find('.box_times p b')
            )
          },
          onComplete: function() {
            if (countdownType < 2) {
              detailPanelTimerDestructor()
              countdownType++;
              $status.text(Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")[countdownType])
              if (countdownType == 1) 
                countDownFn(normalizedTime.endTime, 1);
              if (countdownType == 2) 
                countDownFn(normalizedTime.closeTime, 2);
            }
          }
        })
      }

      detailPanelDestructor = function() {
        if (destroyCategoryDetailModal) destroyCategoryDetailModal()
        if (detailPanelTimerDestructor) detailPanelTimerDestructor()
        $content = undefined;
        detailPanelDestructor = undefined;
      }
      
      api.useCategoryDetailModal(function(doOpen) {
        var renderOrUpateContent = function() {
          if (!$content) {
            $content = promotionTemplate.createDetailForFreespin(promotionData);
            destroyCategoryDetailModal = doOpen($content, {
              wrapperClassNames: ["component_freespin"]
            })
            //倒计时
            countDownFn(normalizedTime.beginTime, 0);

            // 绑定一个 gamecode 视图中的底部子 tab 切换事件
            $content.find('.cont_nav1 > ul > li').each(function (_, ele) {
              ele.addEventListener('click', function () {
                toggleTab($(this).index())
              })
            })

            // 绑定 Home 图标关闭当前详情视图事件
            $content.find('.btn_home')[0].addEventListener('click', function () {
              promotionUtils.soundTick('info')
              detailPanelDestructor && detailPanelDestructor()
            });

            // 绑定全部关闭事件
            $content.find('.btn-close')[0].addEventListener('click', function () {
              promotionUtils.soundTick('info')
              api.closeCategory()
            })

            //绑定领取事件
            var isClickAble = true;
            $content.find('.redeem-btn')[0].addEventListener('click', function() {
              if (!isClickAble) return;
              isClickAble = false
              Service.create().getRceiveSpin({
                tranId: promotionData.data.tranId,
                roundId: assert(promotionData.data.freeSpin).roundId              
              }, function(/** @type {any} */ res) {
                if (res.code == 0) {
                  return spade.redirectGame(assert(promotionData.data.freeSpin).gameCode)
                }
              })
            })
          }
        }

        renderOrUpateContent();
      })
    }

    return api.defineMainComponent({
      setup: function () {
        this.mount()
      },
      initialRender: function() {
        return promotionTemplate.createMainForFreeSpin(
          promotionData,
          mainData.activeState
        );
      },
      onMounted: function() {
        this.startCountdown();
        // 在 iscroll 容器中，监听 tap 事件关闭
        assert(this.$$el)[0].addEventListener('tap', function() {
          showDetailPanel();
        });
      },
      onBeforeUnmount: function() {
        timerDestructor && timerDestructor()
        detailPanelDestructor && detailPanelDestructor();
      },
      startCountdown: function () {       
        if (mainData.activeState === PromotionStates.Registering) {
          this.countdownFn(normalizedTime.beginTime, 0)
        }
        if (mainData.activeState === PromotionStates.Live) {
          var state = promotionUtils.getPromotionState(promotionData)
          var isEndIn = state === PromotionStates.Live
          var isExpireIn = PromotionStates.Expired
          
          if (isEndIn) this.countdownFn(normalizedTime.endTime, 1);
          else if (isExpireIn) this.countdownFn(normalizedTime.closeTime, 2)
        }
      },

      /**
      * @param {number} countdownTime
      * @param {number} countdownType
      */
      countdownFn: function(countdownTime, countdownType) {
        var ctx = this;
        var periodStartIn = normalizedTime.beginTime - normalizedTime.openTime;
        var periodEndIn = normalizedTime.endTime - normalizedTime.beginTime;
        var periodExpireIn = normalizedTime.closeTime - normalizedTime.endTime;
        var period = countdownType == 1 ? periodEndIn : (countdownType == 2 ? periodExpireIn : periodStartIn);

        timerDestructor = promotionUtils.createCountdown(countdownTime, {
          onUpdate: function(remainingTime) {
            promotionUtils.updateElementsCountdown(
              remainingTime, 
              period,
              assert(ctx.$$el).find('.box_times span:first-child'),
              assert(ctx.$$el).find('.box_times p b')
            )
          },
          onComplete: function() {
            if (countdownType == 1) { //Ends in to Expire in
              assert(ctx.$$el).find('.state').text(Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")[2])
              timerDestructor();
              ctx.countdownFn(normalizedTime.endTime, 2);
            } else {
              ctx.unmount()
            }
          }
        })
      }
    })
  }
  })();

