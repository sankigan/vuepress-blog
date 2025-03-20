import { resolve } from 'path';
import recoTheme from 'vuepress-theme-reco';
import { defineUserConfig } from 'vuepress';
import { viteBundler } from '@vuepress/bundler-vite';
import { webpackBundler } from '@vuepress/bundler-webpack';

export default defineUserConfig({
  lang: 'zh-CN',
  title: 'Sanki\'s Blog',
  description: '',
  bundler: viteBundler(),
  // bundler: webpackBundler(),
  alias: {
    '@vicons/carbon': resolve(__dirname, 'icons'),
  },
  theme: recoTheme({
    logo: '/logo.png',
    // docsDir: './docs',
    docsBranch: 'main',
    author: 'sankigan',
    lastUpdatedText: '更新于',
    editLinkText: '编辑此页面',
    authorAvatar: '/avatar.jpg',
    repo: 'https://github.com/sankigan',
    docsRepo: 'https://github.com/sankigan/vuepress-blog',
    head: [
      ['link', { rel: 'icon', href: 'favicon.ico' }]
    ],
    navbar: [
      { text: '首页', link: '/', icon: 'Home' },
      // { text: '文章', link: '/posts.html', icon: 'Blog' },
      {
        text: '分类',
        icon: 'Categories',
        children: [
          { text: '前端', link: '/categories/qianduan/1.html' },
          { text: '后端', link: '/categories/houduan/1.html' },
          { text: '算法', link: '/categories/suanfa/1.html' },
          { text: '设计模式', link: '/categories/shejimoshi/1.html' },
        ],
      },
      { text: '标签', link: '/tags/JavaScript/1', icon: 'Tag' },
      { text: '时间轴', link: '/timeline.html', icon: 'Calendar', },
      // { text: '项目', link: '/code', icon: 'Code' },
      {
        text: '文档',
        icon: 'Doc',
        children: [
          { text: 'vuepress-reco', link: 'https://theme-reco.vuejs.press/' },
        ],
      },
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
