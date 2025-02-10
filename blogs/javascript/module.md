---
title: 前端模块化
date: 2019-4-16
tags:
 - JavaScript
categories:
 - 前端
---

# 前端模块化

> 参考[这篇文章](<https://juejin.im/post/5aaa37c8f265da23945f365c>)

## **CommonJS**

Node.js是CommonJS规范的主要实践者，它有四个重要的环境变量为模块化的实现提供支持：`module`、`exports`、`require`、`global`。实际使用时，用`module.exports`定义当前模块对外输出的接口（不推荐直接用`exports`），用`require`加载模块。

```js
// 定义模块math.js
var basicNum = 0;
function add(a, b) {
    return a + b;
}
module.exports = {  // 在这里写上需要向外暴露的函数、变量
    add: add,
    basicNum: basicNum
}

// 引用自定义的模块时，参数包含路径，可省略.js
var math = require('./math');
math.add(2, 5);

// 引用核心模块时，不需要带路径
var http = require('http');
http.createService(...).listen(3000);
```

**CommonJS用同步的方式加载模块**。在服务器端，模块文件都存在本地磁盘，读取非常快，所以这样做不会有问题。但是在浏览器端，限于网络原因，更合理的方案是使用异步加载。

## **AMD和require.js**

AMD规范采用异步方式加载模块，模块的加载不影响它后面语句的运行。所有依赖这个模块的语句，都定义在一个回调函数中，等到加载完成之后，这个回调函数才会运行。

## **CMD和sea.js**

require.js在申明依赖的模块时会在第一时间加载并执行模块内的代码。

CMD是另一种js模块化方案，它与AMD很类似，不同点在于：**AMD推崇依赖前置、提前执行，CMD推崇依赖就近、延迟执行**。

## **ES6 Module**

ES6在语言标准的层面上，实现了模块功能，而且实现的相当简单，旨在成为浏览器和服务器通用的模块解决方案。其模块功能主要由两个命令构成：`export`和`import`。`export`命令用于规定模块的对外接口，`import`命令用于输入其他模块提供的功能。

```js
// 定义Math.js
var basicNum = 0;
var add = function(a, b) {
    return a+b;
};
export { basicNum, add };

// 引用模块
import { basicNum, add } from './math';
function test(ele) {
    ele.textContent = add(99 + basicNum);
}
```

如上例所示，使用`import`命令的时候，用户需要知道所加载的变量名或函数名。其实ES6还提供了`export default`命令，为模块指定默认输出，对应的`import`语句不需要使用大括号。

ES6模块不是对象，`import`命令会被JS引擎静态分析，在编译时就引入模块代码，而不是在代码运行时加载，所以无法实现条件加载。也正因为这个，使得静态分析成为可能。

## ES6模块与CommonJS模块的差异

1. **CommonJS模块输出的是一个值的拷贝，ES6模块输出的是值的引用。**

2. **CommonJS模块是运行时加载，ES6模块是编译时输出接口。**

   - 运行时加载：CommonJS模块就是对象；即在输入时事先加载整个模块，生成一个对象，然后再从这个对象上面读取方法，这种加载成为`运行时加载`。

   - 编译时加载：ES6模块不是对象，而是通过`export`命令显式指定输出的代码，`import`时采用静态命令的形式。即在`import`时可以指定加载某个输出值，而不是加载整个模块，这种加载称为`编译时加载`。

