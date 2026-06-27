<template>
  <!--
    Strands 流光背景 (WebGL fragment shader, 基于 ogl).
    - 仅在客户端挂载, SSR 阶段返回空容器, 不进 SSR 模块图.
    - 移动端 & 低端机降级:
        * devicePixelRatio 限制 1.5, 避免 4K 渲染发热;
        * glow / intensity / count 降一档.
    - 用户开启 prefers-reduced-motion 时, 完全不启动 WebGL, 退回纯色背景, 避免动效干扰.
    - 离开页面 (visibilitychange hidden) 或组件卸载时, 暂停 / 释放 GL 上下文.

    用法 (绝对定位铺满父容器):
      <StrandsCanvas class="hero-strands" />
  -->
  <div ref="root" class="strands-canvas" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

interface Props {
  /** 调色板, 默认 "克制深色" 路线 (橙红 / 紫 / 青) */
  colors?: string[];
  /** strand 数量, 默认 3 */
  count?: number;
  /** 流动速度, 默认 0.45 */
  speed?: number;
  /** 上下振幅, 默认 1 */
  amplitude?: number;
  /** 波密度, 默认 1 */
  waviness?: number;
  /** 单条线粗细, 默认 0.7 */
  thickness?: number;
  /** 辉光强度, 默认 1.6 (相对原版 2.6 克制一些) */
  glow?: number;
  /** 边缘衰减, 默认 3 */
  taper?: number;
  /** strand 间距, 默认 1 */
  spread?: number;
  /** 全局亮度, 默认 0.6 */
  intensity?: number;
  /** 饱和度, 默认 0.95 */
  saturation?: number;
  /** 整体透明度, 默认 1 */
  opacity?: number;
  /** 缩放, 默认 1.5 */
  scale?: number;
  /**
   * 流光垂直中心偏移 (uv 单位, 1 ≈ 半个 hero 高度).
   *   0   : 流光中心 = hero 几何中心 (默认)
   *   > 0 : 流光向上抬 (画面更靠中央, 文字下方)
   *   < 0 : 流光向下沉
   * 推荐范围 [-0.3, 0.3].
   */
  centerY?: number;
}

const props = withDefaults(defineProps<Props>(), {
  colors: () => ['#ff4d2e', '#7c3aed', '#06b6d4'],
  count: 3,
  speed: 0.45,
  amplitude: 1,
  waviness: 1,
  thickness: 0.7,
  glow: 1.6,
  taper: 3,
  spread: 1,
  intensity: 0.6,
  saturation: 0.95,
  opacity: 1,
  scale: 1.5,
  centerY: 0,
});

const root = ref<HTMLDivElement | null>(null);

// 持有 cleanup, 卸载时统一调
let cleanup: (() => void) | null = null;

const MAX_STRANDS = 12;
const MAX_COLORS = 8;

// GLSL 着色器: 原样移植自 reactbits 的 Strands.jsx, 仅常量替换为字面量字符串拼接
const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform int uStrandCount;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uOpacity;
uniform float uScale;
uniform float uSaturation;
uniform float uCenterY;

out vec4 fragColor;

const float PI = 3.14159265;

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67)));
}

vec3 samplePalette(float t) {
  t = fract(t);
  float scaled = t * float(uColorCount);
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  int nextIdx = idx + 1;
  if (nextIdx >= uColorCount) nextIdx = 0;
  return mix(uColors[idx], uColors[nextIdx], blend);
}

vec3 strandColor(float t) {
  if (uColorCount > 0) return samplePalette(t);
  return spectrum(t);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv /= max(uScale, 0.0001);

  float e = 0.06 + uIntensity * 0.94;

  /*
    水平包络 env 必须随 canvas aspect 自适应, 否则:
      - 原写法 cos(uv.x * PI * 1.3) 在 uv.x = ±0.385 归零;
      - uv 用 uResolution.y 归一, 物理边缘 uv.x = ±0.5 * aspect / uScale;
      - hero 越宽 (aspect 越大), 物理边缘越远超 0.385,
        包络只覆盖屏幕中心一小段, 两侧大片归零 → 视觉上流光"贴不到屏幕边".
    修法: 把"归零点"绑定到屏幕物理边缘.
      halfW = 当前 uv.x 物理边缘 (考虑 uScale 后).
      env = cos(uv.x / halfW * 0.5 * PI) ^ taper
      → uv.x = ±halfW (= 屏幕左右边) 时 cos = 0, 包络归零;
      → uv.x = 0 (屏幕中心) 时 cos = 1, 包络满值.
    波纹密度仍由 uWaviness * freq 控制, 不被包络影响.
  */
  float halfW = 0.5 * (uResolution.x / uResolution.y) / max(uScale, 0.0001);
  float env = pow(max(cos(uv.x / max(halfW, 0.0001) * 0.5 * PI), 0.0), uTaper);

  vec3 col = vec3(0.0);

  for (int i = 0; i < ${MAX_STRANDS}; i++) {
    if (i >= uStrandCount) break;

    float fi = float(i);
    float ph = fi * 1.7 * uSpread;
    float freq = (2.0 + fi * 0.35) * uWaviness;
    float spd = 1.4 + fi * 1.2;

    float tt = uTime * uSpeed;
    float w = sin(uv.x * freq + tt * spd + ph) * 0.60
            + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;

    float amp = (0.1 + 0.02 * e) * env * uAmplitude;
    // strand 中心线整体上抬 uCenterY (uv 单位, > 0 = 向上).
    // 注意是给 strand 自身的 y 加偏移, 不动 uv 原点 ——
    // 这样水平包络 env(uv.x) 不受影响, 流光完整不被切.
    float y = w * amp + uCenterY;

    float d = abs(uv.y - y);
    float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
    float g = thick / (d + thick * 0.45);
    g = g * g;

    float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.04 + uHueShift;
    col += strandColor(h) * g * env;
  }

  col *= 0.45 + 0.7 * e;
  col = 1.0 - exp(-col * uGlow);

  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, uSaturation), 0.0);

  float lum = max(max(col.r, col.g), col.b);
  float alpha = clamp(lum, 0.0, 1.0) * uOpacity;

  fragColor = vec4(col * uOpacity, alpha);
}
`;

onMounted(async () => {
  if (typeof window === 'undefined') return;
  const ctn = root.value;
  if (!ctn) return;

  // a11y: 用户偏好减少动效, 则不启动 WebGL, 留空容器 (父级仍有深色底)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // 动态 import ogl, 不进 SSR 也避免首屏 JS 体积
  const { Renderer, Program, Mesh, Triangle, Color } = await import('ogl');

  // 移动端检测: 视口宽度 <= 900 视为 mobile, 降参数
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const dprCap = isMobile ? 1.5 : 2;

  const renderer = new Renderer({
    alpha: true,
    premultipliedAlpha: true,
    antialias: !isMobile,
    dpr: Math.min(window.devicePixelRatio || 1, dprCap),
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.canvas.style.backgroundColor = 'transparent';

  const geometry = new Triangle(gl);
  if (geometry.attributes.uv) {
    delete geometry.attributes.uv;
  }

  // 调色板 padding: shader 里固定数组长度, 不足补齐到 MAX_COLORS
  const buildPalette = (hexList: string[]) => {
    const filled = hexList && hexList.length ? hexList : ['#ffffff'];
    const padded: [number, number, number][] = [];
    for (let i = 0; i < MAX_COLORS; i++) {
      const hex = filled[i] ?? filled[filled.length - 1];
      const c = new Color(hex);
      padded.push([c.r, c.g, c.b]);
    }
    return padded;
  };

  // 移动端把 glow / intensity / count 各降一档, 牺牲一点视觉换发热
  const mobileScale = isMobile ? 0.7 : 1;
  const effectiveGlow = props.glow * mobileScale;
  const effectiveIntensity = props.intensity * mobileScale;
  const effectiveCount = isMobile ? Math.max(2, props.count - 1) : props.count;

  const program = new Program(gl, {
    vertex: VERT,
    fragment: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
      uColors: { value: buildPalette(props.colors) },
      uColorCount: { value: Math.min(props.colors.length, MAX_COLORS) },
      uStrandCount: { value: Math.min(effectiveCount, MAX_STRANDS) },
      uSpeed: { value: props.speed },
      uAmplitude: { value: props.amplitude },
      uWaviness: { value: props.waviness },
      uThickness: { value: props.thickness },
      uGlow: { value: effectiveGlow },
      uTaper: { value: props.taper },
      uSpread: { value: props.spread },
      uHueShift: { value: 0 },
      uIntensity: { value: effectiveIntensity },
      uOpacity: { value: props.opacity },
      uScale: { value: props.scale },
      uSaturation: { value: props.saturation },
      uCenterY: { value: props.centerY },
    },
  });

  const mesh = new Mesh(gl, { geometry, program });

  ctn.appendChild(gl.canvas);

  const resize = () => {
    if (!ctn) return;
    const width = ctn.offsetWidth;
    const height = ctn.offsetHeight;
    renderer.setSize(width, height);
    program.uniforms.uResolution.value = [width, height];
  };
  window.addEventListener('resize', resize);
  resize();

  let animateId = 0;
  let paused = false;

  const update = (t: number) => {
    if (paused) {
      animateId = requestAnimationFrame(update);
      return;
    }
    animateId = requestAnimationFrame(update);
    program.uniforms.uTime.value = t * 0.001;
    renderer.render({ scene: mesh });
  };
  animateId = requestAnimationFrame(update);

  // 离开标签页时暂停, 回来恢复, 节省 GPU
  const onVisibility = () => {
    paused = document.hidden;
  };
  document.addEventListener('visibilitychange', onVisibility);

  cleanup = () => {
    cancelAnimationFrame(animateId);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    if (ctn && gl.canvas.parentNode === ctn) {
      ctn.removeChild(gl.canvas);
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
});

onBeforeUnmount(() => {
  cleanup?.();
  cleanup = null;
});
</script>

<style scoped>
.strands-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  pointer-events: none;
  /* 让 canvas 自然铺满 */
  overflow: hidden;
}
.strands-canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
