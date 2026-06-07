# 学的是史部署到云服务器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `学的是史` 静态项目部署到 `118.178.140.171:9090`，建立 `git push deploy main` 自动上线流程。

**Architecture:** 本地 `git push deploy main` → 服务器 Git 裸仓库 `post-receive` hook → checkout 到 `/var/www/xuedeshi-history-learning/` → Nginx 在 9090 端口静态 serve。

**Tech Stack:** Git bare repo, Nginx, bash post-receive hook, SSH key auth, curl verification

---

## File Structure Map

### Local files to modify

- Modify: `.gitignore` — 追加 SSH 密钥、编辑器、依赖目录等排除规则
- Modify: `README.md` — 追加部署章节
- Modify: `~/.ssh/config` — 追加 `xuedeshi-server` Host（保留现有 `arteta`）

### Local files to create

- Create: `scripts/deploy.sh` — 一键部署脚本
- Create: `docs/deployment.md` — 部署文档

### Server files to create/modify

- Create: `/etc/nginx/sites-available/xuedeshi-history-learning` — Nginx 站点配置
- Create: `/etc/nginx/sites-enabled/xuedeshi-history-learning` → 软链接到 sites-available
- Create: `/srv/git/xuedeshi-history-learning.git/hooks/post-receive` — 自动部署 hook

---

### Task 1: 重命名分支为 `main`

**Files:**
- Modify: Git branch name

- [ ] **Step 1: 确认当前分支**

Run:

```powershell
git branch --show-current
```

Expected: `refactor/split-static-prototype`

- [ ] **Step 2: 重命名为 main**

Run:

```powershell
git branch -M main
```

Expected: 无输出，分支已改名。

- [ ] **Step 3: 验证**

Run:

```powershell
git branch --show-current
```

Expected: `main`

- [ ] **Step 4: 提交（如果工作区有未追踪文件）**

Run:

```powershell
git status --short
```

If `skills/upload-to-server.md` is still untracked (it is the briefing for this task):

```powershell
git add skills/upload-to-server.md
git commit -m "chore: add upload-to-server deployment briefing"
```

Expected: 工作区干净或仅有已提交文件。

---

### Task 2: 配置 SSH 别名

**Files:**
- Modify: `~/.ssh/config`

- [ ] **Step 1: 确认现有 SSH config 未重复**

Run:

```powershell
Get-Content "$env:USERPROFILE\.ssh\config"
```

Expected: 已有 Host `arteta`，无 Host `xuedeshi-server`。

- [ ] **Step 2: 追加新 Host**

Append to `~/.ssh/config`:

```text
Host xuedeshi-server
    HostName 118.178.140.171
    User root
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

- [ ] **Step 3: CP1 验收 — 免密登录测试**

Run:

```bash
ssh xuedeshi-server 'echo OK && whoami && hostname'
```

Expected:

```
OK
root
iZbp184e2ps5ktrc5bet30Z
```

不再要求输入密码。如果仍要求密码，不继续后续步骤，检查 `authorized_keys` 和 config。

---

### Task 3: 服务器初始化 — 安装 Nginx 并创建目录

**Files:**
- Create: `/srv/git/xuedeshi-history-learning.git/`
- Create: `/var/www/xuedeshi-history-learning/`
- Install: Nginx via apt-get

- [ ] **Step 1: 安装 Nginx**

Run on server:

```bash
ssh xuedeshi-server "apt-get update && apt-get install -y nginx"
```

Expected: Nginx 安装成功，版本号 ≥ 1.18。

- [ ] **Step 2: 验证 Nginx 已安装**

Run:

```bash
ssh xuedeshi-server "nginx -v"
```

Expected: 输出 `nginx version: nginx/1.18.0 ...`。

- [ ] **Step 3: 检查端口 9090 无占用**

Run:

```bash
ssh xuedeshi-server "ss -lntp | grep ':9090' || echo 'PORT 9090 FREE'"
```

Expected: `PORT 9090 FREE`

- [ ] **Step 4: 创建服务器目录**

Run:

```bash
ssh xuedeshi-server "mkdir -p /srv/git && mkdir -p /var/www/xuedeshi-history-learning"
```

- [ ] **Step 5: 验证目录已创建**

Run:

```bash
ssh xuedeshi-server "test -d /srv/git && echo 'srv/git OK' && test -d /var/www/xuedeshi-history-learning && echo 'var/www/... OK'"
```

Expected:

```
srv/git OK
var/www/... OK
```

---

### Task 4: 创建 Git 裸仓库和 post-receive Hook

**Files:**
- Create: `/srv/git/xuedeshi-history-learning.git/`（裸仓库）
- Create: `/srv/git/xuedeshi-history-learning.git/hooks/post-receive`

- [ ] **Step 1: 创建裸仓库**

Run:

```bash
ssh xuedeshi-server "git init --bare /srv/git/xuedeshi-history-learning.git"
```

Expected: `Initialized empty Git repository in /srv/git/xuedeshi-history-learning.git/`

- [ ] **Step 2: 写入 post-receive hook**

Run (create the hook via SSH here-doc):

```bash
ssh xuedeshi-server 'cat > /srv/git/xuedeshi-history-learning.git/hooks/post-receive << '\''SCRIPT'\''
#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/srv/git/xuedeshi-history-learning.git"
WEB_ROOT="/var/www/xuedeshi-history-learning"
DEPLOY_BRANCH="main"

while read -r oldrev newrev refname
do
    branch="$(git rev-parse --symbolic --abbrev-ref "$refname")"

    if [ "$branch" = "$DEPLOY_BRANCH" ]; then
        echo "[deploy] Deploying branch: $branch"
        mkdir -p "$WEB_ROOT"
        git --work-tree="$WEB_ROOT" --git-dir="$REPO_DIR" checkout -f "$DEPLOY_BRANCH"
        echo "[deploy] Deployment completed: $(date -Iseconds)"
    else
        echo "[deploy] Ignored branch: $branch"
    fi
done
SCRIPT'
```

- [ ] **Step 3: 设置 hook 可执行权限**

Run:

```bash
ssh xuedeshi-server "chmod +x /srv/git/xuedeshi-history-learning.git/hooks/post-receive"
```

- [ ] **Step 4: 验证 hook 存在且可执行**

Run:

```bash
ssh xuedeshi-server "test -x /srv/git/xuedeshi-history-learning.git/hooks/post-receive && echo 'HOOK OK'"
```

Expected: `HOOK OK`

---

### Task 5: 配置 Nginx 站点

**Files:**
- Create: `/etc/nginx/sites-available/xuedeshi-history-learning`
- Create: `/etc/nginx/sites-enabled/xuedeshi-history-learning`（软链接）
- Modify: Nginx 默认配置（仅迁出默认站点软链接，不修改）

- [ ] **Step 1: 备份默认配置（仅查看）**

Run:

```bash
ssh xuedeshi-server "ls /etc/nginx/sites-enabled/"
```

If `default` exists, do NOT remove it. Just note it for safety.

- [ ] **Step 2: 写入站点配置文件**

Run:

```bash
ssh xuedeshi-server 'cat > /etc/nginx/sites-available/xuedeshi-history-learning << '\''NGINX'\''
server {
    listen 9090;
    listen [::]:9090;
    server_name _;

    root /var/www/xuedeshi-history-learning;
    index index.html;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|json|png|jpg|jpeg|gif|svg|ico|webp|mp3|wav|ogg)$ {
        try_files $uri =404;
        expires 7d;
        add_header Cache-Control "public";
    }

    access_log /var/log/nginx/xuedeshi-history-learning.access.log;
    error_log /var/log/nginx/xuedeshi-history-learning.error.log;
}
NGINX'
```

- [ ] **Step 3: 创建软链接启用站点**

Run:

```bash
ssh xuedeshi-server "ln -sfn /etc/nginx/sites-available/xuedeshi-history-learning /etc/nginx/sites-enabled/xuedeshi-history-learning"
```

- [ ] **Step 4: 校验并重载 Nginx**

Run:

```bash
ssh xuedeshi-server "nginx -t && systemctl enable nginx && systemctl restart nginx"
```

Expected: `syntax is ok` + `test is successful`，然后 Nginx 启动。

- [ ] **Step 5: 确认 9090 端口已监听**

Run:

```bash
ssh xuedeshi-server "ss -lntp | grep ':9090'"
```

Expected: 一行输出显示 `nginx` 在 `:9090` 上 LISTEN。

- [ ] **Step 6: CP2 验收 — HTTP 可达**

Run:

```powershell
curl --head http://118.178.140.171:9090
```

Expected: 有 HTTP 响应头（此时网站目录为空，可能是 403 或 404，但必须能看到 Nginx 响应而非连接拒绝）。

---

### Task 6: 配置本地 Git Remote

**Files:**
- Modify: Git remote `deploy`

- [ ] **Step 1: 检查现有 remote**

Run:

```powershell
git remote -v
```

Expected: 无名为 `deploy` 的 remote（或不存在）。

- [ ] **Step 2: 添加 deploy remote**

Run:

```powershell
git remote add deploy xuedeshi-server:/srv/git/xuedeshi-history-learning.git
```

- [ ] **Step 3: 验证 remote**

Run:

```powershell
git remote -v
```

Expected:

```text
deploy  xuedeshi-server:/srv/git/xuedeshi-history-learning.git (fetch)
deploy  xuedeshi-server:/srv/git/xuedeshi-history-learning.git (push)
```

---

### Task 7: 创建部署脚本和文档

**Files:**
- Create: `scripts/deploy.sh`
- Modify: `.gitignore`
- Modify: `README.md`
- Create: `docs/deployment.md`

- [ ] **Step 1: 创建 scripts 目录**

Run:

```powershell
New-Item -ItemType Directory -Force "scripts" | Out-Null
```

- [ ] **Step 2: 写入 deploy.sh**

Write `scripts/deploy.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

REMOTE_NAME="deploy"
DEPLOY_BRANCH="main"

current_branch="$(git branch --show-current)"

if [ "$current_branch" != "$DEPLOY_BRANCH" ]; then
    echo "Error: deploy must run from branch '$DEPLOY_BRANCH'."
    echo "Current branch: '$current_branch'"
    exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Error: working tree contains uncommitted changes."
    exit 1
fi

echo "[deploy] Checking SSH connection..."
ssh xuedeshi-server "echo '[deploy] SSH connection OK'"

echo "[deploy] Pushing '$DEPLOY_BRANCH' to '$REMOTE_NAME'..."
git push "$REMOTE_NAME" "$DEPLOY_BRANCH"

echo "[deploy] Verifying website..."
curl --fail --silent --show-error --head \
  "http://118.178.140.171:9090" >/dev/null

echo "[deploy] Success: http://118.178.140.171:9090"
```

- [ ] **Step 3: 设置 deploy.sh 可执行权限**

Run:

```powershell
# On Windows, git tracks the +x bit via git update-index
git update-index --chmod=+x scripts/deploy.sh
```

- [ ] **Step 4: 更新 .gitignore**

Append to `.gitignore`:

```gitignore
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

- [ ] **Step 5: 在 README.md 末尾追加部署章节**

Append:

```markdown
## 部署

线上地址：

```text
http://118.178.140.171:9090
```

日常发布：

```bash
git add .
git commit -m "feat: describe your changes"
./scripts/deploy.sh
```

完整部署说明：

```text
docs/deployment.md
```
```

- [ ] **Step 6: 创建部署文档**

Write `docs/deployment.md`:

```markdown
# "学的是史"部署说明

## 一、线上地址

http://118.178.140.171:9090

## 二、服务器连接

本机已配置 SSH 别名：

```bash
ssh xuedeshi-server
```

SSH 密钥配置保存在本机 `~/.ssh/config`。

## 三、服务器目录

| 路径 | 用途 |
|------|------|
| `/srv/git/xuedeshi-history-learning.git/` | Git 裸仓库 |
| `/var/www/xuedeshi-history-learning/` | Nginx 网站根目录 |

Nginx 对外端口：`9090`

## 四、自动部署原理

本地仓库已配置 Git remote `deploy`：

```bash
git push deploy main
```

服务器 Git 裸仓库接收到 `main` 分支后，`post-receive` hook 自动将最新代码 checkout 到 `/var/www/xuedeshi-history-learning/`，Nginx 直接 serve。

## 五、日常发布流程

```bash
git add .
git commit -m "feat: describe your changes"
./scripts/deploy.sh
```

脚本会：

1. 检查当前是否位于 `main` 分支
2. 检查是否存在未提交的代码
3. 测试 SSH 连接
4. 推送到服务器
5. 检查网站是否可以访问

## 六、常用检查命令

- 检查线上页面: `curl -I http://118.178.140.171:9090`
- 登录服务器: `ssh xuedeshi-server`
- 检查 Nginx: `sudo nginx -t && sudo systemctl status nginx`
- 查看端口: `ss -lntp | grep ':9090'`
- 查看网站文件: `ls -la /var/www/xuedeshi-history-learning`
- 查看 Nginx 日志: `sudo tail -n 100 /var/log/nginx/xuedeshi-history-learning.error.log`

## 七、故障排查

### 网站无法访问

依次检查：

```bash
ssh xuedeshi-server
ss -lntp | grep ':9090'
sudo nginx -t
sudo systemctl status nginx
ls -la /var/www/xuedeshi-history-learning
```

### 推送成功但页面未更新

```bash
ssh xuedeshi-server
ls -la /var/www/xuedeshi-history-learning
cat /srv/git/xuedeshi-history-learning.git/hooks/post-receive
chmod +x /srv/git/xuedeshi-history-learning.git/hooks/post-receive
```

### JSON 文件无法加载

确认通过 `http://118.178.140.171:9090` 访问，不要使用本地 `file://` 协议。

## 八、安全建议

- 不要把服务器密码写入仓库
- 不要把 SSH 私钥提交到仓库
- 定期检查 `cat ~/.ssh/authorized_keys`
```

- [ ] **Step 7: 提交脚本与文档**

Run:

```powershell
git add scripts/deploy.sh .gitignore README.md docs/deployment.md
git commit -m "docs: add server deployment workflow"
```

---

### Task 8: 首次上线并验收（CP3）

- [ ] **Step 1: 确认工作区干净且分支正确**

Run:

```powershell
git status --short; git branch --show-current
```

Expected: 输出为空（干净），分支 `main`。

- [ ] **Step 2: 推送代码到服务器**

Run:

```bash
git push deploy main
```

Expected: 看到 hook 输出 `[deploy] Deploying branch: main` 和 `[deploy] Deployment completed: ...`。

- [ ] **Step 3: 验证线上 200**

Run:

```powershell
curl --head http://118.178.140.171:9090
```

Expected: `HTTP/1.1 200 OK`

- [ ] **Step 4: 验证 HTML 内容可拉取**

Run:

```bash
curl --silent http://118.178.140.171:9090 | head -20
```

Expected: 能看到 `<!DOCTYPE html>` 和 `<title>学的是史</title>`。

- [ ] **Step 5: 验证 CSS 和 JS 文件可单独加载**

Run:

```powershell
curl --head http://118.178.140.171:9090/src/css/base.css
curl --head http://118.178.140.171:9090/src/js/app.js
curl --head http://118.178.140.171:9090/src/data/nouns.json
```

Expected: 每个都返回 `HTTP/1.1 200 OK`。

- [ ] **Step 6: 执行一键部署脚本测试**

Run:

```bash
./scripts/deploy.sh
```

Expected: 完整输出以 `[deploy] Success: http://118.178.140.171:9090` 结尾。

- [ ] **Step 7: 浏览器验收**

浏览器访问 `http://118.178.140.171:9090`，确认：

- 登录页正常显示
- F12 Network 面板无 404
- CSS 正常加载
- JS 正常加载
- JSON 数据正常加载
- Console 无阻断性错误
- 登录、名词、时间轴等核心功能可交互

- [ ] **Step 8: 最终部署验证提交**

If 首次上线时产生了额外的微调 commit：

```powershell
git add .
git commit -m "chore: verify deployment"
./scripts/deploy.sh
```

---

## Self-Review Checklist

### Spec coverage

- SSH 别名配置 ✓ Task 2
- Nginx 安装与站点配置 ✓ Tasks 3 + 5
- Git 裸仓库与 post-receive hook ✓ Task 4
- 服务器目录创建 ✓ Task 3
- 本地 Git remote ✓ Task 6
- 部署脚本 ✓ Task 7
- 部署文档 ✓ Task 7
- .gitignore 更新 ✓ Task 7
- README 更新 ✓ Task 7
- CP1 验收 ✓ Task 2 Step 3
- CP2 验收 ✓ Task 5 Step 6
- CP3 验收 ✓ Task 8

### Placeholder scan

No TBD, TODO, or incomplete sections found. All commands are exact, all file contents are complete.

### Type consistency

All tasks reference `xuedeshi-server` as SSH alias, `main` as deploy branch, `deploy` as remote name — consistent throughout.
