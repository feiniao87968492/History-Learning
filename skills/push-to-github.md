# 本地 Agent Skill：为“学的是史”配置 GitHub 远端与可控同步流程

## 一、角色与任务背景

你是我的本地开发 Agent。

本地已有项目仓库：

```text id="u24zeh"
xuedeshi-history-learning
```

项目名称：

```text id="8s3i5j"
学的是史
```

当前项目已经或即将配置云服务器部署 remote：

```text id="dn0s0u"
deploy
```

服务器网站地址：

```text id="rh4sss"
http://118.178.140.171:9090
```

现在需要额外配置 GitHub 仓库同步能力。

GitHub 目标仓库：

```text id="12y6yz"
https://github.com/feiniao87968492/History-Learning
```

Git remote 使用的完整 HTTPS 地址：

```text id="gqlilk"
https://github.com/feiniao87968492/History-Learning.git
```

本次任务需要完成：

1. 检查本地 Git 仓库状态。
2. 检查 GitHub 远端仓库是否存在以及是否可访问。
3. 配置 GitHub 身份验证。
4. 在本地仓库中增加或修复 GitHub remote。
5. 保留服务器部署 remote，不互相覆盖。
6. 创建 GitHub 单独同步脚本。
7. 创建“同时推送 GitHub 和服务器”的可选脚本。
8. 编写本地文档。
9. 更新 README。
10. 完成首次安全推送验证。
11. 不执行强制覆盖远端历史的操作。

---

# 二、最终 remote 设计

本项目需要长期保留两类 remote：

```text id="6zifrv"
origin  → GitHub 仓库
deploy  → 云服务器裸仓库
```

预期结果：

```text id="a9ckb8"
origin  https://github.com/feiniao87968492/History-Learning.git
deploy  xuedeshi-server:/srv/git/xuedeshi-history-learning.git
```

职责区分：

| Remote   | 用途              | 是否会立即影响线上网站 |
| -------- | --------------- | ----------- |
| `origin` | 同步 GitHub 仓库    | 否           |
| `deploy` | 推送到云服务器 Git 裸仓库 | 是           |

不要把 GitHub remote 替换为 `deploy`。

不要把服务器 remote 替换为 `origin`。

---

# 三、安全规则

必须遵守：

1. 不要把 GitHub 密码写入任何文件。
2. 不要把 GitHub Personal Access Token 写入任何文件。
3. 不要把 token 写入脚本。
4. 不要把 token 写入 README 或部署文档。
5. 不要把 token 写入 `.env` 后提交到 Git。
6. 不要把 token 拼接进 remote URL。
7. 不要使用以下形式：

```text id="44el3r"
https://USERNAME:TOKEN@github.com/...
```

8. 不要执行：

```bash id="0f5nz3"
git push --force
git push -f
```

9. 不要执行：

```bash id="uz5h91"
git reset --hard
```

10. 不要删除本地未提交修改。
11. 不要覆盖 GitHub 已有提交。
12. 如远端和本地历史发生分叉，停止自动推送并汇报。
13. 不要自动将服务器密码、SSH 私钥、GitHub token 或本机敏感文件提交到 GitHub。
14. GitHub 仓库可能是公开仓库，因此推送前必须检查敏感信息。

---

# 四、第一阶段：进入并检查本地仓库

进入本地项目目录：

```bash id="locph2"
cd /path/to/xuedeshi-history-learning
```

根据本机实际路径调整。

确认目录：

```bash id="3lez2u"
pwd
git rev-parse --show-toplevel
```

检查当前分支：

```bash id="d2nydr"
git branch --show-current
```

预期使用：

```text id="hv4u81"
main
```

如果当前仍为 `master`，统一改为 `main`：

```bash id="lyeh6c"
git branch -M main
```

检查状态：

```bash id="kwzbzn"
git status
git status --short
git log --oneline --decorate -10
```

如果存在未提交修改：

1. 不要删除修改。
2. 不要自动 stash 后遗忘。
3. 判断修改是否属于当前项目。
4. 向用户汇报修改文件。
5. 根据用户要求提交，或停止首次 GitHub 推送流程。

---

# 五、第二阶段：检查敏感文件

在同步 GitHub 前进行检查。

## 1. 检查常见敏感文件

```bash id="dm3h77"
find . \
  -path ./.git -prune -o \
  \( \
    -name ".env" -o \
    -name ".env.*" -o \
    -name "*.pem" -o \
    -name "*.key" -o \
    -name "id_rsa" -o \
    -name "id_rsa.pub" -o \
    -name "id_ed25519" -o \
    -name "id_ed25519.pub" -o \
    -name "*credential*" -o \
    -name "*secret*" \
  \) -print
```

## 2. 检查已被 Git 跟踪的敏感文件

```bash id="uec6oy"
git ls-files | grep -Ei \
  '(^|/)(\.env(\..*)?|id_rsa(\.pub)?|id_ed25519(_.*)?(\.pub)?|.*\.pem|.*\.key|.*secret.*|.*credential.*)$' \
  || true
```

## 3. 检查源码中是否存在明显凭据

```bash id="7pjex2"
git grep -nEi \
  '(password|passwd|token|secret|private[_-]?key|access[_-]?key|authorization)[[:space:]]*[:=]' \
  || true
```

注意：

* 搜索结果不一定都是安全问题。
* 需要人工判断。
* 如发现服务器密码、GitHub token、私钥或其他真实凭据，立即停止推送。
* 不要在汇报中完整输出真实凭据。
* 使用打码后的形式说明问题。

例如：

```text id="81zbcm"
发现疑似凭据：docs/example.md 第 18 行，内容已打码为 Zty********
```

---

# 六、第三阶段：更新 .gitignore

确认根目录 `.gitignore` 至少包含：

```gitignore id="vumopj"
# Environment variables
.env
.env.*
!.env.example

# SSH keys and certificates
*.pem
*.key
*.p12
*.pfx
id_rsa
id_rsa.pub
id_ed25519
id_ed25519.pub
id_ed25519_*
id_ed25519_*.pub

# Credentials and local secrets
.credentials
credentials.json
secrets.json
*.secret
*.secrets

# OS files
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/

# Dependencies
node_modules/

# Build outputs
dist/
build/
coverage/

# Logs
*.log

# Temporary files
*.tmp
*.swp
```

说明：

* `.gitignore` 只能阻止尚未被跟踪的文件进入 Git。
* 如果敏感文件已经被 Git 跟踪，必须单独处理。
* 如发现真实凭据已经进入历史提交，不要擅自改写历史；停止操作并汇报用户。

---

# 七、第四阶段：检查本机 GitHub 身份验证能力

本项目使用 HTTPS remote：

```text id="ihutbv"
https://github.com/feiniao87968492/History-Learning.git
```

优先使用 GitHub CLI 管理 HTTPS 身份验证。

## 1. 检查 GitHub CLI

```bash id="kig65m"
gh --version || true
```

## 2. 已安装 GitHub CLI 时

检查登录状态：

```bash id="grvjsw"
gh auth status || true
```

如果尚未登录，执行：

```bash id="h9wm3i"
gh auth login
```

交互式选择：

```text id="37qq6e"
GitHub.com
HTTPS
Login with a web browser
Authenticate Git with your GitHub credentials: Yes
```

如果 GitHub CLI 提供设备验证码：

1. 让用户在浏览器中完成授权。
2. 不要记录验证码。
3. 不要记录 token。
4. 授权完成后继续。

再次检查：

```bash id="1ptumy"
gh auth status
```

## 3. 未安装 GitHub CLI 时

先检查 Git credential helper：

```bash id="sprd4d"
git config --global --get credential.helper || true
git config --system --get credential.helper || true
```

如果本机已配置 Git Credential Manager，可以直接通过首次 `git push` 的系统交互界面完成登录。

如果没有可用凭据管理器：

1. 不要要求用户把 token 发到聊天中。
2. 不要把 token 写入命令。
3. 提示用户选择以下其中一种方式：

   * 安装 GitHub CLI 后使用 `gh auth login`
   * 安装 Git Credential Manager
   * 在首次 HTTPS 推送时，通过终端交互输入 Personal Access Token
4. 如使用 Personal Access Token，token 只允许在安全交互提示中输入。
5. 不要将 token 明文保存到项目文件中。

## 4. 检查 Git 身份信息

```bash id="m0zhp0"
git config --global --get user.name || true
git config --global --get user.email || true
```

如果本机尚未配置，向用户询问希望显示在 GitHub commit 中的名称和邮箱。

设置示例：

```bash id="sx6895"
git config --global user.name "<用户确认的名称>"
git config --global user.email "<用户确认的邮箱>"
```

不要擅自替用户选择公开邮箱。

---

# 八、第五阶段：检查现有 remote

执行：

```bash id="a8fnu5"
git remote -v
```

目标是保留：

```text id="7vnmt4"
deploy
```

并增加：

```text id="ef6q48"
origin
```

## 情况 A：不存在 origin

执行：

```bash id="gf2ek8"
git remote add origin \
  https://github.com/feiniao87968492/History-Learning.git
```

## 情况 B：origin 已指向正确地址

不做修改。

检查：

```bash id="f0pynq"
git remote get-url origin
```

正确结果：

```text id="s3a0rw"
https://github.com/feiniao87968492/History-Learning.git
```

## 情况 C：origin 已存在但指向其他地址

不要直接覆盖。

先汇报：

```text id="uk6fdn"
当前 origin 已指向其他远端地址。为避免破坏原有仓库配置，已暂停修改。
```

然后根据用户要求选择：

```bash id="33bm24"
git remote rename origin previous-origin
git remote add origin \
  https://github.com/feiniao87968492/History-Learning.git
```

或者保留原 origin，新增：

```bash id="3uatfn"
git remote add github \
  https://github.com/feiniao87968492/History-Learning.git
```

默认优先让 GitHub 仓库使用：

```text id="rh6yjw"
origin
```

## 情况 D：deploy 不存在

如果上一阶段服务器部署尚未执行，允许仅完成 GitHub 配置。

如果服务器已经部署但缺少 remote，则添加：

```bash id="kdyd0a"
git remote add deploy \
  xuedeshi-server:/srv/git/xuedeshi-history-learning.git
```

---

# 九、第六阶段：检查 GitHub 远端状态

## 1. 测试访问权限

执行：

```bash id="9s3jcz"
git ls-remote origin
```

可能出现：

### 情况 A：可以访问，且无输出

说明仓库可能为空，可以准备首次推送。

### 情况 B：可以访问，且存在 refs

说明 GitHub 仓库已有提交或分支。

继续执行：

```bash id="d38z25"
git ls-remote --heads origin
```

### 情况 C：身份验证失败

不要继续推送。

依次检查：

```bash id="raz90u"
gh auth status || true
git remote get-url origin
```

修复身份验证后重试。

### 情况 D：仓库不存在或无权限

不要反复尝试推送。

向用户汇报：

```text id="xtz1p1"
GitHub 仓库不存在、地址有误，或当前 GitHub 账户没有写入权限。
```

---

# 十、第七阶段：安全处理 GitHub 已有提交

## 1. 远端为空时

可以执行首次推送：

```bash id="d1z4g9"
git push -u origin main
```

## 2. 远端已有 main 分支时

先抓取：

```bash id="zgnfrn"
git fetch origin main
```

检查本地是否包含远端历史：

```bash id="9953hs"
git merge-base --is-ancestor origin/main main
```

如果命令返回成功，说明远端历史包含在本地历史中，可以正常推送：

```bash id="1ssrk1"
git push -u origin main
```

如果命令返回失败：

1. 不要 force push。
2. 不要 reset。
3. 不要擅自 rebase。
4. 不要擅自 merge。
5. 停止自动推送。
6. 汇报本地与远端历史发生分叉。
7. 展示以下结果：

```bash id="kcd3cm"
git log --oneline --graph --decorate --all -20
```

等待用户选择合并策略。

## 3. 远端只有 README 初始提交时

也视为已有历史。

不要覆盖。

先汇报，然后根据用户要求选择：

```bash id="m7zoai"
git pull --rebase origin main
```

或执行普通 merge。

不要自动决定。

---

# 十一、第八阶段：创建 GitHub 单独同步脚本

创建目录：

```bash id="w9lqtg"
mkdir -p scripts
```

创建：

```text id="zhtl6e"
scripts/push-github.sh
```

内容如下：

```bash id="gimc1n"
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

设置执行权限：

```bash id="a3vjft"
chmod +x scripts/push-github.sh
```

---

# 十二、第九阶段：创建同时发布 GitHub 和服务器的脚本

创建：

```text id="pu2s6s"
scripts/publish-all.sh
```

内容如下：

```bash id="hw9ezr"
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

设置执行权限：

```bash id="kz7274"
chmod +x scripts/publish-all.sh
```

说明：

* `publish-all.sh` 先同步 GitHub，再部署服务器。
* 如果 GitHub 推送失败，不继续更新服务器。
* 日常临时上线测试仍然只用：

```bash id="k6rb7h"
./scripts/deploy.sh
```

* 准备把稳定版本同步 GitHub 并同时上线时，使用：

```bash id="oafck2"
./scripts/publish-all.sh
```

---

# 十三、第十阶段：为 Windows PowerShell 创建可选脚本

如果用户主要使用 Windows PowerShell，而不是 Git Bash，则额外创建：

```text id="mr4vbk"
scripts/push-github.ps1
```

内容如下：

```powershell id="v0n0cw"
$ErrorActionPreference = "Stop"

$RemoteName = "origin"
$TargetBranch = "main"
$ExpectedRemoteUrl = "https://github.com/feiniao87968492/History-Learning.git"

$currentBranch = git branch --show-current

if ($currentBranch -ne $TargetBranch) {
    Write-Error "GitHub sync must run from branch '$TargetBranch'. Current branch: '$currentBranch'"
}

$status = git status --porcelain

if ($status) {
    Write-Host "Uncommitted changes detected:"
    git status --short
    Write-Error "Commit or stash your changes before syncing GitHub."
}

$actualRemoteUrl = git remote get-url $RemoteName

if ($actualRemoteUrl -ne $ExpectedRemoteUrl) {
    Write-Error "Remote '$RemoteName' does not match expected URL. Expected: $ExpectedRemoteUrl Actual: $actualRemoteUrl"
}

Write-Host "[github] Fetching remote state..."
git fetch $RemoteName $TargetBranch 2>$null

$remoteRefExists = git show-ref --verify --quiet "refs/remotes/$RemoteName/$TargetBranch"
$remoteRefExitCode = $LASTEXITCODE

if ($remoteRefExitCode -eq 0) {
    git merge-base --is-ancestor "$RemoteName/$TargetBranch" $TargetBranch

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Remote history has diverged. Resolve manually. Force push is disabled."
    }
}

Write-Host "[github] Pushing '$TargetBranch' to '$RemoteName'..."
git push $RemoteName $TargetBranch

Write-Host "[github] Sync completed successfully."
Write-Host "[github] Repository: https://github.com/feiniao87968492/History-Learning"
```

如果用户仅使用 Git Bash，可以不创建 PowerShell 脚本。

---

# 十四、第十一阶段：创建 GitHub 同步文档

创建：

```text id="9qlkd5"
docs/github-sync.md
```

内容如下：

````markdown id="lntyfk"
# GitHub 同步说明

## 一、GitHub 仓库

```text
https://github.com/feiniao87968492/History-Learning
````

本地 Git remote：

```text id="4dy0jf"
origin
```

完整 remote 地址：

```text id="cvn6jn"
https://github.com/feiniao87968492/History-Learning.git
```

## 二、与服务器部署的区别

项目存在两个独立 remote：

```text id="sh4x1q"
origin  → GitHub
deploy  → 云服务器
```

只同步 GitHub：

```bash id="w8sba0"
git push origin main
```

只发布服务器网站：

```bash id="nv257c"
git push deploy main
```

## 三、推荐脚本

只同步 GitHub：

```bash id="sshljg"
./scripts/push-github.sh
```

只更新服务器网站：

```bash id="z9lmxq"
./scripts/deploy.sh
```

同步 GitHub 并更新网站：

```bash id="iz86yi"
./scripts/publish-all.sh
```

## 四、日常使用场景

### 场景 1：快速更新线上测试版本

```bash id="2e5mv8"
git add .
git commit -m "feat: describe changes"
./scripts/deploy.sh
```

该操作只更新服务器，不同步 GitHub。

### 场景 2：将稳定版本同步至 GitHub

```bash id="mkhpii"
git add .
git commit -m "feat: describe changes"
./scripts/push-github.sh
```

该操作只同步 GitHub，不更新网站。

### 场景 3：稳定版本同时同步 GitHub 并上线

```bash id="8m5n1d"
git add .
git commit -m "feat: describe changes"
./scripts/publish-all.sh
```

## 五、身份验证

GitHub remote 使用 HTTPS。

优先通过 GitHub CLI 登录：

```bash id="8w82gw"
gh auth login
```

选择：

```text id="qv45vf"
GitHub.com
HTTPS
Login with a web browser
Authenticate Git with your GitHub credentials: Yes
```

也可以使用系统 Git Credential Manager。

不要把 GitHub 密码或 token 写入：

* 仓库文件
* Shell 脚本
* README
* `.env`
* Git remote URL
* 聊天记录

## 六、检查 remote

```bash id="zeov4b"
git remote -v
```

预期结果：

```text id="scy0wi"
origin  https://github.com/feiniao87968492/History-Learning.git
deploy  xuedeshi-server:/srv/git/xuedeshi-history-learning.git
```

## 七、检查 GitHub 登录

```bash id="3ldnlv"
gh auth status
```

## 八、常见问题

### 1. GitHub 要求输入密码

GitHub HTTPS Git 操作不要使用账户密码。

优先执行：

```bash id="u9lw2y"
gh auth login
```

或者使用 Git Credential Manager。

### 2. 远端历史冲突

如果脚本提示：

```text id="qxcc63"
Remote history has diverged
```

不要 force push。

执行：

```bash id="rutbmb"
git fetch origin main
git log --oneline --graph --decorate --all -20
```

检查差异后，再决定 merge 或 rebase。

### 3. GitHub 推送成功，但网站没有变化

这是正常现象。

```bash id="0a1453"
./scripts/push-github.sh
```

只同步 GitHub。

要更新服务器网站，需要执行：

```bash id="khmxc7"
./scripts/deploy.sh
```

或：

```bash id="xcen52"
./scripts/publish-all.sh
```

### 4. 网站已更新，但 GitHub 没有变化

这也是正常现象。

服务器部署和 GitHub 同步是两个独立流程。

执行：

```bash id="v3bd09"
./scripts/push-github.sh
```

即可同步 GitHub。

## 九、安全说明

禁止：

```bash id="j0qy1k"
git push --force
```

不要把 token 写入 remote URL。

不要将服务器密码、SSH 私钥、GitHub token 或其他敏感内容提交到 GitHub。

````id="4b0gw4"

---

# 十五、第十二阶段：更新 README

在根目录 `README.md` 中追加：

```markdown id="88fkjy"
## GitHub 仓库

GitHub 地址：

```text
https://github.com/feiniao87968492/History-Learning
````

## 发布与同步

项目具有两个独立流程。

只更新服务器网站：

```bash id="v8sdnc"
./scripts/deploy.sh
```

只同步 GitHub：

```bash id="wbofcc"
./scripts/push-github.sh
```

同步 GitHub 并更新服务器网站：

```bash id="6o30sd"
./scripts/publish-all.sh
```

完整说明：

```text id="4lps26"
docs/deployment.md
docs/github-sync.md
```

````id="x2yqmd"

---

# 十六、第十三阶段：提交新增文件

检查变更：

```bash id="dqv7nv"
git status --short
````

提交：

```bash id="k3xnk7"
git add \
  .gitignore \
  README.md \
  docs/github-sync.md \
  scripts/push-github.sh \
  scripts/publish-all.sh
```

如果创建了 PowerShell 脚本，再加入：

```bash id="1txgsu"
git add scripts/push-github.ps1
```

提交：

```bash id="k2d4h4"
git commit -m "docs: add GitHub synchronization workflow"
```

---

# 十七、第十四阶段：首次推送 GitHub

## 1. 最终检查

```bash id="qgdumw"
git status
git remote -v
git branch --show-current
git log --oneline --decorate -10
```

确认：

* 当前分支为 `main`
* 工作区无未提交修改
* `origin` 指向正确 GitHub 地址
* `deploy` 没有被覆盖
* 没有敏感内容进入提交

## 2. 推送

执行：

```bash id="xzwz3b"
./scripts/push-github.sh
```

如果 GitHub 仓库为空，脚本应完成首次推送。

如果脚本由于远端尚无 `main` 分支而出现异常，可手动执行：

```bash id="9gryvh"
git push -u origin main
```

后续继续使用：

```bash id="o03c6n"
./scripts/push-github.sh
```

---

# 十八、第十五阶段：可选的完整发布验证

如果服务器部署流程已经完成，则执行：

```bash id="5gn1bg"
./scripts/publish-all.sh
```

检查：

1. GitHub 同步成功。
2. 服务器部署成功。
3. 网站可以访问。

检查网站：

```bash id="figh0a"
curl -I http://118.178.140.171:9090
```

预期：

```text id="rg0nlt"
HTTP/1.1 200 OK
```

---

# 十九、最终验收清单

完成后向用户汇报：

1. 本地仓库绝对路径。
2. 当前分支名称。
3. `origin` remote 地址。
4. `deploy` remote 地址。
5. GitHub 登录是否成功。
6. 使用了哪种身份验证方式：

   * GitHub CLI
   * Git Credential Manager
   * Personal Access Token 交互输入
7. GitHub 仓库此前是否为空。
8. GitHub 首次推送是否成功。
9. 是否发现远端历史冲突。
10. 是否检查过敏感文件。
11. 是否发现凭据泄露风险。
12. 新增脚本列表。
13. 新增文档列表。
14. 最新 commit hash。
15. `./scripts/push-github.sh` 是否验证成功。
16. `./scripts/deploy.sh` 是否仍然可用。
17. `./scripts/publish-all.sh` 是否验证成功。
18. 是否存在阻断性问题。

---

# 二十、严格禁止事项

禁止：

* 把 GitHub token 写入仓库。
* 把 GitHub token 写进 remote URL。
* 把服务器密码写入仓库。
* 把 SSH 私钥提交到 GitHub。
* 使用 `git push --force`。
* 擅自覆盖 GitHub 远端历史。
* 擅自删除本地提交。
* 擅自清空 GitHub 仓库。
* 擅自删除服务器 remote。
* 将每次服务器部署自动绑定 GitHub 推送。
* 未检查敏感文件就推送公开仓库。
* 将 GitHub 身份验证凭据通过聊天明文回传。

本次最终目标：

```text id="9wnbbg"
本地完成修改
→ git commit
→ 根据实际需要选择：

./scripts/deploy.sh
    只更新服务器网站

./scripts/push-github.sh
    只同步 GitHub

./scripts/publish-all.sh
    同步 GitHub，并更新服务器网站
```
