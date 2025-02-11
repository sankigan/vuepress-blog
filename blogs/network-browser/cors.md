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
