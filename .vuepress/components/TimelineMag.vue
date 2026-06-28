<template>
  <div class="timeline-mag">
    <!-- 顶部摘要：总数 + 按年统计 + 视图切换 -->
    <header class="timeline-header">
      <!-- 可选大标题 (Tags/Categories 锁定页使用; Timeline 主页不传, 不渲染) -->
      <div v-if="title || subtitle" class="timeline-header__title">
        <h1 v-if="title" class="timeline-header__title-main">{{ title }}</h1>
        <p v-if="subtitle" class="timeline-header__title-sub">{{ subtitle }}</p>
      </div>

      <div class="timeline-header__top">
        <p class="timeline-meta">
          共 <strong>{{ totalCount }}</strong> 篇文章 · 跨越
          <strong>{{ yearSpan }}</strong> 年
        </p>

        <!-- 视图切换 -->
        <div class="view-switcher" role="tablist" aria-label="视图切换">
          <button
            class="view-switcher__btn"
            :class="{ active: viewMode === 'card' }"
            role="tab"
            :aria-selected="viewMode === 'card'"
            title="卡片视图"
            @click="setViewMode('card')"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <rect x="1" y="1" width="6" height="6" rx="1.2" fill="currentColor" />
              <rect x="9" y="1" width="6" height="6" rx="1.2" fill="currentColor" />
              <rect x="1" y="9" width="6" height="6" rx="1.2" fill="currentColor" />
              <rect x="9" y="9" width="6" height="6" rx="1.2" fill="currentColor" />
            </svg>
            <span class="sr-only">卡片</span>
          </button>
          <button
            class="view-switcher__btn"
            :class="{ active: viewMode === 'list' }"
            role="tab"
            :aria-selected="viewMode === 'list'"
            title="列表视图"
            @click="setViewMode('list')"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <rect x="1" y="2" width="14" height="2" rx="1" fill="currentColor" />
              <rect x="1" y="7" width="14" height="2" rx="1" fill="currentColor" />
              <rect x="1" y="12" width="14" height="2" rx="1" fill="currentColor" />
            </svg>
            <span class="sr-only">列表</span>
          </button>
        </div>
      </div>

      <!-- 筛选条 -->
      <!-- 当某个维度被锁定 (lockedTag/lockedCategory) 时:
           - 该维度的筛选条仍渲染, 但去掉"全部"按钮, 且当前锁定项强制 active 且不可取消
           - 这样能继续在该维度看到"上下文 chip 群", 又防止用户在 /tags/JavaScript 页误以为能看到全部 -->
      <div
        class="timeline-filters"
        v-if="(showCategoryFilter && visibleCategories.length) || (showTagFilter && visibleTags.length)"
      >
        <div class="filter-group" v-if="showCategoryFilter && visibleCategories.length">
          <span class="filter-label">分类</span>
          <!-- "全部": 锁定模式下应跳回总览页 (/categories.html), 否则就地清空筛选 -->
          <RouterLink
            v-if="lockedCategory"
            to="/categories.html"
            class="filter-chip"
          >全部</RouterLink>
          <button
            v-else
            class="filter-chip"
            :class="{ active: activeCategory === '' }"
            @click="activeCategory = ''"
          >全部</button>

          <!-- chip 渲染分支:
               1) 锁定模式 + 当前锁定项 → 仍渲染 button (disabled + locked 样式, 不可点)
               2) 锁定模式 + 非锁定项   → 渲染 RouterLink, 直接跳到该分类的锁定页
               3) 非锁定模式            → 渲染 button, 走内部 toggle -->
          <template v-for="cat in visibleCategories" :key="cat">
            <button
              v-if="lockedCategory === cat"
              class="filter-chip active locked"
              disabled
            >
              {{ cat }}<span class="filter-chip__count">{{ categoryCountMap.get(cat) }}</span>
            </button>
            <RouterLink
              v-else-if="lockedCategory"
              :to="categoryLink(cat)"
              class="filter-chip"
            >
              {{ cat }}<span class="filter-chip__count">{{ categoryCountMap.get(cat) }}</span>
            </RouterLink>
            <button
              v-else
              class="filter-chip"
              :class="{ active: activeCategory === cat }"
              @click="toggleCategory(cat)"
            >
              {{ cat }}<span class="filter-chip__count">{{ categoryCountMap.get(cat) }}</span>
            </button>
          </template>

          <button
            v-if="allCategories.length > CHIP_LIMIT"
            class="filter-chip filter-chip--more"
            @click="showAllCategories = !showAllCategories"
          >{{ showAllCategories ? '收起' : `+${allCategories.length - CHIP_LIMIT}` }}</button>
        </div>

        <div class="filter-group" v-if="showTagFilter && visibleTags.length">
          <span class="filter-label">标签</span>
          <!-- "全部": 锁定模式下应跳回总览页 (/tags.html), 否则就地清空筛选 -->
          <RouterLink
            v-if="lockedTag"
            to="/tags.html"
            class="filter-chip filter-chip--tag"
          >全部</RouterLink>
          <button
            v-else
            class="filter-chip filter-chip--tag"
            :class="{ active: activeTag === '' }"
            @click="activeTag = ''"
          >全部</button>

          <!-- 同上, 3 个分支 -->
          <template v-for="tag in visibleTags" :key="tag">
            <button
              v-if="lockedTag === tag"
              class="filter-chip filter-chip--tag active locked"
              disabled
            >
              {{ tag }}<span class="filter-chip__count">{{ tagCountMap.get(tag) }}</span>
            </button>
            <RouterLink
              v-else-if="lockedTag"
              :to="tagLink(tag)"
              class="filter-chip filter-chip--tag"
            >
              {{ tag }}<span class="filter-chip__count">{{ tagCountMap.get(tag) }}</span>
            </RouterLink>
            <button
              v-else
              class="filter-chip filter-chip--tag"
              :class="{ active: activeTag === tag }"
              @click="toggleTag(tag)"
            >
              {{ tag }}<span class="filter-chip__count">{{ tagCountMap.get(tag) }}</span>
            </button>
          </template>

          <button
            v-if="allTags.length > CHIP_LIMIT"
            class="filter-chip filter-chip--tag filter-chip--more"
            @click="showAllTags = !showAllTags"
          >{{ showAllTags ? '收起' : `+${allTags.length - CHIP_LIMIT}` }}</button>
        </div>
      </div>
    </header>

    <!-- Pinned 置顶区:
         - 数据源: frontmatter.sticky > 0 的 page (含 blogs/README.md 这类目录索引页)
         - 仅在通用 Timeline 主页展示 (锁定页 pinnedPosts 已为空, v-if 自动跳过)
         - 视觉: 不参与年份分组, 始终钉在顶部; 用文件夹形式呈现, 点击展开后露出 1~3 张纸,
                 每张纸 = 一篇 pinned 文章, 点击跳转 -->
    <section
      v-if="pinnedPosts.length"
      class="pinned-section pinned-section--folder"
    >
      <PinnedFolder
        :color="folderColor"
        :size="1.3"
        :items="folderItems"
      />
    </section>

    <!-- 按年份分段的卡片网格 (热力图作为每年的"小结/封面"内嵌在年份标题下方) -->
    <section
      v-for="group in filteredGroups"
      :key="group.year"
      class="year-section"
    >
      <!-- 左栏: 年份 + 篇数, sticky 跟随滚动
           移动端 (媒体查询) 降级为顶部横排 header, 不参与 sticky -->
      <aside class="year-aside">
        <h2 class="year-aside__year">{{ group.year }}</h2>
        <span class="year-aside__divider" aria-hidden="true"></span>
        <div class="year-aside__count">
          <span class="year-aside__count-num">{{ group.data.length }}</span>
          <span class="year-aside__count-unit">篇</span>
        </div>
      </aside>

      <!-- 右栏: 热力图 + 文章卡片, 占据剩余宽度 -->
      <div class="year-main">
      <!-- 年份内嵌热力图: 通过 heatmapMap 按 group.year 查表, 命中才渲染
           hideHeatmap=true 时整体跳过 (Tags/Categories 锁定页用) -->
      <div
        v-if="!hideHeatmap && heatmapMap.get(group.year)"
        class="heatmap-panel heatmap-panel--inline"
      >
        <div class="heatmap-panel__body">
          <!-- 周几标签 (左侧, 只标 Mon/Wed/Fri 减少视觉噪音) -->
          <div class="heatmap-weekdays" aria-hidden="true">
            <span></span>
            <span>Mon</span>
            <span></span>
            <span>Wed</span>
            <span></span>
            <span>Fri</span>
            <span></span>
          </div>

          <div class="heatmap-grid-wrap">
            <!-- 月份标签 (顶部, 在每月第一周对应的列位置渲染) -->
            <div class="heatmap-months" aria-hidden="true">
              <span
                v-for="m in heatmapMap.get(group.year)!.months"
                :key="'m-' + group.year + '-' + m.label"
                class="heatmap-months__label"
                :style="{ gridColumnStart: m.col }"
              >{{ m.label }}</span>
            </div>

            <!-- 格子矩阵: column-major (一周一列) -->
            <div class="heatmap-grid">
              <div
                v-for="cell in heatmapMap.get(group.year)!.cells"
                :key="cell.key"
                class="heatmap-cell"
                :class="[
                  'heatmap-cell--lv' + cell.level,
                  {
                    'heatmap-cell--blank': cell.blank,
                    'heatmap-cell--future': cell.future,
                  },
                ]"
                :style="{
                  gridColumnStart: cell.col,
                  gridRowStart: cell.row,
                }"
                @mouseenter="showTip($event, cell)"
                @mousemove="moveTip($event)"
                @mouseleave="hideTip"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="card-grid">
        <RouterLink
          v-for="post in group.data"
          :key="post.path"
          :to="post.path"
          class="post-card"
          :class="getDifficulty(post) ? [`post-card--diff-${getDifficulty(post)!.level}`] : []"
        >
          <!-- 右下角巨型字母水印 (E/M/H), 渐变填充, 纯装饰 -->
          <span
            v-if="getDifficulty(post)"
            class="post-card__wm-letter"
            aria-hidden="true"
          >{{ getDifficulty(post)!.label.charAt(0).toUpperCase() }}</span>

          <div class="post-card__head">
            <span class="post-card__date">{{ post.date }}</span>
            <span
              v-for="cat in displayCats(post)"
              :key="'c-' + cat"
              class="post-card__cat"
            >{{ cat }}</span>
          </div>
          <div class="post-card__body">
            <h3 class="post-card__title">{{ post.title }}</h3>
            <span
              v-if="displayTags(post).length"
              class="post-card__tags"
              :title="displayTags(post).map((t) => '#' + t).join(' ')"
            >
              <span
                v-for="tag in displayTags(post)"
                :key="'t-' + tag"
                class="post-card__tag"
              >#{{ tag }}</span>
            </span>
          </div>
          <p class="post-card__excerpt" v-if="post.excerpt">{{ post.excerpt }}</p>
        </RouterLink>
      </div>

      <!-- 列表视图 -->
      <ul v-else class="post-list">
        <li
          v-for="post in group.data"
          :key="post.path"
          class="post-list__item"
        >
          <RouterLink :to="post.path" class="post-list__link">
            <span class="post-list__date">{{ post.date }}</span>
            <span
              v-if="getDifficulty(post)"
              class="difficulty-tag difficulty-tag--dot"
              :class="`difficulty-tag--${getDifficulty(post)!.level}`"
            >{{ getDifficulty(post)!.label }}</span>
            <span class="post-list__title">{{ post.title }}</span>
            <span
              v-for="cat in displayCats(post)"
              :key="'lc-' + cat"
              class="post-list__cat"
            >{{ cat }}</span>
            <span
              v-for="tag in displayTags(post)"
              :key="'lt-' + tag"
              class="post-list__tag"
            >#{{ tag }}</span>
          </RouterLink>
        </li>
      </ul>
      </div>
    </section>

    <!-- 空状态 -->
    <div v-if="!filteredGroups.length" class="timeline-empty">
      没有符合条件的文章
    </div>

    <!-- 浮动 tooltip (全页单例): 所有年份热力图共用一个, 跟随鼠标定位 -->
    <div
      class="heatmap-tip"
      :class="{ 'is-visible': tip.visible }"
      :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
    >
      <div class="heatmap-tip__date">{{ tip.date }}</div>
      <div v-if="tip.posts.length" class="heatmap-tip__count">
        {{ tip.posts.length }} 篇
      </div>
      <div v-else class="heatmap-tip__count heatmap-tip__count--empty">
        无发布
      </div>
      <ul v-if="tip.posts.length" class="heatmap-tip__list">
        <li
          v-for="t in tip.posts"
          :key="'tp-' + t"
          class="heatmap-tip__item"
        >{{ t }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useExtendPageData } from '@vuepress-reco/vuepress-plugin-page/composables';
import { formatISODate } from '@utils/other.js';
import PinnedFolder, { type FolderItem } from './PinnedFolder.vue';

type ViewMode = 'card' | 'list';
// 视图模式 localStorage key 前缀; 实际 key 形如 'timeline:view-mode:<scope>'
// 不同业务场景传不同 scope (见 props.viewModeScope), 偏好相互隔离.
// scope='timeline' 与历史 key 'timeline:view-mode' 不重合, 老用户的全局偏好失效
// 是有意为之 (新语义下"哪个偏好覆盖哪些页"已变, 沿用旧值会造成预期错位).
const VIEW_MODE_KEY_PREFIX = 'timeline:view-mode';

interface PostLite {
  title: string;
  path: string;
  date: string;
  rawDate: Date;
  excerpt: string;
  frontmatter: Record<string, any>;
}

interface YearGroup {
  year: string;
  data: PostLite[];
}

// 热力图单元格
interface HeatCell {
  key: string;
  col: number;
  row: number;
  level: 0 | 1 | 2 | 3 | 4;
  blank: boolean;
  future: boolean;
  date: string;
  titles: string[];
}

interface HeatMonthLabel {
  label: string;
  col: number;
}

interface HeatPanel {
  year: number;
  total: number;
  cells: HeatCell[];
  months: HeatMonthLabel[];
}

// Props: 用于 Tags/Categories 锁定页复用本组件
// - lockedTag/lockedCategory: 当前页面绑定的筛选维度; 传入时该维度自动激活且不可取消
// - title/subtitle: 顶部大标题 (Timeline 主页不传, 走原始 layout)
// - hideHeatmap: 隐藏年份热力图 (锁定页样本量小, 热力图意义不大)
// - hideOppositeFilter: 隐藏"对面那一维"的筛选条
//     例: 标签页 (lockedTag) 设此项后, 分类筛选条不渲染; 反之亦然
//     仅锁定模式下生效 (无 lock 时该 prop 被忽略)
// - hideCategoryFilter / hideTagFilter: 显式隐藏对应维度的筛选条
//     用于 /categories.html (聚焦分类, 隐藏标签) 与 /tags.html (聚焦标签, 隐藏分类)
//     与 hideOppositeFilter 是独立开关, 任一为真即隐藏
const props = withDefaults(defineProps<{
  lockedTag?: string;
  lockedCategory?: string;
  title?: string;
  subtitle?: string;
  hideHeatmap?: boolean;
  hideOppositeFilter?: boolean;
  hideCategoryFilter?: boolean;
  hideTagFilter?: boolean;
  // 视图模式 (卡片/列表) 的 localStorage 命名空间
  // 默认 'default' 保持向后兼容 (历史 key 即 timeline:view-mode:default 形式).
  // 不同业务场景 (时间线主页/分类/标签) 传不同值, 偏好相互独立, 不再串味儿.
  viewModeScope?: string;
}>(), {
  viewModeScope: 'default',
});

const { posts, categorySummary } = useExtendPageData();

// label → URL slug 映射
// reco 内部把中文 tag/category 用 pinyin 转过, 实际生成的页面路径是
// /tags/<pinyin-slug>/1.html, 而不是 /tags/<原文>/1.html
// 这里读 categorySummary[key].items[*] = { label, categoryValue }
// label 是原文, categoryValue 是 slug, 用 label 反查 slug 才能正确跳转
const tagSlugMap = computed<Map<string, string>>(() => {
  const map = new Map<string, string>();
  const items = (categorySummary as any)?.tags?.items || {};
  Object.values(items).forEach((it: any) => {
    if (it?.label) map.set(it.label, it.categoryValue);
  });
  return map;
});

const categorySlugMap = computed<Map<string, string>>(() => {
  const map = new Map<string, string>();
  const items = (categorySummary as any)?.categories?.items || {};
  Object.values(items).forEach((it: any) => {
    if (it?.label) map.set(it.label, it.categoryValue);
  });
  return map;
});

// 拼接锁定页路径; 找不到 slug 时退化用 encodeURIComponent (兼容性兜底, 一般不会命中)
const tagLink = (tag: string): string => {
  const slug = tagSlugMap.value.get(tag) || encodeURIComponent(tag);
  return `/tags/${slug}/1.html`;
};
const categoryLink = (cat: string): string => {
  const slug = categorySlugMap.value.get(cat) || encodeURIComponent(cat);
  return `/categories/${slug}/1.html`;
};

// 筛选状态: 初值取 locked 值
// 语义: active* 一定等于 "当前生效的筛选词", 由锁定 prop 或用户点击驱动
const activeTag = ref(props.lockedTag || '');
const activeCategory = ref(props.lockedCategory || '');

// 路由切换时 (组件实例常被复用, 不会卸载重建) 必须把 active 整体重置到新 prop 基线
// 关键 bug 历史:
//   旧实现只各自 watch 单一 prop, 跨页时另一维 prop 未变 (始终 undefined),
//   导致前一页用户点选的 active 残留, 串到下一页继续生效:
//     /categories.html 点"前端" → /tags.html 列表被"前端"二次过滤
//     /categories/qianduan/1.html → /tags/xxx/1.html
//       lockedTag 变了清 activeTag, 但 activeCategory='前端' 未清, 同样被串
// 现实现: 同时 watch 两个 prop, 任一变化都"以两个 prop 为权威, 整体覆盖 active"
//   - 锁定维度: active = lock 值
//   - 非锁定维度: active = '' (强制清空用户残留)
watch(
  () => [props.lockedTag, props.lockedCategory] as const,
  ([t, c]) => {
    activeTag.value = t || '';
    activeCategory.value = c || '';
  },
);

// 筛选条显隐: hideOppositeFilter 开启后, 隐藏与 lock 维度相反的那一组
// - lockedTag + hideOppositeFilter → 隐藏"分类"筛选
// - lockedCategory + hideOppositeFilter → 隐藏"标签"筛选
// - 自身那一维 (锁定维度) 始终保留, 展示当前锁定的 chip 作为上下文
const showCategoryFilter = computed<boolean>(() => {
  if (props.hideCategoryFilter) return false;
  if (props.hideOppositeFilter && props.lockedTag) return false;
  return true;
});
const showTagFilter = computed<boolean>(() => {
  if (props.hideTagFilter) return false;
  if (props.hideOppositeFilter && props.lockedCategory) return false;
  return true;
});

// 点击 chip: 仅在非锁定模式下被调用 (锁定模式 chip 改用 RouterLink, 见模板)
const toggleCategory = (cat: string) => {
  activeCategory.value = activeCategory.value === cat ? '' : cat;
};
const toggleTag = (tag: string) => {
  activeTag.value = activeTag.value === tag ? '' : tag;
};

// 默认收起阈值, 超过则需要点击"+N"展开
const CHIP_LIMIT = 8;
const showAllTags = ref(false);
const showAllCategories = ref(false);

// 视图模式: 卡片 / 列表; SSR 安全, 默认 card, 挂载后从 localStorage 恢复
// 按 viewModeScope 分命名空间存储, 不同业务场景偏好独立 (时间线/分类/标签互不影响)
const viewModeStorageKey = computed<string>(() => `${VIEW_MODE_KEY_PREFIX}:${props.viewModeScope}`);
const viewMode = ref<ViewMode>('card');

const loadViewMode = () => {
  try {
    const saved = window.localStorage.getItem(viewModeStorageKey.value) as ViewMode | null;
    viewMode.value = saved === 'card' || saved === 'list' ? saved : 'card';
  } catch (_) {
    // localStorage 不可用时静默忽略
  }
};

onMounted(loadViewMode);
// scope 变化时重新加载该 scope 下保存的偏好 (本组件理论上不会变 scope,
// 但加 watch 让组件对外更稳健, 父组件动态切 scope 也能正确响应)
watch(viewModeStorageKey, loadViewMode);

const setViewMode = (mode: ViewMode) => {
  viewMode.value = mode;
  try {
    window.localStorage.setItem(viewModeStorageKey.value, mode);
  } catch (_) {
    // ignore
  }
};

// 把 posts 规整成带 Date 对象的扁平列表, 便于排序和分组
const normalizedPosts = computed<PostLite[]>(() => {
  return (posts || [])
    .filter((p: any) => p?.frontmatter?.date)
    .map((p: any) => {
      const rawStr = String(p.frontmatter.date);
      const connector = rawStr.includes('/') ? '/' : '-';
      const dateOnly = formatISODate(rawStr).split(' ')[0];
      const [year, month, day] = dateOnly.split(connector);
      const rawDate = new Date(
        `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      );

      const fmDesc = p.frontmatter.description;
      const excerpt = typeof fmDesc === 'string' && fmDesc.trim() ? fmDesc.trim() : '';

      return {
        title: p.title || '(无标题)',
        path: p.path,
        date: `${month}/${day}`,
        rawDate,
        excerpt,
        frontmatter: p.frontmatter || {},
      } as PostLite;
    })
    .sort((a, b) => {
      // 1. 主排序: frontmatter.date 降序 (新的在前)
      //    rawDate 已统一规整到天粒度, 跨天直接由它决定顺序
      const diff = b.rawDate.getTime() - a.rawDate.getTime();
      if (diff !== 0) return diff;

      // 2. 同一天 fallback: 按 git 首次提交时间降序 (后提交的在前)
      //    __createdTime 由 .vuepress/config.js 的 onInitialized 钩子从
      //    page.data.git.createdTime 透传到 frontmatter, 单位 ms.
      //    没有 git 记录 (新建未提交 / 历史缺失) 时视为 0, 排到最后.
      //
      //    已知局限: 同一次 commit 内的多篇文章 createdTime 完全相等,
      //    此时回退到 Array.sort 的稳定性 (即原始 posts 的字典序), 不再额外处理.
      const ga = Number(a.frontmatter.__createdTime) || 0;
      const gb = Number(b.frontmatter.__createdTime) || 0;
      return gb - ga;
    });
});

// 计数 Map: 基于全量 normalizedPosts (不受筛选影响), 保证 chip 数字有"对比信息"
const categoryCountMap = computed<Map<string, number>>(() => {
  const map = new Map<string, number>();
  normalizedPosts.value.forEach((p) => {
    (p.frontmatter.categories || []).forEach((c: string) => {
      map.set(c, (map.get(c) || 0) + 1);
    });
  });
  return map;
});

const tagCountMap = computed<Map<string, number>>(() => {
  const map = new Map<string, number>();
  normalizedPosts.value.forEach((p) => {
    (p.frontmatter.tags || []).forEach((t: string) => {
      map.set(t, (map.get(t) || 0) + 1);
    });
  });
  return map;
});

// 按出现次数倒序; 次数相同时按字母序, 保证稳定
const allCategories = computed<string[]>(() => {
  return [...categoryCountMap.value.keys()].sort((a, b) => {
    const diff = (categoryCountMap.value.get(b) || 0) - (categoryCountMap.value.get(a) || 0);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
});

const allTags = computed<string[]>(() => {
  return [...tagCountMap.value.keys()].sort((a, b) => {
    const diff = (tagCountMap.value.get(b) || 0) - (tagCountMap.value.get(a) || 0);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
});

// 折叠后显示的子集; 若选中/锁定的 chip 在折叠范围外, 需主动带进来
const visibleCategories = computed<string[]>(() => {
  if (showAllCategories.value || allCategories.value.length <= CHIP_LIMIT) {
    return allCategories.value;
  }
  const head = allCategories.value.slice(0, CHIP_LIMIT);
  const must = props.lockedCategory || activeCategory.value;
  if (must && !head.includes(must)) {
    head.push(must);
  }
  return head;
});

const visibleTags = computed<string[]>(() => {
  if (showAllTags.value || allTags.value.length <= CHIP_LIMIT) {
    return allTags.value;
  }
  const head = allTags.value.slice(0, CHIP_LIMIT);
  const must = props.lockedTag || activeTag.value;
  if (must && !head.includes(must)) {
    head.push(must);
  }
  return head;
});

// ============================================================
// Pinned (置顶) 文章
// ------------------------------------------------------------
// 来源: frontmatter.sticky 为真值的 page (含 blogs/README.md 这类目录索引页)
// 行为:
//   - 仅在"通用 Timeline 主页"展示 (锁定页 /tags/xxx /categories/xxx 不出 Pinned 区,
//     因为那是垂直主题的上下文, 全局置顶塞进去会喧宾夺主)
//   - 从主时间流 (filteredPosts) 中剔除, 不进年份分组、不进热力图统计
//   - 排序: sticky 数值降序 (数字越大越靠前), 同值按 rawDate 降序
//     约定: sticky 可以是 true (=1) 或正整数; 0/false/未设 视为非置顶
// ============================================================
const stickyWeight = (p: PostLite): number => {
  const v = p.frontmatter?.sticky;
  if (v === true) return 1;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const isLockedView = computed<boolean>(
  () => Boolean(props.lockedTag || props.lockedCategory),
);

const pinnedPosts = computed<PostLite[]>(() => {
  if (isLockedView.value) return [];
  return normalizedPosts.value
    .filter((p) => stickyWeight(p) > 0)
    .sort((a, b) => {
      const sw = stickyWeight(b) - stickyWeight(a);
      if (sw !== 0) return sw;
      return b.rawDate.getTime() - a.rawDate.getTime();
    });
});

// 主时间流中需要剔除的 path 集合 (pinned 不重复出现在年份分组里)
const pinnedPathSet = computed<Set<string>>(
  () => new Set(pinnedPosts.value.map((p) => p.path)),
);

// 应用筛选
const filteredPosts = computed<PostLite[]>(() => {
  return normalizedPosts.value.filter((p) => {
    // pinned 文章不进主时间流 (热力图/年份分组/总数统计都基于 filteredPosts)
    if (pinnedPathSet.value.has(p.path)) return false;
    if (activeCategory.value) {
      const cats: string[] = p.frontmatter.categories || [];
      if (!cats.includes(activeCategory.value)) return false;
    }
    if (activeTag.value) {
      const tags: string[] = p.frontmatter.tags || [];
      if (!tags.includes(activeTag.value)) return false;
    }
    return true;
  });
});

// 按年分组, 年份倒序
const filteredGroups = computed<YearGroup[]>(() => {
  const map = new Map<string, PostLite[]>();
  filteredPosts.value.forEach((p) => {
    const year = String(p.rawDate.getFullYear());
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(p);
  });
  return [...map.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, data]) => ({ year, data }));
});

// 总数包含 pinned, 让用户在顶部摘要里看到的"共 X 篇"语义保持稳定
// (pinned 仅是展示位置改变, 仍属于站点内容)
const totalCount = computed(() => filteredPosts.value.length + pinnedPosts.value.length);

const yearSpan = computed(() => {
  const years = filteredGroups.value.map((g) => Number(g.year));
  if (!years.length) return 0;
  return Math.max(...years) - Math.min(...years) + 1;
});

// ============================================================
// 热力图聚合 (保持原 Timeline.vue 设计, 详细注释见原文件)
// ============================================================
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isoWeekday = (d: Date): number => d.getDay();

const heatmapYears = computed<HeatPanel[]>(() => {
  const byYear = new Map<number, Map<string, string[]>>();
  filteredPosts.value.forEach((p) => {
    const y = p.rawDate.getFullYear();
    const ymd = toYMD(p.rawDate);
    if (!byYear.has(y)) byYear.set(y, new Map());
    const dayMap = byYear.get(y)!;
    if (!dayMap.has(ymd)) dayMap.set(ymd, []);
    dayMap.get(ymd)!.push(p.title);
  });

  const years = [...byYear.keys()].sort((a, b) => b - a);

  return years.map<HeatPanel>((year) => {
    const dayMap = byYear.get(year)!;

    let maxCount = 0;
    dayMap.forEach((titles) => {
      if (titles.length > maxCount) maxCount = titles.length;
    });

    const first = new Date(year, 0, 1);
    const last = new Date(year, 11, 31);
    const firstWd = isoWeekday(first);
    const lastWd = isoWeekday(last);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    const cells: HeatCell[] = [];
    const monthFirstCol = new Map<number, number>();

    for (let r = 0; r < firstWd; r++) {
      cells.push({
        key: `blank-pre-${r}`,
        col: 1,
        row: r + 1,
        level: 0,
        blank: true,
        future: false,
        date: '',
        titles: [],
      });
    }

    let col = 1;
    let row = firstWd + 1;
    const cursor = new Date(year, 0, 1);
    while (cursor.getFullYear() === year) {
      const ymd = toYMD(cursor);
      const titles = dayMap.get(ymd) || [];
      const count = titles.length;
      const isFuture = cursor.getTime() > todayTs;

      let level: HeatCell['level'] = 0;
      if (!isFuture && count > 0 && maxCount > 0) {
        const ratio = count / maxCount;
        if (ratio > 0.75) level = 4;
        else if (ratio > 0.5) level = 3;
        else if (ratio > 0.25) level = 2;
        else level = 1;
      }

      cells.push({
        key: ymd,
        col,
        row,
        level,
        blank: false,
        future: isFuture,
        date: ymd,
        titles: isFuture ? [] : titles,
      });

      const m = cursor.getMonth();
      if (!monthFirstCol.has(m)) {
        monthFirstCol.set(m, col);
      }

      cursor.setDate(cursor.getDate() + 1);
      row++;
      if (row > 7) {
        row = 1;
        col++;
      }
    }

    if (lastWd < 6) {
      const fillCol = col;
      for (let r = lastWd + 1; r < 7; r++) {
        cells.push({
          key: `blank-post-${r}`,
          col: fillCol,
          row: r + 1,
          level: 0,
          blank: true,
          future: false,
          date: '',
          titles: [],
        });
      }
    }

    const months: HeatMonthLabel[] = [...monthFirstCol.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([m, c]) => ({ label: MONTH_LABELS[m], col: c }));

    const total = [...dayMap.values()].reduce((acc, arr) => acc + arr.length, 0);

    return { year, total, cells, months };
  });
});

const heatmapMap = computed<Map<string, HeatPanel>>(() => {
  const map = new Map<string, HeatPanel>();
  heatmapYears.value.forEach((panel) => {
    map.set(String(panel.year), panel);
  });
  return map;
});

// ============================================================
// 热力图 tooltip (共享单例, 跟随鼠标)
// ============================================================
const tip = ref<{
  visible: boolean;
  x: number;
  y: number;
  date: string;
  posts: string[];
}>({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  posts: [],
});

const positionTip = (evt: MouseEvent) => {
  const wrap = (evt.currentTarget as HTMLElement)?.closest?.('.timeline-mag') as HTMLElement | null;
  if (!wrap) return { x: evt.clientX, y: evt.clientY };
  const rect = wrap.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left + 14,
    y: evt.clientY - rect.top + 14,
  };
};

const showTip = (evt: MouseEvent, cell: HeatCell) => {
  if (cell.blank || cell.future) return;
  const { x, y } = positionTip(evt);
  tip.value = {
    visible: true,
    x,
    y,
    date: cell.date,
    posts: cell.titles,
  };
};

const moveTip = (evt: MouseEvent) => {
  if (!tip.value.visible) return;
  const { x, y } = positionTip(evt);
  tip.value.x = x;
  tip.value.y = y;
};

const hideTip = () => {
  tip.value.visible = false;
};

// 卡片元数据智能去重: 已锁定/激活的维度不再在卡片上重复显示, 避免"全屏复读机"
const DISPLAY_CAT_LIMIT = 1;
const DISPLAY_TAG_LIMIT = 2;

const displayCats = (post: PostLite): string[] => {
  const cats: string[] = post.frontmatter.categories || [];
  const filtered = activeCategory.value
    ? cats.filter((c) => c !== activeCategory.value)
    : cats;
  return filtered.slice(0, DISPLAY_CAT_LIMIT);
};

// ============================================================
// Pinned 文件夹相关辅助
// ============================================================

// 把日期转成英文短格式, 例如 'JUN 29, 2026', 用于文件夹纸张顶部 kicker
const EN_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const formatEnDate = (d: Date): string => {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  return `${EN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

// 文件夹主色: 复用主题色变量 (:root 已注入), SSR/取不到时退化到品牌紫
// 注: getComputedStyle 仅浏览器有效; SSR 阶段返回固定值, 挂载后 computed 会自动重算
const folderColor = computed<string>(() => {
  if (typeof window === 'undefined') return '#5e72e4';
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--theme-color')
    .trim();
  return v || '#5e72e4';
});

// 把 pinnedPosts 映射成 Folder 的 paper 数据 (最多 3 张, 超出截断)
// 注: 这里只截断不补位, 实际有几篇就传几条, 由 PinnedFolder 内部按数量决定布局
const folderItems = computed<FolderItem[]>(() =>
  pinnedPosts.value.slice(0, 3).map((p) => ({
    title: p.title,
    path: p.path,
    dateLabel: formatEnDate(p.rawDate),
    excerpt: p.excerpt,
    cat: (p.frontmatter.categories || [])[0] || '',
  })),
);

const displayTags = (post: PostLite): string[] => {
  const tags: string[] = post.frontmatter.tags || [];
  const filtered = activeTag.value
    ? tags.filter((t) => t !== activeTag.value)
    : tags;
  return filtered.slice(0, DISPLAY_TAG_LIMIT);
};

// LeetCode 题解难度标签
// - 仅当 frontmatter.difficulty 存在且能归一到 easy/medium/hard 时返回非空
// - 同时兼容英文 (Easy/Medium/Hard) 和中文 (简单/中等/困难) 写法
// - 返回值用于 v-if 判断 + 拼 class 后缀, label 直接用 frontmatter 原值, 保留大小写
const DIFFICULTY_LEVEL_MAP: Record<string, 'easy' | 'medium' | 'hard'> = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
  简单: 'easy',
  中等: 'medium',
  困难: 'hard',
};
const getDifficulty = (post: PostLite): { level: 'easy' | 'medium' | 'hard'; label: string } | null => {
  const raw = post.frontmatter.difficulty;
  if (!raw || typeof raw !== 'string') return null;
  const level = DIFFICULTY_LEVEL_MAP[raw.toLowerCase()] || DIFFICULTY_LEVEL_MAP[raw];
  if (!level) return null;
  return { level, label: raw };
};

</script>
