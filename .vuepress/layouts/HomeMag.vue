<template>
  <!--
    自定义首页 layout (Strands + 打字机版):
      - 仅一屏 hero, 无 about / posts list, 沉浸式封面
      - 全屏深色背景 + Strands 流光 + 打字机 `> sanki`
      - 顶部走 GenericContainer 拿到主题 navbar
      - data-home-mag-immersive 用于通知全局 CSS:
          当前是 home 沉浸态, 让 navbar 在首页做磨砂胶囊浮岛 (浅色模式仍是浅, 深色翻深)

    FOUC 保护: 与之前一致, 内容首帧 opacity:0 (is-pending), composable / 兜底
    在双 rAF 后移除 is-pending, opening overlay 演完后揭开 hero.
  -->
  <GenericContainer>
    <div
      class="home-mag"
      :class="{ 'is-pending': isPending }"
      data-home-mag
      data-home-mag-immersive
    >
      <!--
        Opening overlay: 首次访问的揭幕色块.
        - 与之前一致, sessionStorage 标记控制是否演.
        - 现在底色翻深, 与新的 hero 调性一致.
      -->
      <div
        class="home-mag__overlay"
        data-home-overlay
        aria-hidden="true"
      ></div>

      <HomeHero :data="frontmatter.hero || {}" />
    </div>
  </GenericContainer>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { usePageFrontmatter } from '@vuepress/client';
import GenericContainer from '@components/GenericContainer/index.vue';
import HomeHero from '../components/home/HomeHero.vue';
import { useHomeMagAnimation } from '../composables/useHomeMagAnimation';

// 顶层 frontmatter 注入, 类型对子组件透明传递
const frontmatter = usePageFrontmatter<Record<string, any>>();

// is-pending: SSR/首帧时为 true, 让内容初始隐藏避免 FOUC.
const isPending = ref(true);

// 启动入场动效 (composable 内部已自带 lifecycle)
useHomeMagAnimation();

onMounted(() => {
  // 在 body 上挂全局标记, 让 CSS 知道当前是首页沉浸态:
  //   - 影响 navbar 渲染 (磨砂胶囊浮岛 + 深色模式适配)
  //   - 路由切换离开首页时再清理
  document.body.dataset.homeImmersive = 'true';

  // 双 rAF: 确保 GSAP 设好初始态后再揭开 pending
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isPending.value = false;
    });
  });
  // 兜底: GSAP 加载失败时 1.5s 后强制放开
  setTimeout(() => {
    if (isPending.value) isPending.value = false;
  }, 1500);
});

onBeforeUnmount(() => {
  // 离开首页时移除标记, 让其他页恢复正常 navbar
  delete document.body.dataset.homeImmersive;
});
</script>
