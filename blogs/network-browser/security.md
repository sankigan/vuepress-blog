---
title: 网络安全
date: 2019-3-21
editLink: false
tags:
 - 网络与浏览器
categories:
 - 前端
---

### XSS

XSS，即`Cross Site Script`，中译是跨站脚本攻击，其原本缩写是CSS，但是为了和层叠样式表有所区分，因而在安全领域叫做XSS。

XSS攻击是指攻击者在网站上注入恶意的客户端代码，通过恶意脚本对客户端网页进行篡改，从而在用户浏览网页时，对用户浏览器进行控制或者获取用户隐私数据的一种攻击方式。**这类攻击通常包含了HTML以及用户端脚本语言**。

**XSS攻击的防范**

- **HttpOnly防止窃取Cookie**

  浏览器将禁止页面的JavaScript访问带有HttpOnly属性的Cookie，严格来说，HttpOnly 并非阻止 XSS 攻击，而是能阻止 XSS 攻击后的 Cookie 劫持攻击。

- **输入检查**

  **不要相信用户的任何输入**。对于用户的任何输入要进行检查、过滤和转义。建立可信任的字符和HTML标签白名单，对于不在白名单之列的字符或者标签进行过滤或编码。

- **输出检查**

  用户的输入会出现问题，服务端的输出也会存在问题。一般来说，除富文本的输出外，在变量输出到HTML页面时，可以使用编码或转义的方式来防御XSS攻击。

### CSRF

CSRF，即`Cross Site Request Forgery`，中译是跨站请求伪造，是一种劫持受信任用户向服务器发送非预期请求的攻击方式。

通常情况下，CSRF攻击是攻击者借助受害者的Cookie骗取服务器的信任，可以在受害者毫不知情的情况下以受害者名义伪造请求发送给服务器，从而在并未授权的情况下执行在权限保护之下的操作。

**CSRF攻击的防范**

- **验证码**

  验证码被认为是对抗CSRF攻击最简洁而有效的防御方法。CSRF往往是在用户不知情的情况下构造了网络请求。而验证码会强制用户必须与应用进行交互，才能完成最终请求。但是验证码不是万能的，因为出于用户考虑，不能给网站上所有的操作都加上验证码。因此，验证码只能作为防御CSRF的一种辅助手段。

- **Referer Check**

  根据HTTP协议，在HTTP头部中有一个字段叫做`Referer`，它记录了该HTTP请求的来源地址。通过Referer Check，可以检查请求是否来自合法的“源”。

  > Referer Check不仅能防范CSRF攻击，另一个应用场景是“防止图片盗链”。

- **添加token验证**

  要防御CSRF，关键在于在请求中放入攻击者所不能伪造的信息，并在服务器建立一个拦截器来验证这个token，如果请求中没有token或者token内容不正确，则认为可能是CSRF攻击而拒绝该请求。

### SQL 注入

所谓SQL注入，就是通过把 SQL 命令插入到 Web 表单提交或输入域名或页面请求的查询字符串，后台执行 SQL 语句时直接把前端传入的字段拿来做 SQL 查询。

**防御**

- 永远不要信任用户的输入
- 永远不要使用动态拼接 SQL
- 不要把机密信息直接存放
