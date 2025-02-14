import{_ as p,c as e,a as s,e as t,d as l,b as c,r as o,o as i}from"./app-CRUSJUWc.js";const u={},r={href:"https://leetcode.cn/problems/longest-substring-without-repeating-characters/description/",target:"_blank",rel:"noopener noreferrer"};function k(d,n){const a=o("ExternalLinkIcon");return i(),e("div",null,[s("blockquote",null,[s("p",null,[s("a",r,[n[0]||(n[0]=l("无重复字符的最长子串")),c(a)])])]),n[1]||(n[1]=t(`<h2 id="题目描述" tabindex="-1"><a class="header-anchor" href="#题目描述"><span>题目描述</span></a></h2><p>给定一个字符串<code>s</code>，请你找出其中不含有重复字符的 最长子串的长度。</p><p><strong>示例</strong></p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre class="language-text"><code><span class="line">输入: s = &quot;abcabcbb&quot;</span>
<span class="line">输出: 3</span>
<span class="line"></span>
<span class="line">输入: s = &quot;bbbbb&quot;</span>
<span class="line">输出: 1</span>
<span class="line"></span>
<span class="line">输入: s = &quot;pwwkew&quot;</span>
<span class="line">输出: 3</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="解法" tabindex="-1"><a class="header-anchor" href="#解法"><span>解法</span></a></h2><p>这道题主要用到思路是：<strong>滑动窗口</strong></p><p><strong>代码实现</strong></p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre class="language-javascript"><code><span class="line">  <span class="token doc-comment comment">/**</span>
<span class="line">   * <span class="token keyword">@param</span> <span class="token class-name"><span class="token punctuation">{</span>string<span class="token punctuation">}</span></span> <span class="token parameter">s</span></span>
<span class="line">   * <span class="token keyword">@return</span> <span class="token class-name"><span class="token punctuation">{</span>number<span class="token punctuation">}</span></span></span>
<span class="line">   */</span></span>
<span class="line">  <span class="token keyword">var</span> <span class="token function-variable function">lengthOfLongestSubstring</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">s</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>s<span class="token punctuation">.</span>length<span class="token punctuation">)</span> <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">let</span> substringOfMaxLen <span class="token operator">=</span> <span class="token string">&#39;&#39;</span><span class="token punctuation">;</span> <span class="token comment">// 最长子串</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">let</span> start <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> start <span class="token operator">&lt;=</span> s<span class="token punctuation">.</span>length <span class="token operator">-</span> <span class="token number">1</span><span class="token punctuation">;</span> <span class="token operator">++</span>start<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">      <span class="token keyword">if</span> <span class="token punctuation">(</span>s<span class="token punctuation">.</span><span class="token function">slice</span><span class="token punctuation">(</span>start<span class="token punctuation">)</span><span class="token punctuation">.</span>length <span class="token operator">&lt;</span> substringOfMaxLen<span class="token punctuation">.</span>length<span class="token punctuation">)</span> <span class="token keyword">break</span><span class="token punctuation">;</span></span>
<span class="line">      <span class="token keyword">let</span> substring <span class="token operator">=</span> s<span class="token punctuation">[</span>start<span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">      <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">let</span> char <span class="token keyword">of</span> s<span class="token punctuation">.</span><span class="token function">slice</span><span class="token punctuation">(</span>start <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token keyword">if</span> <span class="token punctuation">(</span>substring<span class="token punctuation">.</span><span class="token function">indexOf</span><span class="token punctuation">(</span>char<span class="token punctuation">)</span> <span class="token operator">&lt;</span> <span class="token number">0</span><span class="token punctuation">)</span></span>
<span class="line">          substring <span class="token operator">+=</span> char<span class="token punctuation">;</span></span>
<span class="line">        <span class="token keyword">else</span></span>
<span class="line">          <span class="token keyword">break</span><span class="token punctuation">;</span></span>
<span class="line">      <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">      <span class="token keyword">if</span> <span class="token punctuation">(</span>substring<span class="token punctuation">.</span>length <span class="token operator">&gt;</span> substringOfMaxLen<span class="token punctuation">.</span>length<span class="token punctuation">)</span></span>
<span class="line">        substringOfMaxLen <span class="token operator">=</span> substring<span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">return</span> substringOfMaxLen<span class="token punctuation">.</span>length<span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>以上是我提交的代码，看了题解之后，发现大致思路和我的解法是一致的，不过在时间复杂度上要略逊一筹。</p><p>因为当找到第一个最长不重复子串之后，右指针不用再从 <code>i + 1</code> 开始遍历，因为这个时候从 <code>i + 1</code> 到右指针一定是一个不重复的子串。所以右指针直接继续往右移动即可。</p><p>而且题解中用到了 <code>Set</code> 这种数据结构是我没有想到的。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre class="language-javascript"><code><span class="line">  <span class="token keyword">var</span> <span class="token function-variable function">lengthOfLongestSubstring</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">s</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token comment">// 哈希集合，记录每个字符串是否出现过</span></span>
<span class="line">    <span class="token keyword">const</span> occ <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Set</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">const</span> n <span class="token operator">=</span> s<span class="token punctuation">.</span>length<span class="token punctuation">;</span></span>
<span class="line">    <span class="token comment">// 右指针，初始值为 -1，相当于我们在字符串的左边界的左侧，还没开始移动</span></span>
<span class="line">    <span class="token keyword">let</span> rk <span class="token operator">=</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">,</span> ans <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">let</span> i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> n<span class="token punctuation">;</span> <span class="token operator">++</span>i<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">      <span class="token keyword">if</span> <span class="token punctuation">(</span>i <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token comment">// 左指针向右移动一格，移除一个字符</span></span>
<span class="line">        occ<span class="token punctuation">.</span><span class="token function">delete</span><span class="token punctuation">(</span>s<span class="token punctuation">.</span><span class="token function">charAt</span><span class="token punctuation">(</span>i <span class="token operator">-</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">      <span class="token punctuation">}</span></span>
<span class="line">      <span class="token keyword">while</span> <span class="token punctuation">(</span>rk <span class="token operator">+</span> <span class="token number">1</span> <span class="token operator">&lt;</span> n <span class="token operator">&amp;&amp;</span> <span class="token operator">!</span>occ<span class="token punctuation">.</span><span class="token function">has</span><span class="token punctuation">(</span>s<span class="token punctuation">.</span><span class="token function">charAt</span><span class="token punctuation">(</span>rk <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token comment">// 不断地移动右指针</span></span>
<span class="line">        occ<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span>s<span class="token punctuation">.</span><span class="token function">charAt</span><span class="token punctuation">(</span>rk <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token operator">++</span>rk<span class="token punctuation">;</span></span>
<span class="line">      <span class="token punctuation">}</span></span>
<span class="line">      ans <span class="token operator">=</span> Math<span class="token punctuation">.</span><span class="token function">max</span><span class="token punctuation">(</span>ans<span class="token punctuation">,</span> rk <span class="token operator">-</span> i <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line">    <span class="token keyword">return</span> ans<span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,12))])}const m=p(u,[["render",k],["__file","3.html.vue"]]),b=JSON.parse('{"path":"/blogs/algorithm/leetcode/3.html","title":"<LeetCode> 3. 无重复字符的最长子串","lang":"zh-CN","frontmatter":{"title":"<LeetCode> 3. 无重复字符的最长子串","date":"2025-2-14","tags":["LeetCode"],"categories":["算法"]},"headers":[{"level":2,"title":"题目描述","slug":"题目描述","link":"#题目描述","children":[]},{"level":2,"title":"解法","slug":"解法","link":"#解法","children":[]}],"git":{"createdTime":1739535625000,"updatedTime":1739535625000,"contributors":[{"name":"sankigan","email":"sankigan@tencent.com","commits":1}]},"filePathRelative":"blogs/algorithm/leetcode/3.md"}');export{m as comp,b as data};
