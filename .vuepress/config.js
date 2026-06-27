import { resolve } from 'path';
import recoTheme from 'vuepress-theme-reco';
import { defineUserConfig } from 'vuepress';
import { viteBundler } from '@vuepress/bundler-vite';
import { webpackBundler } from '@vuepress/bundler-webpack';

export default defineUserConfig({
  lang: 'zh-CN',
  title: '> sanki',
  description: '',
  bundler: viteBundler(),
  // bundler: webpackBundler(),
  alias: {
    '@vicons/carbon': resolve(__dirname, 'icons'),
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
    head: [
      ['link', { rel: 'icon', href: 'favicon.ico' }],
      // Safari 顶部状态栏 / 底部工具栏的背景色跟随该 meta;
      // 不设的话会回退到 <body> 默认白底, 在首页黑底场景下出现\"上下白条\".
      // 0a0a0a 与首页 --hm-bg 保持一致, 暗色主题的视觉边界更连续.
      ['meta', { name: 'theme-color', content: '#0a0a0a' }],
      // iOS Safari 全屏 / PWA 状态栏样式 (黑底白字)
      ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
    ],
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
