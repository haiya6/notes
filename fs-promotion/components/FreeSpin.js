// @ts-check

/**
* @type {PromotionNS}
*/
var FreeSpin = /** @type {PromotionNS} */ ({})

; (function () {
  var assert = promotionUtils.assert
  var getPromotionState = promotionUtils.getPromotionState
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
        if (currentState === PromotionStates.EndIn) this.mount()
        else if (currentState === PromotionStates.StartIn) {
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
        promotionUtils.clickWithAnimation(
          assert(this.$$el).find('.single-btn .freespin_btn'), 
          'click',
          true,
          function () {
            api.closeBanner()
          }
        )
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
            var times = promotionUtils.getTimes(remainingTime)
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

  // tip component
  FreeSpin.createTipComponent = function (/** @type {FreeSpinPromotion} */ promotion, api) {
    /** @type {(() => void) | undefined} */
    var timerDestructor
    var normalizedTime = normalizePeriodTime(promotion)

    return api.defineTipComponent({
      setup: function () {
        if (!spade.content.luckyId && promotion.data.freeSpin) this.mount();
      },
      initialRender: function () {
        return promotionTemplate.createTipItemForFreeSpin(promotion, promotionUtils.getPromotionState(promotion));
      },
      onMounted: function () {
        var ctx = this
        this.startCountdown();

        assert(this.$$el).find('.freespin-btn')[0].addEventListener('click', function () {
          api.closeTip()
          api.openCategory({
            openDetail: {
              tranId: promotion.tranId,
              activeCategoryName: promotionUtils.getPromotionCategoryName(promotion) || PromotionCategoryNames.Live
            }
          })
        });

        // 绑定关闭事件
        assert(this.$$el).find('.btn-close')[0].addEventListener('click', function () {
          ctx.unmount()
        })
      },
      onUpdated: function() {
        if (!this.$$el) this.setup();
      },
      onBeforeUnmount: function () {
        timerDestructor && timerDestructor()
      },
      startCountdown: function () {
        var state = promotionUtils.getPromotionState(promotion)
        var isEndIn = state === PromotionStates.EndIn
        var isExpireIn = state === PromotionStates.ExpiredIn

        if (isEndIn) this.countdownFn(normalizedTime.endTime, 1);
        if (isExpireIn) this.countdownFn(normalizedTime.closeTime, 2);
      },
      /**
      * @param {number} time
      * @param {number} countdownType
      */
      countdownFn: function (time, countdownType) {
        var ctx = this;
        var data = promotion.data;
        var periodEndIn = normalizedTime.endTime - normalizedTime.beginTime;
        var periodExpireIn = normalizedTime.closeTime - normalizedTime.endTime;
        var period = countdownType == 1 ? periodEndIn : periodExpireIn;

        timerDestructor = promotionUtils.createCountdown(time, {
          onUpdate: function (remainingTime) {
            promotionUtils.updateElementsCountdown(
              remainingTime, 
              period,
              assert(ctx.$$el).find('.tips_times span:first-child'),
              assert(ctx.$$el).find('.tips_times p b')
            );
          },
          onComplete: function () {
            if (countdownType == 1 && data.freeSpin) { //Ends in to Expire in
              assert(ctx.$$el).find('.state').text(Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")[2]);
              timerDestructor && timerDestructor()
              ctx.countdownFn(normalizedTime.closeTime, 2);
            } else {
              ctx.unmount()
            }
          }
        })
      }
    })
  }

  // main component
  FreeSpin.createMainComponent = function (/** @type {FreeSpinMainComponentData} */ mainData, api) {
    var promotionData = mainData.promotionData;
    var normalizedTime = normalizePeriodTime(mainData.promotionData)

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
    /** 
     * 详情dom结构
     * @type {JQuery<HTMLElement>|undefined} 
     */
    var $content

    var showDetailPanel = function() {
      /** @type {number | undefined} */
      var activeTabIndex = 0
      /**
       * 详情面板中倒计时的卸载器
       * @type {() => void}
       */
       var detailPanelTimerDestructor
      /**
       * CategoryDetailModal 的卸载器
       * @type {DestroyCategoryDetailModalFunction | undefined}
       */
      var destroyCategoryDetailModal
      /**
       * Freespin不能领取提示动画的tween
       * @type {any | undefined}
       */
      var errorShowTween
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
              if (countdownType == 2) {
                promotionData.data.freeSpin ? countDownFn(normalizedTime.closeTime, 2) : (destroyCategoryDetailModal && destroyCategoryDetailModal())
              } 
            }
          }
        })
      }

      var showWarnTips = function() {
        if (errorShowTween) return
        var errorTips = assert($content).find('.freespin_error');
        errorTips.removeClass("none").css("opacity","0");

        // @ts-ignore
        errorShowTween = new TimelineMax()
        .to(errorTips,0.3,{
          "opacity":1
        })
        .to(errorTips,0.3,{
          "opacity":0,
          onComplete:function(){
            errorShowTween.kill();
            errorShowTween = undefined;	
          }
        },"+=1.4");
      }

      /**
       * watch params:spade.betInfo.slotStatus && spade.betInfo.isAuto && spade.content.luckyId
       */
      var watchParams = function() {
        /**
         * @param {any} [status] 
         * @param {any} [isAuto] 
         * @param {any} [luckyId] 
         */
        var setBtnEnable = function (status, isAuto, luckyId) {
          status = status == null ? spade.betInfo.slotStatus : status
          isAuto = isAuto == null ? spade.betInfo.isAuto : isAuto
          luckyId = luckyId == null ? spade.content.luckyId : luckyId

          if (!$content) return;

          if (status == SlotStatus.SPIN || isAuto || luckyId) {
            $content.find('.redeem-btn').addClass('disable')
          } else {
            $content.find('.redeem-btn').removeClass('disable')
          }
        }

        setBtnEnable()

        var slotStatus = spade.betInfo.slotStatus
        Object.defineProperty(spade.betInfo, 'slotStatus', {
          get: function () {
            return slotStatus
          },
          set: function (val) {
            slotStatus = val
            setBtnEnable(slotStatus)
          },
          configurable: true
        })
      
        var isAuto = spade.betInfo.isAuto
        Object.defineProperty(spade.betInfo, 'isAuto', {
          set: function (val) {
            isAuto = val
            setBtnEnable(null, isAuto)
          },
          get: function () {
            return isAuto
          },
          configurable: true
        });
        var luckyId = spade.content.luckyId;
        Object.defineProperty(spade.content, 'luckyId', {
          set: function (val) {
            luckyId = val
            setBtnEnable(null, null, luckyId)
          },
          get: function () {
            return luckyId
          },
          configurable: true
        })
    
      }

      detailPanelDestructor = function() {
        if (destroyCategoryDetailModal) destroyCategoryDetailModal()
        if (detailPanelTimerDestructor) detailPanelTimerDestructor()
        $content = undefined;
        if (errorShowTween) {
          errorShowTween.kill();
          errorShowTween = undefined;	
        }
        // reset
        Object.defineProperty(spade.betInfo, 'slotStatus', { value: spade.betInfo.slotStatus, configurable: true, writable: true })
        Object.defineProperty(spade.betInfo, 'isAuto', { value: spade.betInfo.isAuto, configurable: true, writable: true })
        Object.defineProperty(spade.content, 'luckyId', { value: spade.content.luckyId, configurable: true, writable: true })
      }
      
      api.useCategoryDetailModal(function(doOpen) {
        var renderOrUpateContent = function() {
          if (!$content) {
            $content = promotionTemplate.createDetailForFreespin(promotionData);
            destroyCategoryDetailModal = doOpen($content, {
              wrapperClassNames: ["component_freespin"]
            })
            //设置领取按钮状态
            watchParams()
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
              if(spade.betInfo.isFreeMode) return showWarnTips();

              isClickAble = false
              Service.create().getRceiveSpin({
                tranId: promotionData.data.tranId,
                roundId: assert(promotionData.data.freeSpin).roundId              
              }, function(/** @type {any} */ res) {
                if (res.code == 0) {
                  return spade.redirectGame(assert(promotionData.data.freeSpin).gameCode)
                }
              })
            });
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
          promotionUtils.getPromotionState(promotionData)
        );
      },
      onMounted: function() {
        // 在 iscroll 容器中，监听 tap 事件关闭
        promotionUtils.clickWithAnimation(assert(this.$$el), 'tap', false, function () {
          showDetailPanel();
        })
        this.startCountdown();
      },
      onUpdated: function() {
        var state = promotionUtils.getPromotionState(promotionData);
        var data = promotionData.data;
        if (state === PromotionStates.EndIn || state === PromotionStates.ExpiredIn) {
          if (data.freeSpin) assert(this.$$el).find('.redeem').show();
          if (!data.freeSpin && data.rt) assert(this.$$el).find('.fully-redeem').show();
        }
        if ($content) {
          promotionTemplate.updateFreespinDetailTemplate(promotionData, $content);
        }
      },
      onBeforeUnmount: function(unmountCustomData) {
        timerDestructor && timerDestructor()
        if (!unmountCustomData || unmountCustomData.unmountDetailPanel) {
          detailPanelDestructor && detailPanelDestructor()
        }
      },
      startCountdown: function () {
        var state = promotionUtils.getPromotionState(promotionData);
        switch(state) {
          case PromotionStates.StartIn:
            this.countdownFn(normalizedTime.beginTime, 0);
            break;
          case PromotionStates.EndIn:
            this.countdownFn(normalizedTime.endTime, 1);
            break;
          case PromotionStates.ExpiredIn:
            if (promotionData.data.freeSpin) {
              this.countdownFn(normalizedTime.closeTime, 2);
            } else {
              this.unmount();
            }
            break;
          default:
            this.unmount();
            break;
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
            if (countdownType == 1 && promotionData.data.freeSpin) { //Ends in to Expire in
              assert(ctx.$$el).find('.state').text(Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")[2])
              timerDestructor();
              ctx.countdownFn(normalizedTime.closeTime, 2);
            } else {
              ctx.unmount({
                unmountDetailPanel: false
              })
            }
          }
        })
      }
    })
  }
  })();

