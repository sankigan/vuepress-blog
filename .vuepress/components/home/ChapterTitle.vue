<template>
  <!--
    章节标题通用组件:
      - eyebrow: 顶部小字索引 (如 "01 / ABOUT"), 等宽风格强化编辑设计的"目录感"
      - heading: 章节英文大标题, 巨型字号
      - 第 2/3 步会接 GSAP, 给 .chapter-title__heading 做 clip-path reveal + 字符 stagger
    无障碍:
      - 用 h2 输出语义大纲 (Hero 用 h1, 其余章节统一 h2, 便于 a11y 树阅读)
      - aria-label 显式提供完整文本; 字符切分仅做视觉, 添加 aria-hidden 避免读屏冗余
  -->
  <header class="chapter-title" :class="{ 'is-revealed': revealed }">
    <p v-if="eyebrow" class="chapter-title__eyebrow">{{ eyebrow }}</p>
    <h2 class="chapter-title__heading" :aria-label="heading">
      <span class="chapter-title__heading-inner" aria-hidden="true">{{ heading }}</span>
    </h2>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow?: string;
  heading: string;
  // revealed 控制可见态, 静态阶段默认 true; 第 2 步接 GSAP 后改为初始 false, 由 ScrollTrigger 触发
  revealed?: boolean;
}>();
</script>
