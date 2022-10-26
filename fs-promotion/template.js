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
      '             <p>' + mm.formatStr(Locale.getString("TXT_FREESPIN_READY_WIN"), data.tu) + '</p>' +
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
      '   <div class="tips-freespin-type">' + Locale.getString("TXT_FREESPIN_TYPE").split("%n%")[Number(data.promotionCode[data.promotionCode.length - 1]) - 1] + '</div>' +
      '   <div class="tips-title">' + data.freeSpin.gameName + '</div>' +
      '   <div class="tips-text">' +
      '     <p>' + Locale.getString('TXT_FREESPIN_REDEEM_TIP01') + '<span>' + mm.formatStr(Locale.getString("TXT_FREESPIN_REDEEM_TIP02"), data.freeSpin.spinCount) + '</span></p>' +
      '     <p>' + Locale.getString('TXT_FREESPIN_REDEEM_TIP03') + '</p>' +
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
    var createGameListHTML = promotionTemplate.createGameList
    var html = ''
    var data = promotionData.data
    var typeStr = Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")[promotionUtils.state2RequestStatus[state] - 1]
    var rankStr = data.subInfo.rank == 0 ? maxRankCount + "+" : data.subInfo.rank
    var tourIconTag = 'tour_big_icon' + (spade.content.hideProviderLogo ? '_no' : '')

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
  },

  /**
   * @param {string[]} games 
   * @returns 
   */
  createGameList: function (games) {
    var getImgUrl = promotionUtils.getImgUrl
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
  },

  /**
   * @param {TournamentPromotionDetailData['list'][number]} codeItemData 
   */
  createLeaderListHTML: function (codeItemData) {
    var html = ''

    codeItemData.tournamentRank.list.forEach(function (item, index) {
      if (index <= 2) html += '<div class="tr tr_top" data="' + (index + 1) + '"><div class="td"><span class="bgimgtournament"></span></div>'
      else html += '<div class="tr"><div class="td"><span>' + (index + 1) + '</span></div>'

      html +=
        ' <div class="td">' + item.acctId + '</div>' +
        ' <div class="td">' + mm.formatAmount(item.amount) + '</div>' +
        '</div>';
    })

    return html
  },

  /**
   * @param {TournamentPromotionDetailData['list'][number]} codeItemData 
   */
  createPrizeList: function (codeItemData) {
    var html = ''

    codeItemData.tournamentBonusInfo.forEach(function (item) {
      html += '<div class="tr">' +
        ' <div class="td">' + item.name + '</div>' +
        ' <div class="td">' + mm.formatAmount(item.bonusAmt) + '</div>' +
        '</div>';
    })

    return html
  },

  /**
   * @param {string} beginDate
   * @param {string} endDate
   * @param {TournamentPromotionDetailData['list'][number]} codeItemData 
   */
  createDailyInfo: function (beginDate, endDate, codeItemData) {
    var getDate = promotionUtils.getDate
    // @ts-expect-error
    var beginDateStr = getDate(beginDate).format("yyyy-MM-dd") + " (" + getDate(beginDate).format("hh:mm:ss") + ")"
    // @ts-expect-error
    var endDateStr = getDate(endDate).format("yyyy-MM-dd") + " (" + getDate(endDate).format("hh:mm:ss") + ")"

    var ruleText = ''
    if (codeItemData.minBet) {
      ruleText = Locale.getString("TXT_RULE_AMOUNT")
      codeItemData.tournamentCurrencyIntegrals.forEach(function (item) {
        ruleText += ' ' + item.currId + ':' + mm.parseAmount(item.minBet || 0)
      })
    } else if (codeItemData.minPoint) {
      ruleText = Locale.getString("TXT_MINPOINTS_" + codeItemData.code).replace("%%min-points%", codeItemData.minPoint).replace("%%rank-count%", codeItemData.rankCount);
    } else {
      ruleText = Locale.getString("TXT_NO_MINBET")
    }

    var html =
      '           <h3><span class="bgimgtournament tour_title_icon"></span><i>' + codeItemData.name + '</i></h3>' +
      '                   <div class="daily_table">' +
      '                       <div class="tr">' +
      '                           <div class="td"><p>' + Locale.getString("TXT_TOURNAMENT_STARTTIME") + '</p><p>' + Locale.getString("TXT_TOURNAMENT_ENDTIME") + '</p></div>' +
      '                           <div class="td"><p>' + beginDateStr + '</p><p>' + endDateStr + '</p></div>' +
      '                       </div>' +
      '                       <div class="tr">' +
      '                           <div class="td"><p>' + Locale.getString("TXT_TOURNAMENT_NO_PLAYER") + '</p></div>' +
      '                           <div class="td"><p>' + (codeItemData.noOfPlayer || '-') + '</p></div>' +
      '                       </div>' +
      '                   </div>' +
      '                   <div class="daily_text">' +
      '                       <h4>' + Locale.getString("TXT_TOURNAMENT_GAMES") + '</h4>' +
      '                       <p class="game-list"></p>' +
      '                   </div>' +
      '                   <div class="daily_text">' +
      '                       <h4>' + Locale.getString("TXT_RULES") + '</h4>' +
      '                       <p>' + ruleText + '</p>' +
      '                       <p>' + Locale.getString("TXT_RULE_" + codeItemData.code) + '</p>' +
      '                   </div>' +
      '                   <div class="daily_text">' +
      '                       <h4>' + Locale.getString("TXT_TERMS") + '</h4>' +
      '                       <p>' + Locale.getString("TXT_TERMS_INFO") + '</p>' +
      '                   </div>';

    return html
  },

  createDetailForTournament: function () {
    var html =
      '    <div class="content_nav">' +
      '    <div class="btn-close">' +
      '       <span baseimg="bgimgpromotion " tag="promotion_close" class="bgimgpromotion  promotion_close_up"></span>' + 
          '</div>' +
      '      <div class="top-bar"><div class="title" key="TXT_TOURNAMENT"></div></div>' +
      '      <div class="t_nav">' +
      '        <div class="t_game_list">' +
      '          <ul>' +
      '          </ul>' +
      '        </div>' +
      '        <div class="t_me_area">' +
      '           <div class="t_me_left">' +
      '               <h3 class="my_tour_name"></h3>' +
      '               <div class="t_btn">' +
      '                   <span class="bgimgtournament tour_home_icon"></span>' +
      '                   <p><span class="my-rank"></span><span key="TXT_TOURNAMENT_RANK"></span></p>' +
      '               </div>' +
      '               <div class="t_btn">' +
      '                   <span class="bgimgtournament tour_point_icon"></span>' +
      '                   <p><span class="my-point"></span><span key="TXT_TOURNAMENT_POINT"></span></p>' +
      '               </div>' +
      '           </div>' +
      '           <div class="t_me_right">' +
      '               <div class="t_text">' +
      '                   <span><i key="TXT_TOURNAMENT_ONLINE"></i> <i class="my-online"></i></span>' +
      '               </div>' +
      '               <div class="t_me_times">' +
      '                   <span class="my-type-end"></span>' +
      '                   <span class="my-times"></span>' +
      '                   <p><b class="my-progress"></b></p>' +
      '                   <span class="my-type"></span>' +
      '               </div>' +
      '           </div>' +
      '        </div>' +
      '      </div>' +
      '      <div class="t_main">' +
      '      <div class="t_info list_info_parent">' +
      '        <h3 key="TXT_LEADERBOARD"></h3>' +
      '        <div class="t_list_nodata"><p key="TXT_TOURNAMENT_LEADER_NO_DATA"></p></div>' +
      '        <div class="t_list">' +
      '          <div class="tr">' +
      '            <div class="th" key="TXT_RANK"></div>' +
      '            <div class="th" key="TXT_PLAYERID"></div>' +
      '            <div class="th" key="TXT_TOTAL"></div>' +
      '          </div>' +
      '          <div class="t_list_body">' +
      '            <div class="scroll-container">' +
      '              <div class="main-scroll">' +
      '                <div class="t_list_rank">' +
      '                </div>' +
      '              </div>' +
      '            </div>' +
      '          </div>' +
      '        </div>' +
      '      </div>' +
      '      <div class="t_info_prize list_info_parent">' +
      '        <h3 key="TXT_PRIZE"></h3>' +
      '        <div class="t_list_nodata"><p key="TXT_TOURNAMENT_PRIZE_NO_DATA"></p></div>' +
      '        <div class="t_list">' +
      '          <div class="tr">' +
      '            <div class="th" key="TXT_RANK"></div>' +
      '            <div class="th">' + Locale.getString("TXT_REWARD") + '(' + spade.content.currency + ')</div>' +
      '          </div>' +
      '          <div class="t_list_body">' +
      '            <div class="scroll-container">' +
      '              <div class="main-scroll">' +
      '                <div class="t_list_prize">' +
      '                </div>' +
      '              </div>' +
      '            </div>' +
      '          </div>' +
      '        </div>' +
      '      </div>' +
      '      <div class="t_info_daily">' +
      '          <div class="t_list_body">' +
      '            <div class="scroll-container">' +
      '              <div class="main-scroll">' +
      '                <div class="t_list_daily">' +
      '                </div>' +
      '              </div>' +
      '            </div>' +
      '          </div>' +
      '      </div>' +
      '     </div>' +
      '      <div class="t_nav_cont">' +
      '       <div class="cont_nav1">' +
      '           <ul>' +
      '               <li class="bgimgpromotion promotion_nav_bg"><span baseImg="bgimgtournament" tag="tour_lead" class="bgimgtournament tour_lead_up"></span></li>' +
      '               <li class="bgimgpromotion promotion_nav_bg"><span baseImg="bgimgtournament" tag="tour_prize" class="bgimgtournament tour_prize_up"></span></li>' +
      '               <li class="bgimgpromotion promotion_nav_bg"><span baseImg="bgimgpromotion" tag="promotion_info" class="bgimgpromotion promotion_info_up"></span></li>' +
      '           </ul>' +
      '       </div>' +
      '       <div class="cont_nav2">' +
      '           <ul></ul>' +
      '           <div class="btn_home"><span baseImg="bgimgpromotion" tag="promotion_home" class="bgimgpromotion promotion_home_up"></span></div>' +
      '       </div>' +
      '      </div>' +
      '    </div>'

    return $(html)
  },



  /**
  * @param {FreeSpinPromotionData} promotionData 
  * @param {PromotionState} state 
  */
  createMainForFreeSpin: function (promotionData, state) {
    var data = promotionData.data
    var typeStr = Locale.getString("TXT_PROMOTION_STATUS_TYPE").split("%n%")[promotionUtils.state2RequestStatus[state] - 1]
    var html =
      ' <div class="box_list_info component_freespin">' +
      '   <div class="box_left">' +
      '     <div class="row1">' +
      '       <i><span class="bgimgfreespin fr_normal"></span></i>' +
      '       <div>' +
      '         <p>' + Locale.getString("TXT_TITLE_FREESPIN") + '</p>' +
      '         <p>' + mm.formatStr(Locale.getString("TXT_FREESPIN_WIN_DES"), 1000000) + '</p>' +
      '       </div>' +
      '     </div>' +
      '     <div class="row2">' +
      '       <div class="box_times">' +
      '         <span>00:00:00</span>' +
      '         <p><b></b></p>' +
      '         <span>' + typeStr + '</span>' +
      '       </div>' +
      '       <div class="redeem-box">' +
      '         <div class="btn redeem">' +
      '           <div class="bgimgfreespin redeem_enable">' +
      '             <p>' + Locale.getString('TXT_FREESPIN_READY_REDEEM') + '</p>' +
      '           </div>' +
      '         </div>' +
      '         <div class="btn fully-redeem">' +
      '           <div class="bgimgfreespin redeem_disable">' +
      '             <p>' + Locale.getString('TXT_FREESPIN_FULLY_REDEEM') + '</p>' +
      '           </div>' +
      '         </div>' +
      '       </div>' +
      '     </div>' +
      '   </div>' +
      '   <div class="box_right">' +
      '     <span class="bgimgfreespin freespin_promotion"></span>' +
      '   </div>' +
      ' </div>'
      ;


    var $el = $(html);
    if (state === PromotionStates.Live) {
      if (data.freeSpin) $el.find('.redeem').show();
      if (!data.freeSpin && data.rt) $el.find('.fully-redeem').show()
    }

    return $el;
  },

  /**
  * @param {FreeSpinPromotionData} promotionData 
  */
  createDetailForFreespin: function (promotionData) {
    var data = promotionData.data;
    var beginDate = data.beginDate;
    var endDate = data.endDate;

    var html =
      '<div class="free-detail">' +
      '<div class="title">' +
      '<span class="bgimgfreespin fr_normal"></span>' +
      '<p><span>' + Locale.getString('TXT_TITLE_FREESPIN') + '</span></p>' +
      '<div class="btn-close">' +
      '<span class="icon-close bgimgStyle"></span>' +
      '</div>' +
      '</div>' +

          '<div class="content">' +
            '<div class="tab1">' +
              '<p>this is page1</p>' +
            '</div>' +
            '<div class="tab2">' +
              '<h3><span class="bgimgfreespin fr_normal"></span><i>Free Spin: Loyal</i></h3>' +
              '<div class="daily_table">'+
                '<div class="tr">'+
                  '<div class="td"><p>'+Locale.getString("TXT_TOURNAMENT_STARTTIME")+'</p><p>'+Locale.getString("TXT_TOURNAMENT_ENDTIME")+'</p></div>'+
                  '<div class="td"><p>'+beginDate+'</p><p>'+endDate+'</p></div>'+
                '</div>'+
              '</div>'+
              '<div class="daily_text">' +
                '<h4>' + Locale.getString('TXT_RULES') + '</h4>' +
                '<p>' + Locale.getString("TXT_RULE_FREESPIN") + '</p>' +
              '</div>' +
              '<div class="daily_text">' +
                '<h4>' + Locale.getString('TXT_TERMS') + '</h4>' +
                '<p>' + Locale.getString("TXT_TERMS_FREESPIN") +'</p>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="footer">' +
            '<div class="cont_nav1">' +
              '<ul>' +
                '<li class="bgimgpromotion promotion_nav_bg"><span tag="tour_lead" class="bgimgfreespin fr_up"></span></li>'+
                '<li class="bgimgpromotion promotion_nav_bg"><span tag="tour_info" class="bgimgpromotion promotion_info_up"></span></li>'+
              '</ul>' +
            '</div>' +
            '<div class="cont_nav2">' +
              '<div class="name"><span>Free Spin Legend</span></div>' +
              '<div class="btn_home">' + 
                '<span tag="promotion_home" class="bgimgpromotion promotion_home_up"></span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

    var $el = $(html);
    return $el;
  },

  /**
   * @param {string[]} gameCodes 
   * @param {(html: string) => void} callback 
   * @returns 
   */
  createAllGameList: function (gameCodes, callback) {
    promotionUtils.getTournamentAllGames(function (allGames) {
      var gamesHTML = ''

      gameCodes.forEach(function (code) {
        gamesHTML += '<li>' +
          '<div class="i_top">' +
          '  <img src="' + promotionUtils.getImgUrl(code) + '"/>' +
          '</div>' +
          '<div class="i_info">' +
          '  <h3>' + allGames[code] + '</h3>' +
          '</div>' +
          '</li>'
      })

      var html =
        '    <div class="game_list_wrapper">' +
        '      <div class="btn-close"><span baseImg="bgimgpromotion " tag="promotion_close" class="bgimgpromotion promotion_close_up"></span></div>' +
        '      <div class="g_tit" key="TXT_TOURNAMENT_GAME_LIST"></div>' +
        '      <div class="g_list">' +
        '        <div class="scroll-container">' +
        '          <div class="main-scroll">' +
        '            <ul>' + gamesHTML + '</ul>' +
        '          </div>' +
        '        </div>' +
        '      </div>' +
        '    </div>'


      callback(html)
    })
  }
}

