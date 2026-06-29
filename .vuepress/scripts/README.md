# 字体子集化与内联

## 是什么 / 为什么

得意黑 `SmileySans-Oblique.woff2` 原文件 1.1 MB。强刷时浏览器必须重新下载，会导致"系统字体 → 得意黑"的字体跳变。

本方案做了两件事：

1. **子集化**：只保留博客实际用到的字 + 常用字兜底，1.1 MB → 约 494 KB
2. **外链 + preload**：子集字体输出为独立的 `SmileySans-subset.woff2`，通过 `@font-face { src: url() }` 引用，并在 `<head>` 里 preload 提前加载。配合 `font-display: swap`，字体未到时先用系统字体兜底，不阻塞首屏文字渲染。

> 早期版本把子集字体 base64 内联进 CSS（零额外请求、强刷无跳变），但代价是全局 CSS 被撑到 ~660 KB 且 render-blocking，严重拖慢首屏。改为外链后全局 CSS 从 gzip 539 KB 降到 ~28 KB，首屏 FCP 大幅提前；preload 把字体跳变压到几乎无感。

## 怎么用

### 手动重跑（写完新文章后）

```bash
npm run subset-font
```

会扫描 `blogs/` 下所有 `.md`、配置文件等用到的字符，重新子集化并写入 `.vuepress/style/font.scss`。

### 自动执行

- `npm run build` 会通过 `prebuild` 钩子自动跑一次，**部署前永远是最新的子集**
- 不需要手动跑，写文章 → 直接 build / deploy 即可

### 新机器首次运行

不需要任何额外步骤。`subset-font.sh` 会自动：
- 创建 Python venv（`.vuepress/.venv/`，已 gitignore）
- 安装 `fonttools` + `brotli`
- 执行子集化

只要本机有 `python3` 就行。

## 文件说明

| 文件 | 用途 | 是否提交 |
|---|---|---|
| `subset-font.sh` | 入口脚本，处理 venv + 依赖 + 调用 py | ✅ |
| `subset-font.py` | 核心：收集字符 + fontTools 子集化 + 写字体文件与 SCSS | ✅ |
| `.vuepress/public/fonts/SmileySans-Oblique.woff2` | 字体源文件，子集化的输入 | ✅ |
| `.vuepress/public/fonts/SmileySans-subset.woff2` | 生成产物：子集化后的字体（外链引用） | ❌ gitignored |
| `.vuepress/style/font.scss` | 生成产物：外链引用的 @font-face | ❌ gitignored |
| `.vuepress/.venv/` | Python 虚拟环境 | ❌ gitignored |

`index.scss` 通过 `@import './font.scss'` 引入字体，这样 build 时即使产物变化也不污染源码 diff。

## 字符覆盖范围

- 所有 `blogs/**/*.md` 实际出现的字
- `.vuepress/config.js` 和 `README.md` 中的字（导航/首页等固定文案）
- 可打印 ASCII
- 常见中文标点
- **GB2312 一级常用汉字 3755 个**（兜底，覆盖现代汉语 99% 场景）

写新文章如果用到极少见的生僻字（非 GB2312 一级），那个字会回退到系统字体。这种情况一般感知不到，真要保证万无一失，build 前 `npm run subset-font` 重跑即可。

## 调小字体体积？

如果觉得 500 KB 太大，可以编辑 `subset-font.py` 中的 `collect_chars()`，去掉 `gb2312_level1_chars()` 那行，只保留文章实际用字（约 1400 字）。子集化后约 200 KB，但任何新增的字都需要重跑脚本，否则会漏字。
