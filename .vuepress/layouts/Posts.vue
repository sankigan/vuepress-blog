<template>
  <!--
    /posts.html 及 /posts/<n>.html 全部由本 layout 接管, 仅做一件事: 跳转到 /timeline.html.

    为什么是这种实现:
      1. reco 主题在 node 端 (lib/node/pages.js + PageCreater._createBlogPaginationPages)
         硬编码注入了 /posts.html 与 /posts/<n>.html 一整套博客分页路由, 且无配置项可去除.
      2. VuePress client 端会优先用 .vuepress/layouts/ 下同名 layout 覆盖主题自带的
         (见 vuepress-theme-reco/lib/node/prepareClientConfigFile.js: layouts = { ...layouts, ...layoutsFromDir }).
      3. 项目已统一用 TimelineMag 承担列表+筛选, /posts.* 与 /timeline.html 功能重叠, 故选择重定向收敛.

    SSR 安全说明:
      - 构建期 (SSR) 时无 window/router, 此时本组件渲染为空 div, 不抛错, 不影响 HTML 生成.
      - 客户端 hydration 后立刻 router.replace, 不在历史里留下 /posts.* 入口.
      - 用 replace 而非 push 是为了避免回退键又回到 /posts.html 形成卡死循环.

    后续若要彻底移除路由 (而非重定向), 需要 fork reco 主题或写一个 vuepress plugin 在
    onInitialized 钩子里 app.pages = app.pages.filter(p => !/^\/posts(\/|\.)/.test(p.path)),
    成本远大于本方案, 暂不做.
  -->
  <div class="posts-redirect-placeholder" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  // 用 replace 避免在历史栈留 /posts.* 记录
  router.replace('/timeline.html');
});
</script>

<style scoped>
.posts-redirect-placeholder {
  /* 占位即可, 重定向瞬间完成; 给一个最小高度避免页面跳到 0 高度引发布局抖动 */
  min-height: 100vh;
}
</style>
