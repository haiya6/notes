export type MaybeNull<T> = T | null

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}

type LifeCycleHook = () => void

export type LifeCycle = 
  // 已挂载 DOM
  'mounted'
  // 将要卸载 DOM 
  | 'beforeUnmount' 
  // 从隐藏到显示（发生在切换的时候）
  | 'activated' 
  // 从显示到隐藏（发生在切换的时候）
  | 'deactivated' 
  // 数据更新（后台推送了与当前同 tranId 的数据）
  | 'update'

export type PromotionConfig = {
  [p in PromotionName]: {
    classBaseName: string
    maxWidth: number
  }
}

export type PromotionInstance = {
  [p in LifeCycle]: LifeCycleHook[]
} & {
  $el: MaybeNull<JQuery<HTMLElement>>
  disabled?: boolean
  promotion: Promotion
}

export interface FreespinpromotionData {
  tranId: number
  beginDate: string
  endDate: string
  serverTime: string
  forfeitDate: string
  name: string
  // totalUnit
  tu: number
  turnover: number
  freeSpin: {
    spinCount: number
  }
  promotionCode: string
}

export interface RedpacketData {
  tranId: number
  serverTime: string
  resultedTime: string
  accumulateTime: string
  bufferTime: string
  turnover: number
  // totalUnit
  tu: number
  // totalReward
  tr: number
  // limitMaxAmount
  lma: number
  // -18 推送
  access?: boolean
}

export interface RedpacketNewData {
  packetAcctInfo: {
    level: number
    turnover: number
  }
  packetInfo: {
    tranId: number
    resultedTime: string
    accumulateTime: string
    bufferTime: string
    turnovers: number[]
    controlLevel: boolean
    // totalUnit
    tu: number
    // totalReward
    tr: number
    // limitMaxAmount
    lma: number
  }
  serverTime: string
}

export interface RedpacketNewLevelData {
  tranId: number
  packetAcctInfo: {
    canReceive: {
      level: number
    }[]
  }
}

export interface LuckywheelData {
  languages: string[]
  serverTime: string
  spinRemain: number
  info: {
    tranId: number
    beginTime: string
    endTime: string
    prizes: number[]
    turnover: number
  },
  // totalUnit
  tu: number
  // totalReward
  tr: number
}

export interface TournamentData {
  beginDate: number
  bufferZone: number
  countdown: number
  // cash prize
  cp: number
  endDate: number
  mb: number
  rt: number
  serverTime: string
  // top prize
  tpp: number
  tranId: number
  // total prize
  ttlp: number
  tournamentCurrencyIntegrals: Array<{
    currId: number
    minBet: number
    rate: number
  }>
}

export interface CloseData {
  tranId: number
}

export type PromotionDataMap = {
  'freespinpromotion': Pick<FreespinpromotionData, 'tranId'> & { list: Array<FreespinpromotionData> }
  'redpacket': RedpacketData
  'redpacketnew': RedpacketNewData & DeepPartial<RedpacketNewLevelData>
  'luckywheel': LuckywheelData
  'tournament': TournamentData
}

export type PromotionName = keyof PromotionDataMap

export type PromotionDataStruct<T extends PromotionName> = {
  name: T
  data: PromotionDataMap[T]
  dataUpdater?: (((oldData: PromotionDataMap[T]) => void | PromotionDataMap[T]))[]
}

export type Promotion = {
  tranId: number
  textInstance?: PromotionInstance
} & (
  PromotionDataStruct<'freespinpromotion'>
  | PromotionDataStruct<'redpacket'>
  | PromotionDataStruct<'redpacketnew'>
  | PromotionDataStruct<'luckywheel'>
  | PromotionDataStruct<'tournament'>
)
