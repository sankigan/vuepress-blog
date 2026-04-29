#!/usr/bin/env bash
# ============================================================
# VuePress 博客一键部署脚本
# 流程：
#   1. （可选）若源码有未提交改动，自动 add/commit/push 到 main
#   2. npm run build 生成 .vuepress/dist
#   3. 校验 dist 存在且非空、源码工作区干净
#   4. 在 dist 内重建一次性 git 仓库，强推到 sankigan.github.io master
# 用法：直接执行 ./deploy.sh 或 npm run deploy
# ============================================================

set -euo pipefail

# ---- 配置 ----
SOURCE_REMOTE="git@github.com:sankigan/vuepress-blog.git"
SOURCE_BRANCH="main"
PAGES_REMOTE="git@github.com:sankigan/sankigan.github.io.git"
PAGES_BRANCH="master"
GIT_USER_NAME="sanki"
GIT_USER_EMAIL="sanqi_3737@163.com"
DIST_DIR=".vuepress/dist"

# ---- 工具 ----
# 始终以脚本所在目录（仓库根）为 cwd，避免调用者 pwd 影响
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

step() { printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
ok()   { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m! %s\033[0m\n" "$*"; }
fail() { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; exit 1; }

# ============================================================
# 1. 源码：仅在有改动时 commit + push，避免空 commit / 无意义强推
# ============================================================
step "检查源码是否有未提交改动"
if [[ -n "$(git status --porcelain)" ]]; then
  warn "检测到未提交改动，自动 commit 并推送到 ${SOURCE_BRANCH}"
  git add .
  git commit -m 'update'
  git push "$SOURCE_REMOTE" "$SOURCE_BRANCH"
  ok "源码已推送"
else
  ok "源码干净，跳过提交"
fi

# ============================================================
# 2. 构建
# ============================================================
step "构建静态文件（npm run build）"
npm run build
ok "构建完成"

# ============================================================
# 3. 校验
# ============================================================
step "校验产物与工作区"
[[ -d "$DIST_DIR" ]] || fail "$DIST_DIR 不存在，构建可能未生成产物"
[[ -n "$(ls -A "$DIST_DIR" 2>/dev/null)" ]] || fail "$DIST_DIR 为空"
[[ -f "$DIST_DIR/index.html" ]] || fail "$DIST_DIR/index.html 缺失"

# build 过程中若产生新的源码改动（例如自动生成的文件），停下来让用户处理
if [[ -n "$(git status --porcelain)" ]]; then
  fail "构建后源码工作区不干净，请先处理：\n$(git status --short)"
fi
ok "校验通过"

# ============================================================
# 4. 部署 dist 到 GitHub Pages
# ============================================================
step "部署 ${DIST_DIR} 到 ${PAGES_REMOTE} (${PAGES_BRANCH})"
(
  cd "$DIST_DIR"
  # 移除上次部署残留的 .git，保证幂等
  rm -rf .git
  git init -q -b "$PAGES_BRANCH"
  git config user.name  "$GIT_USER_NAME"
  git config user.email "$GIT_USER_EMAIL"
  git add -A
  git commit -q -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')"
  git push -f -q "$PAGES_REMOTE" "$PAGES_BRANCH"
)
ok "部署成功 → https://sankigan.github.io/"
