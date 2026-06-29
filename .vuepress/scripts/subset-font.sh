#!/usr/bin/env bash
# ============================================================
# 字体子集化入口脚本
#   - 自动准备 Python venv 和依赖 (fontTools, brotli)
#   - 调用 subset-font.py 完成子集化, 输出独立 woff2 + 外链 font.scss
# 在 npm run build / npm run subset-font 中被调用
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
VENV_DIR="$ROOT_DIR/.vuepress/.venv"
PY_SCRIPT="$SCRIPT_DIR/subset-font.py"
# 源字体只作子集化输入, 放在 scripts/ 而非 public/ (避免被原样复制进 dist)。
SRC_FONT="$SCRIPT_DIR/SmileySans-Oblique.woff2"

step() { printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
ok()   { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
err()  { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; }

# 1) 检查源字体
if [[ ! -f "$SRC_FONT" ]]; then
  err "源字体不存在: $SRC_FONT"
  err "请把 SmileySans-Oblique.woff2 放到 .vuepress/scripts/ 后重试"
  exit 1
fi

# 2) 准备 venv (幂等)
if [[ ! -x "$VENV_DIR/bin/python" ]]; then
  step "首次运行: 创建 Python venv ($VENV_DIR)"
  if ! command -v python3 >/dev/null 2>&1; then
    err "未找到 python3, 请先安装 Python 3"
    exit 1
  fi
  python3 -m venv "$VENV_DIR"
  "$VENV_DIR/bin/pip" install --quiet --upgrade pip
  "$VENV_DIR/bin/pip" install --quiet fonttools brotli
  ok "venv 创建完成"
fi

# 3) 检查依赖 (防止有人手动删了包)
if ! "$VENV_DIR/bin/python" -c "import fontTools, brotli" >/dev/null 2>&1; then
  step "venv 依赖缺失, 重新安装"
  "$VENV_DIR/bin/pip" install --quiet fonttools brotli
fi

# 4) 跑子集化
step "执行字体子集化"
"$VENV_DIR/bin/python" "$PY_SCRIPT"
ok "字体子集化完成"
