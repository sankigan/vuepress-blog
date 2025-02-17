---
title: Vue
date: 2025-2-17
editLink: false
tags:
 - Vue
categories:
 - 前端
---

## SPA（单页应用）

### SPA 和 MPA 的区别

  | #               | 单页面应用（SPA）           | 多页面应用（MPA）                           |
  |-----------------|-----------------------------|---------------------------------------------|
  | 组成            | 一个主页面和多个页面片段    | 多个主页面                                  |
  | url模式         | 哈希模式                    | 历史模式                                    |
  | 页面切换        | 速度快，用户体验良好        | 切换加载资源，速度慢，用户体验差            |
  | SEO搜索引擎优化 | 难实现，可使用 SSR 方式改善 | 容易实现                                    |
  | 数据传递        | 容易                        | 通过 `url`、`cookie`、`localStorage` 等传递 |
  | 维护成本        | 相对容易                    | 相对复杂                                    |
  | 刷新方式        | 局部刷新                    | 整页刷新                                    |

### 实现一个 SPA

**原理**

1. 监听地址栏中 `hash` 变化驱动界面变化
2. 用 `pushstate` 记录浏览器的历史，驱动界面发生变化

![](https://static.vue-js.com/fc95bf60-3ac6-11eb-ab90-d9ae814b240d.png)

**实现**

`hash` 模式

```js
class Router {
  constructor() {
    this.routes = {};
    this.currentUrl = '';

    window.addEventListener('load', this.refresh, false);
    window.addEventListener('hashchange', this.refresh, false);
  }

  route(path, callback) {
    this.routes[path] = callback;
  }

  push(path) {
    this.routes[path] && this.routes[path]();
  }
}

window.miniRouter = new Router();
miniRouter.route('/', () => console.log('page1'));
miniRouter.route('/page2', () => console.log('page2'));

miniRouter.push('/');
miniRouter.push('/page2');
```

`history` 模式

```js
class Router {
  constructor() {
    this.routes = {};
    this.listenPopState();
  }

  init(path) {
    history.replaceState({ path }, null, path);
    this.routes[path] && this.routes[path]();
  }

  route(path, callback) {
    this.routes[path] = callback;
  }

  push(path) {
    history.pushState({ path }, null, path);
    this.routes[path] && this.routes[path]();
  }

  listenPopState() {
    window.addEventListener('popstate', e => {
      const path = e.state && e.state.path;
      this.routes[path] && this.routes[path]();
    });
  }
}

window.miniRouter = new Router();
miniRouter.route('/', () => console.log('page1'));
miniRouter.route('/page2', () => console.log('page2'));

miniRouter.push('/page2');
```

### 如何给 SPA 做 SEO

1. SSR 服务端渲染

将组件或页面通过服务器生成 html，再返回给浏览器，如 `Nuxt.js`

2. 静态化

目前主流的静态化主要有两种：（1）一种是通过程序将动态页面抓取并保存为静态页面，这样的页面实际存在于服务器的硬盘中（2）另外一种是通过WEB服务器的 `URL Rewrite` 方式，它的原理是通过WEB服务器内部模块按一定规则将外部的URL请求转换为内部的文件地址。一句话来说就是把外部请求的静态地址转化为实际动态页面地址，而静态页面实际是不存在的。这两种方法都达到了实现URL静态化的效果。

3. 使用 `Phantomjs` 针对爬虫处理

原理是通过 `Ngnix` 配置，判断访问来源是否为爬虫，如果是则搜索引擎的爬虫请求会转发到一个 `node server`，再通过 `Phantomjs` 来解析完整的html，返回给爬虫。

![](https://static.vue-js.com/25be6630-3ac7-11eb-ab90-d9ae814b240d.png)

## v-show 与 v-if 的区别

- 控制手段不同
- 编译过程不同
- 编译条件不同
- 性能消耗不同

控制手段：`v-show` 隐藏是为该元素添加 `css--display:none`，dom 元素依旧存在。`v-if` 显示隐藏是将 `dom` 元素整个添加或删除
编译过程：`v-if` 切换有一个局部编译/卸载的过程，切换过程种合适地销毁和重建内部的事件监听和子组件；`v-show` 只是简单的基于css切换
编译条件：`v-if` 是真正的条件渲染，它会确保在切换过程中条件块内的事件监听器和子组件适当地被销毁和重建。只有渲染条件为假时，并不做操作，知道为真才渲染
性能消耗：`v-if` 有更高的切换消耗，`v-show` 有更高的初始渲染消耗

### v-show 原理

有 `transition` 就执行 `transition`，没有就直接设置 `display` 属性。

```js
// https://github.com/vuejs/vue-next/blob/3cd30c5245da0733f9eb6f29d220f39c46518162/packages/runtime-dom/src/directives/vShow.ts
export const vShow: ObjectDirective<VShowElement> = {
  beforeMount(el, { value }, { transition }) {
    el._vod = el.style.display === 'none' ? '' : el.style.display
    if (transition && value) {
      transition.beforeEnter(el)
    } else {
      setDisplay(el, value)
    }
  },
  mounted(el, { value }, { transition }) {
    if (transition && value) {
      transition.enter(el)
    }
  },
  updated(el, { value, oldValue }, { transition }) {
    // ...
  },
  beforeUnmount(el, { value }) {
    setDisplay(el, value)
  }
}
```

### v-if 原理

返回一个 `node` 节点，`render` 函数通过表达式的值来决定是否生成 DOM

```js
// https://github.com/vuejs/vue-next/blob/cdc9f336fd/packages/compiler-core/src/transforms/vIf.ts
export const transformIf = createStructuralDirectiveTransform(
  /^(if|else|else-if)$/,
  (node, dir, context) => {
    return processIf(node, dir, context, (ifNode, branch, isRoot) => {
      // ...
      return () => {
        if (isRoot) {
          ifNode.codegenNode = createCodegenNodeForBranch(
            branch,
            key,
            context
          ) as IfConditionalExpression
        } else {
          // attach this branch's codegen node to the v-if root.
          const parentCondition = getParentCondition(ifNode.codegenNode!)
          parentCondition.alternate = createCodegenNodeForBranch(
            branch,
            key + ifNode.branches.length - 1,
            context
          )
        }
      }
    })
  }
)
```

## Vue 挂载实例的过程

### 源码分析

首先找到 `vue` 的构造函数，[源码位置](https://github.com/vuejs/vue/blob/main/src/core/instance/index.ts#L9)

```js
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
```

`options` 是用户传递过来的配置项，如 `data`、`methods` 等常用的方法。vue 构建函数使用 `_init` 方法，但我们发现本文件中并没有此方法，但可以看到文件下方定义了很多初始化方法

```js
initMixin(Vue);     // 定义 _init
stateMixin(Vue);    // 定义 $set $get $delete $watch 等
eventsMixin(Vue);   // 定义事件  $on  $once $off $emit
lifecycleMixin(Vue);// 定义 _update  $forceUpdate  $destroy
renderMixin(Vue);   // 定义 _render 返回虚拟dom
```

首先可以看 `initMixin` 方法，发现该方法在 Vue 原型上定义了 `_init` 方法，源码：[src/core/instance/init.js](https://github.com/vuejs/vue/blob/main/src/core/instance/init.ts#L17)

阅读后，得到以下结论：

- 在调用 `beforeCreate` 之前，数据初始化并未完成，像 `data`、`props` 这些属性无法访问到
- 到了 `created` 的时候，数据已经初始化完成，能够访问 `data`、`props` 这些属性，但这时候并未完成 `dom` 的挂载，因此无法访问到 `dom` 元素
- 挂载方法是调用 `vm.$mount` 方法

其中，`initState` 方法是完成 `props/methods/data/watch/computed/watch` 的初始化，源码如下：

```js
export function initState (vm: Component) {
  // 初始化组件的watcher列表
  vm._watchers = []
  const opts = vm.$options
  // 初始化props
  if (opts.props) initProps(vm, opts.props)
  // 初始化methods方法
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    // 初始化data
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```

阅读 [initState](https://github.com/vuejs/vue/blob/main/src/core/instance/state.ts#L52) 和 [initData](https://github.com/vuejs/vue/blob/main/src/core/instance/state.ts#L128) 的源码后，可以得到以下结论：

- 初始化顺序：`props`、`methods`、`data`
- `data` 定义的时候可选择函数形式或者对象形式（组件只能为函数形式）

上文还提到挂载方式是调用 `vm.$mount` 方法

### 结论

- `new Vue` 的时候会调用 `_init` 方法
  - 定义 `$set`、`$get`、`$delete`、`$watch` 等方法
  - 定义 `$on`、`$off`、`$emit`、`$off` 等事件
  - 定义 `_update`、`$forceUpdate`、`$destroy` 生命周期
- 调用 `$mount` 进行页面的挂载
- 挂载的时候主要是通过 `mountComponent` 方法
- 定义 `updateComponent` 更新函数
- 执行 `render` 生成虚拟 `DOM`
- `_update` 将虚拟 `DOM` 生成真实 `DOM` 结构，并且渲染到页面中

## Vue 生命周期

| 生命周期      | 描述                               |
|---------------|------------------------------------|
| beforeCreate  | 组件实例被创建之初                 |
| created       | 组件实例已经完全创建               |
| beforeMount   | 组件挂载之前                       |
| mounted       | 组件挂载到实例上去之后             |
| beforeUpdate  | 组件数据发生变化，更新之前         |
| updated       | 组件数据更新之后                   |
| beforeDestroy | 组件实例销毁之前                   |
| destroyed     | 组件实例销毁之后                   |
| activated     | keep-alive 缓存的组件激活时        |
| deactivated   | keep-alive 缓存的组件停用时调用    |
| errorCaptured | 捕获一个来自子孙组件的错误时被调用 |

![](https://static.vue-js.com/44114780-3aca-11eb-85f6-6fac77c0c9b3.png)

## 为什么 Vue 中的 v-if 和 v-for 不建议一起用

### 优先级

编写一个 `p` 标签，同时使用 `v-if` 与 `v-for`

```html
<div id="app">
  <p v-if="isShow" v-for="item in items">
    {{ item.title }}
  </p>
</div>
```

创建 `vue` 实例，存放 `isShow` 和 `items` 数据

```js
const app = new Vue({
  el: '#app',
  data() {
    return {
      items: [
        { title: 'foo' },
        { title: 'baz' }]
    }
  },
  computed: {
    isShow() {
      return this.items && this.items.length > 0
    }
  }
})
```

模板指令的代码都会生成在 `render` 函数中，通过 `app.$options.render` 就能得到渲染函数

```js
ƒ anonymous() {
  with (this) { return
    _c('div', { attrs: { "id": "app" } },
    _l((items), function (item)
    { return (isShow) ? _c('p', [_v("\n" + _s(item.title) + "\n")]) : _e() }), 0) }
}
```

`_l` 是 vue 的列表渲染函数，函数内部都会进行一次 `if` 判断，初步得到结论：`v-for` 优先级比 `v-if` 高

再将 `v-for` 与 `v-if` 置于不同标签

```js
<div id="app">
  <template v-if="isShow">
    <p v-for="item in items">{{item.title}}</p>
  </template>
</div>
```

渲染函数为

```js
ƒ anonymous() {
  with(this){return
    _c('div',{attrs:{"id":"app"}},
    [(isShow)?[_v("\n"),
    _l((items),function(item){return _c('p',[_v(_s(item.title))])})]:_e()],2)}
}
```

这时候我们可以看到，`v-for` 与 `v-if` 作用在不同标签的时候，是先进行判断，再进行列表的渲染。所以 `v-for` 优先级比 `v-if` 高

源码位置：[src/compiler/codegen/index.js](https://github.com/vuejs/vue/blob/main/src/compiler/codegen/index.ts#L74)

### 注意事项

1. 永远不要把 `v-if` 和 `v-for` 同时用在同一个元素上，带来性能方面的浪费（每次渲染都会先循环再进行条件判断）
2. 如果避免出现这种情况，则在外层嵌套 `template`（页面渲染不生成 `dom` 节点），在这一层进行 `v-if` 判断，然后在内部进行 `v-for` 循环
3. 如果条件出现在循环内部，可通过计算属性 `computed` 提前过滤掉那些不需要显示的项

## SPA 首屏加载速度慢怎么解决

