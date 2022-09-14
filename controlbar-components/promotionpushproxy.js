// @ts-check

///监听所有关于promotion的推送同时转发, promotiontip thumbnail layout会接收转发内容

(function () {
  /**
   * @template T
   * @typedef {import('./promotion').MaybeNull<T>} MaybeNull
   */

  /**
   * @typedef {import('./promotion').PromotionName} PromotionName
   * @typedef {import('./promotion').LuckywheelData} LuckywheelData
   * @typedef {import('./promotion').FreespinpromotionData} FreespinpromotionData
   * @typedef {import('./promotion').RedpacketData} RedpacketData
   * @typedef {import('./promotion').RedpacketNewData} RedpacketNewData
   * @typedef {import('./promotion').RedpacketNewLevelData} RedpacketNewLevelData
   * @typedef {import('./promotion').TournamentData} TournamentData
   * @typedef {import('./promotion').PromotionDataMap} PromotionDataMap
   * @typedef {import('./promotion').Promotion} Promotion
   * @typedef {import('./promotion').CloseData} CloseData
   */

  // @ts-expect-error
  var Service = window.Service
  // @ts-expect-error
  var mm = window.mm
  // @ts-expect-error
  var spade = window.spade
  // @ts-expect-error
  var promotionResource = window.resource_promotion
  // @ts-expect-error
  var Locale = window.Locale

  var pushProxy = {
    /**
     * @type {Promotion[]}
     */
    promotions: [],

    install: function () {
      var service = Service.create();
      var emitter = mm.emitter;

      var resLoadState = {
        luckywheel: false,
        freespin: false,
        redpacket: false,
        redpacketNew: false,
        tournament: false
      };
      var self = this;

      this.proxy(emitter)

      //luckywheel
      service.bindPushEvent(Service._Commands.WHEEL_OPEN, function (/** @type {any} */ data) {
        if (resLoadState.luckywheel) {
          emitter.emit(Service._Commands.WHEEL_OPEN, data);
        } else {
          self.loadResource("luckywheel", data, function () {
            resLoadState.luckywheel = true;
            emitter.emit(Service._Commands.WHEEL_OPEN, data);
          });
        }
      });
      service.bindPushEvent(Service._Commands.WHEEL_CLOSE, function (/** @type {any} */data) {
        emitter.emit(Service._Commands.WHEEL_CLOSE, data);
      });

      //freespin
      service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_OPEN, function (/** @type {any} */data) {
        if (resLoadState.freespin) {
          emitter.emit(Service._Commands.FREESPIN_PROMOTION_OPEN, data);
        } else {
          self.loadResource('freespinpromotion', data, function () {
            resLoadState.freespin = true;
            emitter.emit(Service._Commands.FREESPIN_PROMOTION_OPEN, data);
          });
        }
      });
      service.bindPushEvent(Service._Commands.FREESPIN_PROMOTION_CLOSE, function (/** @type {any} */data) {
        emitter.emit(Service._Commands.FREESPIN_PROMOTION_CLOSE, data);
      });

      //tournament
      service.bindPushEvent(Service._Commands.TOUR_OPEN, function (/** @type {any} */data) {
        if (resLoadState.tournament) {
          emitter.emit(Service._Commands.TOUR_OPEN, data);
        } else {
          self.loadResource('tournament', data, function () {
            resLoadState.tournament = true;
            emitter.emit(Service._Commands.TOUR_OPEN, data);
          });
        }
      });
      service.bindPushEvent(Service._Commands.TOUR_CLOSE, function (/** @type {any} */data) {
        emitter.emit(Service._Commands.TOUR_CLOSE, data);
      });

    //redpacket
    service.bindPushEvent(Service._Commands.DRAW_MSG, function (/** @type {any} */data) {
      if (resLoadState.redpacket) {
        emitter.emit(Service._Commands.DRAW_MSG, data);
      } else {
        self.loadResource('redpacket', data, function () {
          resLoadState.redpacket = true;
          emitter.emit(Service._Commands.DRAW_MSG, data);
        });
      }
    });
    service.bindPushEvent(Service._Commands.DRAW_CLOSE, function (/** @type {any} */data) {
      emitter.emit(Service._Commands.DRAW_CLOSE, data);
    });
    service.bindPushEvent(Service._Commands.DRAW_ACCESS, function (/** @type {any} */data) {
      if (resLoadState.redpacket) {
        emitter.emit(Service._Commands.DRAW_ACCESS, data);
      } else {
        self.loadResource("redpacket", data, function () {
          resLoadState.redpacket = true;
          emitter.emit(Service._Commands.DRAW_ACCESS, data);
        })
      }
    });

      //redpacket2
      service.bindPushEvent(Service._Commands.REDPACKETNEW_OPEN, function (/** @type {any} */data) {
        if (resLoadState.redpacketNew) {
          emitter.emit(Service._Commands.REDPACKETNEW_OPEN, data);
        } else {
          self.loadResource('redpacketnew', data, function () {
            resLoadState.redpacketNew = true;
            emitter.emit(Service._Commands.REDPACKETNEW_OPEN, data);
          });
        }
      });
      service.bindPushEvent(Service._Commands.REDPACKETNEW_CLOSE, function (/** @type {any} */data) {
        emitter.emit(Service._Commands.REDPACKETNEW_CLOSE, data);
      });
      service.bindPushEvent(Service._Commands.REDPACKETNEW_LEVEL, function (/** @type {any} */data) {
        emitter.emit(Service._Commands.REDPACKETNEW_LEVEL, data);
      })
    },

    proxy: function (/** @type {any} */ emitter) {
      var promotions = this.promotions

      /**
       * 接收到一个 promotion 数据
       * @template {PromotionName} T
       * @param {T} name
       * @param {number} tranId
       * @param {PromotionDataMap[T] | ((oldData: MaybeNull<PromotionDataMap[T]>) => PromotionDataMap[T])} dataOrUpdater
       */
      function pushOrUpdatePromotion(name, tranId, dataOrUpdater) {
        var existingIndex = promotionUtils.findIndex(promotions, function (promotion) {
          return promotion.tranId === tranId
        })
        var oldData = existingIndex !== -1 ? /** @type {PromotionDataMap[T]} */ (promotions[existingIndex].data) : null
        var newData = typeof dataOrUpdater === 'function' ? dataOrUpdater(oldData) : dataOrUpdater
        if (existingIndex !== -1) {
          promotions[existingIndex].data = newData
          emitter.emit('promotion:update', promotions[existingIndex])
        } else {
          var newPromotion = {
            name: name,
            tranId: tranId,
            data: newData
          }
          promotions.push(/** @type {any} */ (newPromotion))
          emitter.emit('promotion:new', newPromotion, promotions)
        }
      }

      /**
       * 删除指定的 promotion
       * @param {number} tranId
       * @param {(promotion: Promotion) => null | Promotion | void} [destroyer] 返回 null 表示删除
       */
      function removePromotion(tranId, destroyer) {
        var willDestroyIndex = promotionUtils.findIndex(promotions, function (item) {
          return item.tranId === tranId
        })
        if (willDestroyIndex === -1) return
        var willDestroyPromotion = promotions[willDestroyIndex]
        if (destroyer) {
          var result = destroyer(willDestroyPromotion)
          if (result === null) {
            promotions.splice(willDestroyIndex, 1)
          } else {
            if (result) promotions[willDestroyIndex] = result
            emitter.emit('promotion:updated', promotions[willDestroyIndex])
          }
        } else {
          promotions.splice(willDestroyIndex, 1)
        }
        emitter.emit('promotion:removed', willDestroyPromotion, willDestroyIndex)
      }

      // -25 轮盘推送
      emitter.on(Service._Commands.WHEEL_OPEN, function (/** @type {LuckywheelData}*/ data) {
        pushOrUpdatePromotion('luckywheel', data.info.tranId, data)
      })

      // -26 轮盘关闭
      emitter.on(Service._Commands.WHEEL_CLOSE, function (/** @type {CloseData}*/ data) {
        removePromotion(data.tranId)
      })

      // freespin 推送开启
      emitter.on(Service._Commands.FREESPIN_PROMOTION_OPEN, function (/** @type {FreespinpromotionData} */ data) {
        pushOrUpdatePromotion('freespinpromotion', data.tranId, function (oldData) {
          if (!oldData) {
            return { tranId: data.tranId, list: [data] }
          }
          var existingIndex = promotionUtils.findIndex(oldData.list, function (item) {
            return item.promotionCode === data.promotionCode
          })
          if (existingIndex !== -1) {
            // update
            oldData.list[existingIndex] = data
          } else {
            // insert
            oldData.list.push(data)
          }

          // 按照 promotionCode 升序排列，后续展示第一项
          oldData.list = oldData.list.sort(function (a, b) {
            return Number.parseInt(a.promotionCode.slice(-2)) - Number.parseInt(b.promotionCode.slice(-2))
          })
          
          return oldData
        })
      })

      // freespin 推送关闭
      emitter.on(Service._Commands.FREESPIN_PROMOTION_CLOSE, function (/** @type {CloseData & { promotionCode: string }} */ data) {
        removePromotion(data.tranId, function (promotion) {
          var promotionData = /** @type {PromotionDataMap['freespinpromotion']} */ (promotion.data)
          var existingIndex = promotionUtils.findIndex(promotionData.list, function (item) {
            return item.promotionCode === data.promotionCode
          })
          if (existingIndex !== -1) {
            promotionData.list.splice(existingIndex, 1)
            if (promotionData.list.length === 0) return null
          }
        })
      })

      // -13 红包推送
      emitter.on(Service._Commands.DRAW_MSG, function (/** @type {RedpacketData} */ data) {
        pushOrUpdatePromotion('redpacket', data.tranId, data)
      })

      // -18 红包是否有领取权限
      emitter.on(Service._Commands.DRAW_ACCESS, function (/** @type {RedpacketData} */ data) {
        pushOrUpdatePromotion('redpacket', data.tranId, function (oldData) {
          if (!oldData) return data
          oldData.access = data.access
          return oldData
        })
      })

      // -14 红包关闭推送
      emitter.on(Service._Commands.DRAW_CLOSE, function (/** @type {CloseData} */ data) {
        removePromotion(data.tranId)
      })

      // -38 红包2推送
      emitter.on(Service._Commands.REDPACKETNEW_OPEN, function (/** @type {RedpacketNewData} */ data) {
        pushOrUpdatePromotion('redpacketnew', data.packetInfo.tranId, data)
      })

      // -40 红包2等级变化推送
      emitter.on(Service._Commands.REDPACKETNEW_LEVEL, function (/** @type {RedpacketNewLevelData} */ data) {
        pushOrUpdatePromotion('redpacketnew', data.tranId, function (oldData) {
          if (!oldData) throw new Error('未预期到的数据：REDPACKETNEW_LEVEL')
          oldData.packetAcctInfo.canReceive = data.packetAcctInfo.canReceive.filter(function (item) {
            return item.level > 0
          })
          return oldData
        })
      })

      // -39 红包2关闭推送
      emitter.on(Service._Commands.REDPACKETNEW_CLOSE, function (/** @type {CloseData} */ data) {
        removePromotion(data.tranId)
      })

      // 排行榜推送开启
      emitter.on(Service._Commands.TOUR_OPEN, function (/** @type {TournamentData} */ data) {
        pushOrUpdatePromotion('tournament', data.tranId, data)
      })

      // 排行榜推送关闭
      emitter.on(Service._Commands.TOUR_CLOSE, function (/** @type {CloseData} */ data) {
        removePromotion(data.tranId)
      })
    },

    // @ts-expect-error
    loadResource: function (resouceType, data, cb) {
      var languages = data.languages || ["en_US", "zh_CN"];
      var lan = languages.indexOf(spade.content.language) > -1 ? spade.content.language : "en_US";
      var newRes = promotionResource.getResource(resouceType, lan);
      var cssHtml = '', self = this;

      mm.loader.loadH5Resource(newRes, function () {
        var style = document.createElement("style");
        style.innerHTML = cssHtml;
        document.head.appendChild(style);
        self._initJsonMap(lan, cb);
        // @ts-expect-error
      }, function (resource, img, name) {
        cssHtml += '.bgimg' + name + '{background-image:url("' + resource + '");}';
      })
    },

    // @ts-expect-error
    _initJsonMap: function (lan, cb) {
      if (Locale.getString("TXT_PROMOTION") != "TXT_PROMOTION") return cb();
      Locale.initJsonMap('../../../common/componentsnew/promotionlocale/' + lan + '.json', cb, mm.game.config["ver"]);
    }
  }

  // @ts-expect-error
  window.pushProxy = pushProxy
})()
