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

触发条件：每次生成 message 前。

```json
{
  "questions": [{
    "question": "本次 commit message 用什么语言？",
    "header": "Msg 语言",
    "options": [
      { "label": "中文", "description": "生成中文 commit message" },
      { "label": "英文", "description": "生成英文 commit message" },
      { "label": "跟上次一样", "description": "使用上次的语言偏好（上次：<中文/英文>）" }
    ]
  }]
}
```

首次使用时（MEMORY.md 中无偏好记录）不显示"跟上次一样"选项。

用户选择后，将偏好写入 `~/.workbuddy/MEMORY.md`：
```
- git-smart-commit 语言偏好：中文
```

下次 Q2 的第三项显示"跟上次一样（中文）"。

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

## 提问纪律

1. **只在关键决策点提问**：分组确认、语言选择、是否 push、hook 失败——这四个。其他环节直接执行或直接展示。
2. **条件触发**：单组改动跳过 Q1，hook 没失败不触发 Q4，没有 feature 分支不显示"推送并开 PR"。
3. **不要弹"确认 message"卡**：生成 msg 后直接贴文本让用户看，用户说"可以"或修改即可，不用 AskUserQuestion。
4. **不要弹"是否继续"卡**：多组提交时不要每组之间问"继续吗"，按确认的方案一口气执行完，最后统一问 push。
