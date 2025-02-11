---
title: 跨域
date: 2019-3-22
editLink: false
tags:
 - 网络与浏览器
categories:
 - 前端
---

# 跨域

## 跨域概述

当一个资源从与该资源本身所在的服务器不同的 **`域、协议、端口`** 请求一个资源时，资源会发起一个跨域 HTTP 请求。出于安全原因，浏览器限制从脚本内发起的跨源 HTTP 请求，XMLHttpRequest 和 Fetch API，只能从加载应用程序的一个域请求 HTTP 资源，除非使用`CORS头文件`。

**`浏览器限制`**：不一定是浏览器限制了发起跨站请求，也可能是跨站请求可以正常发起，但返回结果被浏览器拦截。

## CORS 概述

跨域资源共享标准新增了一组 HTTP 首部字段，**允许服务器声明哪些源站通过浏览器有权限访问哪些资源**。

另外，规范要求，对那些可能对服务器数据产生副作用的 HTTP 请求方法（特别是 GET 以外的 HTTP 请求，或者搭配某些 MIME 类型的 POST 请求），**浏览器必须首先使用 OPTIONS 方法发起一个`预检请求`（preflight request），从而获知服务器是否允许该跨域请求。**

**服务器确认允许之后，才发起实际的HTTP请求**。 在预检请求的返回中，服务器端也可以通知客户端，是否需要携带身份凭证（包括 cookie 和 HTTP 认证相关数据）。

话不多说，直接上图。

![](https://user-images.githubusercontent.com/25027560/50205846-accac300-03a4-11e9-8654-2d646d237820.png)

### 简单请求

不会触发 CORS 预检的请求称为简单请求，满足以下**所有条件**的才会被视为简单请求，基本上日常开发只会关注前面两点。

- 使用 `GET`、`POST`、`HEAD` 其中一种方法
- 只使用了如下的安全首部字段，不得人为设置其他首部字段
  - `Accept`
  - `Accept-Language`
  - `Content-Language`
  - `Content-Type` 仅限以下三种
    - `text/plain`
    - `multipart/form-data`
    - `application/x-www-form-urlencoded`
  - HTML 头部 header filed 字段：`DPR`、`Download`、`Save-Data`、`Viewport-Width`、`Width`
- 请求中的任意 `XMLHttpRequestUpload` 对象均没有注册任何事件监听器；`XMLHttpRequestUpload`对象可以使用 `XMLHttpRequest.upload` 属性访问
- 请求中没有使用 `ReadableStream` 对象

### 预检请求

需预检的请求要求必须使用 OPTIONS 方法发起一个预检请求到服务器，以获知服务器是否允许该实际请求。`预检请求` 的使用，可以避免跨域请求对服务器的用户数据产生未预期的影响。

下面的请求会触发预检请求，其实**非简单请求之外的都会触发预检**

- 使用 `PUT`、`DELETE`、`CONNECT`、`OPTIONS`、`TRACE`、`PATCH` 方法
- 人为设置了非规定内的其他首部字段，参考上面简单请求的安全字段集合，还要特别注意 `Content-Type` 的类型
- `XMLHttpRequestUpload` 对象注册了任何事件监听器
- 请求中使用了 `ReadableStream` 对象

### 请求附带身份凭证 => cookie

如果发起请求时设置 `WithCredentials` 标志设置为 `true`，从而向服务器发送 `cookie`，但是如果服务器的响应中未携带 `Access-Control-Allow-Credentials: true`，浏览器将不会把响应内容返回给请求的发送者。

对于附带身份凭证的请求，服务器不得设置 `Access-Control-Allow-Origin` 的值为`*`，必须是某个具体的域名。

注意，简单 GET 请求不会被预检；如果此类带有身份凭证请求的响应中不包含该字段，这个响应将被忽略掉，并且浏览器也不会将相应内容返回给网页。

## 完整请求流程

![](https://user-images.githubusercontent.com/25027560/50205881-c409b080-03a4-11e9-8a57-a2a6d0e1d879.png)

## CORS

### [Access-Control-Allow-Credentials](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials)

`Access-Control-Allow-Credentials` 响应头用于在请求要求包含 credentials 时，告知浏览器是否可以将对请求的响应暴露给前端 JS 代码。

当请求的 credentials 模式为 include 时，浏览器仅在响应标头 `Access-Control-Allow-Credentials` 的值为 true 的情况下将响应暴露给前端的 JS 代码。

Credentials 可以是 cookies、authorization headers 或 TLS client certificates。

当作为预检请求的响应的一部分时，这能表示是否真正的请求可以使用 credentials。**注意简单的 GET 请求没有预检，所以若一个对资源的请求代理 credentials，如果这个响应头没有随资源返回，响应就会被浏览器忽视，不会返回到 web 内容。**

`Access-Control-Allow-Credentials` 标头需要与 `XMLHttpRequest.withCredentials` 或 Fetch API 的 `Request()` 构造函数中的 `credentials` 选项结合使用。Credentials 必须在前后端都被配置（即 `Access-Control-Allow-Credentials` header 和 XHR 或 Fetch requeset 中都要配置）才能使带 credentials 的 CORS 请求成功。

#### tips

1. [🔗](https://maomao.ink/index.php/IT/1587.html) 如果服务器端开启了 Access-Control-Allow-Credentials 为 true，假设服务器端设置了 Access-Control-Allow-Origin 为 *，意味着将 cookie 开放给了所有网站。如果服务端设置了 `"Access-Control-Allow-Origin": "*"`，客户端请求时无需再设置 `withCredentials: true`。

### [script 标签的 crossorigin 属性](https://juejin.cn/post/6969825311361859598)

#### script 标签请求资源

1. script 标签请求资源的时候，request 是没有 origin 头的。
2. script 标签请求跨域资源的时候，内部运行如果报错的话，`window.onerror` 捕获的时候，内部的 `error.message` 只能看到 `Script error`，看不到完整的错误内容。

#### script 标签 crossorigin 属性

1. 设置 `crossorigin` 属性后，`script` 标签去请求资源的时候，request 会带上 origin 头，然后会要求服务器进行 cors 校验，跨域的时候如果 response header 没有 `Access-Control-Allow-Origin` 是不会拿到资源的。cors 验证通过后，拿到的 script 运行内部报错的话，`window.onerror` 捕获的时候，内部的 `error.message` 可以看到完整的错误信息。
2. `crossorigin` 的属性值分为 `anonymous` 和 `use-credentials`。如果设置了 `crossorigin` 属性，但是属性值不正确的话，默认是 `anonymous`。
3. `anonymous` 代表同域会带上 cookie，跨域则不带上 cookie，相当于 fetch 请求的 `credentials: 'same-origin'`。
4. `use-credentials` 跨域也会带上 cookie，相当于 fetch 请求的 `credentials: 'include'`，这种情况下跨域的 response header 需要设置 `'Access-Control-Allow-Credentials' = true`，否则 cors 失败。

#### 总结

1. 设置了 `crossorigin` 属性就相当于开启了 cors 校验。
2. 开启 cors 校验之后，跨域的 script 资源在运行出错的时候，`window.onerror` 可以捕获到完整的错误信息。
3. `crossorigin=use-credentials` 可以跨域带上 cookie。
