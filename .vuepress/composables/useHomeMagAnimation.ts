/**
 * useHomeMagAnimation
 * ------------------------------------------------------------------
 * 首页 (HomeMag) 入场动效调度 (Strands + 打字机版).
 *
 * 旧版本中本 composable 负责:
 *   - opening overlay 揭幕
 *   - hero 字符 stagger 入场
 *   - about 段 IntersectionObserver 触发的滚动入场
 * 现在 hero 主标题改为打字机 (组件自带), about 段已删除, 这里只保留:
 *   1. opening overlay 揭幕 (首次访问的仪式感)
 *   2. hero __inner 整体淡入 (eyebrow / title / subtitle / tagline 一起淡入,
 *      不再做字符级 stagger, 因为字符级动效会和打字机抢戏)
 *
 * 设计要点 (沿用):
 *  - SSR 安全: 顶层不静态 import gsap; 所有 DOM 访问也在 onMounted 内
 *  - sessionStorage 控制 opening 只在首次访问演
 *  - reduce-motion 直接跳过全部动效, overlay 立即隐藏
 */
import { onBeforeUnmount, onMounted } from 'vue';

type GsapInstance = {
  timeline: (vars?: Record<string, unknown>) => GsapTimeline;
  set: (target: unknown, vars: Record<string, unknown>) => void;
};
type GsapTimeline = {
  to: (target: unknown, vars: Record<string, unknown>, position?: string | number) => GsapTimeline;
  set: (target: unknown, vars: Record<string, unknown>, position?: string | number) => GsapTimeline;
  add: (child: GsapTimeline, position?: string | number) => GsapTimeline;
  kill: () => void;
};

let gsapInstance: GsapInstance | null = null;

const OPENING_FLAG_KEY = 'sanki:home-mag:opened';

interface PlayOptions {
  /** 强制重播 opening (调试用), 默认 false */
  forceOpening?: boolean;
}

export function useHomeMagAnimation() {
  let timelines: GsapTimeline[] = [];

  function isMotionAllowed(): boolean {
    if (typeof window === 'undefined') return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function shouldPlayOpening(force = false): boolean {
    if (force) return true;
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem(OPENING_FLAG_KEY) !== '1';
    } catch {
      // 隐私模式: 退回每次都演 (可接受)
      return true;
    }
  }

  function markOpeningPlayed() {
    try {
      window.sessionStorage.setItem(OPENING_FLAG_KEY, '1');
    } catch {
      /* noop */
    }
  }

  /**
   * Opening overlay: 满屏深色色块 → 略停 → 上滑出视口 → display:none
   */
  function buildOpeningOverlayTl(g: GsapInstance): GsapTimeline | null {
    const overlay = document.querySelector<HTMLElement>('[data-home-overlay]');
    if (!overlay) return null;

    const tl = g.timeline();
    tl.to(overlay, {
      yPercent: -100,
      duration: 1.0,
      ease: 'expo.inOut',
      delay: 0.2,
    }).set(overlay, { display: 'none' });
    return tl;
  }

  /**
   * Hero __inner 整体淡入 (不再字符级 stagger).
   * 与打字机协作:
   *   - overlay 揭幕到约 60% 时, inner 容器淡入显示;
   *   - inner 显示后, HomeHero 内部的打字机已自动开始 (它的 startTyping 设了 320ms 起始延迟)
   */
  function buildHeroInnerTl(g: GsapInstance): GsapTimeline | null {
    const inner = document.querySelector<HTMLElement>('[data-hero] .home-hero__inner');
    if (!inner) return null;

    g.set(inner, { autoAlpha: 0, y: 12 });
    const tl = g.timeline();
    tl.to(inner, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' });
    return tl;
  }

  async function play(opts: PlayOptions = {}) {
    if (typeof window === 'undefined') return;

    // reduce-motion: 跳过全部动效, 强制隐藏 overlay 露出内容
    if (!isMotionAllowed()) {
      const overlay = document.querySelector<HTMLElement>('[data-home-overlay]');
      if (overlay) overlay.style.display = 'none';
      return;
    }

    if (!gsapInstance) {
      const mod = await import('gsap');
      gsapInstance = mod.gsap as unknown as GsapInstance;
    }
    const g = gsapInstance;

    const playOpening = shouldPlayOpening(opts.forceOpening);

    if (!playOpening) {
      // 二次访问: 跳过 overlay, 仅做 inner 淡入
      const overlay = document.querySelector<HTMLElement>('[data-home-overlay]');
      if (overlay) overlay.style.display = 'none';

      const innerTl = buildHeroInnerTl(g);
      if (innerTl) timelines.push(innerTl);
      return;
    }

    // 首次访问: overlay → inner 串成主 timeline
    const master = g.timeline({
      onComplete: () => markOpeningPlayed(),
    });
    const openTl = buildOpeningOverlayTl(g);
    if (openTl) master.add(openTl);

    const innerTl = buildHeroInnerTl(g);
    if (innerTl) {
      // overlay 上滑到 60% 时让 inner 开始淡入
      master.add(innerTl, openTl ? '-=0.55' : 0);
    }
    timelines.push(master);
  }

  function destroy() {
    timelines.forEach((t) => t.kill());
    timelines = [];
  }

  onMounted(() => {
    play();
  });
  onBeforeUnmount(() => {
    destroy();
  });

  return { play, destroy };
}
