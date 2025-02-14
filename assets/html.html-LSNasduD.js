import{_ as l,c as o,a,e,d as s,b as p,r as c,o as i}from"./app-CRUSJUWc.js";const u={},r={href:"https://zhuanlan.zhihu.com/p/32609899",target:"_blank",rel:"noopener noreferrer"},d={href:"https://segmentfault.com/a/1190000004279791",target:"_blank",rel:"noopener noreferrer"};function k(m,n){const t=c("ExternalLinkIcon");return i(),o("div",null,[n[3]||(n[3]=a("h2",{id:"html5-为什么只需要写-doctype-html",tabindex:"-1"},[a("a",{class:"header-anchor",href:"#html5-为什么只需要写-doctype-html"},[a("span",null,[s("HTML5 为什么只需要写"),a("code",null,"<!DOCTYPE HTML>")])])],-1)),a("p",null,[a("a",r,[n[0]||(n[0]=s("什么是DOCTYPE？")),p(t)])]),n[4]||(n[4]=e(`<p>HTML5不基于SGML，因此不需要对DTD进行引用，但是需要doctype来规范浏览器的行为。</p><p>而HTML4.01基于SGML，所以需要对DTD进行引用，才能告知浏览器文档所使用的文档类型。</p><h2 id="src-和-href-的区别" tabindex="-1"><a class="header-anchor" href="#src-和-href-的区别"><span>src 和 href 的区别</span></a></h2><p>href是指向网络资源所在位置，建立和当前元素（锚点）或当前文档（链接）之间的链接，用于超链接。</p><p>src是指向外部资源的位置，指向的内容将会嵌入到文档中当前标签所在位置；在请求src资源时会将其指向的资源下载并应用到文档内，例如js脚本，img图片和frame等元素。当浏览器解析到该元素时，会暂停其他资源的下载和处理，直到将该资源加载、编译、执行完毕，图片和框架等元素也是如此，类似于将所指向资源嵌入当前标签内。这也是为什么将js脚本放在底部而不是头部。</p><h2 id="使用meta标签禁用缓存" tabindex="-1"><a class="header-anchor" href="#使用meta标签禁用缓存"><span>使用meta标签禁用缓存</span></a></h2><p>浏览器禁止缓存的headers如下：</p><div class="language-html line-numbers-mode" data-highlighter="prismjs" data-ext="html" data-title="html"><pre class="language-html"><code><span class="line">Cache-Control: no-cache, no-store, must-revalidate</span>
<span class="line">Pragma: no-cache</span>
<span class="line">Expires: 0</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-html line-numbers-mode" data-highlighter="prismjs" data-ext="html" data-title="html"><pre class="language-html"><code><span class="line"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>meta</span> <span class="token attr-name">http-equiv</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>Cache-Control<span class="token punctuation">&quot;</span></span> <span class="token attr-name">content</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>no-cache, no-store, must-revalidate<span class="token punctuation">&quot;</span></span> <span class="token punctuation">/&gt;</span></span></span>
<span class="line"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>meta</span> <span class="token attr-name">http-equiv</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>Pragma<span class="token punctuation">&quot;</span></span> <span class="token attr-name">content</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>no-cache<span class="token punctuation">&quot;</span></span> <span class="token punctuation">/&gt;</span></span></span>
<span class="line"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>meta</span> <span class="token attr-name">http-equiv</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>Expires<span class="token punctuation">&quot;</span></span> <span class="token attr-name">content</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>0<span class="token punctuation">&quot;</span></span> <span class="token punctuation">/&gt;</span></span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="attribute和property的区别" tabindex="-1"><a class="header-anchor" href="#attribute和property的区别"><span>attribute和property的区别</span></a></h2><p><strong>attribute</strong></p><ol><li><p><strong>attribute由HTML来定义，并不存在于DOM中，即：只要是HTML标签内定义的都是attribute</strong>。</p><div class="language-html line-numbers-mode" data-highlighter="prismjs" data-ext="html" data-title="html"><pre class="language-html"><code><span class="line"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name">id</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>test<span class="token punctuation">&quot;</span></span> <span class="token attr-name">class</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>button<span class="token punctuation">&quot;</span></span> <span class="token attr-name">custom-attr</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>1<span class="token punctuation">&quot;</span></span><span class="token punctuation">&gt;</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">&gt;</span></span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre class="language-javascript"><code><span class="line">document<span class="token punctuation">.</span><span class="token function">getElementById</span><span class="token punctuation">(</span><span class="token string">&quot;test&quot;</span><span class="token punctuation">)</span><span class="token punctuation">.</span>attributes<span class="token punctuation">;</span></span>
<span class="line"><span class="token comment">// 返回：[custom-attr=&quot;1&quot; class=&quot;button&quot; id=&quot;test&quot;]</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div></li><li><p><strong>attribute是String类型</strong>。对于上面的div，<code>document.getElementById(&#39;test&#39;).getAttribute(&#39;custom-attr&#39;)</code>会返回string：&quot;1&quot;。</p></li></ol><p><strong>property</strong></p><ol><li><p><strong>property属于DOM，DOM的本质就是JavaScript中的一个Object。我们可以像操作普通object一样读取、设置property，property可以是任意类型</strong>。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre class="language-javascript"><code><span class="line">document<span class="token punctuation">.</span><span class="token function">getElementById</span><span class="token punctuation">(</span><span class="token string">&quot;test&quot;</span><span class="token punctuation">)</span><span class="token punctuation">.</span>foo <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span>  <span class="token comment">// 设置property：foo为number: 1</span></span>
<span class="line">document<span class="token punctuation">.</span><span class="token function">getElementById</span><span class="token punctuation">(</span><span class="token string">&quot;test&quot;</span><span class="token punctuation">)</span><span class="token punctuation">.</span>foo<span class="token punctuation">;</span>  <span class="token comment">// 读取property，返回number: 1</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div></li><li><p><strong>非自定义attribute，如id、class、title等，都会有对应的property映射</strong>。</p><div class="language-html line-numbers-mode" data-highlighter="prismjs" data-ext="html" data-title="html"><pre class="language-html"><code><span class="line"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name">id</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>test<span class="token punctuation">&quot;</span></span> <span class="token attr-name">class</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>button<span class="token punctuation">&quot;</span></span> <span class="token attr-name">foo</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>1<span class="token punctuation">&quot;</span></span><span class="token punctuation">&gt;</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">&gt;</span></span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre class="language-javascript"><code><span class="line">document<span class="token punctuation">.</span><span class="token function">getElementById</span><span class="token punctuation">(</span><span class="token string">&quot;test&quot;</span><span class="token punctuation">)</span><span class="token punctuation">.</span>id<span class="token punctuation">;</span>  <span class="token comment">// 返回string：&quot;test&quot;</span></span>
<span class="line">document<span class="token punctuation">.</span><span class="token function">getElementById</span><span class="token punctuation">(</span><span class="token string">&quot;test&quot;</span><span class="token punctuation">)</span><span class="token punctuation">.</span>className<span class="token punctuation">;</span>  <span class="token comment">// 返回string：&quot;button&quot;</span></span>
<span class="line">document<span class="token punctuation">.</span><span class="token function">getElementById</span><span class="token punctuation">(</span><span class="token string">&quot;test&quot;</span><span class="token punctuation">)</span><span class="token punctuation">.</span>foo<span class="token punctuation">;</span>  <span class="token comment">// 返回undefined，因为foo是自定义attribute</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>注：由于<strong>class</strong>为JavaScript的保留关键字，所以通过property操作class时应使用<strong>className</strong>。</p></li><li><p><strong>非自定义的property或attribute的变化多数是联动的</strong>。</p><div class="language-html line-numbers-mode" data-highlighter="prismjs" data-ext="html" data-title="html"><pre class="language-html"><code><span class="line"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name">id</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>test<span class="token punctuation">&quot;</span></span> <span class="token attr-name">class</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>button<span class="token punctuation">&quot;</span></span><span class="token punctuation">&gt;</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">&gt;</span></span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre class="language-javascript"><code><span class="line"><span class="token keyword">var</span> div <span class="token operator">=</span> document<span class="token punctuation">.</span><span class="token function">getElementById</span><span class="token punctuation">(</span><span class="token string">&quot;test&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">div<span class="token punctuation">.</span>className <span class="token operator">=</span> <span class="token string">&quot;red-input&quot;</span><span class="token punctuation">;</span></span>
<span class="line">div<span class="token punctuation">.</span><span class="token function">getAttribute</span><span class="token punctuation">(</span><span class="token string">&quot;class&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  <span class="token comment">// 返回string：&quot;red-input&quot;</span></span>
<span class="line">div<span class="token punctuation">.</span><span class="token function">setAttribute</span><span class="token punctuation">(</span><span class="token string">&quot;class&quot;</span><span class="token punctuation">,</span> <span class="token string">&quot;green-input&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">div<span class="token punctuation">.</span>className<span class="token punctuation">;</span>  <span class="token comment">// 返回string：&quot;green-input&quot;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></li><li><p><strong>带有默认值的attribute不随property变化而变化</strong>。</p><div class="language-html line-numbers-mode" data-highlighter="prismjs" data-ext="html" data-title="html"><pre class="language-html"><code><span class="line"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>input</span> <span class="token attr-name">id</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>search<span class="token punctuation">&quot;</span></span> <span class="token attr-name">value</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>foo<span class="token punctuation">&quot;</span></span> <span class="token punctuation">/&gt;</span></span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre class="language-javascript"><code><span class="line"><span class="token keyword">var</span> input <span class="token operator">=</span> document<span class="token punctuation">.</span><span class="token function">getElementById</span><span class="token punctuation">(</span><span class="token string">&#39;search&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">input<span class="token punctuation">.</span>value <span class="token operator">=</span> <span class="token string">&quot;foo2&quot;</span><span class="token punctuation">;</span></span>
<span class="line">input<span class="token punctuation">.</span><span class="token function">getAttribute</span><span class="token punctuation">(</span><span class="token string">&quot;value&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  <span class="token comment">// 返回string：&quot;foo&quot;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></li></ol><h2 id="meta标签的作用" tabindex="-1"><a class="header-anchor" href="#meta标签的作用"><span>meta标签的作用</span></a></h2>`,15)),a("blockquote",null,[a("p",null,[n[2]||(n[2]=s("🔎")),a("a",d,[n[1]||(n[1]=s("猛戳我")),p(t)])])]),n[5]||(n[5]=e(`<p><strong>简介</strong></p><p>meta标签提供关于HTML文档的元数据（元数据，用于描述数据的数据）。它不会显示在页面上，但是机器却可以识别。</p><p><strong>用处</strong></p><p>meta元素常用于定义页面的说明，关键字，作者，最后修改日期和其它的元数据。这些元数据将服务于浏览器（如何布置或重载页面），搜索引擎和其它网络服务。</p><p><strong>组成</strong></p><p>meta标签共有两个属性，分别是<code>name</code>属性和<code>http-equiv</code>属性。</p><p>其中，<code>name</code>属性主要用于描述网页，比如网页的关键词，叙述等。与之对应的属性值为content，content中的内容是对name填入类型的具体描述，便于搜索引擎抓取。</p><div class="language-html line-numbers-mode" data-highlighter="prismjs" data-ext="html" data-title="html"><pre class="language-html"><code><span class="line"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>meta</span> <span class="token attr-name">name</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>参数<span class="token punctuation">&quot;</span></span> <span class="token attr-name">content</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>具体的描述<span class="token punctuation">&quot;</span></span> <span class="token punctuation">/&gt;</span></span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p><code>http-equiv</code>顾名思义，相当于http的文件头作用。</p><div class="language-html line-numbers-mode" data-highlighter="prismjs" data-ext="html" data-title="html"><pre class="language-html"><code><span class="line"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>meta</span> <span class="token attr-name">http-equiv</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>参数<span class="token punctuation">&quot;</span></span> <span class="token attr-name">content</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>具体的描述<span class="token punctuation">&quot;</span></span> <span class="token punctuation">/&gt;</span></span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><h2 id="iframe的优缺点" tabindex="-1"><a class="header-anchor" href="#iframe的优缺点"><span>iframe的优缺点</span></a></h2><p><strong>优点</strong></p><ul><li>可以用来加载速度较慢的第三方资源，如广告、图标等。</li><li>可以用作安全沙箱。</li><li>可以并行下载脚本。</li><li>可以解决跨域问题。</li></ul><p><strong>缺点</strong></p><ul><li>加载代价昂贵，即使是空的页面。</li><li>阻塞页面load触发，iframe完全加载后，父页面才会触发load事件。</li><li>缺乏语义。</li><li>会增加http请求数。</li><li>搜索引擎爬虫不能很好的处理iframe中的内容，所以iframe不利于搜索引擎优化</li></ul>`,15))])}const v=l(u,[["render",k],["__file","html.html.vue"]]),h=JSON.parse('{"path":"/blogs/html.html","title":"HTML5","lang":"zh-CN","frontmatter":{"title":"HTML5","date":"2019-5-1","editLink":false,"tags":["HTML5"],"categories":["前端"]},"headers":[{"level":2,"title":"HTML5 为什么只需要写<!DOCTYPE HTML>","slug":"html5-为什么只需要写-doctype-html","link":"#html5-为什么只需要写-doctype-html","children":[]},{"level":2,"title":"src 和 href 的区别","slug":"src-和-href-的区别","link":"#src-和-href-的区别","children":[]},{"level":2,"title":"使用meta标签禁用缓存","slug":"使用meta标签禁用缓存","link":"#使用meta标签禁用缓存","children":[]},{"level":2,"title":"attribute和property的区别","slug":"attribute和property的区别","link":"#attribute和property的区别","children":[]},{"level":2,"title":"meta标签的作用","slug":"meta标签的作用","link":"#meta标签的作用","children":[]},{"level":2,"title":"iframe的优缺点","slug":"iframe的优缺点","link":"#iframe的优缺点","children":[]}],"git":{"createdTime":1739535625000,"updatedTime":1739535625000,"contributors":[{"name":"sankigan","email":"sankigan@tencent.com","commits":1}]},"filePathRelative":"blogs/html.md"}');export{v as comp,h as data};
