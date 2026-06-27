<template>
  <!--
    Hero 首屏 (深色 + Strands 背景 + 循环打字机版):
      - 背景层: Strands 流光 (绝对定位铺满, 在内容下方); 参数调大, 让流光占据视觉中心
      - 内容层:
          eyebrow: 顶部 meta 索引 (等宽字, 浅灰)
          title:   `> sanki` 循环打字机
                     '> ' 作为终端 prompt 立即可见 (得意黑);
                     'sanki' 逐字敲入 (得意黑), 每字 ~110ms;
                     敲完停留 ~2.4s → 逐字退格 → 短暂停顿 → 重新开始, 无限循环.
                     末尾常驻 blink 光标 (下划线 `_` 风格).
          subtitle/tagline: 副标 + 一句话宣言, 浅白色

    a11y:
      - 整个 title 有 aria-label, 屏读器拿到完整 "> sanki"
      - 打字效果只对视觉用户 (字符 span 全部 aria-hidden)
      - prefers-reduced-motion: 不演打字也不循环, 直接展示完整 title, caret 不闪
  -->
  <section class="home-hero" data-hero>
    <!-- WebGL 流光背景 (绝对定位铺满 hero); 客户端按需挂载, SSR 时无 canvas -->
    <ClientOnly>
      <!--
        centerY 单位说明: 由于 shader 把 uv 除以 uScale (=2.6),
        hero 半高对应的 uv.y 实际只有 0.5/2.6 ≈ 0.192,
        所以 centerY 推荐范围 [-0.19, +0.19], 超出会让流光完全离开视口.
        -0.12: strand 中心线沉到画面 ~65% 高度处,
        上半圆弧大部分可见, 下半圆弧大部分被视口底裁切.
      -->
      <StrandsCanvas
        class="home-hero__bg"
        :scale="2.6"
        :amplitude="1.6"
        :thickness="1.2"
        :glow="2.2"
        :intensity="0.9"
        :taper="1.6"
        :speed="0.42"
        :center-y="-0.12"
      />
    </ClientOnly>

    <div class="home-hero__inner">
      <p v-if="data.eyebrow" class="home-hero__eyebrow">{{ data.eyebrow }}</p>

      <h1 class="home-hero__title" :aria-label="data.title || ''">
        <!-- prompt 部分常驻 -->
        <span class="home-hero__prompt" aria-hidden="true">{{ promptText }}</span>
        <!-- 打字部分: 逐字 push 入 typedChars -->
        <span class="home-hero__typed" aria-hidden="true">{{ typedChars }}</span>
        <!-- 光标 (下划线风格) -->
        <span class="home-hero__caret" aria-hidden="true"></span>
      </h1>

      <p v-if="data.subtitle" class="home-hero__subtitle">{{ data.subtitle }}</p>

      <p v-if="data.tagline" class="home-hero__tagline">{{ data.tagline }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ClientOnly } from '@vuepress/client';
import StrandsCanvas from './StrandsCanvas.vue';

interface HeroData {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  tagline?: string;
}

const props = defineProps<{ data: HeroData }>();

/* ============================================================
 *  打字机切分: title 通常形如 '> sanki'
 *    把第一个空格 (含) 之前的部分当作 prompt 立即渲染 (不参与循环),
 *    剩余部分逐字敲入并循环. 若无空格, 整串都走打字.
 * ============================================================ */
const promptText = computed<string>(() => {
  const t = props.data.title || '';
  const idx = t.indexOf(' ');
  if (idx < 0) return '';
  return t.slice(0, idx + 1); // 含尾部空格
});

const restText = computed<string>(() => {
  const t = props.data.title || '';
  const idx = t.indexOf(' ');
  if (idx < 0) return t;
  return t.slice(idx + 1);
});

const typedChars = ref('');

let typingTimer: ReturnType<typeof setTimeout> | null = null;
let stopped = false;

function clearTyping() {
  if (typingTimer) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }
}

/* ============================================================
 *  循环打字机:
 *    typing  : 逐字敲入 (perCharDelay = 110ms)
 *    holding : 全部敲完后停留 (holdDelay = 2400ms)
 *    deleting: 逐字退格 (perDelDelay = 60ms, 退得比敲快, 更自然)
 *    pausing : 全部退完后短暂停顿 (pauseDelay = 600ms) 再下一轮
 *  使用同一个 setTimeout 链, 避免 setInterval 累积漂移.
 * ============================================================ */
function runLoop() {
  const target = restText.value;
  if (!target) return;

  const perCharDelay = 110;
  const perDelDelay = 60;
  const holdDelay = 2400;
  const pauseDelay = 600;
  const initialDelay = 320; // 等 overlay 揭幕完再敲, 视觉节奏更稳

  type Phase = 'typing' | 'holding' | 'deleting' | 'pausing';
  let phase: Phase = 'typing';
  let i = 0;

  const step = () => {
    if (stopped) return;

    if (phase === 'typing') {
      if (i < target.length) {
        typedChars.value += target.charAt(i);
        i += 1;
        typingTimer = setTimeout(step, perCharDelay);
      } else {
        phase = 'holding';
        typingTimer = setTimeout(step, holdDelay);
      }
      return;
    }

    if (phase === 'holding') {
      phase = 'deleting';
      typingTimer = setTimeout(step, perDelDelay);
      return;
    }

    if (phase === 'deleting') {
      if (typedChars.value.length > 0) {
        typedChars.value = typedChars.value.slice(0, -1);
        typingTimer = setTimeout(step, perDelDelay);
      } else {
        phase = 'pausing';
        typingTimer = setTimeout(step, pauseDelay);
      }
      return;
    }

    if (phase === 'pausing') {
      phase = 'typing';
      i = 0;
      typingTimer = setTimeout(step, perCharDelay);
      return;
    }
  };

  typingTimer = setTimeout(step, initialDelay);
}

onMounted(() => {
  if (typeof window === 'undefined') return;
  // reduce-motion: 不演打字也不循环, 直接整段显示
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typedChars.value = restText.value;
    return;
  }
  runLoop();
});

onBeforeUnmount(() => {
  stopped = true;
  clearTyping();
});
</script>
