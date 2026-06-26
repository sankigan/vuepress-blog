<template>
  <GenericContainer>
    <!--
      本 layout 覆盖 reco 内置 Categories.vue, 同时承载 4 类页面:
        路径形态                            模式            渲染
        /categories.html                    overview        TimelineMag (全量 + 只显分类 filter)
        /tags.html                          overview        TimelineMag (全量 + 只显标签 filter)
        /categories/<value>/<page>.html     locked          TimelineMag (锁定分类)
        /tags/<value>/<page>.html           locked          TimelineMag (锁定标签)

      判定依据: 当前 route.path 形态 (不依赖 reco 注入数据, 规避路由切换时
        currentCategoryValue 可能短暂为空的中间帧导致 overview/locked 抖动)
        - 总览页: /categories.html /tags.html (本仓库根目录手写 md 生成)
        - 锁定页: /categories/<slug>/<n>.html /tags/<slug>/<n>.html

      reco 中文 → 拼音的坑 (PageCreater.js formatCategory = convertToPinyin):
        - reco 把所有 category/tag value 内部用 pinyin 转 slug
        - 生成的路由 path 是拼音, 注入的 currentCategoryValue 也是拼音 slug
        - 但文章 frontmatter.categories/tags 仍是原中文
        - 因此向 TimelineMag 传入 lockedTag/lockedCategory 时, 必须把 slug 反查回中文,
          否则 TimelineMag 内的 filter (frontmatter.categories.includes(active))
          全部 miss, 锁定页文章列表会空
        - 反查表: categorySummary[key].items[<slug>].label = 原中文

      设计说明:
        - 总览页与锁定页统一走 TimelineMag, 共享同一套"卡片/列表 + 年份分组 + 筛选条"体验
        - 总览页通过 hideTagFilter / hideCategoryFilter 隐藏对面那一维, 突出当前页职责
        - 分类/标签页均隐藏热力图: 此处页面职责是按"分类/标签"维度筛选浏览,
          时间维度的热力图与之正交, 容易喧宾夺主 (热力图保留在 Timeline 主页)
    -->

    <!--
      :key=\"instanceKey\" 关键说明:
        TimelineMag 内有 activeTag/activeCategory 等内部筛选状态.
        本 layout 同时承载 4 类路由, Vue 在同分支间会复用组件实例,
        导致用户在 A 页 (如 /categories.html) 点选的 chip 状态串到 B 页 (如 /tags.html).
        给两处 TimelineMag 都加 :key, 让 key 跟随 \"路由维度\" 变化,
        Vue 检测到 key 不同会销毁旧实例 + 重建新实例, 内部状态自然重置, 无需在子组件内额外打补丁.
        key 设计:
          总览页: overview-categories / overview-tags
          锁定页: locked-tags-<slug> / locked-categories-<slug>
        粒度: 总览页内同维度切换 (理论上无, 因总览页是手写 md, 不存在分页) 共用一个 key
              锁定页跨 slug 也重建 (顺手把之前提过的 lockedTag 同维度切换闪空问题彻底兜住)
    -->

    <!-- 总览页: 全量 TimelineMag, 只突出当前维度的筛选条
         view-mode-scope 按 categories/tags 维度区分, 与时间线主页也独立 -->
    <TimelineMag
      v-if="isOverview"
      :key="instanceKey"
      :title="overviewTitle"
      :subtitle="overviewSubtitle"
      :hide-tag-filter="!isTagsKey"
      :hide-category-filter="isTagsKey"
      :view-mode-scope="viewModeScope"
      hide-heatmap
    />

    <!-- 锁定页: TimelineMag + lockedTag/lockedCategory
         - hide-heatmap: 与总览页同理 (本页核心是分类/标签维度), 且样本量更小
         - hide-opposite-filter: 标签页只显标签 chip, 分类页只显分类 chip
         - view-mode-scope: 与同维度总览页共用 ("我在分类相关页偏好列表"是连贯偏好) -->
    <TimelineMag
      v-else
      :key="instanceKey"
      :locked-tag="isTagsKey ? currentValue : undefined"
      :locked-category="isTagsKey ? undefined : currentValue"
      :title="lockedTitle"
      :subtitle="lockedSubtitle"
      :view-mode-scope="viewModeScope"
      hide-heatmap
      hide-opposite-filter
    />
  </GenericContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useExtendPageData } from '@vuepress-reco/vuepress-plugin-page/composables';
import GenericContainer from '@components/GenericContainer/index.vue';
import { useMagicCard } from '@composables/index.js';
import TimelineMag from '../components/TimelineMag.vue';

const { categorySummary } = useExtendPageData();
const route = useRoute();

// 路径解析: 完全基于 route.path 推断 key/slug/overview, 不依赖 reco 注入数据
// 这样可以:
//   1. 规避路由切换 (/tags/A → /tags/B) 时 currentCategoryValue 短暂为空的中间帧
//   2. 让手写的 /categories.html /tags.html 总览页 (reco 不注入数据) 走同一套逻辑
// 路径形态:
//   /categories.html             → key=categories, slug=''
//   /tags.html                   → key=tags,       slug=''
//   /categories/<slug>/<n>.html  → key=categories, slug=<slug>
//   /tags/<slug>/<n>.html        → key=tags,       slug=<slug>
const routeInfo = computed<{ key: 'categories' | 'tags'; slug: string }>(() => {
  const path = route.path;
  // 锁定页: /<key>/<slug>/<n>.html
  const lockedMatch = path.match(/^\/(categories|tags)\/([^/]+)\/\d+\.html$/);
  if (lockedMatch) {
    let slug = lockedMatch[2];
    try { slug = decodeURIComponent(slug); } catch (_) { /* keep raw */ }
    return { key: lockedMatch[1] as 'categories' | 'tags', slug };
  }
  // 总览页 (或其它兜底): 按前缀粗判 key
  return { key: path.startsWith('/tags') ? 'tags' : 'categories', slug: '' };
});

const currentKey = computed<string>(() => routeInfo.value.key);
const isTagsKey = computed<boolean>(() => currentKey.value === 'tags');

// slug → label 反查表 (reco 把中文转拼音作 slug, 原中文存在 label 字段)
// 注: dev 模式下 reco 可能不转 path 但仍转 itemKey, slug 与 itemKey 不一定一致
// 因此除了按 itemKey 直查, 还按 label 自身建一份 (兜底处理 slug 本就是英文/已是中文的情况)
const slugLabelMap = computed<Map<string, string>>(() => {
  const map = new Map<string, string>();
  const items = (categorySummary as any)?.[currentKey.value]?.items || {};
  Object.entries(items).forEach(([itemKey, it]: [string, any]) => {
    const label = it?.label ?? itemKey;
    map.set(itemKey, label);           // 拼音 slug → 中文 label
    map.set(label, label);             // 中文自身 → 中文 (兜底)
    if (it?.categoryValue) map.set(it.categoryValue, label);
  });
  return map;
});

// 当前 value: 锁定页是原中文 label, 总览页为空
// 解析顺序: URL slug → 反查 label; 反查失败时退化用 slug 原样 (避免渲染空内容)
const currentValue = computed<string>(() => {
  const { slug } = routeInfo.value;
  if (!slug) return '';
  return slugLabelMap.value.get(slug) || slug;
});

// 是否总览页: 严格按 path 判定, 与 reco 注入数据解耦
const isOverview = computed<boolean>(() => !routeInfo.value.slug);

// 组件实例 key: 路由维度任一变化都重建 TimelineMag, 彻底隔离子组件内部状态
// 避免跨页 (尤其 /categories.html ↔ /tags.html 这种同走 v-if 分支的总览页)
// activeTag/activeCategory 串味儿. 详见模板里的注释.
const instanceKey = computed<string>(() => {
  const { key, slug } = routeInfo.value;
  return slug ? `locked-${key}-${slug}` : `overview-${key}`;
});

// 视图模式 (卡片/列表) 偏好的存储 scope: 分类页和标签页各一份
// 不细分到 slug, 是因为"我浏览分类相关页时偏好列表"通常是一个连贯偏好,
// 锁定到具体分类时强行重置反而违背直觉.
const viewModeScope = computed<string>(() => isTagsKey.value ? 'tags' : 'categories');

// 总览页大标题/副标题
const overviewTitle = computed<string>(() => isTagsKey.value ? '所有标签' : '所有分类');
const overviewSubtitle = computed<string>(() => {
  return isTagsKey.value
    ? '点击下方标签筛选, 或直接浏览全部文章时间线'
    : '点击下方分类筛选, 或直接浏览全部文章时间线';
});

// 锁定页大标题/副标题
const lockedTitle = computed<string>(() => {
  if (!currentValue.value) return '';
  return isTagsKey.value ? `#${currentValue.value}` : currentValue.value;
});

const lockedSubtitle = computed<string>(() => {
  if (!currentValue.value) return '';
  return isTagsKey.value
    ? '当前标签下的全部文章时间线'
    : '当前分类下的全部文章时间线';
});

// 沿用 reco 原 layout 的 magic-card 初始化, 保持卡片 hover 光效一致
const { initMagicCard } = useMagicCard();
onMounted(() => {
  initMagicCard();
});
watch(route, () => {
  initMagicCard();
});
</script>
