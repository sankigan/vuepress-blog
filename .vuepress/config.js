import { resolve } from 'path';
import recoTheme from 'vuepress-theme-reco';
import { defineUserConfig } from 'vuepress';
import { viteBundler } from '@vuepress/bundler-vite';
import { webpackBundler } from '@vuepress/bundler-webpack';

export default defineUserConfig({
  lang: 'zh-CN',
  title: '> sanki',
  description: '',
  // 默认 VuePress 会对全站所有页面 chunk 注入 <link rel="prefetch"> (本站 ~180 个),
  // 这些请求会在首屏 idle 时和字体 / 主 JS / 首页 WebGL 抢带宽。博客站内跳转低频,
  // 关掉 prefetch 让首屏带宽更专注; 点击文章时再按需加载 chunk (有 HTTP 缓存, 体感可接受)。
  shouldPrefetch: false,
  bundler: viteBundler(),
  // bundler: webpackBundler(),
  // head 必须放在顶层 SiteConfig 才会注入到 <head>; 放在 recoTheme() 里不生效。
  head: [
    ['link', { rel: 'icon', href: 'favicon.ico' }],
    // 子集化的得意黑字体改为外链 (见 scripts/subset-font.py), 不再 base64 内联进全局 CSS。
    // 提前 preload, 让字体与首屏关键资源并行下载, 把 font-display: swap 的字体跳变压到最小。
    // 字体请求始终走 CORS 模式, 即便同源也必须带 crossorigin, 否则 preload 命中不了实际请求。
    ['link', { rel: 'preload', href: '/fonts/SmileySans-subset.woff2', as: 'font', type: 'font/woff2', crossorigin: '' }],
    // Safari 顶部状态栏 / 底部工具栏的背景色跟随该 meta, 与首页 --hm-bg (#0a0a0a) 保持一致。
    ['meta', { name: 'theme-color', content: '#0a0a0a' }],
    // iOS Safari 全屏 / PWA 状态栏样式 (黑底白字)
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
  ],
  alias: {
    '@vicons/carbon': resolve(__dirname, 'icons'),
  },
  // 把 @vuepress/plugin-git 注入到 page.data.git 上的"首次提交时间"透传到 frontmatter,
  // 这样前端 (TimelineMag.vue 等) 才能在 post.frontmatter.__createdTime 里读到它,
  // 用于"同一天文章按 git 首次提交时间排序"的 fallback.
  //
  // 为什么不直接读 page.data.git:
  //   @vuepress-reco/vuepress-plugin-page 在生成 posts 时只保留了 title/frontmatter/path,
  //   page.data.git 在打包到前端的数据里就被丢了. 借道 frontmatter 是侵入最小的传递方式.
  //
  // 使用 onInitialized 而非 extendsPage:
  //   extendsPage 触发时, @vuepress/plugin-git 可能还没跑完, page.data.git 是空的.
  //   onInitialized 在所有插件初始化完成后调用, 此时 git 数据已经就位.
  onInitialized(app) {
    app.pages.forEach((page) => {
      const t = page.data?.git?.createdTime;
      if (t != null) {
        page.frontmatter.__createdTime = t;
      }
    });
  },
  theme: recoTheme({
    logo: '/logo.jpg',
    // docsDir: './docs',
    docsBranch: 'main',
    author: 'sankigan',
    lastUpdatedText: '更新于',
    editLinkText: '编辑此页面',
    authorAvatar: '/avatar.jpg',
    repo: 'https://github.com/sankigan',
    docsRepo: 'https://github.com/sankigan/vuepress-blog',
    navbar: [
      { text: '首页', link: '/', icon: 'Home' },
      // { text: '文章', link: '/posts.html', icon: 'Blog' },
      { text: '时间轴', link: '/timeline.html', icon: 'Calendar', },
      // 分类/标签均跳总览页 (TimelineMag 全量列表 + 对应维度的 filter chip)
      // 不再写死子菜单, 新增分类/标签无需改 config
      { text: '分类', link: '/categories.html', icon: 'Categories' },
      { text: '标签', link: '/tags.html', icon: 'Tag' },
      // { text: '项目', link: '/code', icon: 'Code' },
      // {
      //   text: '文档',
      //   icon: 'Doc',
      //   children: [
      //     { text: 'vuepress-reco', link: 'https://theme-reco.vuejs.press/' },
      //   ],
      // },
    ],
    // bulletin: {
    //   body: [
    //     {
    //       type: 'text',
    //       content: `🎉🎉🎉 reco 主题 2.x 已经接近 Beta 版本，在发布 Latest 版本之前不会再有大的更新，大家可以尽情尝鲜了，并且希望大家在 QQ 群和 GitHub 踊跃反馈使用体验，我会在第一时间响应。`,
    //       style: 'font-size: 12px;',
    //     },
    //     {
    //       type: 'hr',
    //     },
    //     {
    //       type: 'title',
    //       content: 'QQ 群',
    //     },
    //     {
    //       type: 'text',
    //       content: `
    //       <ul>
    //         <li>QQ群1：1037296104</li>
    //         <li>QQ群2：1061561395</li>
    //         <li>QQ群3：962687802</li>
    //       </ul>`,
    //       style: 'font-size: 12px;',
    //     },
    //     {
    //       type: 'hr',
    //     },
    //     {
    //       type: 'title',
    //       content: 'GitHub',
    //     },
    //     {
    //       type: 'text',
    //       content: `
    //       <ul>
    //         <li><a href='https://github.com/vuepress-reco/vuepress-theme-reco-next/issues'>Issues<a/></li>
    //         <li><a href='https://github.com/vuepress-reco/vuepress-theme-reco-next/discussions/1'>Discussions<a/></li>
    //       </ul>`,
    //       style: 'font-size: 12px;',
    //     },
    //     {
    //       type: 'hr',
    //     },
    //     {
    //       type: 'buttongroup',
    //       children: [
    //         {
    //           text: '打赏',
    //           link: '/docs/others/donate.html',
    //         },
    //       ],
    //     },
    //   ],
    // },
    // commentConfig: {
    //   type: 'valine',
    //   // options 与 1.x 的 valineConfig 配置一致
    //   options: {
    //     // appId: 'xxx',
    //     // appKey: 'xxx',
    //     // placeholder: '填写邮箱可以收到回复提醒哦！',
    //     // verify: true, // 验证码服务
    //     // notify: true,
    //     // recordIP: true,
    //     // hideComments: true // 隐藏评论
    //   },
    // },
  }),
  // debug: true,
});
