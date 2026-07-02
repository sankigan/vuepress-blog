# AskUserQuestion 提问设计

本文档定义 skill 中各提问点的 AskUserQuestion 调用参数。所有提问用 AskUserQuestion 工具弹出选择卡，用户也可选 "Other" 自定义输入。

## Q1 — 分组确认（仅多组时触发）

触发条件：步骤 3 判定为多组改动。

```json
{
  "questions": [{
    "question": "检测到改动跨多个功能，建议分 N 次提交。分组方案：\n1. <type>(<scope>): <desc> — <n> 文件\n2. ... \n是否按此方案提交？",
    "header": "分组方案",
    "options": [
      { "label": "按此方案提交", "description": "按上述分组逐组提交" },
      { "label": "我要调整分组", "description": "手动指定分组方式" },
      { "label": "全部合一个 commit", "description": "不分组，所有改动合为一个提交" }
    ]
  }]
}
```

用户选"我要调整分组"时，让用户描述调整方式，重新分组后再确认。

## Q2 — commit message 语言

触发条件：**首次使用**（MEMORY.md 中无语言偏好记录）。

```json
{
  "questions": [{
    "question": "本次 commit message 用什么语言？",
    "header": "Msg 语言",
    "options": [
      { "label": "中文", "description": "生成中文 commit message" },
      { "label": "英文", "description": "生成英文 commit message" }
    ]
  }]
}
```

用户选择后，将偏好写入 `~/.workbuddy/MEMORY.md`：
```
- git-smart-commit 语言偏好：中文
```

**非首次使用时不弹此卡**，静默沿用上次偏好。除非用户在本轮指令中主动指定语言（如"用英文写 commit message"），才覆盖偏好。

## Q3 — 是否 push

触发条件：commit 完成后。

```json
{
  "questions": [{
    "question": "提交完成，是否推送到远程 origin/<branch>？",
    "header": "推送",
    "options": [
      { "label": "推送 (git push)", "description": "推送到当前分支的远程跟踪分支" },
      { "label": "不推送", "description": "仅本地提交，不推送" },
      { "label": "推送并开 PR", "description": "推送后创建 Pull Request（仅 feature 分支）" }
    ]
  }]
}
```

选择"推送并开 PR"时：
1. 先 `git push -u origin <branch>`（新分支建跟踪）
2. 用 `gh pr create` 创建 PR，标题用首个 commit 的 subject
3. 如果没装 gh 或不是 GitHub 仓库，降级为只推送，提示用户手动开 PR

多组提交时，Q3 在所有组提交完成后统一问一次，不是每组问。

## Q4 — hook 失败处理

触发条件：`git commit` 时 pre-commit hook 返回非零。

```json
{
  "questions": [{
    "question": "pre-commit hook 失败。\n错误摘要：<hook 输出关键行>\n如何处理？",
    "header": "Hook 失败",
    "options": [
      { "label": "修了再提", "description": "根据 hook 报错修复后重新提交" },
      { "label": "跳过 hook (--no-verify)", "description": "跳过 hook 直接提交（不推荐）" },
      { "label": "取消本次提交", "description": "放弃提交，保留改动" }
    ]
  }]
}
```

选择"修了再提"时：
- 如果是格式化类错误（prettier/black/goimports/clang-format），尝试自动修复后重试
- 如果是 lint 类错误，列出错误让用户手动修

选择"跳过 hook"时：
- 加 `--no-verify` 参数重新 commit
- 本次会话内不再问，但**不持久化**此偏好到 MEMORY.md

## Q5 — message 确认（强意图时触发）

触发条件：步骤 5 判定为**强意图**（用户指令已包含明确提交动作）。

把生成的 message（多组时含分组方案）贴出来后，用此卡一次性确认。多组时所有组的 message 合并展示在 question 里。

```json
{
  "questions": [{
    "question": "commit message 如下，确认提交吗？\n\n<组1> <type>(<scope>): <subject>\n  <body>\n\n<组2> ...",
    "header": "确认 message",
    "options": [
      { "label": "确认提交", "description": "按上述 message 执行提交" },
      { "label": "修改 message", "description": "手动调整 message 内容" }
    ]
  }]
}
```

用户选"修改 message"时，让用户描述修改方式，调整后重新确认。

> 单组改动 + 强意图时，此卡是唯一需要弹的卡（语言已静默沿用、分组无需确认）。
> 多组改动 + 强意图时，此卡合并分组确认与 message 确认，一次完成。

## 提问纪律

1. **只在关键决策点提问**：语言选择（首次）、message 确认（强意图）、分组确认（弱意图多组）、是否 push、hook 失败——按场景触发，其他环节直接执行或直接展示。
2. **条件触发**：单组改动跳过 Q1，hook 没失败不触发 Q4，没有 feature 分支不显示"推送并开 PR"。
3. **message 确认分场景**：弱意图时贴文本让用户看，用户说"可以"或修改即可，不弹卡；强意图时贴文本 + 弹 Q5 确认卡，一次完成 review。无论哪种场景，**都不得跳过 review 直接提交**。
4. **不要弹"是否继续"卡**：多组提交时不要每组之间问"继续吗"，按确认的方案一口气执行完，最后统一问 push。
