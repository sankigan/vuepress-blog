<template>
  <!-- 外层负责 scale, 不参与点击/键盘
       data-count: 当前有效纸张数 (1/2/3), 供 CSS 选择展开布局 -->
  <div
    :style="scaleStyle"
    :class="['folder-wrap', className]"
    :data-count="papers.length"
  >
    <div
      :class="['folder', { open }]"
      :style="folderStyle"
      tabindex="0"
      role="button"
      :aria-expanded="open"
      :aria-label="open ? 'Close folder' : 'Open folder'"
      @click="handleClick"
      @keydown="handleKeydown"
    >
      <div class="folder__back">
        <!-- 纸张: 数量与实际 pinned 文章数一致 (1/2/3 张, 不再用 null 补位)
             不同张数的展开布局由 CSS 根据父级 data-count 决定 -->
        <div
          v-for="(item, i) in papers"
          :key="i"
          :class="['paper', `paper-${i + 1}`]"
          :style="paperStyle(i)"
          @mousemove="(e) => onPaperMove(e, i)"
          @mouseleave="() => onPaperLeave(i)"
          @click.stop="onPaperClick($event, item)"
        >
          <!-- 纸张内容: 只保留标题, 单行省略
               (日期/摘要/分类移除, 小纸条空间有限, 标题已足够识别) -->
          <div class="paper__inner">
            <h4 class="paper__title" :title="item.title">{{ item.title }}</h4>
          </div>
        </div>
        <div class="folder__front"></div>
        <div class="folder__front right"></div>
      </div>
    </div>

    <!-- 文件夹下方的标签条: 提示这是 Pinned -->
    <div class="folder-caption">
      <span class="folder-caption__star" aria-hidden="true">📌</span>
      <span class="folder-caption__text">Pinned</span>
      <span class="folder-caption__count">{{ papers.length }} {{ papers.length > 1 ? 'items' : 'item' }}</span>
      <span class="folder-caption__hint">{{ open ? 'click folder to close' : 'click to open' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

// 单张纸对应一篇 pinned 文章的最小数据集
// 注: 当前纸张只渲染 title, 其它字段保留为可选, 方便未来扩展 (如 hover tooltip / 详情卡)
export interface FolderItem {
  title: string;
  path: string;
  dateLabel?: string;
  excerpt?: string;
  cat?: string;
}

const props = withDefaults(
  defineProps<{
    color?: string;
    size?: number;
    items?: FolderItem[];
    className?: string;
  }>(),
  {
    color: '#5227FF',
    size: 1,
    items: () => [],
    className: '',
  },
);

const MAX_ITEMS = 3;

// 工具函数: 把 hex 颜色加深 (与原 React 实现行为一致)
const darkenColor = (hex: string, percent: number): string => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return (
    '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  );
};

// 实际渲染的纸张列表 (最多 3 张, 不补位; 有几篇 pinned 就几张)
const papers = computed<FolderItem[]>(() => props.items.slice(0, MAX_ITEMS));

const open = ref(false);
// 每张纸的磁吸偏移 (open 状态下鼠标在纸上时, 该纸向鼠标方向微移)
// 长度固定 MAX_ITEMS, 索引超过 papers.length 的位置不会被访问, 不影响功能
const paperOffsets = ref<{ x: number; y: number }[]>(
  Array.from({ length: MAX_ITEMS }, () => ({ x: 0, y: 0 })),
);

const folderBackColor = computed(() => darkenColor(props.color, 0.08));
const paper1Color = computed(() => darkenColor('#ffffff', 0.1));
const paper2Color = computed(() => darkenColor('#ffffff', 0.05));
const paper3Color = '#ffffff';

const folderStyle = computed(() => ({
  '--folder-color': props.color,
  '--folder-back-color': folderBackColor.value,
  '--paper-1': paper1Color.value,
  '--paper-2': paper2Color.value,
  '--paper-3': paper3Color,
}));
const scaleStyle = computed(() => ({ transform: `scale(${props.size})` }));

// 单张纸的内联样式: 仅在 open 状态下输出 --magnet-x/y, 关闭时清空
// 关闭动画依赖 CSS transition 自然回零, 不需要在这里手动写偏移
const paperStyle = (i: number) => {
  if (!open.value) return {} as Record<string, string>;
  const o = paperOffsets.value[i] || { x: 0, y: 0 };
  return {
    '--magnet-x': `${o.x}px`,
    '--magnet-y': `${o.y}px`,
  };
};

const handleClick = () => {
  // 关闭时重置磁吸偏移, 防止下次打开时残留位移
  if (open.value) {
    paperOffsets.value = Array.from({ length: MAX_ITEMS }, () => ({ x: 0, y: 0 }));
  }
  open.value = !open.value;
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
};

const onPaperMove = (e: MouseEvent, i: number) => {
  if (!open.value) return;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const ox = (e.clientX - cx) * 0.15;
  const oy = (e.clientY - cy) * 0.15;
  const next = [...paperOffsets.value];
  next[i] = { x: ox, y: oy };
  paperOffsets.value = next;
};

const onPaperLeave = (i: number) => {
  const next = [...paperOffsets.value];
  next[i] = { x: 0, y: 0 };
  paperOffsets.value = next;
};

// 纸张点击: 仅在 open 状态下跳转, 折叠态让事件冒泡触发外层翻开
const router = useRouter();
const onPaperClick = (e: MouseEvent, item: FolderItem) => {
  if (!open.value) {
    // 折叠态: 让事件继续冒泡, 由外层 folder 接管翻开
    return;
  }
  // 展开态: 阻止冒泡, 防止再次触发 folder 折叠
  e.stopPropagation();
  router.push(item.path);
};
</script>

<style scoped lang="scss">
// ============================================================================
// 文件夹组件 - 改写自 reactbits.dev Folder
// 关键技术点:
//   1. .folder__back 作为绝对定位 stage, papers / front 都贴底对齐
//   2. open 状态下三张纸分别 translate + rotateZ 露出, hover 时附加磁吸
//   3. front/right 是文件夹"嘴"的左右两片, hover/open 时下倾 (skew + scaleY)
//   4. 颜色通过 CSS 变量 (--folder-color 等) 由 JS 注入, 支持运行时换色
// ============================================================================
.folder-wrap {
  // 给 caption 留位; scale 不会影响 caption 因为 scale 是父级整体的
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.folder {
  transition: all 0.2s ease-in;
  cursor: pointer;
  position: relative;
}

// hover 抬升 + 露出纸 (与 open 状态合并的逻辑见下方)
.folder:hover {
  transform: translateY(-8px);
}
.folder:hover .paper {
  transform: translate(-50%, 0%);
}
.folder:hover .folder__front {
  transform: skew(15deg) scaleY(0.6);
}
.folder:hover .right {
  transform: skew(-15deg) scaleY(0.6);
}

// open 态: 文件夹整体抬升, 承接 hover 的两片下倾动作
// 纸张展开位置见下方按 data-count 的分支
.folder.open {
  transform: translateY(-8px);
}
.folder.open .folder__front {
  transform: skew(15deg) scaleY(0.6);
}
.folder.open .right {
  transform: skew(-15deg) scaleY(0.6);
}

// ============================================================
// 展开布局: 根据实际纸张数 (data-count) 决定每张纸 open 后的位置
//   - 3 张: 左斜 / 中下 / 右斜 (原扇形, 保留经典效果)
//   - 2 张: 左右分散, 角度对称
//   - 1 张: 居中向上翻起
// 共同点: 都叠加 hover 时的 scale 放大 + 磁吸偏移 --magnet-x/y
// ============================================================

// --- 3 张 ---
.folder-wrap[data-count="3"] .folder.open {
  .paper:nth-child(1) {
    transform:
      translate(calc(-120% + var(--magnet-x, 0px)), calc(-70% + var(--magnet-y, 0px)))
      rotateZ(-15deg);
  }
  .paper:nth-child(1):hover {
    transform:
      translate(calc(-120% + var(--magnet-x, 0px)), calc(-70% + var(--magnet-y, 0px)))
      rotateZ(-15deg)
      scale(1.06);
    z-index: 10;
  }
  .paper:nth-child(2) {
    transform:
      translate(calc(10% + var(--magnet-x, 0px)), calc(-70% + var(--magnet-y, 0px)))
      rotateZ(15deg);
    height: 80%;
  }
  .paper:nth-child(2):hover {
    transform:
      translate(calc(10% + var(--magnet-x, 0px)), calc(-70% + var(--magnet-y, 0px)))
      rotateZ(15deg)
      scale(1.06);
    z-index: 10;
  }
  .paper:nth-child(3) {
    transform:
      translate(calc(-50% + var(--magnet-x, 0px)), calc(-100% + var(--magnet-y, 0px)))
      rotateZ(5deg);
    height: 80%;
  }
  .paper:nth-child(3):hover {
    transform:
      translate(calc(-50% + var(--magnet-x, 0px)), calc(-100% + var(--magnet-y, 0px)))
      rotateZ(5deg)
      scale(1.06);
    z-index: 10;
  }
}

// --- 2 张 ---
.folder-wrap[data-count="2"] .folder.open {
  .paper:nth-child(1) {
    transform:
      translate(calc(-105% + var(--magnet-x, 0px)), calc(-80% + var(--magnet-y, 0px)))
      rotateZ(-12deg);
  }
  .paper:nth-child(1):hover {
    transform:
      translate(calc(-105% + var(--magnet-x, 0px)), calc(-80% + var(--magnet-y, 0px)))
      rotateZ(-12deg)
      scale(1.06);
    z-index: 10;
  }
  .paper:nth-child(2) {
    transform:
      translate(calc(5% + var(--magnet-x, 0px)), calc(-80% + var(--magnet-y, 0px)))
      rotateZ(12deg);
  }
  .paper:nth-child(2):hover {
    transform:
      translate(calc(5% + var(--magnet-x, 0px)), calc(-80% + var(--magnet-y, 0px)))
      rotateZ(12deg)
      scale(1.06);
    z-index: 10;
  }
}

// --- 1 张 ---
.folder-wrap[data-count="1"] .folder.open {
  .paper:nth-child(1) {
    transform:
      translate(calc(-50% + var(--magnet-x, 0px)), calc(-95% + var(--magnet-y, 0px)))
      rotateZ(-4deg);
  }
  .paper:nth-child(1):hover {
    transform:
      translate(calc(-50% + var(--magnet-x, 0px)), calc(-95% + var(--magnet-y, 0px)))
      rotateZ(-4deg)
      scale(1.06);
    z-index: 10;
  }
}

.folder__back {
  position: relative;
  width: 100px;
  height: 80px;
  background: var(--folder-back-color);
  border-radius: 0 10px 10px 10px;
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.12),
    0 2px 4px rgba(0, 0, 0, 0.08);

  // 文件夹标签 (顶部小耳朵)
  &::after {
    position: absolute;
    z-index: 0;
    bottom: 98%;
    left: 0;
    content: '';
    width: 30px;
    height: 10px;
    background: var(--folder-back-color);
    border-radius: 5px 5px 0 0;
  }
}

.paper {
  position: absolute;
  z-index: 2;
  bottom: 10%;
  left: 50%;
  transform: translate(-50%, 10%);
  width: 70%;
  height: 80%;
  background: var(--paper-1);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  cursor: pointer;
  // 默认隐藏纸内容: 折叠态没必要渲染细节; open 时再淡入
  & .paper__inner {
    opacity: 0;
    transition: opacity 0.25s ease 0.05s;
  }
}
.folder.open .paper .paper__inner {
  opacity: 1;
}

.paper:nth-child(2) {
  background: var(--paper-2);
  width: 80%;
  height: 70%;
}
.paper:nth-child(3) {
  background: var(--paper-3);
  width: 90%;
  height: 60%;
}

.paper__inner {
  position: absolute;
  inset: 0;
  // 标题居中显示在小纸条中央, 单行省略后视觉更稳
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1f2229;
  text-align: center;
}
.paper__title {
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  width: 100%;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.25;
  color: #1f2229;
  // 单行溢出省略 (纸张宽度有限, 强制省略避免撑破布局)
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder__front {
  position: absolute;
  z-index: 3;
  width: 100%;
  height: 100%;
  background: var(--folder-color);
  border-radius: 6px 12px 12px 12px;
  transform-origin: bottom;
  transition: all 0.3s ease-in-out;
  // 文件夹正面顶部一道高光
  background-image: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0) 30%
  );
}

.folder:focus-visible {
  outline: 2px solid var(--folder-color);
  outline-offset: 6px;
  border-radius: 12px;
}

// 文件夹下方的说明文字
.folder-caption {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: 'JetBrains Mono', 'SF Mono', ui-monospace, Menlo, monospace;
  font-size: 0.72rem;
  color: var(--text-color-sub, rgba(125, 125, 125, 0.8));

  &__star {
    color: var(--folder-color);
    font-size: 0.82rem;
    line-height: 1;
  }
  &__text {
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--text-color, inherit);
  }
  &__count {
    opacity: 0.75;
    &::before { content: '·'; margin: 0 0.3rem; }
  }
  &__hint {
    opacity: 0.5;
    &::before { content: '·'; margin: 0 0.3rem; }
  }
}

// 暗色微调
:global(html.dark) {
  .paper__inner { color: rgba(255, 255, 255, 0.92); }
  .paper__title { color: rgba(255, 255, 255, 0.95); }
}
</style>
