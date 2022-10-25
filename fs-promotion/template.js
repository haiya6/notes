// @ts-check
var promotionTemplate = {
  /**
   * @param {TournamentPromotion} promotion
   * @returns {JQuery<HTMLElement>}
   */
  createBannerItemElementForTournament: function (promotion) {
    var data = promotion.data
    var title = data.name

    var txtHtml = mm.isIE()
      ? '<text fill="#fffd40" x="50%" y="50%">' + title + '</text>'
      : '<text fill="url(#gra' + promotion.tranId + ')" filter="url(#blur' + promotion.tranId + ')" x="50%" y="50%">' + title + '</text>'

    var html =
      '     <div class="area-single">' +
      '         <div class="single-main">' +
      '             <div class="single-bg bgimgpromotion_bg ' + promotion.name + '_bg"></div>' +
      '             <div class="single-info">' +
      '             <div class="single-title">' +
      '               <svg class="' + (mm.isIE() ? 'isIE' : '') + '" x="0px" y="0px" style="transform:translate(-50%,-50%) scale(' + (title.length > 26 ? 1 - 0.025 * (title.length - 26) : 1) + ')">' +
      '                   <defs>' +
      '                       <linearGradient id="gra' + promotion.tranId + '" x1="0%" y1="100%" x2="0%" y2="0">' +
      '                           <stop offset="0%" stop-color="#fff285"></stop>' +
      '                           <stop offset="14%" stop-color="#ffbb39"></stop>' +
      '                           <stop offset="47%" stop-color="#e3aa46"></stop>' +
      '                           <stop offset="100%" stop-color="#fffd40"></stop>' +
      '                       </linearGradient>' +
      '                       <filter id="blur' + promotion.tranId + '">' +
      '                           <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#2a1000" />' +
      '                       </filter>' +
      '                   </defs>' +
      txtHtml +
      '               </svg>' +
      '               </div>' +
      '             <div class="single-duration"><span class="bgimgpromotion_lan ' + promotion.name + '_dur_bg"></span><p><b></b><b></b><b></b><b></b></p></div>' +
      '             <div class="single-prize">' +
      '                 <p><span>' + Locale.getString("TXT_PROMOTION_TOTAL_PRIZE") + ':</span><span>' + spade.content.currency + ' ' + mm.formatAmount(data.totalPrize, "") + '</span></p>' +
      '                 <p><span>' + Locale.getString("TXT_PROMOTION_TOP_PRIZE") + ':</span><span>' + spade.content.currency + ' ' + mm.formatAmount(data.topPrize, "") + '</span></p>' +
      '             </div>' +
      '             <div class="single-units">' +
      '                 <p>' + mm.formatStr(Locale.getString("TXT_PROMOTION_CASH_PRIZE"), data.cashPoint) + '</p>' +
      (data.minBet > 0 ? '<p>' + mm.formatStr(Locale.getString("TXT_PROMOTION_MINBET"), spade.content.currency + ' ' + mm.formatAmount(data.minBet, "")) + '</p>' : '') +
      '             </div>' +
      '             <div class="single-btn">' +
      '                 <span class="bgimgpromotion ' + promotion.name + '_btn"><i>' + Locale.getString("TXT_OK") + '</i></span>' +
      '             </div>' +
      '           </div>' +
      '         </div>' +
      '     </div>'

    return $(html)
  },

  /**
   * @param {TournamentPromotion} promotion
   * @returns {JQuery<HTMLElement>}
   */
  createTipItemForTournament: function (promotion) {
    var data = promotion.data

    var html =
      '<div class="tips-single">' +
      '   <div class="tips-title">' + data.name + '</div>' +
      '   <div class="tips-text"><p>' + mm.formatStr(Locale.getString("TXT_PROMOTION_CURRENT_BET"), spade.content.currency + ' ' + mm.formatAmount(data.minBet, "")) + '</p></div>' +
      '   <div class="tips_times">' +
      '       <span></span>' +
      '       <p><b></b></p>' +
      '       <span>' + Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")[1] + '</span>' +
      '   </div>' +
      '</div>'
    return $(html)
  },

  /**
   * @param {FreeSpinPromotion} promotion
   * @returns {JQuery<HTMLElement>}
   */
  createBannerItemElementForFreeSpin: function (promotion) {
    var data = promotion.data;

    var html =
      '     <div class="area-single">' +
      '       <div class="single-main">' +
      '         <div class="single-bg bgimgpromotion_bg ' + promotion.name + '_bg"></div>' +
      '         <div class="single-info freespin">' +
      '           <div class="bgimgpromotion_lan ' + promotion.name + '_title"></div>' +
      '           <div class="single-duration"><span class="bgimgpromotion_lan ' + promotion.name + '_dur_bg"></span><p><b></b><b></b><b></b><b></b></p></div>' +
      '           <div class="single-units">' +
      '             <p>' + mm.formatStr(Locale.getString("TXT_FREESPIN_READY_WIN"), data.freeSpin.spinCount) + '</p>' +
      '             <p>' + mm.formatStr(Locale.getString("TXT_FREESPIN_TURNOVER_DESC"), spade.content.currency + ' ' + mm.formatAmount(data.turnover)) + '</p>' +
      '           </div>' +
      '           <div class="single-btn">' +
      '             <span class="bgimgpromotion ' + promotion.name + '_btn"><i>' + Locale.getString("TXT_OK") + '</i></span>' +
      '           </div>' +
      '         </div>' +
      '       </div>' +
      '     </div>';
    return $(html);
  },

  /**
   * @param {FreeSpinPromotion} promotion
   * @returns {JQuery<HTMLElement>}
   */
  createTipItemForFreeSpin: function (promotion) {
    var data = promotion.data

    var html =
      '<div class="tips-single freespin">' +
      '   <div class="tips-freespin-type">' + Locale.getString("TXT_FREESPIN_TYPE").split("%n%")[Number(data.promotionCode[data.promotionCode.length -1]) - 1] + '</div>' +
      '   <div class="tips-title">' + data.freeSpin.gameName + '</div>' +
      '   <div class="tips-text">' +
      '     <p>' + Locale.getString('TXT_FREESPIN_REDEEM_TIP01') + '<span>' + mm.formatStr(Locale.getString("TXT_FREESPIN_REDEEM_TIP02"), data.freeSpin.spinCount) +'</span></p>' +
      '     <p>' + Locale.getString('TXT_FREESPIN_REDEEM_TIP03') +'</p>' +
      '   </div>' +
      '   <div class="tips_times">' +
      '       <span></span>' +
      '       <p><b></b></p>' +
      '       <span class="state">' + Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")[1] + '</span>' +
      '   </div>' +
      '   <div class="freespin-btn">' + Locale.getString("TXT_YES_FREESPIN") + '</div>' +
      '</div>'

    return $(html)
  },
  /**
  * @param {TournamentPromotionData} promotionData 
  * @param {number} maxRankCount 
  * @param {PromotionState} state 
  */
  createMainForTournament: function (promotionData, maxRankCount, state) {
    var html = ''
    var data = promotionData.data
    var typeStr = Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")[promotionUtils.state2RequestStatus[state] - 1]
    var rankStr = data.subInfo.rank == 0 ? maxRankCount + "+" : data.subInfo.rank
    var tourIconTag = 'tour_big_icon' + (spade.content.hideProviderLogo ? '_no' : '')

    /**
     * @param {string} gameCode 
     */
    var getImgUrl = function (gameCode) {
      return '../../../fscommon/thumbnail/' + promotionUtils.getLanguage(["en_US", "zh_CN", "th_TH"]) + "/" + gameCode + ".png" + "?" + mm.game.config.ver;
    }

    /**
     * 
     * @param {string[]} games 
     */
    var createGameListHTML = function (games) {
      var html = ''
      var len = games.length
      if (len > 6) {
        games.slice(0, 5).forEach(function (gameCode) {
          html += '<li><img src="' + getImgUrl(gameCode) + '"></li>'
        })
        html += '<li class="more">+' + (len - 6) + '<i class="bgimgtournament tour_tips_icon"></i></li>'
      } else if (len > 2) {
        games.forEach(function (gameCode) {
          html += '<li><img src="' + getImgUrl(gameCode) + '"></li>';
          for (var i = 0; i < 6 - len; i++) {
            html += '<li></li>';
          }
        })
      } else {
        games.forEach(function (gameCode) {
          html += '<li num="' + len + '"><img src="' + getImgUrl(gameCode) + '"></li>';
        });
      }
      return html
    }

    if (state === PromotionStates.Registering) {
      html = '<div class="box_list_info component_tournament">' +
        '<div class="box_left">' +
        ' <ul data="2">' + createGameListHTML(data.subInfo.gameList) + '</ul>' +
        ' <div class="box_times">' +
        '   <span></span>' +
        '   <p><b></b></p>' +
        '   <span>' + typeStr + '</span>' +
        ' </div>' +
        '</div>' +
        '<div class="box_center">' +
        ' <h3>' + data.mainInfo.name + '</h3>' +
        ' <p class="t_prize">' + mm.formatAmount(data.subInfo.fullPoint) + '</p>' +
        ' <p class="p_prize"><span class="bgimgtournament tour_home_icon"></span>' + Locale.getString("TXT_TOURNAMENT_PRIZE_TOP") + '</p>' +
        '  <p class="p_gold">' + (data.subInfo.noOfPlayer || '-') + '</p>' +
        '  <p class="p_normal">' + Locale.getString("TXT_TOURNAMENT_NO_PLAYER") + '</p>' +
        '</div>' +
        '<div class="box_right"><span class="bgimgtournament_lan ' + tourIconTag + '"></span></div>' +
        '</div>'
    } else if (state === PromotionStates.Live) {
      html = '<div class="box_list_info live component_tournament">' +
        '<div class="box_left">' +
        ' <ul data="2">' + createGameListHTML(data.subInfo.gameList) + '</ul>' +
        '  <div class="box_times">' +
        '    <span></span>' +
        '   <p><b></b></p>' +
        '   <span>' + typeStr + '</span>' +
        ' </div>' +
        '</div>' +
        '<div class="box_center">' +
        '  <h3>' + data.mainInfo.name + '</h3>' +
        '  <p class="p_prize"><span class="bgimgtournament tour_home_icon"></span> ' + rankStr + '</p>' +
        '  <p class="p_text">' + Locale.getString("TXT_TOURNAMENT_RANK") + '</p>' +
        '  <p class="p_gold">' + (data.subInfo.noOfPlayer || '-') + '</p>' +
        '  <p class="p_normal">' + Locale.getString("TXT_TOURNAMENT_NO_PLAYER") + '</p>' +
        '  <p class="p_gold">' + (data.subInfo.amount == 0 ? '-' : mm.formatAmount(data.subInfo.amount)) + '</p>' +
        '  <p class="p_normal">' + Locale.getString("TXT_TOTAL") + '</p>' +
        '</div>' +
        '<div class="box_right"><span class="bgimgtournament_lan ' + tourIconTag + '"></span></div>' +
        '</div>'
    } else {
      html = '<div class="box_list_info ended component_tournament">' +
        '<div class="box_left">' +
        ' <ul data="2">' + createGameListHTML(data.subInfo.gameList) + '</ul>' +
        '  <div class="box_times">' +
        '    <span></span>' +
        // @ts-expect-error
        '   <span>' + typeStr + ':' + new Date(SlotUtils.transDate(data.mainInfo.endDate)).format("yyyy.MM.dd") + '</span>' +
        '  </div>' +
        '</div>' +
        '<div class="box_center">' +
        '  <h3>' + data.mainInfo.name + '</h3>' +
        '  <p class="p_prize"><span class="bgimgtournament tour_home_icon"></span> ' + rankStr + '</p>' +
        '  <p class="p_text">' + Locale.getString("TXT_TOURNAMENT_RANK_FINAL") + '</p>' +
        '  <p class="p_gold">' + (data.subInfo.noOfPlayer || '-') + '</p>' +
        '  <p class="p_normal">' + Locale.getString("TXT_TOURNAMENT_NO_PLAYER") + '</p>' +
        '  <p class="p_gold">' + (data.subInfo.amount == 0 ? '-' : mm.formatAmount(data.subInfo.amount)) + '</p>' +
        '  <p class="p_normal">' + Locale.getString("TXT_TOTAL") + '</p>' +
        '</div>' +
        '<div class="box_right"><span class="bgimgtournament_lan ' + tourIconTag + '"></span></div>' +
        '</div>'
    }

    return $(html)
  }
}

