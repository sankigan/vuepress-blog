---
title: Vue
date: 2025-2-13
editLink: false
sticky: 2
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

编译过程：`v-if` 切换有一个局部编译/卸载的过程，切换过程中合适地销毁和重建内部的事件监听和子组件；`v-show` 只是简单的基于css切换

编译条件：`v-if` 是真正的条件渲染，它会确保在切换过程中条件块内的事件监听器和子组件适当地被销毁和重建。只有渲染条件为假时，并不做操作，直到为真才渲染

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

首先找到 Vue 的构造函数，[src/core/instance/index.ts](https://github.com/vuejs/vue/blob/main/src/core/instance/index.ts#L9)

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

首先可以看 `initMixin` 方法，发现该方法在 Vue 原型上定义了 `_init` 方法，源码：[src/core/instance/init.ts](https://github.com/vuejs/vue/blob/main/src/core/instance/init.ts#L17)

```js
Vue.prototype._init = function (options?: Object) {
  const vm: Component = this
  // a uid
  vm._uid = uid++
  let startTag, endTag
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    startTag = `vue-perf-start:${vm._uid}`
    endTag = `vue-perf-end:${vm._uid}`
    mark(startTag)
  }

  // a flag to avoid this being observed
  vm._isVue = true
  // merge options
  // 合并属性，判断初始化的是否是组件，这里合并主要是 mixins 或 extends 的方法
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options)
  } else { // 合并vue属性
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    )
  }
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    // 初始化proxy拦截器
    initProxy(vm)
  } else {
    vm._renderProxy = vm
  }
  // expose real self
  vm._self = vm
  // 初始化组件生命周期标志位
  initLifecycle(vm)
  // 初始化组件事件侦听
  initEvents(vm)
  // 初始化渲染方法
  initRender(vm)
  callHook(vm, 'beforeCreate')
  // 初始化依赖注入内容，在初始化data、props之前
  initInjections(vm) // resolve injections before data/props
  // 初始化props/data/method/watch/methods
  initState(vm)
  initProvide(vm) // resolve provide after data/props
  callHook(vm, 'created')

  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    vm._name = formatComponentName(vm, false)
    mark(endTag)
    measure(`vue ${vm._name} init`, startTag, endTag)
  }
  // 挂载元素
  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
}
```

阅读后，得到以下结论：

- 在调用 `beforeCreate` 之前，数据初始化并未完成，像 `data`、`props` 这些属性无法访问到
- 到了 `created` 的时候，数据已经初始化完成，能够访问 `data`、`props` 这些属性，但这时候并未完成 `dom` 的挂载，因此无法访问到 `dom` 元素
- 挂载方法是调用 `vm.$mount` 方法

其中，`initState` 方法是完成 `props/methods/data/computed/watch` 的初始化，源码：[src/core/instance/state.ts](https://github.com/vuejs/vue/blob/main/src/core/instance/state.ts#L52)

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

我们这里主要看初始化 `data` 的方法为 `initData`，它与 `initState` 在同一文件中，源码：[src/core/instance/state.ts](https://github.com/vuejs/vue/blob/main/src/core/instance/state.ts#L128)

```js
function initData (vm: Component) {
  let data = vm.$options.data
  // 获取到组件上的data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      // 属性名不能与方法名重复
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    // 属性名不能与state名称重复
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) { // 验证key值的合法性
      // 将_data中的数据挂载到组件vm上,这样就可以通过this.xxx访问到组件上的数据
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  // 响应式监听data是数据的变化
  observe(data, true /* asRootData */)
}
```

阅读上面的源码后，可以得到以下结论：

- 初始化顺序：`props`、`methods`、`data`
- `data` 定义的时候可选择函数形式或者对象形式（组件只能为函数形式）

`_init` 中还提到挂载方式是调用 `vm.$mount` 方法，源码：[src/platforms/web
/runtime-with-compiler.ts](https://github.com/vuejs/vue/blob/main/src/platforms/web/runtime-with-compiler.ts#L21)

```js
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  // 获取或查询元素
  el = el && query(el)

  /* istanbul ignore if */
  // vue 不允许直接挂载到body或页面文档上
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  if (!options.render) {
    let template = options.template
    // 存在template模板，解析vue模板文件
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // 通过选择器获取元素内容
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }
      /**
       *  1.将temmplate解析ast tree
       *  2.将ast tree转换成render语法字符串
       *  3.生成render方法
       */
      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)
}
```

阅读上面的源码后，可以得到以下结论：

- 不要将根元素放到 `body` 或者 `html` 上
- 可以在对象中定义 `template/render` 或者直接使用 `template`、`el` 表示元素选择器
- 最终都会解析成 `render` 函数，调用 `compileToFunctions`，会将 `template` 解析成 `render` 函数

对 `template` 的解析步骤大致分为以下几步：

- 将 `html` 文档片段解析成 `ast` 描述符
- 将 `ast` 描述符解析成字符串
- 生成 `render` 函数

生成 `render` 函数，挂载到 `vm` 上后，会再次调用 `mount` 方法，源码：[src/platforms/web/runtime/index.ts](https://github.com/vuejs/vue/blob/main/src/platforms/web/runtime/index.ts#L36)

```js
// public mount method
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  // 渲染组件
  return mountComponent(this, el, hydrating)
}
```

其中调用 `mountComponent` 渲染组件，源码：[src/core/instance/lifecycle.ts](https://github.com/vuejs/vue/blob/main/src/core/instance/lifecycle.ts#L147)\

```js
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
  // 如果没有获取解析的render函数，则会抛出警告
  // render是解析模板文件生成的
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        // 没有获取到vue的模板文件
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }
  // 执行beforeMount钩子
  callHook(vm, 'beforeMount')

  let updateComponent
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    // 定义更新函数
    updateComponent = () => {
      // 实际调⽤是在lifeCycleMixin中定义的_update和renderMixin中定义的_render
      vm._update(vm._render(), hydrating)
    }
  }
  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  // 监听当前组件状态，当有数据变化时，更新组件
  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        // 数据更新引发的组件更新
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
```

阅读上面的代码，我们得到以下结论：

- 会触发 `beforeMount` 钩子
- 定义 `updateComponent` 渲染页面视图的方法
- 监听组件数据，一旦发生变化，触发 `beforeUpdate` 生命钩子

`updateComponent` 方法主要执行在 Vue 初始化时声明的 `render`、`update` 方法。`render` 的作用主要是生成 `vnode`，源码：[src/core/instance/render.ts](https://github.com/vuejs/vue/blob/main/src/core/instance/render.ts#L103)

```js
// 定义vue 原型上的render方法
Vue.prototype._render = function (): VNode {
  const vm: Component = this
  // render函数来自于组件的option
  const { render, _parentVnode } = vm.$options

  if (_parentVnode) {
    vm.$scopedSlots = normalizeScopedSlots(
      _parentVnode.data.scopedSlots,
      vm.$slots,
      vm.$scopedSlots
    )
  }

  // set parent vnode. this allows render functions to have access
  // to the data on the placeholder node.
  vm.$vnode = _parentVnode
  // render self
  let vnode
  try {
    // There's no need to maintain a stack because all render fns are called
    // separately from one another. Nested component's render fns are called
    // when parent component is patched.
    currentRenderingInstance = vm
    // 调用render方法，自己的独特的render方法， 传入createElement参数，生成vNode
    vnode = render.call(vm._renderProxy, vm.$createElement)
  } catch (e) {
    handleError(e, vm, `render`)
    // return error render result,
    // or previous vnode to prevent render error causing blank component
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production' && vm.$options.renderError) {
      try {
        vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e)
      } catch (e) {
        handleError(e, vm, `renderError`)
        vnode = vm._vnode
      }
    } else {
      vnode = vm._vnode
    }
  } finally {
    currentRenderingInstance = null
  }
  // if the returned array contains only a single node, allow it
  if (Array.isArray(vnode) && vnode.length === 1) {
    vnode = vnode[0]
  }
  // return empty vnode in case the render function errored out
  if (!(vnode instanceof VNode)) {
    if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
      warn(
        'Multiple root nodes returned from render function. Render function ' +
        'should return a single root node.',
        vm
      )
    }
    vnode = createEmptyVNode()
  }
  // set parent
  vnode.parent = _parentVnode
  return vnode
}
```

`_update` 主要功能是调用 `patch`，将 `vnode` 转换为真实 `DOM`，并且更新到页面中，源码：[src/core/instance/lifecycle.ts](https://github.com/vuejs/vue/blob/main/src/core/instance/lifecycle.ts#L63)

```js
Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
  const vm: Component = this
  const prevEl = vm.$el
  const prevVnode = vm._vnode
  // 设置当前激活的作用域
  const restoreActiveInstance = setActiveInstance(vm)
  vm._vnode = vnode
  // Vue.prototype.__patch__ is injected in entry points
  // based on the rendering backend used.
  if (!prevVnode) {
    // initial render
    // 执行具体的挂载逻辑
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
  } else {
    // updates
    vm.$el = vm.__patch__(prevVnode, vnode)
  }
  restoreActiveInstance()
  // update __vue__ reference
  if (prevEl) {
    prevEl.__vue__ = null
  }
  if (vm.$el) {
    vm.$el.__vue__ = vm
  }
  // if parent is an HOC, update its $el as well
  if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
    vm.$parent.$el = vm.$el
  }
  // updated hook is called by the scheduler to ensure that children are
  // updated in a parent's updated hook.
}
```

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

创建 Vue 实例，存放 `isShow` 和 `items` 数据

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

### 什么是首屏加载

首屏时间（First Contentful Paint），指的是浏览器从响应用户输入网址地址，到首屏内容渲染完成的时间，此时整个网页不一定要全部渲染完成，但需要展示当前视窗需要的内容。可以通过 `performance` 来计算出首屏时间：

```js
performance.getEntriesByName('first-contentful-paint')[0].startTime

// performance.getEntriesByName("first-contentful-paint")[0]
// 会返回一个 PerformancePaintTiming 的实例，结构如下
{
  name: "first-contentful-paint",
  entryType: "paint",
  startTime: 240,
  duration: 0,
};
```

### 加载慢的原因

- 网络延时问题
- 资源文件体积是否过大
- 资源是否重复发送请求去加载了
- 加载脚本的时候，渲染内容堵塞了

### 解决方案

- 减小入口文件体积
- 静态资源本地缓存
- UI 框架按需加载
- 图片资源的压缩
- 组件重复打包
- 开启 `GZip` 压缩
- 使用 SSR

#### 减小入口文件体积

常用的手段是路由懒加载，把不同路由对应的组件分割成不同的代码块，待路由被请求的时候会单独打包路由，使得入口文件变小，加载速度大大增加

在 `vue-router` 配置路由的时候，采用动态加载路由的形式

```js
routes: [
  path: 'Blogs',
  name: 'ShowBlogs',
  component: () => import('./component/ShowBlogs.vue')
]
```

以函数的形式加载路由，这样就可以把各自的路由文件分别打包，只有在解析给定的路由时，才会加载路由组件

#### 静态资源本地缓存

后端返回资源：

- 采用 HTTP 缓存，设置 `Cache-Control`，`Last-Modified`，`E-tag` 等响应头
- 采用 `Servive Worker` 离线缓存

前端合理利用 `localStorage`

#### UI框架按需加载

在日常使用 UI 框架，例如 `Element-UI`，经常直接引用整个 UI 库

```js
import ElementUI from 'element-ui';
Vue.use(ElementUI);
```

但实际上我用到的组件只有其中几个，所以要按需引用

```js
import { Button, Input, Pagination } from 'element-ui';
Vue.use(Button);
Vue.use(Input);
Vue.use(Pagination);
```

#### 组件重复打包

假设 `A.js` 文件是一个常用的库，现在有多个路由使用了 `A.js` 文件，这就造成了重复下载。解决方案：在 webpack 的 config 文件中，修改 `CommonsChunkPlugin` 的配置

```js
minChunks: 3
```

`minChunks` 为 3 表示会把使用 3 次以上的包抽离出来，放进公共依赖文件，避免了重复加载组件

#### 图片资源的压缩

图片资源虽然不在编码过程中，但它却是对页面性能影响最大的因素

对与所有的图片资源，我们可以进行适当的压缩

对页面上使用到的 icon，可以使用在线字体图标，或者雪碧图，将众多小图标合并到同一张图上，用以减轻 `http` 请求压力

#### 开启 GZip 压缩

拆完包之后，我们再用 gzip 做一下压缩，安装 `compression-webpack-plugin` 后，在 `vue.config.js` 中引入并修改 webpack 配置

```js
const CompressionPlugin = require('compression-webpack-plugin');
configureWebpack: (config) => {
  if (process.env.NODE_ENV === 'production') {
    config.mode = 'production';
    return {
      plugins: [new CompressionPlugin({
        test: /\.js$|\.html$|\.css/, // 匹配文件后缀
        threshold: 10240, // 对超过 10k 的数据进行压缩
        deleteOriginalAssets: false, // 是否删除源文件
      })]
    }
  }
}
```

在服务器我们也要做相应的配置，如果发送请求的浏览器支持 gzip，就发送给它 gzip 格式的文件

#### 使用 SSR

SSR，也就是服务端渲染，组件或页面通过服务器生成 html 字符串，再发送到浏览器

### 总结

减少首屏渲染时间的方法有很多，总得来讲可以氛围两大部分：`资源加载优化` 和 `页面渲染优化`

![](https://static.vue-js.com/4fafe900-3acc-11eb-85f6-6fac77c0c9b3.png)

## 为什么 `data` 属性是一个函数而不是一个对象？

创建 vue 实例时，定义的 `data` 属性既可以是一个对象，也可以是一个函数。而在组件中定义 `data` 属性，只能是一个函数

### 组件 `data` 定义函数与对象的区别

上面讲到组件 `data` 必须是一个函数，不知道大家有没有思考过这是为什么呢？

在我们定义好一个组件的时候，vue 最终都会通过 `Vue.extend()` 构建组件实例

这里我们模仿组件构造函数，定义 `data` 属性，采用对象的形式

```js
function Component() {}

Component.prototype.data = {
  count: 0
};
```

创建两个组件实例

```js
const componentA = new Component();
const componentB = new Component();
```

修改 `componentA` 组件 `data` 属性的值，`componentB` 中的值也发生了改变

```js
console.log(componentB.data.count); // 0
componentA.data.count = 1;
console.log(componentB.data.count); // 1
```

产生这样的原因就是这两者共用了同一个内存地址，`componentA` 修改内容的同时，`componentB` 的值也被改变。如果我们采用函数的形式，则不会出现这种情况（函数返回的对象内存地址并不相同）

```js
function Component() {}

Component.prototype.data = function() {
  return { count: 0 };
};
```

vue 组件可能会有很多个实例，采用函数返回一个全新的 `data`，使得每个实例对象的数据不会受到其他实例的污染

### 源码分析

组件在创建的时候，会进行选项的合并，自定义组件会进入 `mergeOptions` 进行选项合并

```js
Vue.prototype._init = function (options?: Object) {
  ...
  // merge options
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options)
  } else {
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    )
  }
  ...
}
```

定义 `data` 会进行数据校验，这个时候 `vm` 实例为 `undefined`，进入 `if` 判断，若 `data` 类型不是 `function`，则出现警告提示

```js
strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    if (childVal && typeof childVal !== "function") {
      process.env.NODE_ENV !== "production" &&
        warn(
          'The "data" option should be a function ' +
            "that returns a per-instance value in component " +
            "definitions.",
          vm
        );

      return parentVal;
    }
    return mergeDataOrFn(parentVal, childVal);
  }
  return mergeDataOrFn(parentVal, childVal, vm);
};
```

## 为什么动态给 Vue 的 `data` 添加一个新的属性界面不刷新？

### 原理分析

Vue2.x 是通过 `Object.defineProperty` 实现数据响应式

```js
const obj = {};
Object.defineProperty(obj, 'foo', {
  get() {
    console.log(`get foo: ${val}`);
    return val;
  },
  set(newVal) {
    if (newVal !== val) {
      console.log(`set foo: ${newVal}`);
      val = newVal;
    }
  }
});
```

当我们访问 `foo` 属性和给 `foo` 赋值的时候都能触发 `setter` 和 `getter`，但是我们为 `obj` 添加新属性的时候，却无法触发事件属性的拦截。原因是一开始 `obj` 的 `foo` 属性被设成了响应式数据，而 `bar` 是后面新增的属性，并没有通过 `Object.defineProperty` 设置成响应式数据

### 解决方案

Vue 不允许在已经创建的实例上动态添加新的响应式属性，若想实现数据与视图的同步更新，可采取下面三种解决方案：

- `Vue.set()`
- `Object.assign()`
- `$forceUpdate()`

#### Vue.set(target, propertyName/index, value)

通过 `Vue.set` 向响应式对象中添加一个 `property`，并确保这个新 `property` 同样是响应式的，且触发视图更新，源码：[src/core/observer/index.ts](https://github.com/vuejs/vue/blob/main/src/core/observer/index.ts#L223)

```js
function set (target: Array<any> | Object, key: any, val: any): any {
  ...
  defineReactive(ob.value, key, val);
  ob.dep.notify();
  return val;
}
```

这里无非再次调用 `defineProperty` 方法，实现新增属性的响应式。关于 `defineReactive` 方法，内部还是通过 `Object.defineProperty` 实现属性拦截

```js
function defineReactive(obj, key, val) {
  Object.defineProperty(obj, key, {
    get() {
      console.log(`get ${key}:${val}`);
      return val;
    },
    set(newVal) {
      if (newVal !== val) {
        console.log(`set ${key}:${newVal}`);
        val = newVal;
      }
    }
  });
}
```

#### Object.assign

直接使用 `Object.assign` 添加到对象的新属性不会触发更新，应创建一个新的对象，合并原对象和混入对象的属性

```js
this.someObject = Object.assign({}, this.someObject, { newProperty1: 1, newProperty1: 2, ... });
```

#### $forceUpdate

如果你发现你需要在 Vue 中做一次强制更新，99.9% 的情况，是你在某个地方做错了事，`$forceUpdate` 迫使 Vue 实例重新渲染

PS：仅仅影响实例本身和插入插槽内容的子组件，而不是所有子组件

### 小结

- 如果为对象添加少量的新属性，可以直接采用 `Vue.set()`
- 如果需要为新对象添加大量的新属性，则通过 `Object.assign()` 创建新对象
- 如果你实在不知道怎么操作时，可采取 `$forceUpdate` 进行强制刷新（不建议）

PS：`vue3` 是通过 `proxy` 实现数据响应式的，直接动态添加新属性仍可以实现属性响应式

## Vue 组件之间的通信方式总结

### 组件间通信的分类

- 父子组件之间的通信
- 兄弟组件之间的通信
- 祖孙与后代组件之间的通信
- 非关系组件间之间的通信

![](https://static.vue-js.com/85b92400-3aca-11eb-ab90-d9ae814b240d.png)

### 组件间通信的方案

- 通过 `props` 传递数据
- 通过 `$emit` 触发自定义事件
- 使用 `ref`
- EventBus
- `$parent` 或 `$root`
- `attrs` 与 `listeners`
- `provide` 与 `inject`
- Vuex

#### 通过 `props` 传递

适用场景：父组件传递数据给子组件

子组件设置 `props` 属性，定义接收父组件传递过来的参数，父组件在使用子组件标签中通过字面量来传递值

#### 通过 `$emit` 触发自定义事件

适用场景：子组件传递数据给父组件

子组件通过 `$emit` 触发自定义事件，`$emit` 第二个参数为传递的数值，父组件绑定监听器获取到子组件传递过来的值

#### 使用 `ref`

父组件在使用子组件的时候设置 `ref`，父组件通过设置子组件 `ref` 来获取数据

#### EventBus

适用场景：兄弟组件传值

创建一个中央事件总线 `EventBus`，兄弟组件通过 `$emit` 触发自定义事件，`$emit` 第二个参数为传递的数值，另一个兄弟组件通过 `$on` 监听自定义事件

```js
class Bus {
  constructor() {
    this.callbacks = {};
  }

  $on(name, fn) {
    this.callbacks[name] = this.callbacks[name] || [];
    this.callbacks[name].push(fn);
  }

  $emit(name, args) {
    if (this.callbacks[name]) {
      this.callbacks[name].forEach(cb => cb(args));
    }
  }
}

// main.js
Vue.prototype.$bus = new Bus(); // 将 $bus 挂载到 Vue 实例的原型上
// 另一种方式
Vue.prototype.$bus = new Vue(); // Vue 已经实现了 Bus 的功能
```

```js
// Children1.vue
this.$bus.$emit('foo');
// Children2.vue
this.$bus.$on('foo', this.handle);
```

#### `$parent` 或 `$root`

适用场景：兄弟组件传值

通过共同祖辈 `$parent` 或者 `$root` 搭建通信桥连

兄弟组件：`this.$parent.on('add', this.add)`

另一个兄弟组件：`this.$parent.emit('add')`

#### `attrs` 与 `listeners`

适用场景：父组件传递数据给子组件

设置批量向下传属性 `$attrs` 和 `$listeners`，包含了父级作用域中不作为 `prop` 被识别（且获取）的特性绑定（class 和 style 除外），可以通过 `v-bind=$attrs` 传入内部组件

#### `provide` 与 `inject`

适用场景：祖先传递数据给子孙

在祖先组件定义 `provide` 属性，返回传递的值，在后代组件通过 `inject` 接收组件传递过来的值

```js
// 祖先组件
provide() {
  return {
    foo: 'foo',
  };
}

// 后代组件
inject: ['foo'] // 获取到祖先组件传递过来的值
```

#### Vuex

适用场景：复杂关系的组件数据传递

Vuex 的作用相当于一个用来存储共享变量的容器

![](https://static.vue-js.com/fa207cd0-3aca-11eb-ab90-d9ae814b240d.png)

- `state` 用来存储共享变量的地方
- `getter`：可以增加一个 `getter` 派生状态（相当于 `store` 中的计算属性），用来获取共享变量的的值
- `mutations` 用来存储修改 `state` 的方法
- `actions` 也是用来存放修改 `state` 的方法，不过 `action` 是在 `mutations` 的基础上进行。常用来做一些异步操作

## 双向数据绑定

### 双向绑定的原理

双向绑定由三个重要部分构成：

- 数据层（Model）：应用的数据及业务逻辑
- 视图层（View）：应用的展示效果，各类 UI 组件
- 业务逻辑层（ViewModel）：框架封装的核心，它负责将数据与视图关联起来

#### 理解 MVVM

它的主要职责就是：

- 数据变化后更新视图
- 视图变化后更新数据

它还有两个主要组成部分：

- **监听器（Observer）**：对所有数据的属性进行监听
- **解析器（Compiler）**：对每个元素节点的指令进行扫描跟解析，根据指令模板替换数据，以及绑定相应的更新函数

### 实现双向绑定

还是以 Vue 为例，先看看 Vue 中的双向绑定流程是什么

1. `new Vue()` 首先执行初始化，对 `data` 执行响应化处理，这个过程发生在 `Observer` 中
2. 同时对模板执行编译，找到其中动态绑定的数据，从 `data` 中获取并初始化视图，这个过程发生在 `Compiler` 中
3. 同时定义一个更新函数 `Updater` 和 `Watcher`，将来对应数据变化时 `Watcher` 会调用更新函数
4. 由于 `data` 的某个 `key` 在一个视图中可能出现多次，所以每个 `key` 都需要一个管家 `Dep` 来管理多个 `Watcher`
5. 将来 `data` 中数据一旦发生变化，会首先找到对应的 `Dep`，通知所有 `Watcher` 执行更新函数

![](https://static.vue-js.com/e5369850-3ac9-11eb-85f6-6fac77c0c9b3.png)

#### 实现

先来一个构造函数：执行初始化，对 `data` 执行响应化处理

```js
class Vue {
  constructor(options) {
    this.$options = options;
    this.$data = options.data;

    // 对 data 选项做响应式处理
    observe(this.$data);

    // 代理 data 到 vm 上
    proxy(this);

    // 执行编译
    new Compile(options.el, this);
  }
}
```

对 `data` 选项执行响应化具体操作

```js
function observe(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }
  new Observer(obj);
}

class Observer {
  constructor(value) {
    this.value = value;
    this.walk(value);
  }

  walk(obj) {
    Object.keys(obj).forEach(key => {
      defineReactive(obj, key, obj[key]);
    });
  }
}
```

**编译 `Compile`**

对每个元素节点的指令进行扫描跟解析，根据指令模板替换数据，以及绑定相应的更新函数

![](https://static.vue-js.com/f27e19c0-3ac9-11eb-85f6-6fac77c0c9b3.png)

```js
class Compile {
  constructor(el, vm) {
    this.$vm = vm;
    this.$el = document.querySelector(el); // 获取 dom
    if (this.$el) {
      this.compile(this.$el);
    }
  }

  compile(el) {
    const childNodes = el.childNodes;
    Array.from(childNodes).forEach(node => { // 遍历子元素
      if (this.isElement(node)) { // 判断是否为节点
        console.log('编译元素' + node.nodeName);
      } else if (this.isInterpolation(node)) {
        console.log('编译插值文本' + node.textContent); // 判断是否为插值文本 {{}}
      }
      if (node.childNodes && node.chilNodes.length > 0) { // 判断是否有子元素
        this.compile(node); // 对子元素进行递归遍历
      }
    });
  }

  isElement(node) {
    return node.nodeType === 1;
  }

  isInterpolation(node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
  }
}
```

**依赖收集**

视图中会用到 `data` 中某 `key`，这称之为依赖。同一个 `key` 可能出现多次，每次都需要收集出来用一个 `Watcher` 来维护它们，此过程称为依赖收集。多个 `Watcher` 需要一个 `Dep` 来管理，需要更新时由 `Dep` 统一通知

![](https://static.vue-js.com/fa191f40-3ac9-11eb-ab90-d9ae814b240d.png)

实现思路

1. `defineReactive` 时为每一个 `key` 创建一个 `Dep` 实例
2. 初始化视图时读取某个 `key`，例如 `name1`，创建一个 `Watcher1`
3. 由于触发 `name1` 的 `getter` 方法，便将 `Watcher1` 添加到 `name1` 对应的 `Dep` 中
4. 当 `name1` 更新，`setter` 触发时，便可通过对应的 `Dep` 通知其管理所有 `Watcher` 更新

```js
// 负责更新视图
class Watcher {
  constructor(vm, key, updater) {
    this.vm = vm;
    this.key = key;
    this.updateFn = updater;

    // 创建实例时，把当前实例指定到 Dep.target 静态属性上
    Dep.target = this;
    // 读一下 key，触发 get
    vm[key]
    // 置空
    Dep.target = null;
  }

  // 未来执行 dom 更新函数，由 dep 调用的
  update() {
    this.updateFn.call(this.vm, this.vm[this.key]);
  }
}
```

声明 `Dep`
```js
class Dep {
  constructor() {
    this.deps = []; // 依赖管理
  }

  addDep(dep) {
    this.deps.push(dep);
  }

  notify() {
    this.deps.forEach(dep => dep.update());
  }
}
```

创建 `watcher` 时触发 `getter`
```js
class Watcher {
  constructor(vm, key, uodateFn) {
    Dep.target = this;
    this.vm[this.key];
    Dep.target = null;
  }
}
```

依赖收集，创建 `Dep` 实例
```js
function defineReactive(obj, key, val) {
  this.observe(val);
  const dep = new Dep();
  Object.defineProperty(obj, key, {
    get() {
      Dep.target && dep.addDep(Dep.target); // Dep.target 也就是 Watcher 实例
      return val;
    },
    set(newVal) {
      if (newVal === val) return;
      dep.notify(); // 通知 dep 执行更新方法
    }
  });
}
```

## Vue $nextTick

### nextTick 是什么

官方对其的定义：

> 在下次 DOM 更新循环结束之后执行延迟回调。在修改数据之后立即使用这个方法，获取更新后的 DOM

我们可以理解成，Vue 在更新 DOM 时是异步执行的。当数据发生变化时，Vue 将开启一个异步更新队列，视图需要等队列中所有的数据变化完成之后，再统一进行更新。

```vue
<template>
<div id="app"> {{ message }} </div>
</template>

<script>
export default {
  el: '#app',
  data() {
    return {
      message: '原始值'
    };
  }
})
</script>
```

修改 `message`，这时候想获取页面最新的 DOM 节点，却发现获取到的是旧值

```js
this.message = '修改后的值1'
this.message = '修改后的值2'
this.message = '修改后的值3'

console.log(vm.$el.textContent); // 原始值
```

这是因为 `message` 在数据发生变化的时候，Vue 并不会立刻去更新 DOM，而是将修改数据的操作放在了一个异步操作队列中。如果我们一直修改相同的数据，异步操作队列还会进行去重。等待同一事件循环中的所有数据变化完成之后，会将队列中的事件拿出来进行处理，进行 DOM 的更新

**为什么要有 nextTick**

```js
{{ num }}
for (let i = 0; i < 100000; i++) {
  num = i;
}
```

如果没有 `nextTick` 更新机制，那么 `num` 每次更新值都会触发视图更新，有了 `nextTick` 机制，只需要更新一次，所以 `nextTick` 本质是一种优化策略

### 使用场景

如果想要在修改数据后立刻得到更新后的 DOM 结构，可以使用 `Vue.nextTick()`，第一个参数为：回调函数（可以获取最新的 DOM 结构），第二个参数为：执行函数上下文

```js
// 修改数据
vm.message = '修改后的值'
// DOM 还没有更新
console.log(vm.$el.textContent) // 原始的值
Vue.nextTick(function () {
  // DOM 更新了
  console.log(vm.$el.textContent) // 修改后的值
})
```

组件内使用 `vm.$nextTick()` 实例方法只需要通过 `this.$nextTick()`，并且回调函数中的 `this` 将自动绑定到当前的 Vue 实例上

```js
this.message = '修改后的值'
console.log(this.$el.textContent) // 原始的值
this.$nextTick(function () {
  console.log(this.$el.textContent) // 修改后的值
})
```

`$nextTick()` 会返回一个 `Promise` 对象，可以使用 `async/await` 完成相同作用的事情

```js
this.message = '修改后的值'
console.log(this.$el.textContent) // 原始的值
await this.$nextTick()
console.log(this.$el.textContent) // 修改后的值
```

### 实现原理

源码位置：[src/core/util/next-tick.ts](https://github.com/vuejs/vue/blob/main/src/core/util/next-tick.ts)

`callbacks` 也就是异步操作队列，`callbacks` 新增回调函数后又执行了 `timeFunc` 函数，`pending` 是用来标识同一个时间只能执行一次。

```js
export function nextTick(cb?: Function, ctx?: Object) {
  let _resolve;

  // cb 回调函数会经统一处理压入 callbacks 数组
  callbacks.push(() => {
    if (cb) {
      // 给 cb 回调函数执行加上了 try-catch 错误处理
      try {
        cb.call(ctx);
      } catch (e) {
        handleError(e, ctx, 'nextTick');
      }
    } else if (_resolve) {
      _resolve(ctx);
    }
  });

  // 执行异步延迟函数 timerFunc
  if (!pending) {
    pending = true;
    timerFunc();
  }

  // 当 nextTick 没有传入函数参数的时候，返回一个 Promise 化的调用
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve;
    });
  }
}
```

`timerFunc` 函数定义，这里是根据当前环境支持什么方法则确定调用哪个，分别有：

`Promise.then`、`MutationObserver`、`setImmediate`、`setTimeout`

通过上面任意一种方法，进行降级操作

```js
export let isUsingMicroTask = false
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  // 判断1：是否原生支持Promise
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // 判断2：是否原生支持MutationObserver
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // 判断3：是否原生支持setImmediate
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // 判断4：上面都不行，直接用setTimeout
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
```

无论是微任务还是宏任务，都会放到 `flushCallbacks` 使用，这里将 `callbacks` 里面的函数复制一份，同时 `callbacks` 置空，依次执行 `callbacks` 里面的函数。

```js
function flushCallbacks() {
  pending = false;
  const copies = callbacks.slice(0);
  callbacks.length = 0;
  for (let i = 0; i < copies.length; ++i) {
    copies[i]();
  }
}
```

#### 小结

1. 把回调函数放入 `callbacks` 等待执行
2. 将执行函数放到微任务或者宏任务中
3. 事件循环到了微任务或者宏任务，执行函数依次执行 `callbacks` 中的回调

## Vue mixin

### mixin 是什么

`mixin` 是面向对象程序设计语言中的类，提供了方法的实现。其他类可以访问 `mixin` 类的方法而不必成为其子类。

`mixin` 类通常作为功能模块使用，在需要该功能时“混入”，有利于代码复用又避免了多继承的复杂。

#### Vue 中的 `mixin`

> `mixin`（混入），提供了一种非常灵活的方式，来分发 Vue 组件中的可复用功能。

本质上是一个 `js` 对象，它可以包含我们组件中任意功能选项，如 `data`、`components`、`methods`、`created`、`computed` 等等。

我们只要将共用的功能以对象的方式传入 `mixins` 选项中，当组件使用 `mixins` 对象时所有 `mixins` 对象的选项都将被混入该组件本身的选项中来。

在 Vue 中我们可以使用 **局部混入** 和 **全局混入**

#### 局部混入

定义一个 `mixin` 对象，有组件 `options` 的 `data`、`methods` 属性

```js
var myMixin = {
  created: function () {
    this.hello()
  },
  methods: {
    hello: function () {
      console.log('hello from mixin!')
    }
  }
}
```

组件通过 `mixins` 属性调用 `mixin` 对象

```js
Vue.component('componentA',{
  mixins: [myMixin]
})
```

该组件在使用的时候，混合了 `mixin` 里面的方法，在自动执行 `created` 生命钩子，执行 `hello` 方法

#### 全局混入

通过 `Vue.mixin()` 进行全局混入

```js
Vue.mixin({
  created: function() {
    console.log('全局混入')
  }
})
```

使用全局混入需要特别注意，因为它会影响到每一个组件实例（包括第三方组件）

PS：全局混入常用于插件的编写

#### 注意事项

当组件存在于 `mixin` 对象相同的选项的时候，进行递归合并的时候组件的选项会覆盖 `mixin` 的选项

但是如果相同选项为生命周期钩子的时候，会合并成一个数组，先执行 `mixin` 的钩子，再执行组件的钩子

### 使用场景

在日常的开发中，我们经常会遇到在不同的组件中经常会需要用到一些相同或者相似的代码，这些代码的功能相对独立。

这时，可以通过 Vue 的 mixin 功能将相同或者相似的代码提出来

举个例子

定义一个 `Modal` 弹窗组件，内部通过 `isShowing` 来控制显示

```js
const Modal = {
  template: '#modal',
  data() {
    return {
      isShowing: false
    }
  },
  methods: {
    toggleShow() {
      this.isShowing = !this.isShowing;
    }
  }
}
```

定义一个 `tooltip` 提示框，内部通过 `isShowing` 来控制显示

```js
const Tooltip = {
  template: '#tooltip',
  data() {
    return {
      isShowing: false
    }
  },
  methods: {
    toggleShow() {
      this.isShowing = !this.isShowing;
    }
  }
}
```

通过观察上面两个组件，发现二者的逻辑是相同，代码控制显示也是相同的，这时 `mixin` 就派上用场了。

首先抽出共同代码，编写一个 `mixin`

```js
const toggle = {
  data() {
    return {
      isShowing: false
    }
  },
  methods: {
    toggleShow() {
      this.isShowing = !this.isShowing;
    }
  }
}
```

两个组件在使用上，只需要引入 `mixin`

```js
const Modal = {
  template: '#modal',
  mixins: [toggle]
}

const Tooltip = {
  template: 'tooltip',
  mixins: [toggle]
}
```

### 源码分析

首先从 `Vue.mixin` 入手，源码位置：[src/core/global-api/mixin.ts](https://github.com/vuejs/vue/blob/main/src/core/global-api/mixin.ts)

```js
export function initMixin(Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
```

主要是调用 `mergeOptions` 方法，源码位置：[src/core/util/options.ts](https://github.com/vuejs/vue/blob/main/src/core/util/options.ts)

```js
export function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {

  if (child.mixins) { // 判断有没有mixin 也就是mixin里面挂mixin的情况 有的话递归进行合并
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm)
    }
  }

  const options = {}
  let key
  for (key in parent) {
    mergeField(key) // 先遍历parent的key 调对应的strats[XXX]方法进行合并
  }
  for (key in child) {
    if (!hasOwn(parent, key)) { // 如果parent已经处理过某个key 就不处理了
      mergeField(key) // 处理child中的key 也就parent中没有处理过的key
    }
  }
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key) // 根据不同类型的options调用strats中不同的方法进行合并
  }
  return options
}
```

- 优先递归处理 `mixins`
- 先遍历合并 `parent` 中的 `key`，调用 `mergeField` 方法进行合并，然后保存在变量 `options`
- 再遍历 `child`，合并补上 `parent` 中没有的 `key`，调用 `mergeField` 方法进行合并，并保存在变量 `options`
- 通过 `mergeField` 函数进行了合并

下面是关于 Vue 的几种类型的合并策略：

- 替换型
- 合并型
- 队列型
- 叠加型

#### 替换型

替换型合并有 `props`、`methods`、`inject`、`computed`

```js
strats.props =
strats.methods =
strats.inject =
strats.computed = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  if (!parentVal) return childVal // 如果parentVal没有值，直接返回childVal
  const ret = Object.create(null) // 创建一个第三方对象 ret
  extend(ret, parentVal) // extend方法实际是把parentVal的属性复制到ret中
  if (childVal) extend(ret, childVal) // 把childVal的属性复制到ret中
  return ret
}
strats.provide = mergeDataOrFn
```

如果 Mixin 和组件中存在同名的选项，组件中的选项会覆盖 Mixin 中的选项。

#### 合并型

合并型合并有 `data`

```js
strats.data = function(parentVal, childVal, vm) {
  return mergeDataOrFn(
    parentVal, childVal, vm
  )
};

function mergeDataOrFn(parentVal, childVal, vm) {
  return function mergedInstanceDataFn() {
    var childData = childVal.call(vm, vm) // 执行data挂的函数得到对象
    var parentData = parentVal.call(vm, vm)
    if (childData) {
      return mergeData(childData, parentData) // 将2个对象进行合并
    } else {
      return parentData // 如果没有childData 直接返回parentData
    }
  }
}

function mergeData(to, from) {
  if (!from) return to
  var key, toVal, fromVal;
  var keys = Object.keys(from);
  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    toVal = to[key];
    fromVal = from[key];
    // 如果不存在这个属性，就重新设置
    if (!to.hasOwnProperty(key)) {
      set(to, key, fromVal);
    }
    // 存在相同属性，合并对象
    else if (typeof toVal =="object" && typeof fromVal =="object") {
      mergeData(toVal, fromVal);
    }
  }
  return to
}
```

`mergeData` 函数遍历了要合并的 data 的所有属性，然后根据不同情况进行合并：

- 当目标 data 对象不包含当前属性时，调用 `set` 方法进行合并（set方法其实就是一些合并重新赋值的方法）
- 当目标 data 对象包含当前属性并且当前值为纯对象时，递归合并当前对象值，这样做是为了防止对象存在新增属性

#### 队列型

队列型合并有全部生命周期和 `watch`

```js
function mergeHook (
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  return childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
}

LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook
})

// watch
strats.watch = function (
  parentVal,
  childVal,
  vm,
  key
) {
  // work around Firefox's Object.prototype.watch...
  if (parentVal === nativeWatch) { parentVal = undefined; }
  if (childVal === nativeWatch) { childVal = undefined; }
  /* istanbul ignore if */
  if (!childVal) { return Object.create(parentVal || null) }
  {
    assertObjectType(key, childVal, vm);
  }
  if (!parentVal) { return childVal }
  var ret = {};
  extend(ret, parentVal);
  for (var key$1 in childVal) {
    var parent = ret[key$1];
    var child = childVal[key$1];
    if (parent && !Array.isArray(parent)) {
      parent = [parent];
    }
    ret[key$1] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child];
  }
  return ret
};
```

生命周期钩子和 `watch` 被合并为一个数组，然后正序遍历一次执行

#### 叠加型

叠加型合并有 `component`、`directives`、`filters`

```js
strats.components=
strats.directives=
strats.filters = function mergeAssets(
  parentVal, childVal, vm, key
) {
  var res = Object.create(parentVal || null);
  if (childVal) {
    for (var key in childVal) {
      res[key] = childVal[key];
    }
  }
  return res
}
```

这些选项通过原型链进行层层叠加。如果 Mixin 和组件中都定义了同名的选项，组件中的选项会覆盖 Mixin 中的选项。

#### 小结

- 替换型策略有 `props`、`methods`、`inject`、`computed`，就是将新的同名参数替代旧的参数
- 合并型策略是 `data`，通过 `set` 方法进行合并和重新赋值
- 队列型策略有生命周期函数和 `watch`，原理是将函数存入一个数组，然后正序遍历依次执行
- 叠加型有 `component`、`directives`、`filters`，通过原型链进行层层叠加

## Vue Observable

### Observable 是什么

`Observable` 翻译过来是可观察的。我们先来看一下其在 Vue 中的定义

> `Vue.observable`，让一个对象变成响应式数据，Vue 内部会用它来处理 `data` 函数返回的对象

返回的对象可以直接用于渲染函数和计算属性内，并且会在发生变更时触发相应的更新。也可以作为最小化跨组件状态存储器。

```js
Vue.observable({ count: 1 })
// 等同于
new Vue({ count: 1 })
```

在 `Vue 2.x` 中，被传入的对象直接被 `Vue.observable` 变更，它和被返回的对象是同一个对象

在 `Vue 3.x` 中，则会返回一个可响应的代理，而对源对象直接进行变更仍然是不可响应的

### 使用场景

在非父子组件通信时，可以使用通常的 `EventBus` 或者使用 `Vuex`，但是实现的功能不是太复杂，而使用上面两个又有点繁琐。这时，`observable` 就是一个很好的选择。

创建一个 `js` 文件

```js
import Vue from 'vue';
export const state = Vue.observable({
  name: '张三',
  age: 30,
});
// 创建对应的方法
export const mutations = {
  changeName(name) {
    state.name = name;
  },
  setAge(age) {
    state.age = age;
  }
}
```

在 `.vue` 文件中直接使用即可

```js
<template>
  <div>
    姓名：{{ name }}
    年龄：{{ age }}
    <button @click="changeName('李四')">改变姓名</button>
    <button @click="setAge(18)">改变年龄</button>
  </div>
</template>
<script>
  import { state, mutations } from '@/store';
  export default {
    computed: {
      name() {
        return state.name;
      },
      age() {
        return state.age;
      }
    },
    methods: {
      changeName: mutations.changeName,
      changeAge: mutations.changeAge
    }
  }
</script>
```

### 原理分析

源码位置：[src/core/observer/index.ts](https://github.com/vuejs/vue/blob/main/src/core/observer/index.ts)

## Vue 中的 key 的原理

### key 是什么

开始之前，我们先还原两个实际工作场景

1. 当我们在使用 `v-for` 时，需要给单元加上 `key`

```html
<ul>
  <li v-for="item in items" :key="item.id">...</li>
</ul>
```

2. 用 `+new Date()` 生成的时间戳作为 `key`，手动强制触发重新渲染

```js
<Comp :key="+new Date()" />
```

#### 场景背后的逻辑

> key 是给每一个 vnode 的唯一 id，也是 diff 的一种优化策略，可以根据 key，更准确，更快地找到对应的 vnode 节点

- 如果不使用 key，Vue 会采用就地复用原则：最小化 element 的移动，并且会尝试尽最大程度在适当的地方对相同类型的 element，做 patch 或者 reuse
- 如果使用了 key，Vue 会根据 keys 的顺序记录 element，曾经拥有了 key 的 element 如果不再出现的话，会直接被 remove 或者 destroy

用 `+new Date()` 生成的时间戳作为 `key`，手动强制触发重新渲染

- 当拥有新值的 renderer 作为 key 时，拥有了新 key 的 Comp出现了，那么旧 key Comp 会被移除，新 key Comp 触发渲染

### 设置 key 与不设置 key 的区别

举个例子：创建一个实例，2 秒后往 `items` 数组插入数据

```html
<body>
  <div id="demo">
    <p v-for="item in items" :key="item">{{item}}</p>
  </div>
  <script src="../../dist/vue.js"></script>
  <script>
    // 创建实例
    const app = new Vue({
      el: '#demo',
      data: { items: ['a', 'b', 'c', 'd', 'e'] },
      mounted () {
        setTimeout(() => {
          this.items.splice(2, 0, 'f')  //
       }, 2000);
     },
   });
  </script>
</body>
```

在不使用 key 的情况下，Vue 会进行这样的操作：

![](https://static.vue-js.com/c9da6790-3f41-11eb-85f6-6fac77c0c9b3.png)

分析下整体流程：

- 比较 A，A，相同类型的节点，进行 patch，但数据相同，不发生 dom 操作
- 比较 B，B，相同类型的节点，进行 patch，但数据相同，不发生 dom 操作
- 比较 C，F，相同类型的节点，进行 patch，数据不同，发生 dom 操作
- 比较 D，C，相同类型的节点，进行 patch，数据不同，发生 dom 操作
- 比较 E，D，相同类型的节点，进行 patch，数据不同，发生 dom 操作
- 循环结束，将 E 插入到 dom 中

一共发生了 **3 次更新，1次插入**操作

在使用 key 的情况下，Vue 会进行这样的操作：

- 比较 A，A，相同类型的节点，进行 patch，但数据相同，不发生 dom 操作
- 比较 B，B，相同类型的节点，进行 patch，但数据相同，不发生 dom 操作
- 比较 C，F，不相同类型的节点
- 比较 E，E，相同类型的节点，进行 patch，但数据相同，不发生 dom 操作
- 比较 D，D，相同类型的节点，进行 patch，但数据相同，不发生 dom 操作
- 比较 C，C，相同类型的节点，进行 patch，但数据相同，不发生 dom 操作
- 循环结束，将 F 插入到 C 之前

一共发生了 **0 次更新，1次插入**操作

#### 设置 key 一定能提高 diff 效率吗？

其实不然，文档中也明确表示

> 当 Vue 用 v-for 正在更新已渲染过的元素列表时，它默认用“就地复用”策略。如果数据项的顺序被改变，Vue 将不会移动 DOM 元素来匹配数据项的顺序，而是简单复用此处每个元素，并且确保它在特定索引下显示已被渲染过的每个元素

这个默认的模式是高效的，但是只适用于不依赖子组件状态或临时 DOM 状态（例如：表单输入值）的列表渲染输出

建议尽可能在使用 `v-for` 时提供 `key`，除非遍历输出的 DOM 内容非常简单，或者是刻意依赖默认行为以获取性能上的提升

### 原理分析

源码位置：[src/core/vdom/patch.ts](https://github.com/vuejs/vue/blob/main/src/core/vdom/patch.ts)

这里判断是否为同一个 vnode，首先判断的是 key 值是否相等，如果没有设置 key，那么 key 为 `undefined`，这时候 `undefined` 是恒等于 `undefined`

```js
function sameVnode (a, b) {
  return (
    a.key === b.key && (
      (
        a.tag === b.tag &&
        a.isComment === b.isComment &&
        isDef(a.data) === isDef(b.data) &&
        sameInputType(a, b)
      ) || (
        isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)
      )
    )
  )
}
```

`updateChildren` 方法中会对新旧 vnode 进行 diff，然后比对出的结果用来更新真实 DOM

```js
function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
  ...
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      ...
    } else if (isUndef(oldEndVnode)) {
      ...
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      ...
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      ...
    } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
      ...
    } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
      ...
    } else {
      if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
      idxInOld = isDef(newStartVnode.key)
        ? oldKeyToIdx[newStartVnode.key]
        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
      if (isUndef(idxInOld)) { // New element
        createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx)
      } else {
        vnodeToMove = oldCh[idxInOld]
        if (sameVnode(vnodeToMove, newStartVnode)) {
          patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
          oldCh[idxInOld] = undefined
          canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm)
        } else {
          // same key but different element. treat as new element
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx)
        }
      }
      newStartVnode = newCh[++newStartIdx]
    }
  }
  ...
}
```

## 自定义指令

在 Vue 中提供了一套为数据驱动视图更为方便的操作，这些操作被称为指令系统。我们看到 `v-` 开头的行内属性，都是指令，不同的指令可以完成或实现不同的功能。

```js
// 会实例化一个指令，但这个指令没有参数
`v-xxx`

// 将值传到指令中
`v-xxx="value"`

// 将字符串传入到指令中，如`v-html="'<p>内容</p>'"`
`v-xxx="'string'"`

// 传参数（`arg`），如`v-bind:class="className"`
`v-xxx:arg="value"`

// 使用修饰符（`modifier`）
`v-xxx:arg.modifier="value"`
```

### 如何实现

注册一个自定义指令有全局注册和局部注册。

**全局注册**

全局注册主要是通过 `Vue.directive` 方法进行注册。`Vue.directive` 第一个参数是指令的名字（不需要写上 `v-` 前缀），第二个参数可以是对象数据，也可以是一个指令函数。

```js
// 注册一个全局自定义指令 `v-focus`
Vue.directive('focus', {
  // 当被绑定的元素插入到 DOM 中时
  inserted: function (el) {
    // 页面加载完成之后自动让输入框获取到焦点的小功能
    el.focus();
  }
})
```

**局部注册**

局部注册通过在组件 `options` 选项中设置 `directive` 属性

```js
directives: {
  focus: {
    inserted: function (el) {
      el.focus()
    }
  }
}
```

自定义指令也像组件那样存在钩子函数：

- `bind`：只调用一次，指令第一次绑定到元素时调用。在这里可以进行一次性的初始化设置
- `inserted`：被绑定元素插入父节点时调用（仅保证父节点存在，但不一定已经被插入文档中）
- `update`：所在组件的 vnode 更新时调用，但是可能发生在其子 vnode 更新之前。指令的值可能发生了改变，也可能没有。但是你可以通过比较更新前后的值来忽略不必要的更新
- `componentUpdated`：指令所在组件的 vnode 及其子 vnode 全部更新后调用
- `unbind`：只调用一次，指令与元素解绑时调用

所有钩子函数的参数都有以下：

- `el`：指令所绑定的元素，可以用来直接操作 DOM
- `binding`：一个对象，包含以下：
  - `name`：指令名，不包括 `v-` 前缀
  - `value`：指令的绑定值，例如：`v-my-directive="1 + 1"` 中，绑定值为 `2`
  - `oldValue`：指令绑定的前一个值，仅在 `update` 和 `componentUpdated` 钩子中可用。无论值是否改变都可用
  - `expression`：字符串形式的指令表达式。例如：`v-my-directive="1 + 1"` 中，表达式为 `"1 + 1"`
  - `arg`：传给指令的参数，可选。例如：`v-my-directive:foo` 中，参数为 `"foo"`
  - `modifiers`：一个包含修饰符的对象。例如：`v-my-directive.foo.bar` 中，修饰符对象为 `{ foo: true, bar: true }`
- `vnode`：Vue 编译生成的虚拟节点
- `oldVnode`：上一个虚拟节点，仅在 `update` 和 `componentUpdated` 钩子中可用

> 除了 `el` 之外，其它参数都应该是只读的，切勿进行修改。如果需要在钩子之间共享数据，建议通过元素的 `dataset` 来进行

举个例子：

```html
<div v-demo="{ color: 'white', text: 'hello!' }"></div>
<script>
  Vue.directive('demo', function (el, binding) {
    console.log(binding.value.color) // "white"
    console.log(binding.value.text)  // "hello!"
  })
</script>
```

## 虚拟 DOM

### 什么是虚拟 DOM

虚拟 DOM 是一层对真实 DOM 的抽象，以 `JavaScript` 对象作为基础的树，用对象的属性来描述节点，最终可以通过一系列操作使这棵树映射到真实环境上。
