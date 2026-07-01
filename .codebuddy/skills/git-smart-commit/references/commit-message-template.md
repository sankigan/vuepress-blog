# Commit Message 模板

## Conventional Commits 格式

```
<type>(<scope>): <subject>

<body>
```

## type 取值

| type | 用途 |
|------|------|
| feat | 新功能 |
| fix | 修复 bug |
| refactor | 重构（不改功能不修 bug） |
| perf | 性能优化 |
| docs | 文档 |
| test | 测试 |
| chore | 构建/依赖/配置等杂项 |
| style | 格式化（不改逻辑） |
| build | 构建系统 |
| ci | CI 配置 |

## scope 推断规则

- 从文件路径推断：`src/auth/` → `auth`，`components/Header/` → `Header`
- 跨多个模块时取主要模块
- **拿不准就省略 scope**，不要硬造

## subject 规则

- 祈使句：写"做了什么"，不写"做了什么了"
- 中文 ≤30 字
- 英文 ≤50 字符
- 不加句号
- 不用大写开头（英文）

## body 规则

- 用 bullet 点列 what / why
- what：改了什么（不是怎么改的，diff 已经有了）
- why：为什么改，解决什么问题
- 每行 ≤72 字符
- 和 subject 之间空一行

## 示例

### 中文示例

```
feat(auth): 新增登录态校验中间件

- 新增 authMiddleware，校验 JWT 并注入用户信息
- 登录接口签发 token，过期时间 7 天
- 补充单元测试覆盖正常/过期/无 token 三种场景
```

### 英文示例

```
feat(auth): add login state validation middleware

- add authMiddleware to verify JWT and inject user info
- login endpoint signs token with 7-day expiry
- add unit tests for valid/expired/missing token cases
```

## 历史风格对齐

如果 `git log --oneline -10` 显示项目不跟 Conventional Commits：

- 纯描述风格（如 `修复登录问题`）→ 跟随，用纯描述
- 带工单号（如 `[BUG-123] 修复登录问题`）→ 跟随，提取工单号格式
- 带作者前缀（如 `zhangsan: 修复登录`）→ 跟随

**不要在不符合规范的项目里硬套 Conventional Commits。**
