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

// 并集
type Concurrence<A, B> = A | B;
// 交集
type Intersection<A, B> = A extends B ? A : never;
// 差集
type Difference<A, B> = A extends B ? never : A;
// 补集
type Complement<A, B extends A> = Difference<A, B>;
