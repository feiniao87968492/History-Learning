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
