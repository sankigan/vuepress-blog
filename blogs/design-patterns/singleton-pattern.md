# 单例模式

## 介绍

单例就是保证一个类只有一个实例，实现的方法一般是先判断实例存在与否，如果存在直接返回，如果不存在就创建了再返回，这就确保了一个类只有一个实例对象。在JavaScript里，单例作为一个命名空间提供者，从全局命名空间里提供一个唯一的访问点来访问该对象。

## 基本用法

在JavaScript中，实现单例的方式有很多种，其中最简单的一个方式就是使用**对象字面量**的方法，其字面量里可以包含大量的属性和方法：

```javascript
var mySingleton = {
	property1: "somrthing",
	property2: "something else",
	method1: function() {
		console.log("hello world");
	}
};
```

如果以后要扩展该对象，你可以添加自己的私有成员和方法，然后使用闭包在其内部封装这些变量和函数声明。只暴露你想要暴露的public成员和方法，样例代码如下：

```javascript
var mySingleton = function() {
	// 声明私有变量和方法
	var privateVariable = 'something private';
	function showPrivate() {
		console.log(privateVariable);
	}

	// 公有变量和方法
	return {
		publicMethod: function() {
			showPrivate();
		},
		publicVar: 'the public can see this~'
	};
};

var single = mySingleton();
single.publicMethod();
console.log(single.publicVar);
```

上面的代码很不错了，但如果想做到只有在使用的时候才初始化，那该如何做呢？为了节约资源的目的，我们可以在另外一个构造函数里初始化这些代码：

```javascript
var Singleton = (function() {
	var instantiated;
	function init() {
		// 这里定义单例代码
		return {
			publicMethod: function() {
				console.log("Hello World");
			},
			publicProperty: 'test'
		};
	}

	return {
		getInstance: function() {
			if (!instantiated) {
				instantiated = init();
			}
			return instantiated;
		}
	};
})()

// 调用公用的方法来获取实例
Singleton.getInstance().publicMethod();
```

知道了单例如何实现了，但单例用在什么样的场景比较好呢？其实**单例一般是用在系统间各种模式的通信协调上**，下面的代码是一个单例的最佳实践：

```javascript
var SingletonTester = (function() {
	// 参数：传递给单例的一个参数集合
	function Singleton(args) {
		var args = args || {};
		this.name = 'SingletonTester';
		this.pointX = args.pointX || 6;
		this.pointY = args.pointY || 10;
	}

	// 实例容器
	var instance;

	var _static = {
		name: 'SingletonTester',
		getInstance: function(args) {
			if (instance === undefined) {
				instance = new Singleton(args);
			}
			return instance;
		}
	};

	return _static;
})();

var singletonTest = SingletonTester.getInstance({pointX: 5});
console.log(singletonTest.pointX); // 5
```

## 其他实现方式

### 方法1：

```javascript
function Universe() {
	// 判断是否存在实例
	if (typeof Universe.instance === "object")
		return Universe.instance;

	// 其他内容
	this.start_time = 0;
	this.bang = "Big";

	// 缓存
	Universe.instance = this;

	// 隐式返回this
}

var uni = new Universe();
var uni2 = new Universe();
console.log(uni === uni2); // true
```

### 方法2：

```javascript
function Universe() {
	// 缓存的实例
	var instance = this;

	// 其他内容
	this.start_time = 0;
	this.bang = "Big";

	// 重写构造函数
	Universe = function() {
		return instance;
	};
}

var uni = new Universe();
var uni2 = new Universe();
uni.bang = "123";
console.log(uni === uni2); // true
console.log(uni2.bang);  // 123
```

### 方法3：

```javascript
function Universe() {
	// 缓存实例
	var instance;

	// 重新构造函数
	Universe = function Universe() {
		return instance;
	};

	// 后期处理原型属性
	Universe.prototype = this;

	// 实例
	instance = new Universe();

	// 重设构造函数指针
	instance.constructor = Universe;

	// 其他功能
	instance.start_time = 0;
	instance.bang = "Big";

	return instance;
}

var uni = new Universe();
var uni2 = new Universe();
console.log(uni === uni2); // true

// 添加原型属性
Universe.prototype.nothing = true;

var uni = new Universe();

Universe.prototype.everything = true;

var uni2 = new Universe();

console.log(uni.nothing); // true
console.log(uni2.nothing); // true
console.log(uni.everything); // true
console.log(uni2.everything); // true
console.log(uni.constructor === Universe); // true
```

### 方法4

```javascript
var Universe;

(function() {
	var instance;
	Universe = function Universe() {
		if (instance)
			return instance;

		instance = this;

		// 其他内容
		this.start_time = 0;
		this.bang = "Big";
	};
})();

var a = new Universe();
var b = new Universe();
console.log(a === b);
a.bang = "123";
console.log(b.bang);
```

