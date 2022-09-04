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

## object、Object、{} 的类型兼容（之间的 extends 条件判断）

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

## any、unknown、never 的类型兼容（之间的 extends 条件判断）

```ts
// '1'
type v32 = any extends any ? '1' : '2'
// '1'
type v33 = any extends unknown ? '1' : '2'
// '1' | '2'
type v34 = any extends never ? '1' : '2'
// 这里只拿 string 来表示其它的基本类型（除 any、unknown、never 的如 number 等），下同
// '1' | '2'
type v35 = any extends string ? '1' : '2'

// '1'
type v36 = unknown extends any ? '1' : '2'
// '1'
type v37 = unknown extends unknown ? '1' : '2'
// '2'
type v38 = unknown extends never ? '1' : '2'
// '2'
type v39 = unknown extends string ? '1' : '2'

// '1'
type v40 = never extends any ? '1' : '2'
// '1'
type v41 = never extends unknown ? '1' : '2'
// '1'
type v42 = never extends never ? '1' : '2'
// '1'
type v43 = never extends string ? '1' : '2'
type v44<T> = T extends string ? '1' : '2'
// never
type v45 = v44<never>
```

可以得出一些结论：

+ 当 any 作为条件判断参数（extends 左边）的时候，判断条件（extens 右边）是：
  - any、unknown 时，会返回真结果
  - 否则，会返回真假结果的联合类型。拿判断条件为 string 举例，any 可以理解为即有存在满足是 string 子类型的情况（如字符串字面量类型），也存在不满足是 string 子类型的情况
+ 当 unknown 作为条件判断参数时候，判断条件时：
  - any、unknown 时，会返回真结果
  - 否则，返回假结果
+ 当 never 作为条件判断参数时，都会返回真结果（never 是 TS 中的最底层类型）
  - 特殊点：在 v45 中，通过泛型传递 never 类型并作为**裸类型**进行条件判断时，会直接返回 never

## 分布式条件类型

当联合类型**通过泛型**传入并进行条件判断时，会将联合类型中的每一个类型都单独拿出来进行条件判断的特性：

```ts
type v46<T> = T extends boolean ? '1' : '2'
// "1" | "2"
type v47 = v46<'xie' | false>
```

上面代码中，当联合类型 `'xie' | false` **通过泛型**传递给 v44 进行条件判断（extends）时，会将 `'xie'` 和 `false` 这两个类型单独进行判断，并返回他们结果的联合类型

可以通过不让传入的类型通过“裸类型”判断来禁用这一特性，比如可以通过数组包着：

```ts
type v48<T> = [T] extends [boolean] ? '1' : '2'
// '2'
type v49 = v48<'xie' | false>
```

此时，就是严格判断传入的联合类型 `'xie' | false` 是否为 `boolean` 的子类型，显然不是

还有另外一种方式可以达到同样的效果：

```ts
type v50<T> = (T & {}) extends [boolean] ? '1' : '2'
// '2'
type v51 = v50<'xie' | false>
```

## infer 约束

在 TS 4.7 引入了对 infer 支持约束的功能：

```ts
type v52<T> = T extends () => (infer P extends string) ? P : never
type v53 = v52<() => string>
```
