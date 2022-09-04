type MaybeNull<T> = T | null
type MaybeArray<T> = T | T[]

// 通过 [T] 包括可以禁用分布式类型的特性
type isNever<T> = [T] extends [never] ? true : false
// 利用 any 啥子都是的特性
type isAny<T> = 0 extends (1 & T) ? true : false
// 利用只有 unknown extends any 和 unknown extends unknown 的特性
type isUnknown<T> = unknown extends T 
    ? isAny<T> extends true
        ? false
        : true
    : false