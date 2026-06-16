import { defineClientConfig } from '@vuepress/client';
import { h, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { usePageData } from 'vuepress/client';
import DifficultyBadge from './components/DifficultyBadge.vue';

import './style/index.scss';

function createBadgeInjector(getPageData) {
  let retryTimer = null;

  const inject = (maxRetries = 10) => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    const difficulty = getPageData().value?.frontmatter?.difficulty;

    // 移除可能残留的 badge
    const existing = document.querySelector('.difficulty-tag');
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

    onMounted(() => {
      inject();
    });

    watch(
      () => route.path,
      () => {
        nextTick(() => {
          inject();
        });
      },
      { flush: 'post' }
    );
  },
});
