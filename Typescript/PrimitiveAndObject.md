# Primitive and Object 原始类型和对象类型

在 TypeScript 中，对 JavaScript 中每个内置的原始类型都有对应的类型注解：

```ts
const name: string = 'xie'
const age: number = 18
const male: boolean = true
const undef: undefined = undefined
const nul: null = null
const obj: object = {}
const bigintVal: bigint = 100n
const symbolVal: symbol = Symbol()
```

## null 和 undefined

在 JavaScript 中，null 表示”这里有值但是一个空值“，undefined 表示”这里没有值“。

在 TypeScript 中，null 和 undefined 都是一个具体意义的类型，如同 string、number 一样，在没有开启 `strictNullChecks` 时，他们是其它类型的子类型，比如下面这个例子：

```ts
let str: string = null
let str2: string = undefined
```

但如果开启了 `strictNullChecks` 时，上面的操作会报错：

```ts
// Type 'null' is not assignable to type 'string'.
let str: string = null
// Type 'undefined' is not assignable to type 'string'.
let str2: string = undefined
```

## void

```ts
function func1() {}
function func2() {
  return;
}
function func3() {
  return undefined;
}
```

上面的代码中，func1 和 func2 的返回值会被推断为 void 类型，func3 中显式的返回了 undefined，因此返回值是 undefined  类型，但在 func3 中，也可以手动标注为 void 类型，如：

```ts
function func3(): void {
  return undefined;
}
```

TODO

## 数组类型的标注

在 TypeScript 中，有两种数组标注的方式，是等价的：

```ts
const arr1: number[] = []
const arr2: Array<number> = []
```

在一些情况中，使用元组（Tuple）来代替数组更加更加合适一些，比如只想在数组中存固定个数的元素：

```ts
const arr3: number[] = [1, 2]
console.log(arr3[1000])

const arr4: [number, number] = [1, 2]
// 这里 TypeScript 就可以判断出元组只有 2 位元素，越界访问后给出报错信息
// Tuple type '[number, number]' of length '2' has no element at index '1000'.
console.log(arr4[1000])
```

对于元组类型，在 TypeScript4.0 后，有了具名元祖的支持，可以对元祖内的元素起名字：

```ts
const arr5: [name: string, age: number] = ['xie', 18]
```

## 对象的类型标注

在 TypeScript 中，通过 interface 来声明一个对象的结构：

```ts
interface Student {
    name: string
    age: number
}
```

通过这个结构来给对象的类型进行标注：

```ts
const obj1: Student = {
    name: 'xie',
    age: 18
}
```

其中，对象的每一个属性值都需要对应到声明的接口结构中，既不能有多的属性也不能少属性

除了声明属性及属性的类型外，还可以对属性进行修饰，常见的属性修饰有可选（Optional）与只读（Readonly）两种

