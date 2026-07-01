# 安全检查清单

提交前对 `git diff` 内容执行以下扫描。命中拦截项时停止提交，高亮警告。

## 拦截级（命中则停止，不提交）

### 1. 敏感信息

扫描 diff 中的新增行（`+` 开头），匹配以下模式：

**关键词模式**：
- `password` / `passwd` / `pwd`（赋值或硬编码，不含变量名）
- `secret` / `api_key` / `apikey` / `api-key`
- `access_key` / `secret_key` / `private_key`
- `token`（赋值且值看起来像真实 token，不含变量名 `authToken`）
- `AKID` / `AK` + 数字（腾讯云 AK 格式）

**文件模式**：
- `.env` / `.env.local` / `.env.production` 等环境变量文件
- `id_rsa` / `id_ed25519` 等私钥文件
- `*.pem` / `*.key` / `*.p12` / `*.pfx` 证书文件
- `credentials.json` / `service-account.json`

**值模式**（正则）：
- 长度 ≥32 的 base64/hex 字符串赋值（疑似真实密钥）
- 形如 `AKIA[A-Z0-9]{16}`（AWS AK）
- 形如 `AKID[A-Za-z0-9]{13,}`（腾讯云 AK）

命中时：**停止提交**，高亮显示命中的文件和行，告诉用户"检测到疑似敏感信息，请确认是否应提交"。

### 2. 受保护分支

当前分支匹配以下时，二次确认：

- `main` / `master`
- `release/*` / `hotfix/*`
- `develop`

用 AskUserQuestion 弹卡确认。

## 警告级（提示但不拦截）

### 3. 大文件

扫描改动文件大小（非二进制）：

- >1MB：提示"文件 X 大小 1.2MB，确认是否需要提交"
- >5MB：强烈建议检查是否应该拆分或用 LFS

### 4. 调试残留

扫描新增行中的调试代码：

- `console.log(` / `console.debug(`
- `debugger`
- `fmt.Println(` （Go，正式代码用 log）
- `print(` （Python，正式代码用 logging）
- `System.out.println(` （Java）
- `dump(` （PHP / Swift）

提示"检测到调试代码，确认是否应保留"。

### 5. 误加文件

检查是否有不应提交的文件：

- `.DS_Store` / `Thumbs.db`
- `*.swp` / `*.swo`
- `node_modules/`
- `__pycache__/`
- `*.log`

提示"检测到通常不应提交的文件 X，确认是否提交"。

## 检查执行方式

对 `git diff` 的输出做文本扫描，不依赖额外工具。伪代码：

```
diff = git diff  # 或 git diff --cached
for line in diff:
    if line starts with '+':
        check_patterns(line)
```

每个检查项独立报告，最后汇总。
