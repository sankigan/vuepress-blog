// ============================================================
// LeetCode 刷题汇总页生成器
// ------------------------------------------------------------
// 扫描 blogs/algorithm/leetcode/ 下的所有题解 markdown, 解析其 frontmatter
// (title / difficulty / date) 与正文首行的原题链接 (> [题名](url)),
// 生成一份带 sticky (自动进置顶) 的汇总 markdown:
//   blogs/algorithm/leetcode-summary.md
//
// 为什么用"生成 markdown"而不是写 Vue 组件:
//   - 题解 frontmatter 高度统一, 解析成本极低;
//   - 生成的 markdown 直接复用主题的 TOC / 暗色 / 站内搜索 / 难度徽章样式,
//     零运行时成本, 比自定义组件更易维护;
//   - sticky 字段天然接入主题已有的置顶机制 (见 TimelineMag.vue)。
//
// 何时被调用:
//   - npm run build  → prebuild 钩子 (与字体子集化一起)
//   - npm run dev    → predev 钩子
// 产物已加入 .gitignore (与 font.scss 同策略): 始终在构建期重新生成,
// 避免污染 git 工作区导致 deploy.sh 的"构建后工作区必须干净"校验失败。
// ============================================================

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');
const LEETCODE_DIR = join(REPO_ROOT, 'blogs/algorithm/leetcode');
const OUT_FILE = join(REPO_ROOT, 'blogs/algorithm/leetcode-summary.md');

// 难度元数据: 排序权重 + 展示用 CSS 修饰类后缀
const DIFFICULTY_META = {
  Easy: { order: 0, slug: 'easy', label: 'Easy' },
  Medium: { order: 1, slug: 'medium', label: 'Medium' },
  Hard: { order: 2, slug: 'hard', label: 'Hard' },
};

/**
 * 从单个题解文件解析出汇总所需的最小数据集
 * @param {string} file 文件名 (如 '1.md' / 'LCR127.md')
 * @returns {object | null} 解析失败 (非题解文件) 返回 null
 */
const parseProblem = (file) => {
  const raw = readFileSync(join(LEETCODE_DIR, file), 'utf8');

  // 取出 frontmatter 区块 (首个 --- 到下一个 ---)
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return null;
  const fm = fmMatch[1];

  const pick = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : '';
  };

  const title = pick('title');
  const difficulty = pick('difficulty');
  const date = pick('date');
  if (!title) return null;

  // 题号: 形如 '1.两数之和' / 'LCR127.跳跃训练'
  // 拆出 id (1 / LCR127) 与题名 (两数之和)
  const idMatch = title.match(/^(LCR\d+|\d+)[.．]\s*(.+)$/);
  const id = idMatch ? idMatch[1] : title;
  const name = idMatch ? idMatch[2].trim() : title;

  // 原题链接: 正文首个 markdown 引用里的链接 (> [题名](url))
  const urlMatch = raw.match(/>\s*\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
  const url = urlMatch ? urlMatch[1] : '';

  // 本地题解页路径: blogs/algorithm/leetcode/<base>.html (base = '/')
  const base = file.replace(/\.md$/, '');
  const localPath = `/blogs/algorithm/leetcode/${base}.html`;

  return { id, name, difficulty, date, url, localPath };
};

/**
 * 排序键: 纯数字题号按数值升序在前, LCR 系列 (按其编号) 排在最后
 */
const sortKey = (p) => {
  if (/^\d+$/.test(p.id)) return Number(p.id);
  const n = Number((p.id.match(/\d+/) || ['0'])[0]);
  return 1e9 + n; // LCR* 统一推到数字题号之后
};

/** 归一化日期 '2025-2-7' → '2025-02-07', 解析失败原样返回 */
const normalizeDate = (d) => {
  const m = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return d;
  const [, y, mo, day] = m;
  return `${y}-${mo.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const main = () => {
  const files = readdirSync(LEETCODE_DIR).filter((f) => f.endsWith('.md'));
  const problems = files
    .map(parseProblem)
    .filter(Boolean)
    .sort((a, b) => sortKey(a) - sortKey(b));

  // 统计各难度数量
  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  problems.forEach((p) => {
    if (counts[p.difficulty] != null) counts[p.difficulty] += 1;
  });
  const total = problems.length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  // 最近一次练习日期 (取所有题解里的最大 date), 作为 frontmatter.date 与"更新于"
  // 用内容派生的日期而非构建时间戳, 保证多次构建产物稳定 (不引入无谓 diff)
  const latestDate = problems
    .map((p) => normalizeDate(p.date))
    .filter(Boolean)
    .sort()
    .pop() || normalizeDate(`${new Date().getFullYear()}-1-1`);

  // ---- 拼装 markdown ----
  const lines = [];

  lines.push('---');
  // 标题保持简短: pinned 文件夹的小纸条宽度有限, "LeetCode" 这种 8 字母不可断
  // 英文单词会溢出被省略号截断 (见 PinnedFolder.vue .paper__title)。
  // 用中文「力扣总结」(LeetCode 中文官方名) 可自由换行, 且与同级「前端总结」字数对齐。
  lines.push('title: 🔖 力扣总结');
  lines.push(`date: ${latestDate}`);
  lines.push('sticky: 2');
  lines.push('editLink: false');
  lines.push('tags:');
  lines.push('  - LeetCode');
  lines.push('categories:');
  lines.push('  - 算法');
  lines.push('---');
  lines.push('');
  lines.push('<!-- 本文件由 .vuepress/scripts/gen-leetcode-summary.mjs 自动生成, 请勿手动编辑 -->');
  lines.push('');
  lines.push(
    `> 截至目前共练习 **${total}** 题 · ` +
      `Easy ${counts.Easy} · Medium ${counts.Medium} · Hard ${counts.Hard} · ` +
      `最近更新于 ${latestDate}`,
  );
  lines.push('');

  // 进度概览卡片 (复用 index.scss 里的 .lc-stats 样式)
  lines.push('## 进度概览');
  lines.push('');
  lines.push('<div class="lc-stats">');
  // 总计卡: 进度条改为难度堆叠条 (绿/黄/红 按实际比例拼接),
  //   表达"难度分布"而非无意义的 100%
  lines.push(totalCard(total, counts));
  lines.push(statCard('easy', 'Easy', counts.Easy, `占比 ${pct(counts.Easy)}%`, pct(counts.Easy), 'E'));
  lines.push(statCard('medium', 'Medium', counts.Medium, `占比 ${pct(counts.Medium)}%`, pct(counts.Medium), 'M'));
  lines.push(statCard('hard', 'Hard', counts.Hard, `占比 ${pct(counts.Hard)}%`, pct(counts.Hard), 'H'));
  lines.push('</div>');
  lines.push('');

  // 全部题目表格 (按题号升序)
  lines.push('## 全部题目');
  lines.push('');
  lines.push('| 题号 | 题目 | 难度 |');
  lines.push('| :--- | :--- | :--- |');
  problems.forEach((p) => {
    const meta = DIFFICULTY_META[p.difficulty];
    // 难度徽章复用列表页的「辉光圆点」样式 (difficulty-tag--dot), 见 index.scss
    const badge = meta
      ? `<span class="difficulty-tag difficulty-tag--dot difficulty-tag--${meta.slug}">${meta.label}</span>`
      : p.difficulty;
    const titleCell = `[${p.name}](${p.localPath})`;
    lines.push(`| \`${p.id}\` | ${titleCell} | ${badge} |`);
  });
  lines.push('');

  writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');
  console.log(`[gen-leetcode-summary] 已生成 ${OUT_FILE} (共 ${total} 题)`);
};

/**
 * 生成一张统计卡片的 HTML 字符串
 * @param {string} slug 卡片配色类 (total/easy/medium/hard)
 * @param {string} label 卡片标题
 * @param {number} num 主数字
 * @param {string} sub 副文案
 * @param {number} barPct 进度条填充百分比 (0-100)
 * @param {string} wm 右下角巨型字母水印 (E/M/H/Σ), 与时间轴卡片同款, 见 index.scss
 */
const statCard = (slug, label, num, sub, barPct, wm) =>
  `  <div class="lc-stat lc-stat--${slug}">` +
  `<span class="lc-stat__wm" aria-hidden="true">${wm}</span>` +
  `<div class="lc-stat__num">${num}</div>` +
  `<div class="lc-stat__label">${label}</div>` +
  `<div class="lc-stat__bar"><span style="width:${barPct}%"></span></div>` +
  `<div class="lc-stat__sub">${sub}</div>` +
  `</div>`;

/**
 * 生成"总计"卡: 与 statCard 同结构, 但进度条替换为难度堆叠条 (Easy/Medium/Hard 三段),
 * 用 flex 子项的 flex-grow 按实际题数比例分配宽度, total=0 时整体置灰
 * @param {number} total 总题数
 * @param {{Easy:number, Medium:number, Hard:number}} counts 各难度题数
 */
const totalCard = (total, counts) => {
  // total=0 时 segments 为空, 由 .lc-stat__stack 的轨道色兜底, 不至于显示空白
  const segments = total === 0
    ? ''
    : ['easy', 'medium', 'hard']
        .map((k) => {
          const n = counts[k.charAt(0).toUpperCase() + k.slice(1)];
          return n > 0
            ? `<span class="lc-stat__seg lc-stat__seg--${k}" style="flex-grow:${n}" title="${k}: ${n}"></span>`
            : '';
        })
        .join('');
  const sub = total === 0
    ? '已练习题目'
    : `Easy ${counts.Easy} · Medium ${counts.Medium} · Hard ${counts.Hard}`;
  return (
    `  <div class="lc-stat lc-stat--total">` +
    `<span class="lc-stat__wm" aria-hidden="true">Σ</span>` +
    `<div class="lc-stat__num">${total}</div>` +
    `<div class="lc-stat__label">总计</div>` +
    `<div class="lc-stat__bar lc-stat__stack">${segments}</div>` +
    `<div class="lc-stat__sub">${sub}</div>` +
    `</div>`
  );
};

main();
