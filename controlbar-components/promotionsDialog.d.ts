export type MaybeNull<T> = T | null
export type LifeCycle = 'mounted' | 'beforeUnmount' | 'activated'| 'deactivated' | 'update'
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
  serverTime: string
  forfeitDate: string
  name: string
}

export interface LuckywheelData {
  languages: string[]
  serverTime: string
  info: {
    tranId: number
    beginTime: string
    endTime: string
  }
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
    name: 'luckywheel',
    data: LuckywheelData
  }
)
