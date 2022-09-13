export type MaybeNull<T> = T | null
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
export type PromotionName = 'freespinpromotion' | 'redpacket' | 'luckywheel' | 'redpacketnew' | 'tournament'
export type PromotionConfig = {
  [p in PromotionName]: {
    classBaseName: string
    maxWidth: number
  }
}
export type PromotionInstance = {
  [p in LifeCycle]: (() => void)[]
} & {
  $el: JQuery<HTMLElement>
  promotionName: PromotionName
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

export interface LuckywheelData {
  languages: string[]
  serverTime: string
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

export type Promotion = {
  tranId: number
  instance?: PromotionInstance
} & (
  {
    name: 'freespinpromotion',
    data: FreespinpromotionData
  }
  | {
    name: 'redpacket',
    data: RedpacketData
  }
  | {
    name: 'redpacketnew'
    data: RedpacketNewData
  }
  | {
    name: 'luckywheel',
    data: LuckywheelData
  }
  | {
    name: 'tournament',
    data: TournamentData
  }
)