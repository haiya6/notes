# TypeScript 笔记

## 装箱类型 Object/String/Number/Boolean/Symbol

在 TS 中，Object 包含了所有的类型：

```ts
const v1: Object = 1
const v2: Object = 'XIE'
const v3: Object = false
const v4: Object = Symbol()
const v5: Object = {}
const v6: Object = []
const v7: Object = () => {}

// 在 strictNullChecks 关闭时
const v8: Object = null
const v9: Object = undefined
```

其它的装箱类型包含对应的拆箱类型（不包括其它装箱类型对应的拆箱类型），如 String：

```ts
const v10: String = 'xie'

// 在 strictNullChecks 关闭时
const v11: String = null
const v12: String = undefined

// Error: Type 'boolean' is not assignable to type 'String'.
const v13: String = false
```

**在任何情况下，都不应该使用这些装箱类型**

## object

object 表示所有的非原始类型的类型，即数组、对象、函数类型这些：

```ts
const v14: object = {}
const v15: object = []
const v16: object = () => {}

// 在 strictNullChecks 关闭时
const v17: object = null
const v18: object = undefined

// Error: Type 'number' is not assignable to type 'object'.
const v19: object = 1
```

## {}

{} 也可表示为任意类型，与 Object 类似，但 {} 类型的变量就像一张白纸，没有任何属性，不能进行任意的赋值和取值操作：

```ts
const v20: {} = { name: 'xie' }
// Error: Property 'name' does not exist on type '{}'.
v20.name
// Error: Property 'name' does not exist on type '{}'.
v20.name = 'y'
```

与 Object 有一点区别的是，Object 类型的变量可以访问 Object 原型上的一些方法：

```ts
const v21: Object = { name: 'xie' }
// Error: Property 'name' does not exist on type '{}'.
v21.name
// Error: Property 'name' does not exist on type '{}'.
v21.name = 'y'

// ok
v21.toString
v21.valueOf
```

## unique symbol

在 TS 中表示一个 Symbol 值类型可以使用 symbol：

```ts
let v22: symbol = Symbol('a')
v22 = Symbol('b')
```

但这样无法表示这个类型是独一无二的，就像代码中 v22 还可以重新赋值为一个新的 Symbol 值。
为实现这个特性，可以使用 unique symbol：

```ts
const v23: unique symbol = Symbol()
// Error: Type 'typeof v23' is not assignable to type 'typeof v24'.
const v24: unique symbol = v23

// ok
const v25: typeof v23 = v23
```

## 类型断言守卫 assert

TS 3.7 中，引入了 assert 关键字来进行断言场景下的守卫：

```ts
let name: any = 'xie'

function assertIsNumber(val: any): asserts val is number {
  if (typeof val !== 'number') throw new Error('Not a number!')
}

assertIsNumber(name)

// 若通过了断言后，这里 name 就会推断为 number 类型！
name.toFixed()
```

## object、Object、{} 的类型兼容

以下操作都成立：

```ts
type v26 = {} extends object ? 1 : 2
type v27 = object extends {} ? 1 : 2

type v28 = object extends Object ? 1 : 2
type v29 = Object extends object ? 1 : 2

type v30 = Object extends {} ? 1 : 2
type v31 = {} extends Object ? 1 : 2
```

在 26-27 和 30-31 中，`{} extends ...` 和 `... extends {}` 是两种完全不同的比较方式：

+ `{} extends object`、`{} extends Object` 是从**类型信息**来比较，因 `{}` 是 `object`、`Object` 的字面量类型成立
+ `object extends {}`、`Object extends {}` 是从**结构化类型系统**来比较，`object`、`Object` 都是扩展了 `{}` “空对象”，所以成立

（TODO: 下面的定义需要更明确，章节 11）

在 28-29中，因为“系统设定”的原因，Object 包含了除 Top Level 之外的类型（基础类型、对象、函数等），object 包含了所有非原始类型的类型（数组、对象、函数类型），导致了“你中有我，我中有你”

## unknown 和 any 的类型兼容

以下操作都成立：

```ts
type v32 = any extends unknown ? 1 : 2
type v33 = unknown extends any ? 1 : 2
```

记住。

TODO: 12