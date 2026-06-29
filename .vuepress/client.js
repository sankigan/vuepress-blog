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

export default defineClientConfig({
  enhance({ app }) {
    app.component('DifficultyBadge', DifficultyBadge);
  },
  setup() {
    const route = useRoute();
    const pageData = usePageData();
    const inject = createBadgeInjector(() => pageData);

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
    });

    watch(
      () => route.path,
      () => {
        syncHomeFlag();
        nextTick(() => {
          inject();
        });
      },
      { flush: 'post' }
    );
  },
});
