# 学的是史 GitHub 同步配置 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为项目配置 GitHub 远端 `origin`，保留 `deploy`，建立独立的 GitHub 同步脚本和文档。

**Architecture:** 双 Remote 模型 — `origin`（GitHub HTTPS + gh CLI 认证）和 `deploy`（服务器 SSH），两者独立。三个脚本：`push-github.sh`（仅 GitHub）、`deploy.sh`（仅服务器，已有）、`publish-all.sh`（先 GitHub 后服务器）。

**Tech Stack:** GitHub CLI (`gh`), HTTPS Git, bash scripts, Git remote management

---

## File Structure Map

### Local files to modify

- Modify: `.gitignore` — 追加证书、凭据、覆盖率、临时文件排除规则
- Modify: `README.md` — 追加 GitHub 仓库和同步脚本说明

### Local files to create

- Create: `scripts/push-github.sh` — 仅同步 GitHub 脚本
- Create: `scripts/publish-all.sh` — 先同步 GitHub，成功后再部署服务器
- Create: `docs/github-sync.md` — GitHub 同步文档

### Install

- Install: GitHub CLI (`gh`) via winget

---

### Task 1: 安装 GitHub CLI 并完成身份验证

- [ ] **Step 1: 确认 gh 未安装**

Run:

```powershell
gh --version
```

Expected: 命令找不到或报错 `The term 'gh' is not recognized`。

- [ ] **Step 2: 安装 GitHub CLI**

Run:

```powershell
winget install --id GitHub.cli --silent
```

Expected: 安装成功。如果 winget 不可用，改用 `scoop install gh` 或从 `https://cli.github.com/` 下载。

- [ ] **Step 3: 验证安装**

Run:

```powershell
gh --version
```

Expected: 输出如 `gh version 2.x.x ...`。

- [ ] **Step 4: 登录 GitHub（CP1 前半）**

Run:

```bash
gh auth login
```

交互选择：

```text
? What account do you want to log into? GitHub.com
? What is your preferred protocol for Git operations? HTTPS
? How would you like to authenticate Git with your GitHub credentials? Login with a web browser
```

浏览器会自动打开 GitHub 授权页面，完成授权后终端显示登录成功。

- [ ] **Step 5: CP1 验收 — 确认登录状态**

Run:

```bash
gh auth status
```

Expected: 输出包含 `Logged in to github.com account feiniao87968492`。

- [ ] **Step 6: 验证 gh 可用于 Git 认证**

Run:

```bash
gh auth setup-git
```

Expected: 配置完成，后续 `git push origin` 自动通过 `gh` 认证。

---

### Task 2: 敏感文件扫描

- [ ] **Step 1: 文件系统敏感文件扫描**

Run:

```powershell
Get-ChildItem -Recurse -Force -ErrorAction SilentlyContinue `
  -Include ".env",".env.*","*.pem","*.key","*.p12","*.pfx","id_rsa","id_rsa.pub","id_ed25519","id_ed25519.pub","*credential*","*secret*" `
  -Exclude ".git" | Select-Object FullName
```

Evaluate: 检查输出中是否有位于项目目录（非 `.git/` 区域）的敏感文件。预期无匹配或仅有误报警。

- [ ] **Step 2: Git 跟踪文件敏感扫描**

Run:

```bash
git ls-files | grep -Ei '(^|/)(\.env(\..*)?|id_rsa(\.pub)?|id_ed25519(_.*)?(\.pub)?|.*\.pem|.*\.key|.*secret.*|.*credential.*)$' || echo "CLEAN"
```

Expected: `CLEAN`，无敏感文件被 Git 跟踪。

- [ ] **Step 3: 源码凭据模式扫描**

Run:

```bash
git grep -nEi '(password|passwd|token|secret|private[_-]?key|access[_-]?key)[[:space:]]*[:=]' || echo "CLEAN"
```

Evaluate: 人工判断结果。`nouns.json` 中可能有 `"text": "..."` 包含历史叙述文字（如"推恩令"、"秘密"等中文词），这些不是凭据。只关注真实 token 或密码值。

- [ ] **Step 4: 判断扫描结果**

- 如果三层扫描均无真实凭据发现 → 继续 Task 3
- 如果发现真实凭据（如 `ghp_` 前缀、IP+密码组合）→ 立即停止，汇报位置，等待用户处理

---

### Task 3: 更新 .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: 检查当前 .gitignore 已有但缺少的规则**

Current `.gitignore`:

```gitignore
Thumbs.db
Desktop.ini
.DS_Store
*.log

# Environment
.env
.env.*
!.env.example

# SSH keys and certificates
*.pem
*.key
id_rsa
id_rsa.pub
id_ed25519
id_ed25519.pub
id_ed25519_*
id_ed25519_*.pub

# Editor
.vscode/
.idea/

# Dependencies and builds
node_modules/
dist/
build/
```

- [ ] **Step 2: 追加说明书要求的额外规则**

Append to `.gitignore`:

```gitignore
# Additional certificate types
*.p12
*.pfx

# Credentials and local secrets
.credentials
credentials.json
secrets.json
*.secret
*.secrets

# Coverage output
coverage/

# Temporary files
*.tmp
*.swp
```

- [ ] **Step 3: 验证 .gitignore 语法**

Run:

```bash
git check-ignore --verbose .env id_ed25519 node_modules/ 2>&1 || true
```

Expected: `.env`、`id_ed25519`、`node_modules/` 被 `.gitignore` 规则匹配。

- [ ] **Step 4: 提交 .gitignore 更新**

Run:

```powershell
git add .gitignore
git commit -m "chore: extend gitignore for github sync safety"
```

---

### Task 4: 添加 GitHub Remote 并探测远端状态

**Files:**
- Modify: Git remote `origin`

- [ ] **Step 1: 确认当前只有 deploy remote**

Run:

```powershell
git remote -v
```

Expected:

```text
deploy  xuedeshi-server:/srv/git/xuedeshi-history-learning.git (fetch)
deploy  xuedeshi-server:/srv/git/xuedeshi-history-learning.git (push)
```

- [ ] **Step 2: 添加 origin remote**

Run:

```powershell
git remote add origin https://github.com/feiniao87968492/History-Learning.git
```

- [ ] **Step 3: 验证双 remote 并存**

Run:

```powershell
git remote -v
```

Expected:

```text
deploy  xuedeshi-server:/srv/git/xuedeshi-history-learning.git (fetch)
deploy  xuedeshi-server:/srv/git/xuedeshi-history-learning.git (push)
origin  https://github.com/feiniao87968492/History-Learning.git (fetch)
origin  https://github.com/feiniao87968492/History-Learning.git (push)
```

- [ ] **Step 4: 探测 GitHub 远端状态**

Run:

```bash
git ls-remote origin
```

Evaluate:

| 输出 | 含义 | 下一步 |
|------|------|--------|
| 无输出 | 仓库为空 | 继续 Task 5，首次 `push -u` |
| 有 `refs/heads/main` | 仓库已有 main 分支 | 执行 Step 5 检查分叉 |
| 认证错误 | 身份验证失败 | 回到 Task 1 修复 `gh auth` |

- [ ] **Step 5: (仅当远端有 main 时) 检查历史分叉**

Run:

```bash
git fetch origin main
git merge-base --is-ancestor origin/main main
```

- 返回成功 → 本地包含远端历史，可以正常推送
- 返回失败 → **停止**，汇报历史分叉，执行 `git log --oneline --graph --decorate --all -20`，等待用户选择策略

---

### Task 5: 创建同步脚本

**Files:**
- Create: `scripts/push-github.sh`
- Create: `scripts/publish-all.sh`

- [ ] **Step 1: 写入 push-github.sh**

Write `scripts/push-github.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

REMOTE_NAME="origin"
TARGET_BRANCH="main"
EXPECTED_REMOTE_URL="https://github.com/feiniao87968492/History-Learning.git"

current_branch="$(git branch --show-current)"

if [ "$current_branch" != "$TARGET_BRANCH" ]; then
    echo "Error: GitHub sync must run from branch '$TARGET_BRANCH'."
    echo "Current branch: '$current_branch'"
    exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Error: working tree contains uncommitted changes."
    echo "Commit or stash your changes before syncing GitHub."
    git status --short
    exit 1
fi

actual_remote_url="$(git remote get-url "$REMOTE_NAME" 2>/dev/null || true)"

if [ "$actual_remote_url" != "$EXPECTED_REMOTE_URL" ]; then
    echo "Error: remote '$REMOTE_NAME' does not match the expected GitHub URL."
    echo "Expected: $EXPECTED_REMOTE_URL"
    echo "Actual:   ${actual_remote_url:-<missing>}"
    exit 1
fi

echo "[github] Fetching remote state..."
git fetch "$REMOTE_NAME" "$TARGET_BRANCH" 2>/dev/null || true

if git show-ref --verify --quiet "refs/remotes/$REMOTE_NAME/$TARGET_BRANCH"; then
    if ! git merge-base --is-ancestor \
        "$REMOTE_NAME/$TARGET_BRANCH" \
        "$TARGET_BRANCH"; then
        echo "Error: remote history is not an ancestor of local '$TARGET_BRANCH'."
        echo "The histories may have diverged."
        echo "Resolve the difference manually. Force push is intentionally disabled."
        exit 1
    fi
fi

echo "[github] Pushing '$TARGET_BRANCH' to '$REMOTE_NAME'..."
git push "$REMOTE_NAME" "$TARGET_BRANCH"

echo "[github] Sync completed successfully."
echo "[github] Repository: https://github.com/feiniao87968492/History-Learning"
```

- [ ] **Step 2: 设置 push-github.sh 可执行权限**

Run:

```powershell
git update-index --chmod=+x scripts/push-github.sh
```

- [ ] **Step 3: 写入 publish-all.sh**

Write `scripts/publish-all.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "[publish] Step 1/2: syncing GitHub..."
./scripts/push-github.sh

echo "[publish] Step 2/2: deploying website..."
./scripts/deploy.sh

echo "[publish] Completed successfully."
echo "[publish] GitHub: https://github.com/feiniao87968492/History-Learning"
echo "[publish] Website: http://118.178.140.171:9090"
```

- [ ] **Step 4: 设置 publish-all.sh 可执行权限**

Run:

```powershell
git update-index --chmod=+x scripts/publish-all.sh
```

---

### Task 6: 创建文档并更新 README

**Files:**
- Create: `docs/github-sync.md`
- Modify: `README.md`

- [ ] **Step 1: 写入 github-sync.md**

Write `docs/github-sync.md`:

```markdown
# GitHub 同步说明

## 一、GitHub 仓库

```text
https://github.com/feiniao87968492/History-Learning
```

本地 Git remote：

```text
origin
```

完整 remote 地址：

```text
https://github.com/feiniao87968492/History-Learning.git
```

## 二、与服务器部署的区别

项目存在两个独立 remote：

```text
origin  → GitHub
deploy  → 云服务器
```

只同步 GitHub：

```bash
git push origin main
```

只发布服务器网站：

```bash
git push deploy main
```

## 三、推荐脚本

只同步 GitHub：

```bash
./scripts/push-github.sh
```

只更新服务器网站：

```bash
./scripts/deploy.sh
```

同步 GitHub 并更新网站：

```bash
./scripts/publish-all.sh
```

## 四、日常使用场景

### 场景 1：快速更新线上测试版本

```bash
git add .
git commit -m "feat: describe changes"
./scripts/deploy.sh
```

该操作只更新服务器，不同步 GitHub。

### 场景 2：将稳定版本同步至 GitHub

```bash
git add .
git commit -m "feat: describe changes"
./scripts/push-github.sh
```

该操作只同步 GitHub，不更新网站。

### 场景 3：稳定版本同时同步 GitHub 并上线

```bash
git add .
git commit -m "feat: describe changes"
./scripts/publish-all.sh
```

## 五、身份验证

GitHub remote 使用 HTTPS。

优先通过 GitHub CLI 登录：

```bash
gh auth login
```

选择：

```text
GitHub.com
HTTPS
Login with a web browser
Authenticate Git with your GitHub credentials: Yes
```

不要把 GitHub 密码或 token 写入：

- 仓库文件
- Shell 脚本
- README
- `.env`
- Git remote URL
- 聊天记录

## 六、检查 remote

```bash
git remote -v
```

预期结果：

```text
origin  https://github.com/feiniao87968492/History-Learning.git
deploy  xuedeshi-server:/srv/git/xuedeshi-history-learning.git
```

## 七、检查 GitHub 登录

```bash
gh auth status
```

## 八、常见问题

### 1. GitHub 要求输入密码

GitHub HTTPS Git 操作不要使用账户密码。

优先执行：

```bash
gh auth login
```

### 2. 远端历史冲突

如果脚本提示：

```text
Remote history has diverged
```

不要 force push。

执行：

```bash
git fetch origin main
git log --oneline --graph --decorate --all -20
```

检查差异后，再决定 merge 或 rebase。

### 3. GitHub 推送成功，但网站没有变化

这是正常现象。`push-github.sh` 只同步 GitHub。

要更新服务器网站，需要执行 `./scripts/deploy.sh` 或 `./scripts/publish-all.sh`。

### 4. 网站已更新，但 GitHub 没有变化

这也是正常现象。服务器部署和 GitHub 同步是两个独立流程。

执行 `./scripts/push-github.sh` 即可同步 GitHub。

## 九、安全说明

禁止：

```bash
git push --force
```

不要把 token 写入 remote URL。

不要将服务器密码、SSH 私钥、GitHub token 或其他敏感内容提交到 GitHub。
```

- [ ] **Step 2: 在 README.md 末尾追加 GitHub 章节**

Append after the existing deployment section:

```markdown
## GitHub 仓库

GitHub 地址：

```text
https://github.com/feiniao87968492/History-Learning
```

## 发布与同步

项目具有两个独立流程。

只更新服务器网站：

```bash
./scripts/deploy.sh
```

只同步 GitHub：

```bash
./scripts/push-github.sh
```

同步 GitHub 并更新服务器网站：

```bash
./scripts/publish-all.sh
```

完整说明：

```text
docs/deployment.md
docs/github-sync.md
```
```

- [ ] **Step 3: 提交脚本、文档和 README**

Run:

```powershell
git add scripts/push-github.sh scripts/publish-all.sh docs/github-sync.md README.md
git commit -m "docs: add GitHub synchronization workflow"
```

---

### Task 7: 首次推送 GitHub 并验收（CP2）

- [ ] **Step 1: 最终状态确认**

Run:

```powershell
git status --short; git branch --show-current; git remote -v; git log --oneline --decorate -5
```

Expected:
- 工作区干净
- 分支 `main`
- `origin` 和 `deploy` 都存在且正确
- 最新提交可见

- [ ] **Step 2: 执行 push-github.sh**

Run:

```bash
./scripts/push-github.sh
```

Expected: `[github] Sync completed successfully.`

如果是首次推送且远端为空（Task 4 Step 4 的结果），改用：

```bash
git push -u origin main
```

后续再运行 `./scripts/push-github.sh` 也应正常。

- [ ] **Step 3: CP2 验收 — GitHub 页面确认**

浏览器打开：

```text
https://github.com/feiniao87968492/History-Learning
```

确认：
- 分支 `main` 存在
- 提交历史可见（之前的多次重构提交）
- 文件结构完整（`src/css/`、`src/js/`、`src/data/` 等）
- 无凭据文件出现在仓库中

- [ ] **Step 4: 验证 deploy remote 未被破坏**

Run:

```bash
git push deploy main
```

Expected: 推送成功（`Everything up-to-date` 或正常同步），服务器网站仍正常。

- [ ] **Step 5: 验证 publish-all.sh**

Run:

```bash
./scripts/publish-all.sh
```

Expected:
- `[publish] Step 1/2: syncing GitHub...` → `Sync completed successfully`
- `[publish] Step 2/2: deploying website...` → `Success`
- `[publish] Completed successfully.`

---

## Self-Review Checklist

### Spec coverage

- GitHub CLI 安装与 `gh auth login` ✓ Task 1
- 敏感文件扫描（三层） ✓ Task 2
- `.gitignore` 扩展 ✓ Task 3
- `origin` remote 添加 ✓ Task 4
- 远端状态探测与分叉处理 ✓ Task 4
- `push-github.sh` 脚本 ✓ Task 5
- `publish-all.sh` 脚本 ✓ Task 5
- `docs/github-sync.md` 文档 ✓ Task 6
- README 更新 ✓ Task 6
- CP1 身份验证 ✓ Task 1 Step 5
- CP2 首次推送 ✓ Task 7

### Placeholder scan

No TBD, TODO, or incomplete sections. All commands exact, all file contents complete.

### Type consistency

All tasks reference `origin` as GitHub remote name, `https://github.com/feiniao87968492/History-Learning.git` as URL, `main` as target branch — consistent throughout. `gh` CLI used consistently for authentication. No function/variable name inconsistencies.
