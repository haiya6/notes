declare type PromotionName = 'common' | 'freespinpromotion' | 'tournament';

declare type PromotionState = 'registering' | 'live' | 'ended'

declare interface Promotion {
  $receiveTimestamp: number
  name: PromotionName
  tranId: number
  data: {}
}

declare interface FreeSpinPromotion extends Promotion {
  name: 'freespinpromotion'
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
    turnover: number
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

declare interface PromotionComponent {
  // 当前组件的根 jquery 元素，这是个外部使用的属性，对组件内部是只读或忽略的（也就是 render 返回的）
  $$el?: JQuery<HTMLElement>
  // 是否应该挂载此组件，根据组件自身逻辑判断，有的不满足情况不需要挂载（或触发卸载）返回 false 即可
  // 不给此钩子等于总是返回 true
  shouldMount?: () => boolean
  // 返回组件的 jquery 元素
  render: () => JQuery<HTMLElement>
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
}

declare interface PromotionInstance {
  setup: () => void
  promotion: Promotion
  state: PromotionState
  bannerComponent?: PromotionComponent
  tipComponent?: PromotionComponent
  contentComponent?: PromotionComponent
}

declare interface PromotionSource {
  promotion: Promotion
  instance: PromotionInstance
}
