# TypeScript の Narrowing

TypeScript 的类型检查器会考虑到这些类型保护和赋值语句，而这个**将类型推导为更精确类型的过程，我们称之为收窄(narrowing)**。

```typescript
// Case1
function padLeft(padding: number | string, input: string) {
  if (typeof padding === 'number') {
    return new Array(padding + 1).join(' ') + input;
  }
  return padding + input;
}
```

## typeof 类型保护 (type guards)

## 真值收窄 (Truthiness narrowing)

## 等值收窄 (Equality narrowing)

## in 操作符收窄

## instanceof 收窄

## 赋值语句

## 控制流分析 (Control flow analysis)

在 Case1 中，第一个 if 语句，因为有 return 语句，TypeScript 就能通过代码分析，判断出在剩余的部分 `return padding + input`，如果 padding 是 number 类型，是无法达到 (unreachable) 这里的，所以在剩余的部分，就会将 number 类型从 number | string 类型中删除掉。

这种基于**可达性(reachability)**的代码分析就叫做控制流分析(Control flow analysis)。在遇到类型保护和赋值语句的时候，TypeScript 就是使用这样的方式收窄类型。而使用这种方式，一个变量可以被观察到变为不同的类型：

![](https://camo.githubusercontent.com/20af38f788785d0d679c41fb5a30716dab8b06f73c4a85b2c6a00bd2050a3108/68747470733a2f2f63646e2e6a7364656c6976722e6e65742f67682f6d717971696e6766656e672f706963747572652f2545362538452541372545352538382542362545362542352538312545352538382538362545362539452539302e706e67)

## 类型判断式 (type predicates)

如果你想直接通过代码控制类型的改变，你可以自定义一个类型保护。实现方式是定义一个函数，这个函数返回的类型是类型判断式：

```typescript
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}
```

在上面这个例子中，`pet is fish` 就是我们的类型判断式，一个类型判断式采用 `parameterName is Type` 的形式，但 `parameterName` 必须是当前函数的参数名。

当 isFish 被传入变量进行调用，TypeScript 就可以将这个变量收窄到更具体的类型：

```typescript
let pet = getSmallPet();

if (isFish(pet)) {
  pet.swim();
} else {
  pet.fly();
}
```
