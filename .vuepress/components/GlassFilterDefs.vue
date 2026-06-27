<!--
  GlassFilterDefs
  ---------------------------------------------------------------------------
  全局唯一的、不可见的 SVG 容器, 只用来定义 <filter id="nav-glass">.
  navbar 通过 `backdrop-filter: url(#nav-glass)` 引用该 filter,
  实现 "底部内容穿过磨砂玻璃时的液态折射 + chromatic aberration".

  设计要点:
    1. 单例: 该组件只在 client.js 中通过 layout 注入一次, 全站共享.
       (避免每个页面重复挂载导致 id 冲突, 重复 backdrop-filter 失效.)
    2. 静态 displacementMap (data URI):
       - 红色横向渐变 (左 → 右) + 蓝色纵向渐变 (上 → 下), mix-blend: difference
       - feDisplacementMap 用 R 通道做 x 位移, G 通道做 y 位移
       - 三通道 (R/G/B) 各自不同 scale → 形成色散 (chromatic aberration)
       - 因为 navbar 是高度固定的胶囊, 不需要随宽度动态重画 map
    3. 兼容性:
       - Chromium 支持 backdrop-filter: url(#...) → 看到完整折射效果
       - Safari/Firefox 不支持 → navbar 走 @supports fallback (普通 blur)
       - 故本组件即使在 Safari 挂上 DOM 也无副作用 (filter 不会被引用).
    4. 视觉调参 (参照 iOS 26 / Apple Vision):
       - distortionScale = -160  (主位移强度, 负值让折射方向更自然)
       - redOffset = 0, greenOffset = 12, blueOffset = 24  (色散明显)
       - displace blur = 0.7 (轻微平滑, 避免锯齿)
-->
<template>
  <svg
    class="glass-filter-defs"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <filter
        id="nav-glass"
        color-interpolation-filters="sRGB"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
      >
        <!-- ===========================================================
             ★★★ 关于"navbar 内浮现上下颠倒文字"的根因记录 ★★★
             元凶是 feDisplacementMap 在 backdrop-filter 上对"采样区域外"
             像素的回退行为: Chromium 实测会做"边界镜像反射", 而不是返回
             规范要求的透明黑.
               - navbar 是 fixed 贴顶, 上方没有 backdrop 像素可采
               - 只要 G 通道某像素 < 128 (= 向上位移), navbar 该行就会
                 尝试采样视口外的内容 → 触发镜像回退 → 看到下方倒影
             解决方案是 displacement map 的 G 通道从 128 起步 (见下方
             linearGradient g-only), 让 navbar 不去采样不存在的上方区域.

             顺带: 用 feComposite arithmetic 替代 feBlend screen 合成
             三个色散通道. 二者视觉等价 (三通道颜色互不重叠时 screen ≡
             加法), 但 arithmetic 在 backdrop-filter 链路上更稳定, 避免
             潜在的边界伪影.
        =========================================================== -->

        <!-- displacement map: 通过 data URI 内嵌一张 SVG 渐变图 -->
        <feImage
          x="0"
          y="0"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          result="map"
          :href="displacementMap"
        />

        <!-- 红通道 -->
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          :scale="distortionScale + redOffset"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispRed"
        />
        <feColorMatrix
          in="dispRed"
          type="matrix"
          values="1 0 0 0 0
                  0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 1 0"
          result="red"
        />

        <!-- 绿通道 -->
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          :scale="distortionScale + greenOffset"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispGreen"
        />
        <feColorMatrix
          in="dispGreen"
          type="matrix"
          values="0 0 0 0 0
                  0 1 0 0 0
                  0 0 0 0 0
                  0 0 0 1 0"
          result="green"
        />

        <!-- 蓝通道 -->
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          :scale="distortionScale + blueOffset"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispBlue"
        />
        <feColorMatrix
          in="dispBlue"
          type="matrix"
          values="0 0 0 0 0
                  0 0 0 0 0
                  0 0 1 0 0
                  0 0 0 1 0"
          result="blue"
        />

        <!-- 用 feComposite arithmetic 加法合成 (替代 feBlend screen) -->
        <feComposite
          in="red"
          in2="green"
          operator="arithmetic"
          k1="0" k2="1" k3="1" k4="0"
          result="rg"
        />
        <feComposite
          in="rg"
          in2="blue"
          operator="arithmetic"
          k1="0" k2="1" k3="1" k4="0"
          result="output"
        />
        <!-- 轻微抗锯齿 -->
        <feGaussianBlur in="output" stdDeviation="0.3" />
      </filter>
    </defs>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// =====================================================================
// 折射参数
// ---------------------------------------------------------------------
// 这次重写的核心: 之前 map 中央位移=0 + scss 又叠 blur(10px),
//   等于看到的全是磨砂模糊, 完全没有"透过玻璃看到背景"的感觉.
// 新方案: 整张 map 横向 + 纵向连续渐变, 让位移在胶囊上沿水平/垂直
//   方向呈"S 曲线"分布 —— 中央偏一点, 边缘偏更多, 像一片整体微凸的玻璃,
//   背景透过来时有连续的轻微扭曲, 而不是边缘一圈环、中央一片糊.
//
// scale 含义: 实际位移 ≈ scale × (channelValue/255 - 0.5)
// 当前: scale = 110 → 边缘最大位移 ±55px, 中央 ≈ 0.
// =====================================================================
// ⚠️ distortionScale 越大, feDisplacementMap 的采样窗口外扩越多.
// navbar 是 position: fixed 贴顶, 上方没有 backdrop, 一旦采样窗口
// 越过 navbar 顶边, Chromium 就会用"边界镜像反射"填充 → 出现倒影.
// 实测 70 时镜像明显, 30 是临界附近的安全值, 视觉上仍有清晰折射 + 色散.
const distortionScale = 30; // 主位移强度
const redOffset = 0;
const greenOffset = -3;
const blueOffset = -6;

// displacement map 尺寸 (内部坐标, feImage 会拉伸到目标矩形)
const mapWidth = 600;
const mapHeight = 60;

// =====================================================================
// displacement map (两层叠加, 各负责一个通道)
//   想要的最终像素值: R = 横向渐变 (左 40 → 右 216), G = 纵向渐变 (上 40 → 下 216).
//   做法: 黑底 #000 + 两层 mix-blend-mode: screen:
//     - 第一层 fill = (R渐变, 0, 0) → screen 后 R 通道被点亮, G/B 仍为 0
//     - 第二层 fill = (0, G渐变, 0) → screen 后 G 通道被点亮, R 不变
//   screen 模式公式: out = 1 - (1-a)*(1-b),
//     当 a 或 b 任一通道为 0 时, 结果 = 另一者 → 两个通道完全独立, 不会互相干扰.
//   B 通道一直保持 0 (feDisplacementMap 不用 B, 无所谓).
// =====================================================================
const displacementMap = computed(() => {
  const svg = `<svg viewBox="0 0 ${mapWidth} ${mapHeight}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- R 通道: 横向 40 → 216 -->
      <linearGradient id="r-only" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="rgb(40,0,0)"/>
        <stop offset="100%" stop-color="rgb(216,0,0)"/>
      </linearGradient>
      <!--
        G 通道: 全平面 128 (纵向位移 = 0).
        navbar fixed 贴顶, 上方无 backdrop 可采. 任何让 G < 128 的尝试
        (双向折射) 都会让 navbar 上半部直接采样视口外, 触发 Chromium
        的边界镜像反射 → 倒影. 即使 G 单向 ≥ 128 (上 128 → 下 216),
        在 distortionScale 较大时, 采样窗口仍可能因横向 R 通道大幅位移
        +抗锯齿外扩越过上边界. 最稳的方案: G 全平面 128, 只保留横向折射.
      -->
      <linearGradient id="g-only" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stop-color="rgb(0,128,0)"/>
        <stop offset="100%" stop-color="rgb(0,128,0)"/>
      </linearGradient>
    </defs>

    <!-- 黑底, 准备 screen 叠加 -->
    <rect x="0" y="0" width="${mapWidth}" height="${mapHeight}" fill="black"/>
    <!-- R 通道 (横向) -->
    <rect x="0" y="0" width="${mapWidth}" height="${mapHeight}"
          fill="url(#r-only)" style="mix-blend-mode: screen"/>
    <!-- G 通道 (纵向) -->
    <rect x="0" y="0" width="${mapWidth}" height="${mapHeight}"
          fill="url(#g-only)" style="mix-blend-mode: screen"/>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
});
</script>

<style scoped>
/*
  整个 <svg> 容器不可见, 但必须留在 DOM 内 (display:none 会让 filter 失效).
  做法: 0×0 尺寸 + absolute 定位塞到角落.
*/
.glass-filter-defs {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
  overflow: hidden;
}
</style>
