---
name: git-smart-commit
description: 智能 git 提交助手 - 分析工作区改动，自动分组生成规范 commit message，支持中英文、多组提交、安全检查和选择性推送
triggers:
  - /commit
  - 提交代码
  - 帮我 commit
  - commit 一下
  - 提交一下改动
agent_created: true
---

# git-smart-commit

分析当前 git 工作区改动，按功能智能分组，生成符合 Conventional Commits 规范的提交信息，在关键决策点通过 AskUserQuestion 让用户选择，最后选择性推送到远程。

## 工作流

### 步骤 1：采集改动

执行以下命令，不要用 `git add` 暂存任何东西：

```bash
git status --short
git diff --stat
git diff --cached --stat   # 暂存区已有内容也要看
git log --oneline -10       # 看历史风格
git branch --show-current    # 当前分支
```

**如果工作区干净（无 staged 也无 unstaged 改动）**：直接回复"没有改动需要提交"并展示 `git status` 输出，结束。

**如果暂存区非空**：先问用户"检测到已暂存 N 个文件，是提交这些已暂存的，还是把所有改动重新分组？"——用 AskUserQuestion。

### 步骤 2：逐文件读 diff 并分类

对每个改动文件，用 `git diff <file>` 读取完整 diff（新文件用 `git diff --no-index /dev/null <file>` 或直接读文件内容）。分类维度：

- **改动类型**：新增(A) / 修改(M) / 删除(D) / 重命名(R)
- **语义归类**：根据文件路径和 diff 内容，归入功能模块
- **依赖层级**：基础设施(类型/工具) → 业务逻辑 → 测试 → 文档/配置

### 步骤 3：智能分组

判断改动是否跨多个不相关功能模块：

- **单组判定**：所有改动服务于同一功能目的，或文件数 ≤3 且语义一致
- **多组判定**：文件数 >5 且跨 ≥2 个顶层模块，或明显属于不同功能

分组规则：
1. 按文件路径聚类（同模块目录归一起）
2. 跨文件但服务同一目的的（API + 对应测试 + 对应文档）归一组
3. 按依赖顺序排序：基础设施 → 业务 → 测试 → 文档
4. 每组是一个"最小功能实现"，能独立成立

**单文件混入多功能的情况**：检测到单文件 diff 涉及多个不相关功能时，提示用户"文件 X 改动涉及多个功能，建议手动 `git add -p` 分块暂存后再跑"，不要硬分组。

**多组时**：用 AskUserQuestion 弹卡确认分组方案（见 references/ask-questions.md 的 Q1）。用户可：
- 确认按方案提交
- 要求调整分组
- 要求全部合为一个 commit

### 步骤 4：问 commit message 语言

用 AskUserQuestion 弹卡（见 references/ask-questions.md 的 Q2）。选项：
- 中文
- 英文
- 跟上次一样（显示上次偏好）

用户选择后，如果是第一次使用，将语言偏好写入 `~/.workbuddy/MEMORY.md`。

### 步骤 5：生成 commit message

按 Conventional Commits 规范生成，格式见 references/commit-message-template.md。

关键规则：
- **type**：feat / fix / refactor / perf / docs / test / chore / style / build / ci
- **scope**：从文件路径推断（如 `src/auth/` → `auth`），拿不准就省略 scope，不要硬造
- **subject**：祈使句，中文 ≤30 字，英文 ≤50 字符，不加句号
- **body**：用 bullet 列 what/why，每行 ≤72 字符
- **对齐历史风格**：如果 `git log` 显示项目不跟 Conventional Commits（比如用的是纯描述、或带工单号前缀），跟随项目历史风格，不要套模板

生成后把完整 message 贴出来让用户 review，等用户确认或修改。不要直接提交。

### 步骤 6：安全检查

提交前执行安全检查（见 references/safety-checks.md）。如果命中任何拦截项：
- 敏感信息（密码/token/密钥/.env）→ **拦截，高亮警告，不提交**
- 大文件（>1MB 非二进制）→ 提示，等用户确认
- 调试残留（console.log/debugger/fmt.Println）→ 提醒，不拦截
- 受保护分支（main/master/release/*）→ 二次确认

### 步骤 7：执行 commit

```bash
git add <file1> <file2> ...   # 只 add 本组的文件，不用 -A
git commit -m "<msg>"          # 用 HEREDOC 传多行 msg
```

多组时按顺序逐组执行，每组 add + commit 一次。

**pre-commit hook 失败时**：
1. 读取 hook 报错输出
2. 用 AskUserQuestion 弹卡（见 references/ask-questions.md 的 Q4）
3. **绝对不要自动 `--no-verify`**，只有用户明确选择"跳过 hook"才加该参数

### 步骤 8：问是否 push

commit 完成后，用 AskUserQuestion 弹卡（见 references/ask-questions.md 的 Q3）。选项：
- 推送（git push）
- 不推送
- 推送并开 PR（如果是 feature 分支）

push 前先 `git fetch` 检查远程状态：
- 远程有新提交（非 fast-forward）→ 不要自动 pull --rebase，告诉用户手动处理
- push 被拒绝 → 不要 `--force`，除非用户明确说"强推"
- 新远程分支 → 用 `git push -u origin <branch>`

### 步骤 9：提交回执

每组 commit 完成后输出回执：

```
✓ [组 1/3] feat(auth): 登录态校验
  commit: a1b2c3d
  files: 3 changed (+45, -12)

✓ [组 2/3] fix(api): 响应体字段对齐
  commit: e4f5g6h
  files: 2 changed (+8, -3)
  ...
```

全部完成后给总览。如果 push 了，附上远程链接。
