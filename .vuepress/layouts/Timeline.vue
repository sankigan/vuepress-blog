<template>
  <GenericContainer class="timeline-mag">
    <!-- 顶部摘要：总数 + 按年统计 + 视图切换 -->
    <header class="timeline-header">
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
            <span>卡片</span>
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
            <span>列表</span>
          </button>
        </div>
      </div>

      <!-- 筛选条 -->
      <div class="timeline-filters" v-if="allTags.length || allCategories.length">
        <div class="filter-group" v-if="allCategories.length">
          <span class="filter-label">分类</span>
          <button
            class="filter-chip"
            :class="{ active: activeCategory === '' }"
            @click="activeCategory = ''"
          >全部</button>
          <button
            v-for="cat in visibleCategories"
            :key="cat"
            class="filter-chip"
            :class="{ active: activeCategory === cat }"
            @click="activeCategory = activeCategory === cat ? '' : cat"
          >
            {{ cat }}<span class="filter-chip__count">{{ categoryCountMap.get(cat) }}</span>
          </button>
          <button
            v-if="allCategories.length > CHIP_LIMIT"
            class="filter-chip filter-chip--more"
            @click="showAllCategories = !showAllCategories"
          >{{ showAllCategories ? '收起' : `+${allCategories.length - CHIP_LIMIT}` }}</button>
        </div>

        <div class="filter-group" v-if="allTags.length">
          <span class="filter-label">标签</span>
          <button
            class="filter-chip filter-chip--tag"
            :class="{ active: activeTag === '' }"
            @click="activeTag = ''"
          >全部</button>
          <button
            v-for="tag in visibleTags"
            :key="tag"
            class="filter-chip filter-chip--tag"
            :class="{ active: activeTag === tag }"
            @click="activeTag = activeTag === tag ? '' : tag"
          >
            {{ tag }}<span class="filter-chip__count">{{ tagCountMap.get(tag) }}</span>
          </button>
          <button
            v-if="allTags.length > CHIP_LIMIT"
            class="filter-chip filter-chip--tag filter-chip--more"
            @click="showAllTags = !showAllTags"
          >{{ showAllTags ? '收起' : `+${allTags.length - CHIP_LIMIT}` }}</button>
        </div>
      </div>
    </header>

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
      <!-- 年份内嵌热力图: 通过 heatmapMap 按 group.year 查表, 命中才渲染 -->
      <div
        v-if="heatmapMap.get(group.year)"
        class="heatmap-panel heatmap-panel--inline"
      >
        <div class="heatmap-panel__body">
          <!-- 周几标签 (左侧, 只标 Mon/Wed/Fri 减少视觉噪音)
               采用 GitHub 风格: 网格行序为 Sun/Mon/Tue/Wed/Thu/Fri/Sat,
               标签放在第 2/4/6 行 (Mon/Wed/Fri), 头尾 (Sun/Sat) 各留 1 行空白以保证视觉对称. -->
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
        >
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
    <!-- 放在 .timeline-mag 末尾, 配合 position: relative 参考系 -->
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
  </GenericContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import GenericContainer from '@components/GenericContainer/index.vue';
import { useExtendPageData } from '@vuepress-reco/vuepress-plugin-page/composables';
import { formatISODate } from '@utils/other.js';

type ViewMode = 'card' | 'list';
const VIEW_MODE_KEY = 'timeline:view-mode';

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
  key: string;       // 唯一 key, 用日期 ISO 或 'blank-i'
  col: number;       // grid 列 (1-based)
  row: number;       // grid 行 (1-based, 1=Mon ... 7=Sun)
  level: 0 | 1 | 2 | 3 | 4;
  blank: boolean;    // 占位格 (年初/年末用来对齐周列)
  future: boolean;   // 未来格 (今年中今天之后的日期), 视觉上比 lv0 更浅, 不响应 hover
  date: string;      // YYYY-MM-DD, blank/future 时仍保留真实日期 (future 用得到, blank 为空)
  titles: string[];  // 当天文章标题
}

interface HeatMonthLabel {
  label: string; // 'Jan' ...
  col: number;   // 对应的 grid 列
}

interface HeatPanel {
  year: number;
  total: number;
  cells: HeatCell[];
  months: HeatMonthLabel[];
}

const { posts } = useExtendPageData();

// 筛选状态
const activeTag = ref('');
const activeCategory = ref('');

// 默认收起阈值, 超过则需要点击"+N"展开
const CHIP_LIMIT = 8;
const showAllTags = ref(false);
const showAllCategories = ref(false);

// 视图模式: 卡片 / 列表; SSR 安全, 默认 card, 挂载后从 localStorage 恢复
const viewMode = ref<ViewMode>('card');
onMounted(() => {
  try {
    const saved = window.localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
    if (saved === 'card' || saved === 'list') {
      viewMode.value = saved;
    }
  } catch (_) {
    // localStorage 不可用时静默忽略
  }
});
const setViewMode = (mode: ViewMode) => {
  viewMode.value = mode;
  try {
    window.localStorage.setItem(VIEW_MODE_KEY, mode);
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

      // 优先用 frontmatter.description, 否则 fallback 到 categories 拼接
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
    .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
});

// 全量收集 tag/category 供筛选
// 全量收集 + 计数 (用 Map 一次遍历完成, 避免分两次)
// 注意: 计数基于全量 normalizedPosts, 而不是 filteredPosts,
//       否则筛某分类后其他分类数量会变成 0, 失去"对比信息"
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

// 折叠后显示的子集; 但若当前选中的 chip 在折叠范围之外, 要把它带进来避免"选中却看不见"
const visibleCategories = computed<string[]>(() => {
  if (showAllCategories.value || allCategories.value.length <= CHIP_LIMIT) {
    return allCategories.value;
  }
  const head = allCategories.value.slice(0, CHIP_LIMIT);
  if (activeCategory.value && !head.includes(activeCategory.value)) {
    head.push(activeCategory.value);
  }
  return head;
});

const visibleTags = computed<string[]>(() => {
  if (showAllTags.value || allTags.value.length <= CHIP_LIMIT) {
    return allTags.value;
  }
  const head = allTags.value.slice(0, CHIP_LIMIT);
  if (activeTag.value && !head.includes(activeTag.value)) {
    head.push(activeTag.value);
  }
  return head;
});

// 应用筛选
const filteredPosts = computed<PostLite[]>(() => {
  return normalizedPosts.value.filter((p) => {
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

const totalCount = computed(() => filteredPosts.value.length);

// 跨越年数 = 最晚年 - 最早年 + 1, 比"有文章的年份数"更符合直觉
const yearSpan = computed(() => {
  const years = filteredGroups.value.map((g) => Number(g.year));
  if (!years.length) return 0;
  return Math.max(...years) - Math.min(...years) + 1;
});

// ============================================================
// 热力图聚合
// ============================================================
// 设计要点 (避免踩坑):
//  1. 用 ISO 周历 (周一为起始), 一年起止可能横跨 53 或 54 周
//     -> 列数取实际算出的周数, 不写死 53, 否则边缘年份会越界或留空列
//  2. 同周跨年的格子归属"自然年", 跨年那几天放在对应年份的面板首/末列
//     -> 直观: 用户找 2023 年的内容不会跑去 2024 面板
//  3. 颜色分档按"当年最大值的分位"动态切, 防止低产年份全部 lv1, 高产年份全部 lv4
//  4. 月份标签只在该月的"第一个出现在网格里的格子所在列"标一次, 用 gridColumnStart 精确对位

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 把 Date 转成本地 YYYY-MM-DD, 不依赖 toISOString (会被 UTC 偏移)
const toYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// 采用 GitHub 风格: Sun 起头 (Sun=0, Mon=1 ... Sat=6).
// 这样 weekdays 标签 _ Mon _ Wed _ Fri _ 在 7 行中头尾各空 1 行, 视觉对称.
// 注: 函数名沿用 isoWeekday 仅为语义上的 "weekday index", 实际并非 ISO 标准 (ISO 是 Mon=1..Sun=7).
const isoWeekday = (d: Date): number => d.getDay();

const heatmapYears = computed<HeatPanel[]>(() => {
  // 按年聚合: 同年内按 YMD 累计该天的标题列表
  const byYear = new Map<number, Map<string, string[]>>();
  filteredPosts.value.forEach((p) => {
    const y = p.rawDate.getFullYear();
    const ymd = toYMD(p.rawDate);
    if (!byYear.has(y)) byYear.set(y, new Map());
    const dayMap = byYear.get(y)!;
    if (!dayMap.has(ymd)) dayMap.set(ymd, []);
    dayMap.get(ymd)!.push(p.title);
  });

  // 倒序年份
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return years.map<HeatPanel>((year) => {
    const dayMap = byYear.get(year)!;

    // 当年最大单日发文数, 用于动态分档
    let maxCount = 0;
    dayMap.forEach((titles) => {
      if (titles.length > maxCount) maxCount = titles.length;
    });

    // 该年第一天的 ISO 周序: 决定首列起始 row
    const first = new Date(year, 0, 1);
    const last = new Date(year, 11, 31);
    const firstWd = isoWeekday(first); // 0..6
    const lastWd = isoWeekday(last);

    // 今天 00:00, 用于把"今年未到日期"标记为 future
    // 提到外面只算一次, 避免循环里反复 new Date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    const cells: HeatCell[] = [];
    const monthFirstCol = new Map<number, number>(); // month -> first col

    // 首列前置空白格 (年初不是周日时, 前面用 blank 占位对齐到 Sun)
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

    // 逐日遍历当年
    let col = 1;
    let row = firstWd + 1; // 1-based grid row
    const cursor = new Date(year, 0, 1);
    while (cursor.getFullYear() === year) {
      const ymd = toYMD(cursor);
      const titles = dayMap.get(ymd) || [];
      const count = titles.length;
      // 当年中今天之后的日期标记为 future: 视觉更浅, 不响应 hover, 不参与统计
      const isFuture = cursor.getTime() > todayTs;

      // 4 档动态分位: 0=无, 1=1..max/4, 2=..max/2, 3=..max*3/4, 4=>max*3/4
      // future 日期强制 level=0 (即使理论上不会有 titles, 这里防御性兜底)
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

      // 记录每月第一次出现的列 (用于顶部月标签)
      // future 月份也记录: 视觉上灰色月份也应有月名标签, 让"未到的月份"位置清晰
      const m = cursor.getMonth();
      if (!monthFirstCol.has(m)) {
        monthFirstCol.set(m, col);
      }

      // 推进一天
      cursor.setDate(cursor.getDate() + 1);
      row++;
      if (row > 7) {
        row = 1;
        col++;
      }
    }

    // 末列后置空白 (12-31 之后, 补到周六, 让最后一列也是完整 7 行)
    // 循环退出时:
    //   - 若 12-31 落在某列中间, row 被推到了 lastWd+2 (1-based), col 不变
    //   - 若 12-31 恰好是周六 (lastWd=6), row 被推到 1, col++ 跳到了新空列
    // 因此用 lastWd 直接判断:
    if (lastWd < 6) {
      // 12-31 的列号: 此时循环未跨列, 就是当前 col
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

    // 月份标签: 只保留 col >= 1 的, 按 col 升序
    const months: HeatMonthLabel[] = [...monthFirstCol.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([m, c]) => ({ label: MONTH_LABELS[m], col: c }));

    const total = [...dayMap.values()].reduce((acc, arr) => acc + arr.length, 0);

    return { year, total, cells, months };
  });
});

// 按 year 字符串建索引, 给模板按 group.year (string) 直接 .get(), 避免每个 year-section 写 .find
// 注意: heatmapYears 的 year 是 number, filteredGroups 的 year 是 string, 这里统一为 string key
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
// 不用原生 title (丑/不能多行/不能列文章), 也不每格挂一个 DOM (上千格性能差)
// 方案: 单个浮动 div, 通过 mouseenter 填内容, mousemove 更新位置, mouseleave 隐藏
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

// 把鼠标坐标转为相对 .timeline-mag 的坐标, 让 tooltip (单例, 挂在 .timeline-mag 末尾) 跟随鼠标
// 用 .timeline-mag 作为参考系: 跨多个 year-section 都能正确定位
const positionTip = (evt: MouseEvent) => {
  const wrap = (evt.currentTarget as HTMLElement)?.closest?.('.timeline-mag') as HTMLElement | null;
  if (!wrap) return { x: evt.clientX, y: evt.clientY };
  const rect = wrap.getBoundingClientRect();
  // 偏移 14px 避开光标; 不做边界翻转, tooltip CSS 用 max-width 控宽
  return {
    x: evt.clientX - rect.left + 14,
    y: evt.clientY - rect.top + 14,
  };
};

const showTip = (evt: MouseEvent, cell: HeatCell) => {
  // 占位格 (年初年末对齐用) 和 future 格 (今年未到的日期) 都不展示 tooltip
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

// 卡片元数据: 智能去重
// 规则: 如果已经按某 chip 筛选, 卡片就不再重复显示该 chip (避免"全屏复读机"),
//      并对数量做上限控制, 保证密度不被打回原形。
const DISPLAY_CAT_LIMIT = 1;
const DISPLAY_TAG_LIMIT = 2;

// 剔除当前激活的分类/tag, 避免和顶部筛选条信息重复。
// 卡片高度由 .post-card__head { min-height } 锁定, 不会因 chip 消失而抖动。
const displayCats = (post: PostLite): string[] => {
  const cats: string[] = post.frontmatter.categories || [];
  const filtered = activeCategory.value
    ? cats.filter((c) => c !== activeCategory.value)
    : cats;
  return filtered.slice(0, DISPLAY_CAT_LIMIT);
};

const displayTags = (post: PostLite): string[] => {
  const tags: string[] = post.frontmatter.tags || [];
  const filtered = activeTag.value
    ? tags.filter((t) => t !== activeTag.value)
    : tags;
  return filtered.slice(0, DISPLAY_TAG_LIMIT);
};
</script>
