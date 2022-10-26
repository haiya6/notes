declare type PromotionName = 'freespin' | 'tournament';

declare type PromotionState = 'registering' | 'live' | 'ended'

declare interface Promotion {
  $receiveTimestamp: number
  name: PromotionName
  tranId: number
  data: {}
}

declare interface FreeSpinPromotion extends Promotion {
  name: 'freespin'
  data: {
    tranId: number
    beginDate: string
    cd: string
    endDate: string
    forfeitDate: string
    languages: string[]
    promotionCode: string
    promotionGroup: string
    rt: boolean
    serverTime: string
    tr: number
    tu: number
    turnover: number,
    freeSpin: {
      acctId: string;
      gameCode: string;
      gameName: string;
      roundId: number;
      sourceType: number;
      spinCount: number;
      totalBetAmt: number;
    }
  }
}

declare interface TournamentPromotion extends Promotion {
  name: 'tournament',
  data: {
    tranId: number
    name: string
    languages: string[]
    beginDate: string
    bufferZone: string
    cashPoint: number
    countDownDate: string
    endDate: string
    minBet: number
    serverTime: string
    timeZone: string
    topPrize: number
    totalPrize: number
    tournamentInfos: Array<{
      tournamentCode: string
      beginDate: string
      closeDate: string
      countDownDate: string
      endDate: string
      tranId: number
    }>
  }
}

declare interface PromotionData {
  __d: true
  name: PromotionName
  tranId: number
  data: {}
}

// 列表请求的 FreeSpin 数据
declare interface FreeSpinPromotionData extends PromotionData {
  name: 'freespin'
  data: {
    beginDate: string
    cd: string
    endDate: string
    forfeitDate: string
    name: string
    promotionCode: string
    promotionGroup: number
    rt: boolean
    serverTime: string
    tranId: number
    turnover: number,
    freeSpin: {
      acctId: string;
      gameCode: string;
      gameName: string;
      roundId: number;
      sourceType: number;
      spinCount: number;
      totalBetAmt: number;
    }
  }
}

// 列表请求的 Tournament 数据
declare interface TournamentPromotionData extends PromotionData {
  name: 'tournament',
  data: {
    mainInfo: {
      beginDate: string
      closeDate: string
      codes: string[]
      countDownDate: string
      endDate: string
      name: string
      tranId: number
    },
    subInfo: {
      amount: number
      code: string
      fullPoint: number
      gameList: string[]
      joined: boolean
      minPoint: number
      name: string
      noOfPlayer: number
      online: number
      rank: number
      rankCount: number
      tournamentCurrencyIntegrals: Array<{
        currId: number
        rate: number
      }>,
      tr: {
        list: Array<{
          amount: number
          li: string
          rank: string
        }>
      }
    }
  }
}

// 详情请求的 Tournament 数据
declare interface TournamentPromotionDetailData {
  mainInfo: TournamentPromotionData['data']['mainInfo']
  list: Array<{
    amount: number
    code: string
    firstPrize: number
    gameList: string[]
    joined: boolean
    minBet: number
    minPoint: number
    name: string
    noOfPlayer: number
    online: number
    rank: number
    rankCount: number
    tournamentBonusInfo: Array<{
      bonusAmt: number
      name: string
    }>
    tournamentCurrencyIntegrals: Array<{
      currId: string
      minBet: number
      rate: number
    }>,
    tournamentRank: {
      list: Array<{
        acctId: string
        amount: number
        rank: string
      }>
    }
  }>
}

// 列表接口响应结构
declare interface GameListRequestResult {
  code: number
  map: {
    // freespin
    'B-FS00'?: {
      code: number
      list: FreeSpinPromotionData['data'][]
    },
    // Tournament
    'B-TD01'?: {
      code: number
      list: TournamentPromotionData['data'][]
      maxRankCount: number
      timeZone: string
    }
  }
}

// Tournament 详情接口响应结构
declare interface TournamentDetailRequestResult {
  code: number
  detailInfo: TournamentPromotionDetailData
  maxRankCount: number
}

declare type TournamentMainComponentData = Pick<Required<GameListRequestResult['map']>['B-TD01'], 'maxRankCount' | 'timeZone'> & { promotionData: TournamentPromotionData }

declare type FreeSpinMainComponentData = { promotionData: FreeSpinPromotionData }

declare interface PromotionComponentOptions {
  setup?: () => void | (() => void)
  // 返回组件的 jquery 元素
  initialRender: () => JQuery<HTMLElement>
  // DOM 挂载后调用
  onMounted?: () => void
  // promotion 数据发生变化了调用
  onUpdated?: () => void
  // 组件被激活（从不显示到显示）
  onActivated?: () => void
  // 组件不活跃（从显示到不显示）
  onDeactivated?: () => void
  // 在 DOM 卸载之前
  onBeforeUnmount?: () => void
  // 给了此钩子之后，会在卸载前触发此钩子并传递一个卸载函数，在调用此函数后，依然会走 onBeforeUnmount 回调，然后真正的 DOM 移除
  onDelayUnmount?: (doUnmount: () => void) => void
  // 组件将被移除时执行，在 promotion 数据被移除，如后台的关闭推送，
  onBeforeRemove?: () => void
}

declare interface PromotionComponentInstanceProperties {
  // 当前组件的根 jquery 元素，这是个外部使用的属性，对组件内部是只读或忽略的（也就是 render 返回的）
  $$el?: JQuery<HTMLElement>
  // 挂载自身（会走生命周期）
  mount: () => void
  // 卸载自身（会走生命周期）
  unmount: () => void
}

declare type PromotionComponent = PromotionComponentOptions & PromotionComponentInstanceProperties

declare type DefineComponentFunction = <T extends PromotionComponentOptions>(
  options: T & ThisType<PromotionComponentInstanceProperties & T>
) => PromotionComponent & T

declare interface PromotionAPI {
  emitter: Emitter
  defineBannerComponent: DefineComponentFunction
  defineTipComponent: DefineComponentFunction
  defineMainComponent: DefineComponentFunction
  // 关闭 banner 模块
  closeBanner: () => void
  // 展示分类模块
  openCategory: () => void
  // 分类模块的详情模态框
  useCategoryDetailModal: (
    promotionName: PromotionName,
    $content: JQuery<HTMLElement>,
    options?: {
      wrapperClassNames?: string[],
      animation?: boolean
    }
  ) => (options?: { animation?: boolean }) => void
}

declare interface PromotionNS {
  createBannerComponent?: (promotion: Promotion, api: PromotionAPI) => PromotionComponent
  createTipComponent?: (promotion: Promotion, api: PromotionAPI) => PromotionComponent
  createMainComponent?: (data: unknown, api: PromotionAPI) => PromotionComponent
}
