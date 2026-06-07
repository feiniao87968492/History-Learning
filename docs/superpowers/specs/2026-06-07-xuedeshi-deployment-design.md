# 学的是史部署到云服务器设计

## 1. 背景与目标

本地项目 `学的是史` 已完成第二阶段重构，从一个单文件 HTML 原型拆分为 HTML、CSS、JavaScript 和 JSON 静态数据的可维护项目。当前代码在 `D:\Users\zty\微型项目\History-Learning`，分支为 `refactor/split-static-prototype`。

本次目标是将项目部署到已有云服务器 `118.178.140.171:9090`，并建立一条 `git push deploy main` 即可自动上线的完整流程。部署后用户可以通过 `http://118.178.140.171:9090` 访问网站。

## 2. 现状

### 2.1 本机

- OS：Windows 11
- Git 仓库：`D:\Users\zty\微型项目\History-Learning`
- 当前分支：`refactor/split-static-prototype`（将重命名为 `main`）
- SSH 密钥：`~/.ssh/id_ed25519` 已存在，公钥为 `~/.ssh/id_ed25519.pub`
- SSH 配置：`~/.ssh/config` 已有 Host `arteta` 指向 `118.178.140.171`，用户 `root`，已免密

### 2.2 服务器

- OS：Ubuntu 20.04.6 LTS
- Git：2.25.1 已安装
- Nginx：未安装
- 目录 `/srv/git/`、`/var/www/`：不存在
- 端口 9090：空闲
- SSH：已配置公钥，`root` 用户可免密登录
- 防火墙：UFW 未启用，无 firewalld

## 3. 部署架构

```
本机 (Windows)
  │
  ├─ git push deploy main ──→ 服务器 Git 裸仓库
  │                              │
  │                         post-receive hook
  │                              │
  │                              ▼
  │                         /var/www/xuedeshi-history-learning/
  │                              │
  │                              ▼
  浏览器 ←── http://118.178.140.171:9090 ── Nginx (port 9090)
```

流程简述：

1. 开发者在本机 `main` 分支完成代码修改并提交
2. 执行 `./scripts/deploy.sh`（或手动 `git push deploy main`）
3. 代码推送到服务器上的 Git 裸仓库 `/srv/git/xuedeshi-history-learning.git`
4. 裸仓库的 `post-receive` hook 检测到 `main` 分支更新，自动将代码 checkout 到 `/var/www/xuedeshi-history-learning/`
5. Nginx 将 `/var/www/xuedeshi-history-learning/` 作为静态站点，通过 9090 端口对外提供服务

## 4. 组件设计

### 4.1 SSH 别名

在 `~/.ssh/config` 中保留现有 Host `arteta`，追加新 Host `xuedeshi-server`：

```text
Host xuedeshi-server
    HostName 118.178.140.171
    User root
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

两个别名均可免密登录同一台服务器。部署脚本和文档统一使用 `xuedeshi-server`。

### 4.2 服务器目录

| 路径 | 用途 | 权限 |
|------|------|------|
| `/srv/git/xuedeshi-history-learning.git/` | Git 裸仓库 | root 创建 |
| `/var/www/xuedeshi-history-learning/` | Nginx 网站根目录 | root 创建，post-receive hook 写入 |

部署用户为 `root`，目录自然归属 `root`，不需要额外 `chown`。不使用 `chmod 777`。

### 4.3 Nginx

安装方式：`apt-get install nginx`（Ubuntu 20.04）。

站点配置放在 `/etc/nginx/sites-available/xuedeshi-history-learning`，并通过软链接启用：

```bash
ln -sfn /etc/nginx/sites-available/xuedeshi-history-learning \
        /etc/nginx/sites-enabled/xuedeshi-history-learning
```

Nginx 配置内容：

```nginx
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
```

设计决策：
- `try_files $uri $uri/ /index.html` 确保 SPA 风格的路径回退对静态原型友好
- 静态资源 `expires 7d` 做浏览器缓存
- 独立日志文件，与服务器上其他站点隔离
- `server_name _` 匹配所有主机名，不依赖域名

### 4.4 Git 裸仓库与 post-receive Hook

裸仓库创建：

```bash
git init --bare /srv/git/xuedeshi-history-learning.git
```

Hook 文件 `/srv/git/xuedeshi-history-learning.git/hooks/post-receive`：

```bash
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
```

权限：`chmod +x`。

### 4.5 本地 Git Remote

```bash
git remote add deploy xuedeshi-server:/srv/git/xuedeshi-history-learning.git
```

使用 `xuedeshi-server` 别名作为 remote URL 的主机名，与部署脚本和文档保持一致。

### 4.6 部署脚本

`scripts/deploy.sh`：

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

### 4.7 .gitignore 补充

在现有基础上追加：

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

## 5. 错误处理设计

| 失败点 | 检测方式 | 处理策略 |
|--------|---------|---------|
| SSH 免密不生效 | `ssh xuedeshi-server 'echo OK'` 仍要求密码 | 不继续后续步骤；检查 config 和 authorized_keys |
| Nginx 安装失败 | `apt-get install nginx` 非零退出 | 检查 apt 源、网络；不强行继续 |
| post-receive hook 未触发 | `git push deploy main` 输出中无 `[deploy]` 字样 | 检查 hook 路径、执行权限、分支名 |
| 端口 9090 冲突 | `ss -lntp \| grep :9090` 有已有进程 | 不强行停止；汇报冲突等待决策 |
| JSON 404 | 浏览器 Console 显示 JSON 加载失败 | 检查 Nginx try_files 和文件是否存在 |
| 首次 curl 验证非 200 | `curl -I` 返回 4xx/5xx | 检查 Nginx 错误日志 |

### 回退原则

- 所有服务器配置文件修改前先创建备份（`cp file file.bak.$(date +%s)`）
- Nginx 配置每次修改后必须 `nginx -t` 通过才 reload
- 不自动执行 `git reset --hard`、`git clean -fd`、`rm -rf`

## 6. 验收设计

### CP1 — SSH 别名配置完成

- `ssh xuedeshi-server 'echo OK'` 不再要求密码
- `ssh xuedeshi-server whoami` 输出 `root`

### CP2 — Nginx + Git 裸仓库就绪

- `ssh xuedeshi-server 'nginx -v'` 输出版本
- `/srv/git/xuedeshi-history-learning.git/` 存在
- `post-receive` hook 存在且可执行
- `curl -I http://118.178.140.171:9090` 有 HTTP 响应（首次推送前可能是 403/404）

### CP3 — 首次上线成功

- `./scripts/deploy.sh` 执行成功
- `curl -I http://118.178.140.171:9090` 返回 `HTTP/1.1 200 OK`
- 浏览器访问 `http://118.178.140.171:9090`：
  - 登录页正常
  - CSS 正常加载
  - JS 正常加载
  - JSON 数据正常加载
  - Console 无阻断性报错

## 7. 不纳入本次范围

- 域名绑定与 HTTPS/SSL 证书
- 关闭 SSH 密码登录等安全加固
- CI/CD 流水线（GitHub Actions 等）
- 容器化部署（Docker）
- 多环境部署（staging / production）
- 监控与告警
