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

首先找到 `vue` 的构造函数，[src/core/instance/index.ts](https://github.com/vuejs/vue/blob/main/src/core/instance/index.ts#L9)

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

`updateComponent` 方法主要执行在 `vue` 初始化时声明的 `render`、`update` 方法。`render` 的作用主要是生成 `vnode`，源码：[src/core/instance/render.ts](https://github.com/vuejs/vue/blob/main/src/core/instance/render.ts#L103)

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

