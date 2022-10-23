// @ts-check

var promotionTemplate = {
  /**
   * @param {Promotion} promotion
   * @returns {JQuery<HTMLElement>}
   */
  createBannerItemElement: function (promotion) {
    var title = 'TODO'

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
      // '                 <p><span>' + Locale.getString("TXT_PROMOTION_TOTAL_PRIZE") + ':</span><span>' + spade.content.currency + ' ' + mm.formatAmount(data.totalPrize, "") + '</span></p>' +
      // '                 <p><span>' + Locale.getString("TXT_PROMOTION_TOP_PRIZE") + ':</span><span>' + spade.content.currency + ' ' + mm.formatAmount(data.topPrize, "") + '</span></p>' +
      '             </div>' +
      // '             <div class="single-units">' +
      // '                 <p>' + mm.formatStr(Locale.getString("TXT_PROMOTION_CASH_PRIZE"), data.cashPoint) + '</p>' +
      // (data.minBet > 0 ? '<p>' + mm.formatStr(Locale.getString("TXT_PROMOTION_MINBET"), spade.content.currency + ' ' + mm.formatAmount(data.minBet, "")) + '</p>' : '') +
      // '             </div>' +
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
    var html =
      '<div class="tips-single">' +
      '   <div class="tips-title">' + promotion.data.name + '</div>' +
      '   <div class="tips-text"><p>' + mm.formatStr(Locale.getString("TXT_PROMOTION_CURRENT_BET"), spade.content.currency + ' ' + mm.formatAmount(promotion.data.minBet, "")) + '</p></div>' +
      '   <div class="tips_times">' +
      '       <span></span>' +
      '       <p><b></b></p>' +
      '       <span>' + Locale.getString("TXT_TOURNAMENT_TYPE").split("%n%")[1] + '</span>' +
      '   </div>' +
      '</div>'
    return $(html)
  }
}
