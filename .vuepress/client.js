import { defineClientConfig } from '@vuepress/client';
import { h, onMounted, watch, nextTick, createApp } from 'vue';
import { useRoute } from 'vue-router';
import { usePageData } from 'vuepress/client';
import DifficultyBadge from './components/DifficultyBadge.vue';
import GlassFilterDefs from './components/GlassFilterDefs.vue';

import './style/index.scss';

/*
  全局挂载一次 GlassFilterDefs:
    - navbar 的 backdrop-filter: url(#nav-glass) 需要在 DOM 中存在一个 <filter id="nav-glass">.
    - 该 SVG 必须挂在 body 下 (而不是某个 layout 内), 否则路由切换会卸载, navbar 会失去 filter.
    - 不依赖主应用根的生命周期, 直接 createApp + mount 到 body.
*/
function mountGlassFilterDefs() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('nav-glass')) return; // 已注入

  const host = document.createElement('div');
  host.id = 'glass-filter-defs-host';
  document.body.appendChild(host);
  createApp(GlassFilterDefs).mount(host);
}

function createBadgeInjector(getPageData) {
  let retryTimer = null;

  const inject = (maxRetries = 10) => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    const difficulty = getPageData().value?.frontmatter?.difficulty;

    // 移除上一篇遗留在标题里的 badge。
    // 注意: 必须限定在 .page-title 内, 否则 document.querySelector('.difficulty-tag')
    // 会命中正文里第一个难度徽章 (如「力扣总结」表格首行的 Easy), 把它误删,
    // 导致汇总页第 1 题难度恒为空白。本注入器只负责文章标题徽章, 不应触碰正文。
    const existing = document.querySelector('.page-title .difficulty-tag');
    if (existing) {
      existing.remove();
    }

    if (!difficulty) {
      return;
    }

    const titleEl = document.querySelector('.page-title');
    if (!titleEl) {
      // 页面标题元素还未渲染，重试
      if (maxRetries > 0) {
        retryTimer = setTimeout(() => inject(maxRetries - 1), 200);
      }
      return;
    }

    // 避免重复注入
    if (titleEl.querySelector('.difficulty-tag')) {
      return;
    }

    const badge = document.createElement('span');
    const difficultyLower = difficulty.toLowerCase();
    const typeMap = {
      'easy': 'easy',
      'medium': 'medium',
      'hard': 'hard',
    };
    const type = typeMap[difficultyLower] || 'easy';
    badge.className = `difficulty-tag difficulty-tag--${type}`;
    badge.textContent = difficulty;
    titleEl.prepend(badge);
  };

  return inject;
}

const DETAILS_TITLE_SELECTOR = '.custom-container.details > summary.custom-container-title';

/**
 * Details 折叠块标题的 PillNav 风格 hover 动效增强:
 *   1. 将 summary 纯文字包裹为 .label-stack（双层 .pill-label + .pill-label-hover）
 *   2. 插入 .hover-circle 蒙版
 *   3. 根据胶囊实际尺寸计算圆形直径 & transform-origin（与 PillNav 相同公式）,
 *      通过 CSS 自定义属性传给 CSS 过渡驱动动画
 * 返回 cleanup 函数, 路由切换时调用以移除 resize 监听。
 */
function enhanceDetailsHover() {
  if (typeof document === 'undefined') return () => {};

  let retryTimer = null;
  let onResize = null;

  const layout = (summaries) => {
    summaries.forEach((summary) => {
      const rect = summary.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      // 圆形直径需令弧线穿过胶囊顶角, 使填充呈现"从底部撑开"的弧形
      const R = ((w * w) / 4 + h * h) / (2 * h);
      const D = Math.ceil(2 * R) + 2;
      const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
      const originY = D - delta;

      summary.style.setProperty('--circle-w', `${D}px`);
      summary.style.setProperty('--circle-h', `${D}px`);
      summary.style.setProperty('--circle-bottom', `-${delta}px`);
      summary.style.setProperty('--circle-origin', `50% ${originY}px`);
    });
  };

  const run = (retries = 5) => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    if (onResize) {
      window.removeEventListener('resize', onResize);
      onResize = null;
    }

    const summaries = [];
    document.querySelectorAll(DETAILS_TITLE_SELECTOR).forEach((summary) => {
      if (summary.querySelector('.hover-circle')) return;

      const text = summary.textContent ?? '';

      const circle = document.createElement('span');
      circle.className = 'hover-circle';
      circle.setAttribute('aria-hidden', 'true');

      const labelStack = document.createElement('span');
      labelStack.className = 'label-stack';

      const label = document.createElement('span');
      label.className = 'pill-label';
      label.textContent = text;

      const labelHover = document.createElement('span');
      labelHover.className = 'pill-label-hover';
      labelHover.textContent = text;

      labelStack.appendChild(label);
      labelStack.appendChild(labelHover);

      summary.textContent = '';
      summary.appendChild(circle);
      summary.appendChild(labelStack);

      summaries.push(summary);
    });

    if (summaries.length === 0) {
      if (retries > 0) {
        retryTimer = setTimeout(() => run(retries - 1), 200);
      }
      return;
    }

    layout(summaries);

    onResize = () => layout(summaries);
    window.addEventListener('resize', onResize);

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => layout(summaries)).catch(() => {});
    }
  };

  run();

  return () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (onResize) {
      window.removeEventListener('resize', onResize);
      onResize = null;
    }
  };
}

export default defineClientConfig({
  enhance({ app }) {
    app.component('DifficultyBadge', DifficultyBadge);
  },
  setup() {
    const route = useRoute();
    const pageData = usePageData();
    const inject = createBadgeInjector(() => pageData);
    let detailsHoverCleanup = () => {};

    // 在 <body> 上标记当前是否为首页, 供 CSS 精确控制 nav active 态:
    //   reco 的 Link.vue 用 route.path.startsWith(item.link) 判定 active, 而首页 link 是 '/',
    //   任何子路径都以 '/' 开头, 导致 "首页" nav 在所有页面都被打上 .router-link-active.
    //   theme option home: '/' 防御逻辑因 reco 内部 bug 不可靠 (themeLocal.home 实际是 undefined).
    //   故走 CSS 兜底: body[data-is-home="false"] 时, 强行抹掉首页 nav item 的 active 视觉.
    const syncHomeFlag = () => {
      if (typeof document === 'undefined') return;
      document.body.dataset.isHome = route.path === '/' ? 'true' : 'false';
    };

    onMounted(() => {
      syncHomeFlag();
      inject();
      mountGlassFilterDefs();
      detailsHoverCleanup = enhanceDetailsHover();
    });

    watch(
      () => route.path,
      () => {
        syncHomeFlag();
        nextTick(() => {
          inject();
          detailsHoverCleanup();
          detailsHoverCleanup = enhanceDetailsHover();
        });
      },
      { flush: 'post' }
    );
  },
});
