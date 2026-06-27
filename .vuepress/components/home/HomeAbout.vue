<template>
  <!--
    About 模块:
      - 左侧大段文字 (paragraphs[] 由 frontmatter 提供, 修改不动组件)
      - 右侧头像 + meta key-value 列表 (avatar 用 mask reveal 入场, 第 3 步接动效)
      - 整体走 12 栏隐式网格, 移动端塌缩成单列
    SSR 安全: 完全静态, 无浏览器 API
  -->
  <section id="about" class="home-section home-about" data-section>
    <ChapterTitle
      :eyebrow="data.eyebrow || '01 / ABOUT'"
      :heading="data.heading || 'About.'"
      :revealed="true"
    />

    <div class="home-about__body">
      <!-- 文字栏: 多段 p, 段间留白由样式控制, 不在 frontmatter 写换行符 -->
      <div class="home-about__text">
        <p
          v-for="(p, i) in paragraphs"
          :key="'about-p-' + i"
          class="home-about__paragraph"
        >{{ p }}</p>
      </div>

      <!-- 名片栏: 头像 + 一组 meta -->
      <aside class="home-about__card">
        <div class="home-about__avatar-wrap" v-if="data.avatar">
          <img
            :src="data.avatar"
            alt=""
            class="home-about__avatar"
            loading="lazy"
            decoding="async"
          />
        </div>
        <dl v-if="meta.length" class="home-about__meta">
          <div
            v-for="(m, i) in meta"
            :key="'about-m-' + i"
            class="home-about__meta-row"
          >
            <dt class="home-about__meta-label">{{ m.label }}</dt>
            <dd class="home-about__meta-value">{{ m.value }}</dd>
          </div>
        </dl>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ChapterTitle from './ChapterTitle.vue';

interface MetaItem { label: string; value: string; }
interface AboutData {
  eyebrow?: string;
  heading?: string;
  paragraphs?: string[];
  meta?: MetaItem[];
  avatar?: string;
}

const props = defineProps<{ data: AboutData }>();

const paragraphs = computed<string[]>(() => props.data.paragraphs || []);
const meta = computed<MetaItem[]>(() => props.data.meta || []);
</script>
