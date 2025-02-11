# 一、缓存

> 参考了[这篇文章](<https://github.com/amandakelake/blog/issues/43>)

## 缓存的分类？

![缓存分类](https://user-images.githubusercontent.com/25027560/38461517-c7f2f422-3b04-11e8-8e94-20bbeb2a32b8.png)

> 注：文章只讨论浏览器（客户端）缓存喔

## 缓存的一些应用场景？

1. 每次都加载某个同样的静态文件 => 浪费带宽，重复请求 => **让浏览器使用本地缓存（协商缓存，返回304）**

2. 协商缓存还是要和服务器通信 => **强制浏览器使用本地强缓存（返回200）**

3. 缓存要更新，没有网络请求，怎么知道什么时候更新？ => **让请求加上(header加上ETag)或者url的修改与文件内容关联（文件名加哈希值）**

   > !!! 这个我有次面试被问到了了，然后一脸懵逼的说了不会...

***

# 二、浏览器的缓存机制：强缓存、协商缓存

> 话不多述，先上流程图 : )

![](https://user-images.githubusercontent.com/25027560/38223505-d8ab53da-371d-11e8-9263-79814b6971a5.png)

## 概述

**1. 基本原理**

- 浏览器在加载资源时，根据请求头的`Expires`和`Cache-Control`判断是否命中**强缓存**，是则直接从缓存读取资源，不会发送请求到服务器。
- 如果没有命中强缓存，浏览器一定会发送一个请求到服务器，通过`Last-Modified`和`ETag`验证资源是否命中**协商缓存**，如果命中，服务器会将这个请求返回，但是不会返回这个资源的数据，依然是从缓存中读取资源
- 如果前两者都没有命中，直接从服务器加载资源

**2. 相同点**

​	如果命中，都是从客户端缓存中加载资源，而不是从服务器加载资源数据

**3. 不同点**

​	强缓存不发请求到服务器，协商缓存会发送请求到服务器

## 强缓存

强缓存通过`Expires`和`Cache-Control`两种响应头实现

1. **`Expires`**
   `Expires`是HTTP 1.0提出的一个表示资源过期时间的头部，它描述的是一个绝对的时间，由服务器返回。`Expires`受限于本地时间，如果修改了本地时间，可能会导致缓存失效。

   `Expires: Sat, Mar 16 2019 20:26:43 GMT`

2. **`Cache-Control`**
   `Cache-Control`出现于HTTP 1.1，**优先级高于`Expires`**，表示的是相对时间。

   `Cache-Control: max-age=315360000`

> 原作者在这里顺带提及了Cache-Control指令的细节

- `Cache-Control: no-cache` 不会缓存数据到本地的说法是错误的（下图是《HTTP权威指南》p182内容）
  ![](https://user-images.githubusercontent.com/25027560/38223488-c2bf4b76-371d-11e8-85ac-45fc8ed04dd4.png)
- `Cache-Control: no-store` 真正的不缓存数据到本地
- `Cache-Control: public` 可以被所有用户缓存（多用户共享），包括终端和CDN等中间代理服务器
- `Cache-Control: private` 只能被终端浏览器缓存（而且是私有缓存），不允许中继缓存服务器进行缓存
  ![](https://user-images.githubusercontent.com/25027560/38223493-c7ec919e-371d-11e8-8d72-8c6b0e4935a8.png)

## 协商缓存

当浏览器对某个资源没有命中强缓存，就会发一个请求到服务器，验证协商缓存是否命中，如果协商缓存命中，请求响应返回的HTTP状态为**304 Not Modified**。

协商缓存利用的是`【Last-Modified, If-Modified-Since】`和`【ETag, If-None-Match】`这两对Header来管理。
1. **`Last-Modified, If-Modified-Since`**
   `Last-Modified`表示本地文件最后修改日期，浏览器会在request header加上`If-Modified-Since`（上次返回的`Last-Modified`的值），询问服务器在该日期后资源是否有更新，有更新的话就会将新的资源发送回来。
   但是如果在本地打开缓存文件，就会造成`Last-Modified`被修改，所以HTTP 1.1 出现了`ETag`。

2. **`ETag, If-None-Match`**
   `ETag`就像一个指纹，资源变化都会导致`ETag`变化，跟最后修改时间没关系，`ETag`可以保证每一个资源是唯一的。
   `If-None-Match`的Header会将上次的`ETag`发送给服务器，询问该资源的`ETag`是否有更新，有变动就会发送新的资源回来。

   > 下面这张图很形象地描述了这个过程

   ![](https://user-images.githubusercontent.com/25027560/38223495-d02aec3e-371d-11e8-92ae-fe7c729ab6e5.png)
   **`ETag`的优先级比`Last-Modified`更高**
   那么为什么要使用`ETag`呢？

   - 一些文件也许会周期性的更改，但是他的内容并不改变（仅仅改变了修改时间），这时我们并不希望客户端认为这个文件被修改而重新GET；
   - 某些文件修改是非常频繁的，比如在秒以下的时间内进行修改（例如1s内修改了N次），`If-Modified-Since`能检查到的粒度是s级的，这种修改无法判断；
   - 某些服务器不能精确的得到文件的最后修改时间。

## 几种状态码的区别

- `200`：强缓存`Expires/Cache-Control`失效时，返回新的资源文件

  > 其实我觉得这里应该是强缓存和协商缓存都没有命中才会返回状态码200

- `200(from disk cache)/200(from memory cache)`：强缓存`Expires/Cache-Control`两者都存在，未过期，`Cache-Control`优先`Expires`时，浏览器从本地获取资源成功

- `304(Not Modified)`：协商缓存`Last-Modified/ETag`没有过期时，服务器端返回状态码304

**`from memory cache`和`from disk cache`的区别**

`from memory cache`：资源是直接从内存中拿到的，不会请求服务器，一般已经加载过该资源切换存在了内存当中，当关闭该页面时，此资源就被内存释放掉了，再次重新打开相同页面时不会出现`from memory cache`的情况

`from disk cache`：同上类似，此资源是从磁盘当中取出的，也是在已经在之前的某个时间加载过该资源，不会请求服务器但是此资源不会随着该页面的关闭而释放掉，因为是存在硬盘当中的，下次打开仍会`from disk cache`

***

# 三、数据存储：cookie、Storage、indexedDB

## 简单对比

1. `cookie`：4K，可以手动设置失效期
2. `localStorage`：5M，除非手动清除，否则一直存在
3. `sessionStorage`：5M，不可以跨标签访问，页面关闭就清理
4. `indexedDB`：浏览器端数据库，无限容量，除非手动清除，否则一直存在

## cookie

> cookie通过在客户端记录信息确定用户身份
>
> session通过在服务器端记录信息确定用户身份

**1. cookie机制**

一个用户的所有请求操作都应该属于同一个会话，而另一个用户的所有请求操作则应该属于另一个会话。

HTTP协议是无状态的协议。一旦数据交换完毕，客户端与服务器端的连接就会关闭，再次交换数据需要建立新的连接。这就意味着服务器无法从连接上跟踪会话。

cookie实际上是一小段的文本信息。客户端请求服务器，如果服务器需要记录该用户状态，就使用response向客户端浏览器颁发一个cookie。客户端会把cookie保存起来。当浏览器再请求该网站时，浏览器把请求的网址连同该cookie一同提交给服务器。服务器检查该cookie，以此来辨认用户状态。服务器还可以根据需要修改cookie的内容。

cookie的内容主要包括：名字、值、过期时间、路径和域。路径和域一起构成cookie的作用范围。

***

**2. session机制**

session是另一种记录客户状态的机制，不同的是cookie保存在客户端浏览器中，而session保存在服务器上。

客户端浏览器访问服务器的时候，服务器把客户端信息以某种形式记录在服务器上，这就是session。客户端浏览器再次访问时只需要从该session中查找该客户的状态就可以了。

**如果说cookie机制是通过检查客户身上的“通行证”来确定客户身份的话，那么session机制就是通过检查服务器上的“客户明细表”来确认客户身份**。session相当于程序在服务器上建立的一份客户档案，客户来访的时候只需要查询客户档案表就可以了。

当程序需要为某个客户端的请求创建一个session时，

- 服务器首先检查这个客户端的请求里是否包含了一个session标识——称为session id
- 如果已包含则说明以前已经为此客户端创建过session，服务器按照session id把这个session检索出来使用（检索不到，会新建一个）
- 如果客户端请求不包含session id，则为此客户端创建一个session并生成一个与此session相关联的session id，session id的值应该是一个既不会重复，又不容易被找到规律以仿造的字符串，这个session id将会在本次响应中被返回给客户端保存

***

可以用`document.cookie`获取cookie，得到一个字符串，形式如`key1=value1; key2=value2`，需要用正则匹配需要的值。

cookie可以设置路径path，所以它要比另外两个多了一层访问限制
cookie可以通过设置domain属性值，可以不同二级域名下共享cookie，而Storage不可以，比如`http://image.baidu.com`的cookie`http://map.baidu.com`是可以访问的，前提是cookie的domain设置为`.http://baidu.com`，而Storage不可以

**缺点**：在请求头带着数据，大小是4K之内，主domain污染。

常用的配置属性有以下几个：

**`Expires`**：cookie最长有效期

**`Max-Age`**：在cookie失效之前需要经过的秒数。(当`Expires`和`Max-Age`同时存在时，文档中给出的是以`Max-Age`为准，但是作者在Chrome中实验的结果是取二者中最长有效期的值)

**`Domain`**：指定cookie可以送达的主机名

**`Path`**：指定一个URL路径，这个路径必须出现在要请求的资源的路径中才可以发送cookie首部

**`Secure`**：一个带有安全属性的cookie只有在请求使用SSL和HTTPS协议的时候才会被发送到服务器

**`HttpOnly`**：设置了 `HttpOnly` 属性的cookie不能使用JavaScript经由`document.cookie`属性、XMLHttpRequest`和`Request APIs` 进行访问，以防范跨站脚本攻击（XSS）

## Storage：localStorage、sessionStorage

**大小**：官方建议是5M存储空间

**类型**：只能操作字符串，在存储之前应该使用`JSON.stringify()`方法先进行一步安全转换字符串，取值时再用`JSON.parse()`方法再转换一次

**存储的内容**：数组，图片，json，样式，脚本等（只要是能序列化成字符串的内容都可以存储）

**注意**：数据是**明文存储**，毫无隐私性可言，**绝对不能用于存储重要信息**

**区别**：sessionStorage将数据临时存储在session中，浏览器关闭，数据随之消失，localStorage将数据存储在本地，理论上来说数据永远不会消失，除非人为删除

另外，不同浏览器无法共享localStorage和sessionStorage中的信息。同一浏览器的相同域名和端口的不同页面间可以共享相同的localStorage，但是不同页面间无法共享sessionStorage的信息。

**1. 基础操作API**

**保存数据**

`lcoalStorage.setItem(key, value);`
`sessionStorage.setItem(key, value);`

**读取数据**

`lcoalStorage.getItem(key);`
`sessionStorage.getItem(key);`

**删除单个数据**

`lcoalStorage.removeItem(key);`
`sessionStorage.removeItem(key);`

**删除全部数据**

`lcoalStorage.clear();`
`sessionStorage.clear();`

**获取索引的key**

`lcoalStorage.key(index);`
`sessionStorage.key(index);`

**2. 监听storage事件**

可以通过监听window对象的storage事件并指定其事件处理函数，当页面中对 localStorage 或 sessionStorage 进行修改时，则会触发对应的处理函数

```javascript
window.addEventListener('storage', function(e) {
    console.log(`key=${e.key}, oldValue=${e.oldValue}, newValue=${e.newValue}`);
}, false)
```

触发事件的事件对象有几个属性：
**key**：键值
**oldValue**：修改前的值
**newValue**：修改后的值
**url**：页面url
**storageArea**：被修改的storage对象

## indexedDB

> 这个我在这里就不码了，具体内容[点击这里](<https://github.com/amandakelake/blog/issues/13>)

