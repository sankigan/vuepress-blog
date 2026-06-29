<template>
  <!-- 外层负责 scale, 不参与点击/键盘
       data-count: 当前有效纸张数 (1/2/3), 供 CSS 选择展开布局
       data-mini: 启用 mini 尺寸样式 (folder 缩为 60×48, 纸张/字号同比例缩)
       data-mode: 控制点击交互方式 (decor / morph), alwaysOpen 时不参与
       data-always-open: 锁定打开态形态 (folder 永远翻盖, 纸张永远扇出露在外面),
                          外层不可点击, 但纸张点击仍可跳转文章 -->
  <div
    :style="scaleStyle"
    :class="[
      'folder-wrap',
      className,
      { 'folder-wrap--mini': mini, 'folder-wrap--always-open': alwaysOpen },
    ]"
    :data-count="papers.length"
    :data-mode="mode"
  >
    <div
      :class="['folder', { open }]"
      :style="folderStyle"
      :tabindex="alwaysOpen ? -1 : 0"
      :role="alwaysOpen ? undefined : 'button'"
      :aria-expanded="alwaysOpen ? undefined : open"
      :aria-label="alwaysOpen ? 'Pinned folder' : (open ? 'Close folder' : 'Open folder')"
      @click="handleClick"
      @keydown="handleKeydown"
    >
      <!-- 角标: 真实总数 (含被截断的 pinned 文章), 仅在 total > papers.length 时显示 -->
      <span
        v-if="showBadge"
        class="folder__badge"
        aria-label="总数"
      >{{ total }}</span>

      <div class="folder__back">
        <!-- 纸张: 数量与实际 pinned 文章数一致 (1/2/3 张, 不再用 null 补位)
             不同张数的展开布局由 CSS 根据父级 data-count 决定 -->
        <div
          v-for="(item, i) in papers"
          :key="i"
          :ref="(el) => setPaperRef(el, i)"
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

    <!-- 文件夹下方的标签条: 仅保留 📌 PINNED, 不再显示 N items 数量
         (数量信息已由 folder 右上角的角标承担, caption 只做语义提示, 避免冗余) -->
    <div class="folder-caption">
      <span class="folder-caption__star" aria-hidden="true">📌</span>
      <span class="folder-caption__text">Pinned</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
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

export type FolderMode = 'decor' | 'morph';

const props = withDefaults(
  defineProps<{
    color?: string;
    size?: number;
    items?: FolderItem[];
    className?: string;
    /** mini 尺寸: folder 缩到 60×48, 用于 aside 区域 */
    mini?: boolean;
    /** 点击交互模式
     *  - decor: 纸张扇出短暂悬浮后淡出 (纯装饰彩蛋, 信息来自右侧卡片)
     *  - morph: 纸张扇出后飞向右侧对应卡片位置 (FLIP), 卡片始终可见, 纸张飞到目标淡出
     */
    mode?: FolderMode;
    /** 真实总数 (含被截断到 papers 外的 pinned 文章), 用于角标 */
    total?: number;
    /** morph 模式: 父级传入的目标元素列表 (每张纸对应一个目标卡片 DOM)
     *  纸张飞行的目的地坐标 = 对应索引位置目标元素的 getBoundingClientRect 中心 */
    morphTargets?: (HTMLElement | null)[];
    /** 永久打开模式: folder 锁定为翻盖态, 纸张永远扇出露在外面
     *  - 外层 folder 不响应点击 (彻底关闭翻盖交互)
     *  - 纸张本身的 click 仍生效, 点击跳转到对应文章
     *  - mode (decor/morph) 在 alwaysOpen=true 时被忽略
     *  适用形态: 把 folder 直接作为 pinned 信息的承载容器, 不需要"先点开才能看" */
    alwaysOpen?: boolean;
    /** 初始打开模式: folder 默认渲染为打开态 (纸张已扇出), 但仍可点击切换
     *  - 与 alwaysOpen 区别: 此模式下用户点击 folder 可以收起, 再点可重新打开
     *  - 此模式下 mode (decor/morph) 的所有自动行为 (2.5s 自动收起 / 自动飞行) 都被禁用,
     *    folder 作为常驻信息容器, 开/合完全由用户点击控制
     *  适用形态: 想给用户"开盖装在眼前"的默认观感, 又保留 folder 可手动折叠的交互 */
    initialOpen?: boolean;
  }>(),
  {
    color: '#5227FF',
    size: 1,
    items: () => [],
    className: '',
    mini: false,
    mode: 'decor',
    total: undefined,
    morphTargets: () => [],
    alwaysOpen: false,
    initialOpen: false,
  },
);

const emit = defineEmits<{
  /** 通知父级 folder 打开状态变化, 用于 morph 控制外部动效 */
  (e: 'update:open', open: boolean): void;
}>();

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

// 角标显示条件: 真实总数 > 当前展示的纸张数, 说明有被截断的 pinned
const showBadge = computed<boolean>(
  () => typeof props.total === 'number' && props.total > papers.value.length,
);

// open 初始值:
//   - alwaysOpen=true: 锁定为 true, handleClick 始终被拦截
//   - initialOpen=true: 初始 true, 用户点击仍可切换 (走 setOpen)
//   - 其余: false (经典折叠态, 用户点击翻盖)
// 注: initialOpen 的初始 true 不经过 setOpen, 因此不会触发 mode='decor' 的 2.5s
// 自动收起或 mode='morph' 的飞行 —— 只有用户主动点击 (handleClick → setOpen)
// 才会激活 mode 对应的自动行为
const open = ref<boolean>(props.alwaysOpen || props.initialOpen);
// 每张纸的磁吸偏移 (open 状态下鼠标在纸上时, 该纸向鼠标方向微移)
// 长度固定 MAX_ITEMS, 索引超过 papers.length 的位置不会被访问, 不影响功能
const paperOffsets = ref<{ x: number; y: number }[]>(
  Array.from({ length: MAX_ITEMS }, () => ({ x: 0, y: 0 })),
);

// 纸张 DOM 引用 (morph 模式下需要拿真实位置算 FLIP)
const paperRefs = ref<(HTMLElement | null)[]>([]);
const setPaperRef = (el: Element | { $el?: Element } | null, i: number) => {
  // Vue 3 template ref 函数可能传入组件实例, 这里只用 HTMLElement
  const dom = (el as HTMLElement) || null;
  paperRefs.value[i] = dom;
};

const folderBackColor = computed(() => darkenColor(props.color, 0.08));
const paper1Color = computed(() => darkenColor('#ffffff', 0.1));
const paper2Color = computed(() => darkenColor('#ffffff', 0.05));
// paper-3 不再用纯白: 浅色主题下纯白纸会和页面背景融为一体, 只剩文字浮在空中
// 用 #FAFAFA (darken 2%) 留一点点灰度, 配合下方 box-shadow + border, 让纸张轮廓清晰
const paper3Color = darkenColor('#ffffff', 0.02);

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

// 自动关闭定时器 (decor 模式 2.5s; morph 模式由飞行动画结束后回调触发)
let autoCloseTimer: number | null = null;
const clearAutoClose = () => {
  if (autoCloseTimer !== null) {
    window.clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
};

// 当前正在播放的 morph Web Animations, 用于切换状态时取消
let activeMorphAnimations: Animation[] = [];
const cancelMorphAnimations = () => {
  activeMorphAnimations.forEach((a) => {
    try { a.cancel(); } catch { /* noop */ }
  });
  activeMorphAnimations = [];
};

/**
 * morph 模式核心: 等纸张完成 CSS 扇出后, 用 Web Animations API 把每张纸
 * 沿"当前位置 → 目标卡片中心"飞过去, 同时缩放归零 + 淡出
 *
 * 关键约束:
 *   - 纸张 transform 已经被 :nth-child 选择器占用 (扇形位置), 不能直接覆盖
 *     → 解决: 给 paper 元素加一层 transform 通过 Web Animations 叠加 (composite: 'add')
 *   - 飞行结束 (fill: forwards) 后纸张仍处于"飞走"的视觉位置, 紧接着关闭 folder
 *     让 paper 重新走 CSS transition 归位, 顺便把 Animations cancel 掉避免 transform 残留
 */
const playMorphFlight = () => {
  // 扇出动画时长 ≈ 300ms (.paper transition 0.3s), 等它落定再起飞
  // 这里多给 50ms buffer 让 CSS 完整执行
  const FAN_OUT_MS = 350;
  // 飞行 + 淡出时长
  const FLY_MS = 600;
  // 飞完到 folder 关闭的停留时间
  const HOLD_AFTER_MS = 120;

  autoCloseTimer = window.setTimeout(() => {
    if (!open.value) return; // 期间被关掉就放弃
    const paperEls = paperRefs.value.slice(0, papers.value.length);
    const targets = props.morphTargets || [];

    paperEls.forEach((paperEl, i) => {
      if (!paperEl) return;
      const targetEl = targets[i];
      // 没有目标卡片就退化为"原地淡出", 不计算飞行
      if (!targetEl) {
        const fadeOut = paperEl.animate(
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: FLY_MS, easing: 'ease-out', fill: 'forwards' },
        );
        activeMorphAnimations.push(fadeOut);
        return;
      }

      // FLIP 第一步: First - 拿纸张当前真实位置 (已经扇出后的)
      const paperRect = paperEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const dx = targetRect.left + targetRect.width / 2
        - (paperRect.left + paperRect.width / 2);
      const dy = targetRect.top + targetRect.height / 2
        - (paperRect.top + paperRect.height / 2);

      // Last/Invert/Play: 用 Web Animations 把 transform 叠加 (composite: 'add')
      // 这样不会覆盖 CSS 选择器写的扇形 transform, 而是在它之上加位移
      const anim = paperEl.animate(
        [
          { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.6)`, opacity: 0 },
        ],
        {
          duration: FLY_MS,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards',
          composite: 'add',
        },
      );
      activeMorphAnimations.push(anim);
    });

    // 飞行结束 → 短暂停留 → 关闭 folder (纸张随 open=false 自然回到 .folder__back)
    // 此时 cancel 掉所有动画, 让 paper 的 transform 回归 CSS 控制, 不会残留位移
    autoCloseTimer = window.setTimeout(() => {
      cancelMorphAnimations();
      open.value = false;
      paperOffsets.value = Array.from({ length: MAX_ITEMS }, () => ({ x: 0, y: 0 }));
      emit('update:open', false);
      autoCloseTimer = null;
    }, FLY_MS + HOLD_AFTER_MS);
  }, FAN_OUT_MS);
};

const setOpen = (next: boolean) => {
  if (open.value === next) return;
  // 切换状态时一律清掉残留动画/定时器, 避免上一次的 morph 飞行影响本次
  cancelMorphAnimations();
  clearAutoClose();

  if (open.value) {
    // 关闭时重置磁吸偏移, 防止下次打开时残留位移
    paperOffsets.value = Array.from({ length: MAX_ITEMS }, () => ({ x: 0, y: 0 }));
  }
  open.value = next;
  emit('update:open', next);

  if (!next) return;
  // initialOpen 模式: folder 作为 pinned 信息的常驻承载, 用户主动打开后不应该自己收起
  // (decor 的 2.5s 自动收起 / morph 的飞行都是"彩蛋"语义, 跟"常驻展示"冲突)
  // 因此 initialOpen=true 时直接跳过所有 mode 自动行为, 只保留"用户点击切换 open/close"
  if (props.initialOpen) return;
  // 打开后根据模式触发自动收起
  if (props.mode === 'decor') {
    // decor 模式: 打开后 2.5s 自动收起 (纸张做完扇出动作就归位, 体现"彩蛋"性质)
    autoCloseTimer = window.setTimeout(() => {
      open.value = false;
      paperOffsets.value = Array.from({ length: MAX_ITEMS }, () => ({ x: 0, y: 0 }));
      emit('update:open', false);
      autoCloseTimer = null;
    }, 2500);
  } else if (props.mode === 'morph') {
    // morph 模式: 等 DOM 更新 (纸张拿到 open class 开始扇出) 后再排飞行
    nextTick(() => {
      playMorphFlight();
    });
  }
};

const handleClick = () => {
  // alwaysOpen 模式: folder 永远翻盖, 外层点击不做任何事 (避免误触发收起)
  if (props.alwaysOpen) return;
  setOpen(!open.value);
};

const handleKeydown = (e: KeyboardEvent) => {
  if (props.alwaysOpen) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
};

const onPaperMove = (e: MouseEvent, i: number) => {
  if (!open.value) return;
  // morph 模式下纸张正在飞, 不响应磁吸 (否则 transform 会和 WAAPI 冲突视觉抖动)
  if (props.mode === 'morph') return;
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
  // alwaysOpen 模式: 不收起 folder, 直接跳转 (folder 永远保持打开形态)
  if (props.alwaysOpen) {
    router.push(item.path);
    return;
  }
  // 普通模式: 点击纸张视为"读完彩蛋", 立刻关闭并跳转
  cancelMorphAnimations();
  clearAutoClose();
  open.value = false;
  emit('update:open', false);
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
//   5. mini 模式: 通过 CSS 变量整体压缩 folder 尺寸, 纸张同比例缩;
//                扇形展开角度保留, 仅尺寸变小, 视觉上像一个"小印章"
//   6. morph 模式: CSS 不写专门样式, 飞行动画由 JS Web Animations API 叠加
//                  (composite: 'add'), 不与扇形 transform 冲突
// ============================================================================
.folder-wrap {
  // 给 caption 留位; scale 不会影响 caption 因为 scale 是父级整体的
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  // CSS 变量: 控制 folder 主体尺寸, mini 模式下覆盖
  --folder-w: 100px;
  --folder-h: 80px;
  // 纸张标题字号 (注意: 外层可能套 scale, 实际渲染字号 = --paper-font × scale)
  // 15px 在 scale=0.9 下实际渲染 ≈ 13.5px, 接近正文小字号, 中文字形舒展;
  // 配合 white-space: nowrap + ellipsis, 撑破风险由单行省略兜底
  --paper-font: 15px;
}

// mini 模式: 整体等比压缩 (60% 体量)
// 注意: 不改变 scale prop, mini 是"基础尺寸"的变化, scale 在外层叠加
.folder-wrap--mini {
  --folder-w: 60px;
  --folder-h: 48px;
  --paper-font: 8px;
  gap: 0.5rem;
}

.folder {
  transition: all 0.2s ease-in;
  cursor: pointer;
  position: relative;
}

// alwaysOpen 模式: folder 整体不可点击 (外层 cursor 还原, 仅纸张保留 pointer)
.folder-wrap--always-open .folder {
  cursor: default;
}

// hover 抬升 + 露出纸 (alwaysOpen 模式禁用 — 已经是打开态, hover 再变化反而抖动)
.folder-wrap:not(.folder-wrap--always-open) {
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
  width: var(--folder-w);
  height: var(--folder-h);
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

// mini 模式下顶部小耳朵也压缩
.folder-wrap--mini .folder__back::after {
  width: 18px;
  height: 6px;
  border-radius: 3px 3px 0 0;
}

// 角标: 真实总数 (含被截断的) - 类似 App icon 的 unread badge
// 位置: folder 右上角, 略微悬空; 颜色用主题色, 与置顶语义呼应
.folder__badge {
  position: absolute;
  // 注意: badge 在 .folder 内部, 不在 .folder__back; 用百分比对齐避免 mini/normal 切换时硬编码偏移
  top: -8px;
  right: -10px;
  z-index: 20; // 高于 papers (z-index: 2/10) 和 front (z-index: 3)
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--folder-color);
  color: #fff;
  font-family: 'JetBrains Mono', 'SF Mono', ui-monospace, Menlo, monospace;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  letter-spacing: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  pointer-events: none;
}
.folder-wrap--mini .folder__badge {
  top: -6px;
  right: -8px;
  min-width: 14px;
  height: 14px;
  font-size: 9px;
  line-height: 14px;
}

.paper {
  position: absolute;
  z-index: 2;
  bottom: 10%;
  left: 50%;
  transform: translate(-50%, 10%);
  // 纸张宽度阶梯 85% / 95% / 105%: 比 folder 略宽, 强化"档案袋里塞满纸"的拥挤感
  // 折叠态超出 folder 边界的部分被 .folder__front 遮住, 视觉上不会穿帮
  width: 85%;
  height: 80%;
  background: var(--paper-1);
  border-radius: 8px;
  // 纸张轮廓: 不加边框, 靠双层阴影撑起"纸张悬浮"的物理感
  //   - 外阴影 0 3px 8px rgba(0,0,0,0.09): 远投影, 制造"纸离桌面有距离"的层次
  //   - 内阴影 0 1px 2px rgba(0,0,0,0.06): 紧贴纸缘, 轻轻勾轮廓
  // 配合 paper-3 不再纯白 (#FAFAFA), 浅色背景下三张纸靠阴影 + 色块差异看清边缘
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.09),
    0 1px 2px rgba(0, 0, 0, 0.06);
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
  width: 95%;
  height: 70%;
}
.paper:nth-child(3) {
  background: var(--paper-3);
  width: 105%;
  height: 60%;
}

// ============================================================
// 颜色覆盖: 按实际纸张数 (data-count) 调整, 保证"视觉最上层那张永远最浅"
// ------------------------------------------------------------
// 默认规则按 :nth-child 死着色 (1=最深, 2=中, 3=最浅), 这在 3 张时合理
// (越底层颜色越深, 符合"被压在下面 → 阴影累积"的物理直觉);
// 但 1 张 / 2 张时, 最上层那张会落到 nth-child(1) 或 (2), 拿到偏深的颜色,
// 看起来反而比 3 张时更"脏". 这里按 data-count 单独覆盖, 让"最上那张"始终用 paper-3.
// 注: 只覆盖 background, 不动 width/height, 形态由上方默认规则继续控制.
// ============================================================
// 1 张: 唯一那张直接升到最浅
.folder-wrap[data-count="1"] .paper:nth-child(1) {
  background: var(--paper-3);
}
// 2 张: 底层用中等, 上层用最浅 (跳过最深档, 避免单调的"深 + 中"组合)
.folder-wrap[data-count="2"] {
  .paper:nth-child(1) {
    background: var(--paper-2);
  }
  .paper:nth-child(2) {
    background: var(--paper-3);
  }
}

.paper__inner {
  position: absolute;
  inset: 0;
  // 横向 padding 从 10px 收到 6px: 短中文标题 (如"前端总结" 4 字) 在原 padding 下
  // 因为有效宽不够会被 line-clamp 切成"前端总 / 结"这种丑断行;
  // 多给 8px 横向空间, 4-5 字标题大概率单行塞下, 不触发换行
  padding: 8px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1f2229;
  text-align: center;
}
// mini 模式下纸张内边距压缩, 给小纸张更多有效面积
.folder-wrap--mini .paper__inner {
  padding: 3px 4px;
}
.paper__title {
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  width: 100%;
  font-size: var(--paper-font);
  font-weight: 700;
  line-height: 1.3;
  color: #1f2229;
  // 最多两行, 超出在第二行末尾显示省略号
  // -webkit-line-clamp 是行夹方案, 需要配合 display: -webkit-box + box-orient: vertical
  // 现代浏览器全支持; 中文标题大概率能在第一行显示完, 实在塞不下才会出现两行
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2; // 标准属性, 配合 -webkit- 前缀使用以兼容 lint 和未来浏览器
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  // 断行策略: 用浏览器默认规则 (normal), 不主动允许在词/字中间断
  //   - 旧值 break-word 会鼓励中文逐字断行, 短标题 (如"前端总结") 容易被切成
  //     "前端总 / 结"这种 3+1 的丑断行, 比单行省略号还难看
  //   - normal 下中文仍可在任意字符间换行 (中文无单词边界), 但浏览器更倾向
  //     "整体溢出 → 触发末尾省略号", 而非"提前断行 → 后半行大片留白"
  word-break: normal;
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

// 文件夹下方的说明文字 (现在只剩 📌 PINNED, 极简)
.folder-caption {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  // 字体使用默认 (继承主题 body 字体), 不再指定 monospace 栈
  // 字号与纸张标题 (13px × scale) 保持视觉量级一致, caption 略小于标题不抢戏
  font-size: 0.85rem;
  color: var(--text-color-sub, rgba(125, 125, 125, 0.8));

  &__star {
    color: var(--folder-color);
    font-size: 0.95rem;
    line-height: 1;
  }
  &__text {
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--text-color, inherit);
  }
}

// mini 模式下 caption 进一步压字号, 与 .year-aside__count 视觉量级对齐
.folder-wrap--mini .folder-caption {
  font-size: 0.62rem;
  gap: 0.3rem;
  &__star { font-size: 0.7rem; }
  &__text { letter-spacing: 0.06em; }
}

// 暗色微调
:global(html.dark) {
  .paper__inner { color: rgba(255, 255, 255, 0.92); }
  .paper__title { color: rgba(255, 255, 255, 0.95); }
}
</style>
