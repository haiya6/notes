// @ts-check

/**
 * @type {PromotionNS}
 */
var Tournament = /** @type {PromotionNS} */ ({});

; (function () {
  var assert = promotionUtils.assert
  var getPromotionState = promotionUtils.getPromotionState
  var getTimes = promotionUtils.getTimes
  var normalizePeriodTime = promotionUtils.normalizePeriodTime

  // banner component
  Tournament.createBannerComponent = function (/** @type {TournamentPromotion} */ promotion, api) {
    var normalizedTime = normalizePeriodTime(promotion)
    /** @type {(() => void) | undefined} */
    var timerDestructor

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
        return promotionTemplate.createBannerItemElementForTournament(promotion)
      },
      onMounted: function () {
        this.startCountdown()
        // 绑定关闭事件
        assert(this.$$el).find('.single-btn .tournament_btn')[0].addEventListener('click', function () {
          promotionUtils.soundTick('info')
          $(this).addClass('ani')
          this.addEventListener('animationend', function () {
            api.closeBanner()
          })
        })
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
        var ctx = this
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

  // tip component
  Tournament.createTipComponent = function (/** @type {TournamentPromotion} */ promotion, api) {
    var normalizedTime = promotionUtils.normalizePeriodTime(promotion)
    /** @type {(() => void) | undefined} */
    var timerDestructor

    return api.defineTipComponent({
      setup: function () {
        var ctx = this

        var handler = function () {
          if (getPromotionState(promotion) === PromotionStates.Live && spade.betInfo.totalBet < promotion.data.minBet) {
            ctx.mount()
          } else {
            ctx.unmount()
          }
        }

        handler()
        api.emitter.on(PromotionEvents.BetChanged, handler)
      },
      initialRender: function () {
        return promotionTemplate.createTipItemForTournament(promotion)
      },
      onMounted: function () {
        var ctx = this
        timerDestructor = promotionUtils.createCountdown(normalizedTime.endTime, {
          onUpdate: function (remainingTime) {
            var totalTime = normalizedTime.endTime - normalizedTime.beginTime
            promotionUtils.updateElementsCountdown(
              remainingTime,
              totalTime,
              assert(ctx.$$el).find('.tips_times span:first-child'),
              assert(ctx.$$el).find('.tips_times p b')
            )
          },
          onComplete: function () {
            ctx.unmount()
          }
        })

        // 绑定关闭事件
        assert(this.$$el).find('.btn-close')[0].addEventListener('click', function () {
          ctx.unmount()
        })
      },
      onBeforeUnmount: function () {
        timerDestructor && timerDestructor()
      }
    })
  }

  // main component
  Tournament.createMainComponent = function (/** @type {TournamentMainComponentData} */ mainData, api) {
    var promotionData = mainData.promotionData
    var normalizedTime = normalizePeriodTime(promotionData)
    var typeStrs = Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")

    /**
     * 列表 item 的倒计时的定时器卸载器
     * @type {(() => void) | undefined}
     */
    var timerDestructor
    /**
     * 详情面板视图卸载器
     * @type {(() => void) | undefined}
     */
    var detailPanelDestructor
    /**
     * 更多游戏视图卸载器
     * @type {(() => void) | undefined}
     */
    var moreGameListDestructor

    /**
     * 展示更多游戏视图
     * @param {string[]} gameCodes 
     */
    var showMoreGameList = function (gameCodes) {
      /** @type {any} */
      var scrollIns
      /** @type {number} */
      var drawerID

      moreGameListDestructor = function () {
        if (scrollIns) {
          scrollIns.destroy()
          scrollIns = undefined
        }
        if (drawerID) DrawerUI.close(drawerID)
        moreGameListDestructor = undefined
      }

      promotionTemplate.createAllGameList(gameCodes, function (html) {
        var $content = $(html)
        promotionUtils.localize($content)
        promotionUtils.addIconEvents($content)

        drawerID = DrawerUI.open($content, {
          height: '1152px',
          wrapperClassNames: ['component_tournament']
        })

        var isIos = mm.device.isIos() && !mm.device.isIpad()
        scrollIns = new IScroll($content.find('.scroll-container')[0], {
          moveScale: 1 / gameSize.scale,
          mouseWheel: true,
          useTransform: !isIos,
          scrollbars: true,
          interactiveScrollbars: true,
          click: true
        })

        // 绑定关闭事件
        $content.find('.btn-close')[0].addEventListener('click', function () {
          moreGameListDestructor && moreGameListDestructor()
        })
      })
    }

    /**
     * 展示详情视图
     */
    var showDetailPanel = function () {
      /** @type {TournamentPromotionDetailData} */
      var detailData
      /** @type {string | undefined} */
      var activeCode
      /** @type {number | undefined} */
      var activeTabIndex
      /** @type {JQuery<HTMLElement> | undefined} */
      var $content
      /**
       * 详情面板中倒计时的卸载器
       * @type {() => void}
       */
      var detailPanelTimerDestructor
      /** @type {any} */
      var scrollIns
      /**
       * CategoryDetailModal 的卸载器
       * @type {DestoryCategoryDetailModalFunction | undefined}
       */
      var destroyCategoryDetailModal
      /**
       * 定时更新详情数据的定时器
       * @type {number | undefined}
       */
      var intervalRefreshTimer

      detailPanelDestructor = function () {
        if (destroyCategoryDetailModal) destroyCategoryDetailModal()
        if (detailPanelTimerDestructor) detailPanelTimerDestructor()
        window.clearInterval(intervalRefreshTimer)
        destroyScrollIns()
        $content = undefined
        detailPanelDestructor = undefined
      }

      /**
       * @param {(result: TournamentDetailRequestResult) => void} callback
       */
      var loadDetailData = function (callback) {
        var params = {
          gameCode: spade.content.game,
          tranId: promotionData.tranId,
          language: spade.content.language,
          promotionCode: 'B-TD01'
        }
        Service.create().getTournamentDetail(params, function (/** @type {TournamentDetailRequestResult} */ result) {
          callback(result)
        })
      }

      var initOrRefreshScrollIns = function () {
        if (!$content) return
        if (scrollIns) {
          scrollIns.refresh()
          return
        }
        var isIos = mm.device.isIos() && !mm.device.isIpad()
        var scrollContainer = $content.find('.scroll-container:visible')
        if (scrollContainer.length > 0) {
          scrollIns = new IScroll(scrollContainer[0], {
            moveScale: 1 / gameSize.scale,
            mouseWheel: true,
            useTransform: !isIos,
            scrollbars: true,
            interactiveScrollbars: true,
            click: true
          })
        }
      }

      var destroyScrollIns = function () {
        if (scrollIns) scrollIns.destroy()
        scrollIns = undefined
      }

      /**
       * 切换每个 code 中的底部 tab
       * @param {number | undefined} index
       */
      var toggleTab = function (index) {
        if (!$content || !detailData) return
        if (typeof index === 'undefined') index = 0
        activeTabIndex = index
        var codeItemData = promotionUtils.find(detailData.list, function (item) {
          return item.code === activeCode
        })
        if (!codeItemData) return
        $content.removeClass('hide-tnav')
        $content.find('.cont_nav1 > ul > li').removeClass('on').eq(index).addClass('on')
        $content.find('.t_main').children().hide().eq(index).show()

        switch (index) {
          case 0: {
            // t_list_rank
            $content.find('.t_list_rank').html(
              promotionTemplate.createLeaderListHTML(codeItemData)
            )
            break
          }
          case 1: {
            var $t_info_prize = $('.t_info_prize')
            $t_info_prize.find('.t_list_prize').html(
              promotionTemplate.createPrizeList(codeItemData)
            )
            if (codeItemData.tournamentBonusInfo.length === 0) {
              $t_info_prize.addClass('nodata')
            } else {
              $t_info_prize.removeClass('nodata')
            }
            break
          }
          case 2: {
            $content.addClass('hide-tnav')
            $content.find('.t_list_daily').html(
              promotionTemplate.createDailyInfo(
                normalizedTime.beginTime,
                normalizedTime.endTime,
                codeItemData
              )
            )
            promotionUtils.getTournamentAllGames(function (games) {
              if ($content && codeItemData) {
                $content.find('.t_list_daily .game-list').html(
                  codeItemData.gameList.map(function (i) {
                    return games[i]
                  }).join(',')
                )
                initOrRefreshScrollIns()
              }
            })
            break
          }
        }

        destroyScrollIns()
        initOrRefreshScrollIns()
      }

      /**
       * @param {string | undefined} code 
       */
      var toggleCode = function (code) {
        if (!$content || !detailData) return
        var index = promotionUtils.findIndex(detailData.list, function (item) {
          return item.code === code
        })
        if (index === -1) index = 0

        var data = detailData.list[index]
        activeCode = data.code
        // nav2
        $content.find('.cont_nav2 > ul > li').removeClass('on').eq(index).addClass('on')
        // gamelist
        $content.find('.t_game_list > ul').html(
          promotionTemplate.createGameList(data.gameList)
        )
        var $btnMoreGameList = $content.find('.t_game_list > ul > li.more')
        if ($btnMoreGameList.length) $btnMoreGameList[0].addEventListener('click', function () {
          showMoreGameList(data.gameList)
        })
        // top name
        $content.find('.my_tour_name').text(data.name)
        // my-rank
        // 如果当前处于准备阶段，则排名默认显示-，否则才显示正常排名
        $content.find('.my-rank').text(
          mainData.activeState === PromotionStates.Registering
            ? '-'
            : data.rank === 0 ? (mainData.maxRankCount + '+') : data.rank
        )
        // my-point
        $content.find('.my-point').text(
          data.amount === 0 ? '-' : mm.formatAmount(data.amount)
        )
        // my-online
        $content.find('.my-online').text(
          SlotUtils.transUnit(data.online)
        )

        toggleTab(activeTabIndex)
      }

      api.useCategoryDetailModal(function (doOpen) {
        var renderOrUpdateContent = function () {
          if (!$content) {
            $content = promotionTemplate.createDetailForTournament()
            destroyCategoryDetailModal = doOpen($content, {
              wrapperClassNames: ['component_tournament']
            })
            // 倒计时
            var $t_me_times = $content.find('.t_me_times')
            $t_me_times.removeClass('end')
            $t_me_times.find('.my-type').text(typeStrs[1])
            $t_me_times.find('.my-type-end').text(typeStrs[2])
            if (mainData.activeState === PromotionStates.Registering) $t_me_times.hide()
            else {
              $t_me_times.show()
              if (mainData.activeState === PromotionStates.Live) {
                var totalTime = normalizedTime.endTime - normalizedTime.beginTime
                detailPanelTimerDestructor = promotionUtils.createCountdown(normalizedTime.endTime, {
                  onUpdate: function (remainingTime) {
                    promotionUtils.updateElementsCountdown(remainingTime, totalTime, $t_me_times.find('.my-times'), $t_me_times.find('.my-progress'))
                  }
                })
              } else {
                // ended
                $t_me_times.addClass('end')
                // @ts-expect-error
                $t_me_times.find('.my-times').text(new Date(normalizedTime.endTime).format('yyyy.MM.dd'))
              }
            }

            // 绑定 gamecode 切换事件
            $content.find('.cont_nav2 > ul')[0].addEventListener('click', function (event) {
              var target = /** @type {HTMLElement} */ (event.target)
              if (target.tagName !== 'LI') return
              activeTabIndex = undefined
              toggleCode($(target).attr('data-code'))
            })

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
            })

            // 绑定全部关闭事件
            $content.find('.btn-close')[0].addEventListener('click', function () {
              promotionUtils.soundTick('info')
              api.closeCategory()
            })
          }

          var nav2LiHTML = detailData.list.reduce(function (prev, current) {
            return prev + ('<li data-code="' + current.code + '">' + current.name + '</li>')
          }, '')

          $content.find('.cont_nav2 > ul').html(nav2LiHTML)

          toggleCode(activeCode)
        }

        var setup = function () {
          loadDetailData(function (result) {
            if (result.code !== 0) return
            detailData = result.detailInfo
            renderOrUpdateContent()
          })
        }
        setup()
        // 定时刷新
        intervalRefreshTimer = window.setInterval(setup, 1000 * 60 * 2)
      })

    }

    return api.defineMainComponent({
      setup: function () {
        this.mount()
      },
      initialRender: function () {
        return promotionTemplate.createMainForTournament(
          promotionData,
          mainData.maxRankCount,
          mainData.activeState
        )
      },
      onMounted: function () {
        this.startCountdown()

        // 绑定更多游戏事件
        var btnMoreEl = assert(this.$$el).find('.box_left .more')[0]
        if (btnMoreEl) {
          btnMoreEl.addEventListener('click', function (event) {
            event.stopPropagation()
            showMoreGameList(mainData.promotionData.data.subInfo.gameList)
          })
        }

        // 绑定打开详情事件，在 iscroll 容器中，监听 tap 事件关闭
        assert(this.$$el)[0].addEventListener('tap', function () {
          showDetailPanel()
        })
      },
      onBeforeUnmount: function () {
        timerDestructor && timerDestructor()
        detailPanelDestructor && detailPanelDestructor()
        moreGameListDestructor && moreGameListDestructor()
      },
      startCountdown: function () {
        var ctx = this
        var normalizedTime = normalizePeriodTime(mainData.promotionData)

        /**
         * 当前阶段的开始时间戳
         * @type {number | undefined}
         */
        var currentStageBeginTime
        /**
         * 当前阶段的结束时间戳
         * @type {number | undefined} 
         */
        var currentStageEndTime

        if (mainData.activeState === PromotionStates.Registering) {
          currentStageBeginTime = normalizedTime.openTime
          currentStageEndTime = normalizedTime.beginTime
        } else if (mainData.activeState === PromotionStates.Live) {
          currentStageBeginTime = normalizedTime.beginTime
          currentStageEndTime = normalizedTime.endTime
        }

        if (!currentStageBeginTime || !currentStageEndTime) return

        var totalTime = currentStageEndTime - currentStageBeginTime
        timerDestructor = promotionUtils.createCountdown(currentStageEndTime, {
          onUpdate: function (remainingTime) {
            promotionUtils.updateElementsCountdown(
              remainingTime,
              totalTime,
              assert(ctx.$$el).find('.box_times > span:eq(0)'),
              assert(ctx.$$el).find('.box_times > p > b')
            )
          },
          onComplete: function () {
            ctx.unmount()
          }
        })
      }
    })
  }
})();
