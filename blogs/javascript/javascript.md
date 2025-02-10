---
title: JavaScript 第一章
date: 2020-6-16
tags:
 - JavaScript
categories:
 - 前端
---

# JavaScript 第一章

## 显式原型与隐式原型

  先贴篇[文章](https://zhuanlan.zhihu.com/p/23253365)。

  **显式原型**：每一个函数在创建之后都会拥有一个名为 prototype 的属性，这个属性指向函数的原型对象。

  > 通过 Function.prototype.bind 方法构造出来的函数是个例外，它没有 prototype 属性

  **隐式原型**：JavaScript 中任意对象都有一个内置属性 `[[prototype]]`，在 ES5 之前没有标准的方法访问这个内置属性，但是大多数浏览器都支持通过 `__proto__` 来访问。ES5 中有了对于这个内置属性标准的 Get 方法 `Object.getPrototypeOf()`。

  > Object.prototype 这个对象是个例外，它的 `__proto__` 值为 null

	**二者的关系**：

  - 隐式原型指向创建这个对象的构造函数（constructor）的显式原型；
  - 构造函数的 `__proto__` 指向构造函数的原型对象，对于函数来说就是 Function.prototype；
  - 构造函数的原型对象也有 `__proto__`，同理它指向构造原型对象的构造函数（即 Function）的原型对象（即 Object.prototype)。

## `instanceof` 内部机制

  假设现在有 `L instanceof R`

  ```javascript
  function instance_of(L, R) {  // L表示左表达式，R表示右表达式
      var O = R.prototype,  // 取R的显式原型
          L = L.__proto__;  // 取L的隐式原型
      while (true) {
      	if (L === null)
              return false;
          if (O === L)  // 这里重点：当O严格等于L时，返回true
              return true;
          L = L.__proto__;
      }
  }
  ```

## 理解下面这张图

  ![](https://user-gold-cdn.xitu.io/2018/12/18/167c0772297e4ff8?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

## 你真的了解`instanceOf`操作符吗？

  有了上面`instanceof`运算符的JS代码和原型继承图，再来理解`instanceof`运算符易如反掌。先来看几个`instanceof`复杂用法：

  ```js
  console.log(Object   instanceof Object);  // true
  console.log(Function instanceof Function);// true
  console.log(Number   instanceof Number);  // false
  console.log(String   instanceof String);  // false

  console.log(Function instanceof Object);  // true

  console.log(Foo      instanceof Function);// true
  console.log(Foo      instanceof Foo);     // false
  ```

  - `Object instanceof Object`

    ```js
    // 为了表述清楚，首先区分左侧表达式和右侧表达式
    ObjectL = Object, ObjectR = Object;
    // 下面根据规范逐步推演
    O = Object.prototype = Object.prototype;
    L = Object.__proto__ = Function.prototype;  // 注意这一步
    // 第一次判断
    O != L;
    // 循环查找L是否还有__proto__
    L = Function.prototype.__proto__ = Object.prototype;
    // 第二次判断
    O == L;
    // 返回true
    ```

  - `Function instanceof Function`

    ```js
    // 为了表述清楚，首先区分左侧表达式和右侧表达式
    FunctionL = Function， FunctionR = Function;
    // 下面根据规范逐步推演
    O = FunctionR.prototype = Function.prototype;
    L = FunctionL.__proto__ = Function.prototype;
    // 第一次判断
    O == L;
    // 返回true
    ```

  - `Foo instanceof Foo`

    ```js
    // 为了表述清楚，首先区分左侧表达式和右侧表达式
    FooL = Foo, FooR = Foo;
    // 下面根据规范逐步推演
    O = FooR.prototype = Foo.prototype;
    L = FooL.__proto__ = Function.prototype;
    // 第一次判断
    O != L;
    // 循环查找L是否还有__proto__
    L = Function.prototype.__proto__ = Object.prototype;
    // 第二次判断
    O != L;
    // 再次循环查找L是否还有__proto__
    L = Object.prototype.__proto__ = null;
    // 第三次判断
    L == null
    // 返回false
    ```

## 创建对象的方法汇总

  1. **工厂模式**

     ```javascript
     function createPerson(name) {
         var o = new Object();
         o.name = name;
         o.getName = function() {
             console.log(this.name);
         }
         return o;
     }
     var p1 = createPerson("ghm");
     ```

     缺点：对象无法识别，因为所有实例都指向一个原型。

  2. **构造函数模式**

     ```js
     function Person(name) {
         this.name = name;
         this.getName = function() {
             console.log(this.name);
         };
     }
     var p1 = new Person("ghm");
     ```

     优点：实例可以识别为一个特定的类型

     缺点：每次创建实例时，每个方法都要被创建一次

  3. **原型模式**

     ```js
     function Person(name) {

     }
     Person.prototype.name = "ghm";
     Person.prototype.getName = function() {
         console.log(this.name);
     }
     var p1 = new Person();
     ```

     优点：方法不会被重建

     缺点：所有属性和方法共享；不能初始化参数

  4. **组合模式**

     ```js
     function Person(name) {
         this.name = name;
     }
     Person.prototype = {
         constructor: Person,
         getName: function() {
             console.log(this.name);
         }
     };
     var p1 = new Person();
     ```

     优点：该共享的共享，该私有的私有，使用最广泛的方式

     缺点：有的人就是希望全部都写在一起，即更好的封装性

  5. **动态原型模式**

     ```js
     function Person(name) {
         this.name = name;
         if (typeof this.getName != "function") {
             Person.prototype.getName = function() {
                 console.log(this.name);
             }
         }
     }
     var p1 = new Person("ghm");
     ```

  6. **寄生构造函数模式**

     ```js
     function Person(name) {
         var o = new Object();
         o.name = name;
         o.getName = function() {
             console.log(this.name);
         }
         return o;
     }
     var p1 = new Person("ghm");
     console.log(p1 instanceof Person);  // false
     console.log(p1 instanceof Object);  // true
     ```

     这样方法可以在特殊情况下使用，比如我们想创建一个具有额外方法的特殊数组，但是又不想直接修改Array构造函数。在可以使用其他模式的情况下，不要使用这种模式。

  7. **稳妥构造函数模式**

     ```js
     function person(name) {
         var o = new Object();
         o.sayName = function() {
             console.log(name);
         };
         return o;
     }
     var p1 = person("ghm");
     p1.sayName();  // ghm
     p1.name = "kevin";
     p1.sayName();  // ghm
     console.log(p1.name);  // "kevin"
     ```

     所谓稳妥对象，指的是没有公共属性，而且其方法也不引用this的对象。

     稳妥对象最适合在一些安全的环境中。稳妥构造函数模式也跟工厂模式一样，无法识别对象所属类型。

## 继承的方式

  # 继承的方法汇总

  ## 1、**原型链继承**

  ```javascript

  function Parent() {
    this.name = 'ghm';
  }
  Parent.prototype.getName = function() {
      console.log(this.name);
  }
  function Child() {

  }
  Child.prototype = new Parent();
  var child1 = new Child();
  console.log(child1.getName());  // ghm
  ```
  问题：

  1. 引用类型的属性被所有实例共享
  ```js
  function Parent () {
      this.names = ['kevin', 'daisy'];
  }
  function Child () {

  }
  Child.prototype = new Parent();

  var child1 = new Child();
  child1.names.push('yayu');
  console.log(child1.names); // ["kevin", "daisy", "yayu"]

  var child2 = new Child();
  console.log(child2.names); // ["kevin", "daisy", "yayu"]
  ```
  2. 在创建Child的实例时，不能向Parent传参

  ## 2、 **借用构造函数**

  ```js
  function Parent() {
      this.names = ["kevin", "daisy"];
  }
  function Child() {
      Parent.call(this);
  }

  var child1 = new Child();
  child1.names.push("yayu");
  console.log(child1.names);  // ["kevin", "daisy", "yayu"]

  var child2 = new Child();
  console.log(child2.names);  // ["kevin", "daisy"]
  ```

  优点：

  1. 避免了引用类型的属性被所有实例共享

  2. 可以在Child中向Parent传参

    ```js
    function Parent(name) {
        this.name = name;
    }
    function Child(name) {
        Parent.call(this, name);
    }

    var child1 = new Child('kevin');
    console.log(child1.name);  // kevin

    var child2 = new Child('daisy');
    console.log(child2.name);  // daisy
    ```

  缺点：方法都在构造函数里定义，每次创建实例都会创建一遍方法。

  ## 3、 **组合继承**

  ```js
  function Parent(name) {
      this.name = name;
      this.colors = ['red', 'blue', 'green'];
  }
  Parent.prototype.getName = function() {
      console.log(this.name);
  }

  function Child(name, age) {
    Parent.call(this, name);
      this.age = age;
  }
  Child.prototype = new Parent();
  Child.prototype.constructor = Child;

  var child1 = new Child('kevin', '18');
  child1.colors.push('black');
  console.log(child1.name); // kevin
  console.log(child1.age); // 18
  console.log(child1.colors); // ["red", "blue", "green", "black"]

  var child2 = new Child('daisy', '20');
  console.log(child2.name); // daisy
  console.log(child2.age); // 20
  console.log(child2.colors); // ["red", "blue", "green"]
  ```

  优点：融合原型链继承和构造函数继承的优点，是 JavaScript 中最常用的继承模式。

  ## 4、 **原型式继承**

  ```js
  function createObj(o) {
      function F() {}
      F.prototype = o;
      return new F();
  }
  ```

  缺点：包含引用类型的属性值始终会共享相应的值，这点跟原型链继承一样。

  ```js
  var person = {
      name: 'kevin',
      friends: ['daisy', 'kelly']
  }
  var person1 = createObj(person);
  var person2 = createObj(person);

  person1.name = 'person1';
  console.log(person2.name);  // kevin

  person1.firends.push('taylor');
  console.log(person2.friends);  // ["daisy", "kelly", "taylor"]
  ```

  注意：修改`person1.name`的值，`person2.name`的值并未发生改变，并不是因为`person1`和`person2`有独立的 name 值，而是因为`person1.name = 'person1'`，给`person1`添加了 name 值，并非修改了原型上的 name 值。

  ## 5、 **寄生式继承**

  创建一个仅用于封装继承过程的函数，该函数在内部以某种形式来做增强对象，最后返回对象。

  ```js
  function createObj(o) {
      var clone = Object.create(o);
      clone.sayName = function() {
      console.log('hi');
      }
      return clone;
  }
  ```

  缺点：跟借用构造函数模式一样，每次创建对象都会创建一遍方法。

  ## 6、 **寄生组合式继承**

  **组合继承最大的缺点是会调用两次父构造函数。**

  如果不使用`Child.prototype = new Parent()`，而是间接地让`Child.prototype`和`child1`都有一个属性为`colors`，属性值为`['red', 'blue', 'green']`。

  如何间接的让`Child.prototype`访问到`Parent.prototype`呢？

  ```js
  function Parent (name) {
      this.name = name;
      this.colors = ['red', 'blue', 'green'];
  }
  Parent.prototype.getName = function () {
      console.log(this.name)
  }

  function Child (name, age) {
      Parent.call(this, name);
      this.age = age;
  }

  // 关键的三步
  var F = function() {};
  F.prototype = Parent.prototype;
  Child.prototype = new F();

  var child1 = new Child("kevin", 18);
  ```

  最后封装一下这个继承方法：

  ```js
  function create(o) {
    function F() {}
      F.prototype = o;
      return new F();
  }

  function prototype(child, parent) {
      child.prototype = create(parent.prototype);
      child.prototype.constructor = child;
  }

  // 当使用的时候
  prototype(Child, Parent);
  ```

  引用《JavaScript高级程序设计》中对寄生组合式继承的夸赞就是：

  这种方式的高效率体现在它只调用一次Parent构造函数，并且因此避免了在`Parent.prototype`创建不必要的、多余的属性。与此同时，原型链还能保持不变；因此，还能够正常使用`instanceof`和`isPrototypeOf`。开发人员普遍认为寄生组合式继承是引用类型最理想的继承范式。

## 一道跟原型动态性有关的题

```js
function F() {}
function O() {}

O.prototype = new F();
var obj = new O();

console.log(obj instanceof O);
console.log(obj instanceof F);
console.log(obj.__proto__ === O.prototype);
console.log(obj.__proto__.__proto__ === F.prototype);
```

​	答案是：`true, true, true, true`

​	接着再来看：

```js
function F() {}
function O() {}

var obj = new O();
O.prototype = new F();

console.log(obj instanceof O);
console.log(obj instanceof F);
console.log(obj.__proto__ === O.prototype);
console.log(obj.__proto__.__proto__ === F.prototype);
```

​	答案完全相反：`false, false, false, false`

​	这里的坑点在于**重写了原型对象!!!**

​	**重写原型对象切断了现有原型与`任何之前已经存在的对象实例`之间的联系，他们引用的仍然是最初的原型。**

## JavaScript 中的 `==` 运算符

  ![](https://pic2.zhimg.com/80/0fc2dd69d7f9d4083f347784446b7f0d_hd.png)

  一张图概括如上。（也可参考[这篇文章](<https://zhuanlan.zhihu.com/p/21650547>)）

  转换规则如下：

  - 字符串和数字之间的比较，是将字符串转换为数字
  - 其他类型和布尔类型的比较，是将布尔类型转换为数字
  - 在 `==` 中`null` 和 `undefined` 相等（他们也与自身相等），除此之外其他值都不存在这种情况
  - 对象和非对象之间的比较，调用`ToPrimitive`将对象转换为原始类型，`ToPrimitive`操作规则如下：

  > **`ToPrimitive(obj)`**等价于：先计算 **`obj.valueOf()`**，如果为原始值，则返回此结果；
  > 否则，计算 **`obj.toString()`**，如果结果是原始值，则返回此结果；否则，抛出异常。

## `var` 和 `let` 区别

  1. ES6可以用let定义块级作用域变量
  2. let配合for循环的独特应用
  3. let没有变量提升和暂时性死区
  4. let变量不能重复声明

## Promise

  具体看[这里](/blogs/javascript/promise.html)

## async/await

  ### async 函数

  函数的返回值为 Promise 对象

  Promise 对象的结果由 async 函数执行的返回值决定

  ### await 函数

  await 右侧的表达式一般为 Promise 对象，但也可以是其它的值

  如果表达式是 Promise 对象，await 返回的是 Promise 成功的值

  如果表达式是其它值，直接将此值作为 await 的返回值

  > ⚠️ 注意
  >
  > await 必须写在 async 函数中，但 async 函数中可以没有 await
  >
  > 如果 await 的 Promise 失败了，就会抛出异常，需要通过 try...catch 来捕获处理

## 事件循环机制

  > https://segmentfault.com/a/1190000016022069

  ## 宏任务
  | #                       | 浏览器 | Node |
  | ----------------------- | ------ | ---- |
  | `I/O`                   | ✅      | ✅    |
  | `setTimeout`            | ✅      | ✅    |
  | `setInterval`           | ✅      | ✅    |
  | `setImmediate`          | ❌      | ✅    |
  | `requestAnimationFrame` | ✅      | ❌    |

  ## 微任务
  | #                            | 浏览器 | Node |
  | ---------------------------- | ------ | ---- |
  | `process.nextTick`           | ❌      | ✅    |
  | `MutationObserver`           | ✅      | ❌    |
  | `Promise.then catch finally` | ✅      | ✅    |

  **process.nextTick优先级高于promise.then**

  **setTimeout优先级高于setImmediate**

  ```js
  console.log('a');
  setTimeout(() => {
      console.log('b');
  }, 0);
  console.log('c');
  Promise.resolve().then(() => {
      console.log('d');
  })
  .then(() => {
      console.log('e');
  });
  console.log('f');
  ```

## `this` 的指向

  - 在调用函数时使用`new`关键字，函数内的`this`是一个全新的对象
  - 如果`apply`、`call`或`bind`方法用于调用、创建一个函数，函数内部的`this`就是作为参数传入这些方法的对象
  - 当函数作为对象里的方法被调用时，函数内的`this`是调用该函数的对象。
  - 如果调用函数不符合上述规则，那么`this`的值指向全局对象。非严格模式下，`this`指向`window`对象，但在严格模式下，`this`的值是`undefined`。
  - 如果符合上述多个规则，则较高的规则（从上到下依次减小）将决定`this`的值
  - 如果函数是箭头函数，将忽略上面的所有规则，`this`被设置为它被创建时的上下文

## 类数组转数组

  ```js
  let arrayLike = {0: 'name', 1: 'age', 2: 'sex', length: 3 };
  // 1.slice
  Array.prototype.slice.call(arrayLike);  // ["name", "age", "sex"]
  // 2.splice
  Array.protrotype.splice.call(arrayLike, 0);  // ["name", "age", "sex"]
  // 3.ES6 Array.from
  Array.from(arrayLike);  // ["name", "age", "sex"]
  // 4.apply
  Array.prototype.concat.apply([], arrayLike);  // ["name", "age", "sex"]
  ```

## 改写数组的`push`方法，保持原来的逻辑之外，再添加一个`console.log（arguments）`在控制台打印

  ```js
  const push = Array.prototype.push;
  Array.prototype.push = ((val) => {
    console.log(val);
    push.call(this, val);
  })
  ```

## 哪些操作会导致内存泄漏

  JS内存泄漏指对象在不需要使用它时仍然存在，导致占用的内存不能够被使用或回收。

  - 未使用var声明的全局变量
  - 闭包函数
  - 循环引用（两个对象相互引用）
  - 控制台日志（console.log）
  - 移除存在事件绑定的DOM元素（IE）

## JS调用函数有哪几种方式
  - 作为对象的方法调用
  - 函数直接调用
  - 作为构造函数调用
  - 使用call/apply
  - 使用bind

## 数组随机化

  ```javascript
  const shuffle = (arr) => {
    let currentIndex = arr.length, temporaryValue, randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      --currentIndex;

      // swap currentIndex and randomIndex
      temporaryValue = arr[currentIndex];
      arr[currentIndex] = arr[randomIndex];
      arr[randomIndex] = temporaryValue;
    }

    return arr;
  };
  ```

## 数组扁平化 + 去重

  先来扁平化。

  ```javascript
  // 深度策略
  function flattern(arr) {
    return arr.reduce((prev, cur) => prev.concat(Array.isArray(cur) ? flattern(cur) : cur), []);
  }
  ```

  ```javascript
  // 广度策略
  function flattern(arr) {
    while (arr.some(item => Array.isArray(item))) {
      arr = [].concat(...arr);
    }
    return arr;
  }
  ```

  ```javascript
  function flattern(arr) {
    return arr.toString().split(',').map((item) => +item);
  }
  ```

  ```javascript
  function iterTree(tree) {
    if (Array.isArray(tree)) {
      for (let i = 0; i < tree.length; ++i) {
        yield* iterTree(tree[i]);
      }
    } else {
      yield tree;
    }
  }
  ```

​	再来去重。

  ```javascript
  function unique(arr) {
    return arr.reduce((prev, cur) => prev.includes(cur) ? prev : [...prev, cur], []);
  }
  ```

  ```javascript
  function unique(arr) {
    return array.filter((item, index, array) => array.indexOf(item) === index);
  }
  ```

  ```javascript
  function unique(arr) {
    let obj = {};
    return arr.filter((item, index, arr) => {
      return obj.hasOwnProperty(typeof item + JSON.stringify(item)) ? false : (obj[typeof item + JSON.stringify(item)] = true);
    });
  }
  ```

​	ES6 的去重方法：

  ```js
  let unique = (arr) => [...new Set(arr)];
  ```

  ```js
  function unique(arr) {
    let seen = new Map();
    return arr.filter((a) => !seen.has(a) && seen.set(a, 1));
  }
  ```

## 实现`call`、`apply`

  ```javascript
  Function.prototype.call = function(context) {
    context = context || window;
    context.fn = this;

    let args = [];
    for (let i = 1; i < arguments.length; ++i) {
      args.push('arguments[' + i + ']');
    }

    let result = eval('context.fn(' + args + ')');

    delete context.fn;
    return result;
  }
  ```

  ```javascript
  Function.prototype.apply = function(context, arr) {
    context = context || window;
    context.fn = this;

    let result;
    if (!arr) {
      result = context.fn();
    } else {
      let args = [];
      for (let i = 0, len = arr.length; i < len; ++i) {
        args.push('arr[' + i + ']');
      }
      result = eval('context.fn(' + args + ')');
    }
    delete context.fn;
    return result;
  }
  ```

## 实现`bind`

  ```js
  Function.prototype.bind = function(ctx) {
    let self = this;
    let args = Array.prototype.slice.call(arguments, 1);

    let fBound = function() {
      let bindArgs = Array.prototype.slice.call(arguments);
      return self.apply(this instanceof fBound ? this : ctx, args.concat(bindArgs));
    }

    fBound.prototype = self.prototype;
    return fBound;
  }
  ```

## 实现`new`

  1. 首先新建一个对象
  2. 然后将对象的原型指向 `fn.prototype`
  3. 然后 `Person.apply(obj)`
  4. 返回这个对象

  ```javascript
  function New(fn) {
    let res = {};
    res.prototype = fn.prototype;

    let ret = fn.apply(res, Array.prototype.slice.call(arguments, 1));

    if ((typeof ret == "function" || typeof ret == "object") && ret !== null) {
      return ret;
    }

    return res;
  }
  ```

## 实现浅拷贝和深拷贝

  **浅拷贝的实现**

  ```js
  function shallowCopy(obj) {
    if (typeof obj !== 'object') return;
    let newObj = obj instanceof Array ? [] : {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) newObj[key] = obj[key];
    }
    return newObj;
  }
  ```

  **深拷贝的实现**

  ```js
  function deepCopy(obj) {
    if (typeof obj !== 'object') return;
    let newObj = obj instanceof Array ? [] : {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) newObj[key] = typeof obj[key] === "object" ? deepCopy(obj[key]) : obj[key];
    }
    return newObj;
  }
  ```

## 实现原生 Ajax

  **发送GET请求**

  ```javascript
  let request;
  if (window.XMLHttpRequest)
    request = new XMLHttpRequest();
  else
    request = new ActiveXObject('Microsoft.XMLHTTP');

  request.onreadystatechange = () => {
    if (request.readyState === 4 && request.status === 200)
      cb(request.response);
  }

  request.open('GET', url);
  request.send();
  ```

  **发送POST请求**

  ```javascript
  let request;
  // 1.创建一个XMLHttpRequest对象
  if (window.XMLHttpRequest)
    request = new XMLHttpRequest();
  else
    request = new ActiveXObject('Microsoft.XMLHTTP');

  // 2.设置回调监听
  request.onreadystatechange = () => {
    if (request.readyState == 4 && request.status == 200)
      callback(request.responseText);
  }

  // 3.打开一个链接
  request.open('POST', url);

  // 4.设置请求头（GET没有该步骤）
  request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

  // 5.发送请求（参数: 具体发送的值）
  request.send('name=value&age=12');
  ```

## 防抖与节流

  1. 先来讲讲**防抖**：你尽管触发事件，但是我**一定在事件触发n秒后再执行**，如果你在一个事件触发的n秒内又触发了这个事件，那我就以新的事件的事件为标准，n秒后才执行，总之，就是要等你触发完事件n秒内不再触发事件。

  ```javascript
  function debounce(func, wait) {
    let timeout;
    return function() {
      let ctx  = this;
      let args = arguments;

      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(ctx, args);
      }, wait);
    }
  }
  ```

  2. 再来介绍**节流**：如果你持续触发事件，每隔一段时间，只执行一次事件。有两种主流的实现方式，一种是**时间戳**，一种是**定时器**。

  ​	*时间戳*

  ```javascript
  function throttle(func, wait) {
    let ctx, args;
    let prev = 0;

    return function() {
      let now = Date.now();
      ctx  = this;
      args = arguments;
      if (now - prev > wait) {
        func.apply(ctx, args);
        prev = now;
      }
    }
  }
  ```

  ​	*定时器*

  ```javascript
  function throttle(func, wait) {
    let ctx, args;
    let timeout;

    return function() {
      ctx  = this;
      args = arguments;
      if (!timeout) {
        timeout = setTimeout(function() {
          timeout = null;
          func.apply(ctx, args);
        }, wait)
      }
    }
  }
  ```

## 简述同步和异步的区别

  同步是阻塞模式，异步是非阻塞模式。

  - 同步就是指一个进程在执行某个请求的时候，若该请求需要一段时间才能返回信息，那么这个进程将会一直等待下去，知道收到返回信息才继续执行下去
  - 异步是指进程不需要一直等下去，而是继续执行下面的操作，不管其他进程的状态。当有消息返回时系统会通知进程进行处理，这样可以提高执行的效率

## 一道面试题引发的思考

  ```js
  const obj = { selector: { to: { toutiao: "FE Coder"} }, target: [1, 2, { name: 'byted'}]};

  get(obj, 'selector.to.toutiao', 'target[0]', 'target[2].name');
  // [ 'FE Coder', 1, 'byted']
  ```

  实现一个get函数，使得上面的输出成立。

  首先，可以通过构建一个Function解决这个问题（[Function的详细介绍](<https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function>)）。

  ```js
  function get(data, ...args) {
    return args.map(item => (new Function('data', `try {return data.${item}} catch(e) {}`))(data));
  }
  ```

  还可以使用正则表达式来进行处理：

  ```js
  function get (data, ...args) {
    return args.map(item => {
      let res = data;
      item.replace(/\[/g, '.')
          .replace(/\]/g, '')
          .split('.')
          .map(path => res = res && res[path]);
      return res;
    });
  }
  ```

  也可以用eval，不过不推荐使用。

  ```js
  function get(data, ...args) {
    return args.map(item => eval('data.' + item));
  }
  ```

## 正则实现千位分隔符

  ```js
  let str = "1312567.903000";
  let reg = /\B(?=(\d{3})+\.)/g;

  console.log(str.replace(reg, ","));
  ```

  或者

  ```js
  let str = "1312567.903000";
  str = str.replace(/(\d)(?=(\d{3})+\.)/g, function($0, $1) {
    return $1 + ',';
  })

  console.log(str);
  ```

  还可以

  ```js
  let str = 1312567.903000;
  str.toLocaleString();  // 不过这种方法会自动进行四舍五入
  ```

  注：如果不带小数点的话就把`\.`换成`$`

## 正则实现转换下划线命名法和驼峰命名法

  - 下划线命名法 -> 驼峰命名法

    ```js
    function toHump(str) {
      return str.replace(/\_([a-z])/g, function($0, $1) {
        return $1.toUpperCase();
      });
    }
    ```

  - 驼峰命名法 -> 下划线命名法

    ```js
    function toLine(str) {
      return str.replace(/[A-Z]/g, function($0) {
        return '_' + $0.toLowerCase();
      });
    }
    ```

## 下面的代码输出什么？为什么？

  ```js
  Function.prototype.a = 'a';
  Object.prototype.b = 'b';
  function Person() {};
  var p = new Person();
  console.log('p.a: ' + p.a);  // undefined，因为new出来的p是一个对象
  console.log('p.b: ' + p.b);  // b
  ```

## 下面的代码输出什么？为什么？

  ```js
  async function async1() {
    console.log("a");
    await async2();
    console.log("b");
  }
  async function async2() {
  	console.log("c");
  }
  console.log("d");
  setTimeout(function () {
    console.log("e");
  }, 0);
  async1();
  new Promise(function (resolve) {
    console.log("f");
    resolve();
  }).then(function () {
    console.log("g");
  });
  console.log("h");
  // d a c f h b g e
  ```

  **`async/await`本质上还是基于`Promise`的一些封装**，而`Promise`是属于微任务的一种。所以在使用`await`关键字与`Promise.then`效果类似：

  ```js
  setTimeout(_ => console.log(5))

  async function main() {
  	console.log(1);
    await side();
    console.log(4);
  }

  async function side() {
    console.log(2);
  }

  main();

  console.log(3);
  // 1 2 3 4 5
  ```

  **async函数在await之前的代码都是同步执行的，可以理解为await之前的代码属于`new Promise`时传入的代码，await之后的所有代码都是在`promise.then`中的回调。await后的代码也会立即执行**。

## 为什么0.1 + 0.2 不等于 0.3 ？

  > 首先我们要知道**JS是如何表示数字的？**

  JS使用Number类型表示数字（整数和浮点数），遵循IEEE 754标准通过64位来表示一个数字，如下图。

  ![](https://user-gold-cdn.xitu.io/2018/9/16/165e0eb7f4d6c50f?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

  - 第0位：符号位，0表示正数，1表示负数（s）
  - 第1位到第11位：存储指数部分（e）
  - 第12位到第63位：存储尾数部分（即有效数字f）

  JS最大安全数是**Number.MAX_SAFE_INTEGER == Math.pow(2, 53) - 1，而不是Math.pow(2, 52) - 1，why？尾数部分不是只有52位吗？**

  这是因为二进制表示有效数字总是1.xx...xx的形式，尾数部分f在规约形式下第一位默认为1（省略不写，xx...xx为尾数部分f，最长52位）。因此，JS提供的有效数字最长为53个二进制位（64位浮点的后52位 + 被省略的1位）。

  >  其次我们还要清楚**运算时发生了什么？**

  首先，计算机无法直接对十进制的数字进行运算，这是硬件物理特性已经决定的。这样运算就分成了两个部分：**先按照IEEE 754转成相应的二进制，然后对阶运算。**

  **1. 进制转换**

  0.1 和 0.2 转换成二进制后会无限循环。

  ```js
  0.1 -> 0.0001100110011001...(无限循环)
  0.2 -> 0.0011001100110011...(无限循环)
  ```

  但是由于IEEE 754尾数位限制，需要将后面多余的位截掉。这样在进制转换的时候精度已经损失。

  **2. 对阶运算**

  由于指数位数不相同，运算时需要对阶运算，这部分也可能产生精度损失。按照上面两步运算（包括两步的精度损失），最后的结果是：

  ```js
  0.0100110011001100110011001100110011001100110011001100
  ```

  转换为十进制结果就是0.30000000000000004。

## 用`setTimeout`实现`setInterval`

  ```js
  function mySetInterval(fn, wait, count) {
  	function interval() {
  		if (typeof count == "undefined" || count --> 0) {  // 这里的 --> 其实是先判断count是否大于0，然后再自减一（第一次看到这种写法。。。）
  			setTimeout(interval, wait);
  			try {
  				fn();
  			} catch (e) {
  				count = 0;
          throw e.toString();
  			}
  		}
  	}
  	setTimeout(interval, wait);
  }
  ```

## Fetch和Ajax的区别

  - **Ajax**：利用的是XMLHttpRequest对象来请求数据的。

  - **Fetch**：window对象的一个方法，主要特点是：

  1. 第一个参数是URL
  2. 第二个参数可选，可以控制不同的init对象
  3. 使用了es6的promise对象

  ```js
  fetch(url).then(function(response) {
    return response.json();  // 执行成功第一步
  }).then(function(val) {
      // 执行成功第二步
  }).catch(function(err) {
      // 中途任何地方出错都会在这里捕捉到
  })
  ```

  注意：fetch的第二个参数中

  1. 默认的请求为get请求，可以使用`method: post`来进行配置
  2. 第一步中的response有许多方法：`json()`、`text()`、`formData()`
  3. fetch跨域的时候默认不会带cookie，需要手动指定：`credentials: 'include'`

  - **fetch和ajax的主要区别**

  1. 当接收到一个代表错误的HTTP状态码时，从fetch()返回的**Promise不会被标记为reject**，即便该HTTP响应的状态码是404或500。相反，它会将Promise状态标记为resolve（**但是会将resolve的返回值的`ok`属性设置为false**），仅当网络故障时或请求被阻止时，才会标记为reject。
  2. 在默认情况下**fetch不会从服务器端发送或接收任何cookies**。

## 前端模块化

  [戳我查看](</blogs/javascript/module.html>)

## JS基本类型的属性赋值问题

  在某些情况下基本类型会表现的“很像”对象类型，使得用户可以像使用对象一样去使用基本类型数据。某些情况主要指“对属性的赋值和读取”。

  当你尝试将名为"bar"的属性分配给变量foo时，像这样：

  ```javascript
  foo.bar = 'abc';
  ```

  那么结果取决于foo的值的类型：

  1. 如果foo的值的类型为undefined或null，那么将抛出一个错误
  2. 如果foo的值的类型是Object类型，那么将在对象foo上定义一个命名的属性”bar"，并且其值将被设置为"abc"
  3. 如果foo的值是Number、String或Boolean类型，那么变量foo不会以任何方式改变。在这种情况下，上面的赋值操作将是一个[NOP](<https://zh.wikipedia.org/wiki/NOP>)

  以Number类型为例：

  ```javascript
  var a = 12.3;
  console.log(a.toFixed(3)); // 输出"12.300"

  a.foo = 'bar';  // 不报错
  console.log(a.foo);  // 输出undefined
  ```

  上述代码说明，基本类型可以像对象类型一样使用，包括访问其属性、对其属性赋值（尽管实际上不起作用，但是形式上可以）。

  之所以能这样去使用基本类型，是因为JavaScript引擎内部在处理对某个基本类型`a`进行形如`a.sth`的操作时，会在内部临时创建一个对应的包装类型（对数字类型来说就是`Number`类型）的临时对象，并把对基本类型的操作代理到这个临时对象身上， 使得对基本类型的属性访问看起来像对象一样。但是在操作完成后，临时对象就被丢弃了，下次再访问时，会重新建立临时对象，当然对之前的临时对象的修改都不会有效了。

## 判断对象是否为空对象

  - 方法1：`for...in...`遍历属性，为真则为空对象，否则为非空对象。

    ```javascript
    for (var key in obj) {
      return false;
    }
    return true;
    ```

  - 方法2：通过`JSON.stringify()`来判断。

    ```javascript
    if (JSON.stringify(obj) == "{}") {
      return true;
    }
    return false;
    ```

  - 方法3：ES6新增的方法`Object.keys()`，`Object.keys()`会**返回一个由一个给定对象的自身可枚举属性组成的数组**。

    ```javascript
    Object.keys(obj).length === 0;
    ```

## 如何判断两个对象相等

  ```javascript
  function equals(x, y) {
    let f1 = x instanceof Object;
    let f2 = y instanceof Object;
    if (!f1 || !f2) return x === y;
    if (Object.keys(f1).length !== Object.keys(f2).length) return false;
    let newX = Object.keys(x);
    for (let value of newX) {
      let a = x[value] instanceof Object;
      let b = y[value] instanceof Object;
      if (a && b) {
        equals(x[value], y[value]);
      } else if (x[value] !== y[value]) {
        return false;
      }
    }
    return true;
  }
  ```

## 什么是函数柯里化？实现sum(1)(2)(3)返回结果是1，2，3之和

  函数柯里化是把接收多个参数的函数变换成接受一个单一参数（最初函数的第一个参数）的函数，并且返回接受余下的参数而且返回结果的新函数的技术。

  ```javascript
  function sum(a) {
    return function(b) {
      return function(c) {
        return a + b + c;
      }
    }
  }
  console.log(sum(1)(2)(3));  // 6
  ```

  ### 引申：实现一个curry函数，将普通函数柯里化

  ```javascript
  function curry(fn, args = []) {
    return function() {
      let rest = [...args, ...arguments];
      if (rest.length < fn.length) {
        return curry.call(this, fn, rest);
      } else {
        return fn.apply(this, rest);
      }
    }
  }

  function sum(a, b, c) {
    return a + b + c;
  }

  let sumFn = curry(sum);
  console.log(sumFn(1)(2)(3));  // 6
  console.log(sumFn(1)(2, 3));  // 6
  ```

## 使用Promise封装简单Ajax方法

  **GET**

  ```javascript
  function getJSON(url) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 200) {
            resolve(JSON.parse(this.responseText), this);
          } else {
            let resJson = { code: this.status, response: this.response };
            reject(resJson, this);
          }
        }
      }
      xhr.open("GET", url, true);
      xhr.send();
    })
  }
  ```

  **POST**

  ```javascript
  function postJSON(url, data) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 200) {
            resolve(JSON.parse(this.responseText), this);
          } else {
            let resJson = { code: this.status, response: this.response };
            reject(resJson, this);
          }
        }
      }
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhr.send(JSON.stringify(data));
    })
  }
  ```
