---
title: 前端路由跳转原理
date: 2019-9-6
tags:
 - JavaScript
categories:
 - 前端
---

# 前端路由跳转原理

> [前端路由跳转基本原理](<https://juejin.im/post/5c52da9ee51d45221f242804>)
>
> [单页面应用路由实现原理](<https://github.com/youngwind/blog/issues/109>)

目前前端三杰Angular、React、Vue都推介单页面应用SPA开发模式，在路由切换时替换DOM树中最小修改的部分DOM，来减少原先因为多页应用的页面跳转带来的巨量性能损耗。它们都有自己的典型路由解决方案，angular/router、react-router、vue-router。

一般来说这些路由插件总是提供两种不同方式的路由方式：**Hash**和**History**，有时也会提供非浏览器环境下的路由方式Abstract，在vue-router中是使用了外观模式将几种不同的路由方式提供了一个一致的高层接口，让我们可以更解耦的在不同路由方式中切换。

Hash和History除了外观上的不同之外，还有一个区别是：Hash方式的状态保存需要另行传递，而HTML5 History原生提供了自定义状态传递的能力，我们可以直接利用其来传递信息。

## Hash

最开始的网页是多页面的，后来出现了Ajax之后，才慢慢有了SPA。然而，那时候的SPA有两个弊端：

1. 用户在使用的过程中，URL不会发生任何改变。当用户操作了几步之后，一不小心刷新了页面，又会回到最开始的状态。
2. 由于缺乏URL，不方便搜索引擎进行收录。

怎么办呢？→ 使用hash。

URL上的hash本意是用来作锚点的，方便用户在一个很长的文档里进行上下的导航，用来做SPA的路由控制并非它的本意。然而，hash满足这么一种特性：**改变url的同时，不刷新页面**，再加上浏览器也提供`onhashchange`这样的事件监听，因此，hash能用来做路由控制。后来这种模式大行其道， `onhashchange`也就被写进了HTML5规范中去了。

下面举个栗子，演示“通过改变hash值，对页面进行局部刷新”。

```html
<ul>
	<li><a href="#/">/</a></li>
	<li><a href="#/page1">page1</a></li>
	<li><a href="#/page2">page2</a></li>
</ul>
<div class="content-div"></div>
```

```javascript
class RouterClass {
	constructor() {
		this.routes = {};
		this.currentUrl = "";
		window.addEventListener("load", () => this.render());
		window.addEventListener("hashchange", () => this.render());
	}

	// Static methods aren't called on instances of the class.
	// Instead, they're called on the class itself.
	static init() {
		window.Router = new RouterClass();
	}

	// register router and callback
	route(path, cb) {
		this.routes[path] = cb || function() {}
	}

	// Record the current hash, execute callback
	render() {
		this.currentUrl = location.hash.slice(1) || '/';
		this.routes[this.currentUrl]();
	}
}

RouterClass.init();
const contentDom = document.querySelector('.content-div');
const changContent = content => contentDom.innerHTML = content;

Router.route('/', () => changContent('default page'));
Router.route('/page1', () => changContent('page1 display'));
Router.route('/page2', () => changContent('page2 display'));
```

问题：虽然hash解决了SPA路由控制的问题，但是它又引入了新的问题：**URL上会有一个#号，很不美观**。解决方案：**抛弃hash，使用history**。

## History

通过`history.pushState`或者`history.replaceState`，也能做到：**改变url的同时，不会刷新页面。**所以history也具备实现路由控制的潜力。然而，还缺一点：hash的改变会触发`hashchange`事件，history的改变会触发什么事件呢？很遗憾，没有。

但是如果我们能罗列出所有可能改变history的途径，然后再这些途径一一进行拦截，不也一样相当于监听了history的改变吗？

对一个应用而言，url的改变只能由以下3种途径引起：

1. 点击浏览器的前进或者后退按钮

2. 点击a标签

3. 在JS代码中直接修改路由

第2和第3种途径可以看成是一种，因为a标签的默认事件可以被禁止，进而调用JS方法。关键是第1种，HTML5规范中新增了一个`popstate`事件，通过它便可以监听到前进或者后退按钮的点击。

> 要特别注意的是：调用`history.pushState`和`history.replaceState`并不会触发`popstate`事件。

把之前的例子改造一下，在需要路由跳转的地方使用`history.pushState`来入栈并记录`cb`，前进后退的时候监听`popstate`事件拿到之前传给`pushState`的参数并执行对应`cb`，因为借用了浏览器自己的API，因此代码看起来整洁不少。

```html
<ul>
	<li><a href="/">/</a></li>
	<li><a href="/page1">page1</a></li>
	<li><a href="/page2">page2</a></li>
</ul>
<div class='content-div'></div>
```

```javascript
class RouterClass {
	constructor(path) {
		this.routes = {};
		history.replaceState({path}, null, path);
		this.routes[path] && this.routes[path]();
		window.addEventListener("popstate", e => {
			const path = e.state && e.state.path;
			this.routes[path] && this.routes[path]();
		});
	}

	static init() {
		window.Router = new RouterClass(location.pathname);
	}

	// register callback
	route(path, cb) {
		this.routes[path] = cb || function() {};
	}

	go(path) {
		history.pushState({path}, null, path);
		this.routes[path] && this.routes[path]();
	}
}

RouterClass.init();
const ul = document.querySelector("ul");
const contentDom = document.querySelector(".content-div");
const changeContent = content => contentDom.innerHTML = content;

Router.route('/', () => changeContent('default page'));
Router.route('/page1', () => changeContent('page1'));
Router.route('/page2', () => changeContent('page2'));

ul.addEventListener("click", function(e) {
	if (e.target.tagName == "A") {
		e.preventDefault();
		Router.go(e.target.getAttribute("href"));
	}
});
```

