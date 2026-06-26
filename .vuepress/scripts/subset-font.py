#!/usr/bin/env python3
"""
子集化得意黑字体并将结果 base64 内联到 .vuepress/style/index.scss 的 @font-face。

字符来源:
  1) blogs/ 下所有 .md 实际用到的字
  2) .vuepress/config.js 中的导航/标题等固定文案
  3) 常用 ASCII + 中文标点 + 3500 常用汉字(防止新文章漏字)

依赖: fontTools, brotli (装在 .vuepress/.venv 中)
运行: .vuepress/.venv/bin/python .vuepress/scripts/subset-font.py
"""

import base64
import glob
import io
import os
import re
import sys
from pathlib import Path

from fontTools.subset import Subsetter, Options
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
SRC_FONT = ROOT / '.vuepress/public/fonts/SmileySans-Oblique.woff2'
# 生成产物: 单独的 font.scss, 由 .gitignore 排除, 不污染 index.scss diff
FONT_SCSS = ROOT / '.vuepress/style/font.scss'

# 3500 常用汉字 (国家语委《现代汉语常用字表》常用字 2500 + 次常用字 1000)
# 来源已固化, 防止漏字。这里只保留常用字范围, 详细字表通过 Unicode 范围近似:
# 实际做法: 用 GB2312 一级字库 (3755 字) 覆盖, 再叠加文章实际用字。
def gb2312_level1_chars():
    """GB2312 一级汉字共 3755 个, 覆盖 99% 的现代汉语使用场景。"""
    chars = []
    for hi in range(0xB0, 0xD8):  # 区号 16-55
        for lo in range(0xA1, 0xFF):  # 位号 1-94
            try:
                ch = bytes([hi, lo]).decode('gb2312')
                chars.append(ch)
            except UnicodeDecodeError:
                pass
    return ''.join(chars)


def collect_chars():
    """收集所有需要保留的字符。"""
    chars = set()

    # 1) 文章
    md_files = glob.glob(str(ROOT / 'blogs/**/*.md'), recursive=True)
    for f in md_files:
        chars.update(Path(f).read_text(encoding='utf-8'))

    # 2) 站点固定文案
    for rel in ['.vuepress/config.js', 'README.md']:
        p = ROOT / rel
        if p.exists():
            chars.update(p.read_text(encoding='utf-8'))

    article_only_count = len(chars)

    # 3) 常用 ASCII (可打印部分)
    chars.update(chr(c) for c in range(0x20, 0x7F))

    # 4) 中文标点
    chars.update('，。、；：？！“”‘’（）《》【】〈〉「」『』—…·～￥')

    # 5) GB2312 一级常用汉字
    chars.update(gb2312_level1_chars())

    print(f'  文章实际用字: {article_only_count}')
    print(f'  叠加常用字后总字符数: {len(chars)}')
    return chars


def subset_font(chars):
    """子集化字体, 返回 woff2 字节流。"""
    font = TTFont(str(SRC_FONT))

    options = Options()
    options.flavor = 'woff2'
    options.with_zopfli = False
    options.desubroutinize = True
    options.hinting = False  # 中文字体 hinting 占空间巨大, 屏幕显示无需
    options.drop_tables += ['DSIG']
    options.layout_features = ['*']  # 保留所有 OpenType feature
    options.name_IDs = ['*']
    options.notdef_glyph = True
    options.notdef_outline = True
    options.recommended_glyphs = True

    subsetter = Subsetter(options=options)
    subsetter.populate(text=''.join(chars))
    subsetter.subset(font)

    buf = io.BytesIO()
    font.flavor = 'woff2'
    font.save(buf)
    return buf.getvalue()


def write_font_scss(font_bytes):
    """把子集字体 base64 编码后写入独立的 font.scss (由 index.scss @import)。"""
    b64 = base64.b64encode(font_bytes).decode('ascii')
    data_uri = f'data:font/woff2;base64,{b64}'

    content = (
        "// !!! 此文件由 .vuepress/scripts/subset-font.py 自动生成, 请勿手动编辑 !!!\n"
        "// 由 .gitignore 排除, build 前自动重新生成\n\n"
        "@font-face {\n"
        "  font-family: 'Smiley Sans';\n"
        f"  src: url('{data_uri}') format('woff2');\n"
        "  font-weight: normal;\n"
        "  font-style: oblique;\n"
        "  font-display: block;\n"
        "}\n"
    )
    FONT_SCSS.write_text(content, encoding='utf-8')


def main():
    if not SRC_FONT.exists():
        print(f'!! 源字体不存在: {SRC_FONT}', file=sys.stderr)
        sys.exit(1)

    src_size = SRC_FONT.stat().st_size
    print(f'源字体: {SRC_FONT.relative_to(ROOT)}  ({src_size/1024:.1f} KB)')

    print('收集字符:')
    chars = collect_chars()

    print('执行子集化...')
    out = subset_font(chars)
    out_size = len(out)
    b64_size = len(base64.b64encode(out))
    print(f'  子集化后: {out_size/1024:.1f} KB (压缩率 {out_size*100/src_size:.1f}%)')
    print(f'  base64 后: {b64_size/1024:.1f} KB (将内联进 SCSS)')

    print('写入 font.scss...')
    write_font_scss(out)
    print(f'  已生成 {FONT_SCSS.relative_to(ROOT)}')
    print('完成。')


if __name__ == '__main__':
    main()
