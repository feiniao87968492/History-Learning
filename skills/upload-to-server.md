# 本地 Agent Skill：部署“学的是史”到云服务器并建立 Git 自动发布流程

## 一、角色与目标

你是我的本地开发 Agent。

本地已有 Git 仓库：

```text
xuedeshi-history-learning
```

这是一个中国历史学习网站，项目名为：

```text
学的是史
```

当前网站为静态 Web 项目，入口文件为：

```text
index.html
```

服务器公网 IP：

```text
118.178.140.171
```

网站对外访问端口：

```text
9090
```

预期上线地址：

```text
http://118.178.140.171:9090
```

本次需要完成：

1. 使用 SSH 登录服务器。
2. 在服务器上创建 Git 裸仓库。
3. 创建网站部署目录。
4. 使用 Nginx 将静态网页发布到 `9090` 端口。
5. 在服务器 Git 仓库中创建 `post-receive` 自动部署钩子。
6. 为本机设置 SSH 密钥登录。
7. 配置本机 SSH 别名。
8. 为本地仓库增加部署 remote。
9. 创建一键部署脚本。
10. 在本地仓库写好部署文档。
11. 验证以后执行一条命令即可完成发布。
12. 做一次真实上线测试。

---

# 二、安全规则

必须遵守：

1. 不要把服务器密码写入任何文件。
2. 不要把服务器密码写入 Git 提交。
3. 不要把服务器密码写入 Shell 历史记录。
4. 首次登录时，只允许通过终端交互输入密码。
5. 不要把私钥复制到服务器。
6. 只将本机 SSH 公钥添加到服务器的：

```text
~/.ssh/authorized_keys
```

7. 在密钥登录验证成功之前，不要关闭密码登录。
8. 不要擅自删除服务器上已有的 Nginx 配置。
9. 不要覆盖其他项目的网站目录。
10. 每次修改服务器配置前先创建备份。
11. 不要提交：

```text
.env
*.pem
*.key
id_rsa
id_ed25519
```

---

# 三、需要优先确认的变量

在开始前设置以下变量。

```bash
SERVER_IP="118.178.140.171"
SERVER_PORT="22"
WEB_PORT="9090"
PROJECT_NAME="xuedeshi-history-learning"
SSH_ALIAS="xuedeshi-server"
SERVER_REPO="/srv/git/xuedeshi-history-learning.git"
WEB_ROOT="/var/www/xuedeshi-history-learning"
```

## SSH 用户名确认规则

首先检查本机是否已有可用配置：

```bash
grep -n "118.178.140.171" ~/.ssh/config 2>/dev/null || true
```

如果已有对应配置，优先读取其中的 `User`。

如果没有：

1. 检查用户是否已明确提供 SSH 用户名。
2. 若没有，不要猜测并反复尝试大量账户。
3. 只向用户询问一次：

```text
请提供服务器 SSH 用户名。常见值为 root、ubuntu 或 admin。
```

获取后设置：

```bash
SERVER_USER="<用户提供的 SSH 用户名>"
```

如果用户确认使用 `root`：

```bash
SERVER_USER="root"
```

---

# 四、第一阶段：检查本地仓库

进入本地项目目录：

```bash
cd /path/to/xuedeshi-history-learning
```

根据实际路径调整。

确认当前目录是 Git 仓库：

```bash
git rev-parse --show-toplevel
git status
git branch --show-current
git log --oneline --decorate -10
```

确认入口文件存在：

```bash
test -f index.html && echo "index.html exists"
```

确认部署前工作区状态：

```bash
git status --short
```

如果存在尚未提交的代码修改：

1. 不要丢弃。
2. 先向用户汇报。
3. 若改动属于当前项目且适合提交，则创建正常 Git 提交。
4. 不要使用 `git reset --hard`。
5. 不要使用 `git clean -fd`。

---

# 五、第二阶段：创建或复用 SSH 密钥

## 1. 检查本机密钥

执行：

```bash
ls -la ~/.ssh 2>/dev/null || true
```

优先检查：

```bash
test -f ~/.ssh/id_ed25519 && echo "Existing ed25519 key found"
test -f ~/.ssh/id_ed25519.pub && echo "Existing public key found"
```

## 2. 复用或新建密钥

如果已有合适的 `ed25519` 密钥，优先复用。

如果没有，创建一个专用于该服务器的密钥：

```bash
ssh-keygen -t ed25519 -C "xuedeshi-deploy@118.178.140.171" -f ~/.ssh/id_ed25519_xuedeshi
```

允许用户自行决定是否设置本地私钥口令。

私钥路径：

```text
~/.ssh/id_ed25519_xuedeshi
```

公钥路径：

```text
~/.ssh/id_ed25519_xuedeshi.pub
```

严禁输出私钥内容。

---

# 六、第三阶段：首次 SSH 登录并写入公钥

## 1. 首次登录

使用：

```bash
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP"
```

首次连接时：

* 核对目标 IP。
* 接受服务器 host key。
* 密码通过终端交互输入。
* 不要把密码拼接进命令。
* 不要使用会将密码明文写入命令行的工具。

## 2. 添加公钥

退出首次连接后，优先使用：

```bash
ssh-copy-id -p "$SERVER_PORT" -i ~/.ssh/id_ed25519_xuedeshi.pub "$SERVER_USER@$SERVER_IP"
```

如果复用了默认密钥，则调整路径：

```bash
ssh-copy-id -p "$SERVER_PORT" -i ~/.ssh/id_ed25519.pub "$SERVER_USER@$SERVER_IP"
```

如果系统没有 `ssh-copy-id`，则手动追加公钥。

本地执行：

```bash
cat ~/.ssh/id_ed25519_xuedeshi.pub
```

服务器执行：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

将公钥追加到：

```text
~/.ssh/authorized_keys
```

注意：

* 只能追加公钥。
* 不要覆盖已有 `authorized_keys`。
* 不要上传私钥。

---

# 七、第四阶段：配置本机 SSH 别名

编辑：

```text
~/.ssh/config
```

如文件不存在，创建并设置权限：

```bash
mkdir -p ~/.ssh
touch ~/.ssh/config
chmod 600 ~/.ssh/config
```

追加以下配置，但不要重复追加同名 Host：

```sshconfig
Host xuedeshi-server
    HostName 118.178.140.171
    User <SERVER_USER>
    Port 22
    IdentityFile ~/.ssh/id_ed25519_xuedeshi
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

说明：

* 将 `<SERVER_USER>` 替换为真实 SSH 用户名。
* 如果实际使用默认密钥，修改 `IdentityFile`。
* 如果 SSH 端口不是 `22`，同步修改。
* 不要在 SSH config 中写密码。

## 测试免密登录

执行：

```bash
ssh xuedeshi-server "echo 'SSH key login works' && whoami && hostname"
```

验收标准：

* 不再要求输入服务器账户密码。
* 能正常执行远程命令。
* 输出远程用户名和主机名。

如果仍要求服务器密码：

1. 检查本机密钥路径。
2. 检查 `authorized_keys` 权限。
3. 检查远程用户是否一致。
4. 使用调试模式：

```bash
ssh -v xuedeshi-server
```

5. 不要进入下一阶段，直到免密登录成功。

---

# 八、第五阶段：服务器初始化

通过别名登录：

```bash
ssh xuedeshi-server
```

以下命令在服务器执行。

## 1. 检查系统信息

```bash
whoami
hostname
uname -a
cat /etc/os-release
```

## 2. 检查端口占用

```bash
ss -lntp | grep ':9090' || true
```

如果 `9090` 已被其他服务使用：

* 不要强行停止服务。
* 不要覆盖其他项目。
* 汇报冲突进程。
* 等待用户决定。

## 3. 安装 Git 和 Nginx

先检查：

```bash
git --version || true
nginx -v || true
```

Debian / Ubuntu 系统：

```bash
sudo apt-get update
sudo apt-get install -y git nginx
```

CentOS / Rocky / AlmaLinux 系统：

```bash
sudo dnf install -y git nginx
```

如果当前账户为 `root`，可以去掉 `sudo`。

如果系统使用 `yum`：

```bash
sudo yum install -y git nginx
```

## 4. 创建服务器目录

```bash
sudo mkdir -p /srv/git
sudo mkdir -p /var/www/xuedeshi-history-learning
```

将目录权限交给当前部署用户：

```bash
sudo chown -R "$USER:$USER" /srv/git
sudo chown -R "$USER:$USER" /var/www/xuedeshi-history-learning
```

如部署用户没有权限，保留合理的用户组权限，不要使用：

```bash
chmod -R 777
```

---

# 九、第六阶段：创建 Git 裸仓库和自动部署 Hook

## 1. 创建裸仓库

服务器执行：

```bash
cd /srv/git
git init --bare xuedeshi-history-learning.git
```

目标路径：

```text
/srv/git/xuedeshi-history-learning.git
```

## 2. 创建自动部署脚本

编辑：

```text
/srv/git/xuedeshi-history-learning.git/hooks/post-receive
```

内容如下：

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

设置权限：

```bash
chmod +x /srv/git/xuedeshi-history-learning.git/hooks/post-receive
```

## 3. 检查默认分支

本地仓库通常使用：

```text
main
```

如果本地实际分支为：

```text
master
```

需要二选一：

优先在本地切换为 `main`：

```bash
git branch -M main
```

或者把服务器 Hook 中的：

```bash
DEPLOY_BRANCH="main"
```

修改为：

```bash
DEPLOY_BRANCH="master"
```

优先统一使用 `main`。

---

# 十、第七阶段：配置 Nginx 静态站点

以下命令在服务器执行。

## 1. 检查现有 Nginx 配置

```bash
sudo nginx -t
```

确认现有配置无错误后再修改。

## 2. 创建站点配置

Debian / Ubuntu 推荐创建：

```text
/etc/nginx/sites-available/xuedeshi-history-learning
```

内容如下：

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

创建软链接：

```bash
sudo ln -sfn \
  /etc/nginx/sites-available/xuedeshi-history-learning \
  /etc/nginx/sites-enabled/xuedeshi-history-learning
```

CentOS / Rocky / AlmaLinux 推荐直接创建：

```text
/etc/nginx/conf.d/xuedeshi-history-learning.conf
```

内容保持一致。

## 3. 校验并重载

```bash
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

再次确认端口监听：

```bash
ss -lntp | grep ':9090'
```

## 4. 检查系统防火墙

用户已说明云端安全组放行 `9090`，仍需检查服务器自身防火墙。

如果使用 UFW：

```bash
sudo ufw status
sudo ufw allow 9090/tcp
```

如果使用 firewalld：

```bash
sudo firewall-cmd --state
sudo firewall-cmd --permanent --add-port=9090/tcp
sudo firewall-cmd --reload
```

不要在不清楚系统防火墙状态时，擅自关闭整个防火墙。

---

# 十一、第八阶段：本地配置 Git Remote

退出服务器，返回本地仓库：

```bash
cd /path/to/xuedeshi-history-learning
```

检查当前 remote：

```bash
git remote -v
```

添加部署 remote：

```bash
git remote add deploy xuedeshi-server:/srv/git/xuedeshi-history-learning.git
```

如果 `deploy` 已存在，更新：

```bash
git remote set-url deploy xuedeshi-server:/srv/git/xuedeshi-history-learning.git
```

确认：

```bash
git remote -v
```

目标结果类似：

```text
deploy  xuedeshi-server:/srv/git/xuedeshi-history-learning.git (fetch)
deploy  xuedeshi-server:/srv/git/xuedeshi-history-learning.git (push)
```

---

# 十二、第九阶段：首次上线

## 1. 确认本地分支

```bash
git branch --show-current
```

统一为：

```text
main
```

必要时执行：

```bash
git branch -M main
```

## 2. 确认代码已提交

```bash
git status
git log --oneline --decorate -10
```

如有合理变更未提交：

```bash
git add .
git commit -m "chore: prepare static site deployment"
```

## 3. 推送上线

```bash
git push deploy main
```

预期 Hook 输出：

```text
[deploy] Deploying branch: main
[deploy] Deployment completed: ...
```

---

# 十三、第十阶段：创建本地一键部署脚本

创建目录：

```bash
mkdir -p scripts
```

创建：

```text
scripts/deploy.sh
```

内容如下：

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
    echo "Commit or stash your changes before deployment."
    git status --short
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

设置执行权限：

```bash
chmod +x scripts/deploy.sh
```

之后发布只需执行：

```bash
./scripts/deploy.sh
```

---

# 十四、第十一阶段：创建本地部署文档

创建：

```text
docs/deployment.md
```

内容如下：

````markdown
# “学的是史”部署说明

## 一、线上地址

```text
http://118.178.140.171:9090
````

## 二、服务器连接

本机已配置 SSH 别名：

```bash
ssh xuedeshi-server
```

SSH 密钥配置保存在本机：

```text
~/.ssh/config
```

服务器公钥授权文件：

```text
~/.ssh/authorized_keys
```

注意：

* 不要把服务器密码写入仓库。
* 不要把 SSH 私钥提交到仓库。
* 不要通过聊天、文档或脚本传播服务器密码。

## 三、服务器目录

服务器裸仓库：

```text
/srv/git/xuedeshi-history-learning.git
```

网站静态文件部署目录：

```text
/var/www/xuedeshi-history-learning
```

Nginx 对外端口：

```text
9090
```

## 四、自动部署原理

本地仓库已配置 Git remote：

```text
deploy
```

执行：

```bash
git push deploy main
```

服务器 Git 裸仓库接收到 `main` 分支后，会自动运行：

```text
/srv/git/xuedeshi-history-learning.git/hooks/post-receive
```

该 Hook 会将最新代码签出到：

```text
/var/www/xuedeshi-history-learning
```

Nginx 会直接读取该目录并对外提供网站。

## 五、日常发布流程

完成代码修改后：

```bash
git add .
git commit -m "feat: describe your changes"
./scripts/deploy.sh
```

脚本会：

1. 检查当前是否位于 `main` 分支。
2. 检查是否存在未提交的代码。
3. 测试 SSH 连接。
4. 推送到服务器。
5. 检查网站是否可以访问。

## 六、手动发布

如需手动发布：

```bash
git push deploy main
```

## 七、常用检查命令

### 检查线上页面

```bash
curl -I http://118.178.140.171:9090
```

### 登录服务器

```bash
ssh xuedeshi-server
```

### 检查 Nginx

```bash
sudo nginx -t
sudo systemctl status nginx
```

### 查看端口

```bash
ss -lntp | grep ':9090'
```

### 查看网站文件

```bash
ls -la /var/www/xuedeshi-history-learning
```

### 查看 Nginx 日志

```bash
sudo tail -n 100 /var/log/nginx/xuedeshi-history-learning.access.log
sudo tail -n 100 /var/log/nginx/xuedeshi-history-learning.error.log
```

### 查看服务器 Git Hook

```bash
cat /srv/git/xuedeshi-history-learning.git/hooks/post-receive
```

## 八、故障排查

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

检查：

```bash
ssh xuedeshi-server
ls -la /var/www/xuedeshi-history-learning
cat /srv/git/xuedeshi-history-learning.git/hooks/post-receive
```

确认 Hook 可执行：

```bash
chmod +x /srv/git/xuedeshi-history-learning.git/hooks/post-receive
```

### JSON 文件无法加载

确认通过：

```text
http://118.178.140.171:9090
```

访问，不要使用本地 `file://` 协议。

同时检查浏览器控制台中的路径错误。

## 九、安全建议

首次免密 SSH 登录验证成功后：

1. 修改服务器登录密码。
2. 妥善保存服务器管理信息。
3. 不要把密码写入仓库。
4. 不要把私钥上传到服务器。
5. 定期检查：

```bash
cat ~/.ssh/authorized_keys
```

6. 若未来需要进一步加固 SSH，先保留一个已验证可用的 SSH 会话，再考虑关闭密码登录。

````

---

# 十五、第十二阶段：更新 README

在 `README.md` 中追加：

```markdown
## 部署

线上地址：

```text
http://118.178.140.171:9090
````

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

````

---

# 十六、第十三阶段：更新 .gitignore

确认 `.gitignore` 至少包含：

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

# OS files
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/

# Dependencies and builds
node_modules/
dist/
build/

# Logs
*.log
````

说明：

* SSH 公钥也不需要提交到项目仓库。
* SSH 私钥严禁提交。

---

# 十七、第十四阶段：提交本地部署配置

提交新增文档和脚本：

```bash
git add README.md .gitignore docs/deployment.md scripts/deploy.sh
git commit -m "docs: add server deployment workflow"
```

将本次提交推送上线：

```bash
./scripts/deploy.sh
```

---

# 十八、第十五阶段：验收

## 1. 本地验证

执行：

```bash
ssh xuedeshi-server "echo 'SSH key authentication is working'"
```

必须确认：

* 无需输入服务器账户密码。
* 可以执行远程命令。

## 2. 网站验证

执行：

```bash
curl -I http://118.178.140.171:9090
```

期望看到：

```text
HTTP/1.1 200 OK
```

然后检查首页内容：

```bash
curl --silent http://118.178.140.171:9090 | head -n 30
```

## 3. 浏览器验证

浏览器访问：

```text
http://118.178.140.171:9090
```

检查：

* 首页可以访问。
* CSS 正常加载。
* JavaScript 正常加载。
* JSON 数据正常加载。
* 页面移动端布局正常。
* 浏览器控制台无阻断性错误。

## 4. 自动部署验证

在本地创建一次无害变更，例如更新部署文档中的验证时间，不要修改业务代码。

然后执行：

```bash
git add .
git commit -m "docs: verify automatic deployment"
./scripts/deploy.sh
```

确认：

* Git push 成功。
* 服务器 Hook 被触发。
* 网站仍可访问。
* 线上目录已更新。

---

# 十九、可选安全加固

只有在以下条件全部满足后才能执行：

1. `ssh xuedeshi-server` 免密登录成功。
2. 已保留至少一个当前可用的 SSH 会话。
3. 用户明确同意关闭密码登录。
4. 已确认云平台具备控制台救援登录能力。

然后才考虑编辑：

```text
/etc/ssh/sshd_config
```

推荐配置：

```text
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
```

修改前备份：

```bash
sudo cp /etc/ssh/sshd_config \
  /etc/ssh/sshd_config.backup.$(date +%Y%m%d-%H%M%S)
```

校验配置：

```bash
sudo sshd -t
```

重载 SSH 服务：

```bash
sudo systemctl reload ssh || sudo systemctl reload sshd
```

新开一个终端，再次测试：

```bash
ssh xuedeshi-server
```

注意：

* 用户本次要求建立免密码 SSH，不等于必须立刻关闭密码登录。
* 默认只完成密钥登录配置，不主动禁用密码登录。
* 避免因配置错误导致服务器失联。

---

# 二十、最终汇报要求

任务完成后，向用户汇报：

1. 实际 SSH 用户名。
2. SSH 是否已实现免密码登录。
3. 本机 SSH 别名。
4. 本地仓库绝对路径。
5. 服务器 Git 裸仓库路径。
6. 网站静态文件目录。
7. Nginx 配置文件路径。
8. 网站访问地址。
9. `curl -I` 返回状态。
10. 本地 Git remote 列表。
11. 新增文档和脚本列表。
12. 最新 commit hash。
13. 自动部署验证是否成功。
14. 是否存在阻断性错误。
15. 是否修改了服务器密码。
16. 是否关闭了 SSH 密码登录。
17. 推荐用户在密钥验证成功后自行修改临时密码。

---

# 二十一、严格禁止事项

禁止：

* 将服务器密码写入仓库。
* 将服务器密码写入文档。
* 将服务器密码写入脚本。
* 将服务器密码写入命令行参数。
* 上传 SSH 私钥。
* 将 SSH 私钥提交到 Git。
* 使用 `chmod -R 777`。
* 强行占用已有端口。
* 擅自删除其他 Nginx 站点。
* 擅自删除服务器文件。
* 使用 `git reset --hard` 丢弃本地修改。
* 未验证密钥登录前关闭密码登录。
* 未经用户明确同意关闭 SSH 密码登录。
* 在生产服务器上使用 `python -m http.server` 长期提供服务。

本次最终目标：

```text
本地修改代码
→ git commit
→ ./scripts/deploy.sh
→ 自动推送到服务器
→ Git Hook 自动更新网站目录
→ Nginx 在 9090 端口提供静态网页
```
