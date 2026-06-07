# 学的是史 GitHub 同步配置设计

## 1. 背景与目标

本地项目 `学的是史` 已完成第二阶段重构和云服务器部署配置。当前仓库有两个 remote：

- `deploy` → `xuedeshi-server:/srv/git/xuedeshi-history-learning.git`（服务器部署）
- `origin` → 不存在

本次目标是为项目配置 GitHub 远端仓库同步能力，同时保留已有 `deploy` remote 不受影响。

GitHub 目标仓库：`https://github.com/feiniao87968492/History-Learning`

## 2. 现状

| 项目 | 状态 |
|------|------|
| 分支 | `main` |
| `origin` remote | 不存在 |
| `deploy` remote | `xuedeshi-server:/srv/git/...` ✓ |
| GitHub CLI (`gh`) | 未安装 |
| Git Credential Helper | 未配置 |
| Git 身份 | `feiniao` / `2648955710@qq.com` |
| 工作区 | 干净（仅 `skills/push-to-github.md` 未追踪） |
| `.gitignore` | 已有基础规则（部署阶段配置） |

## 3. 双 Remote 架构

```
本机 (main)
  │
  ├─ git push origin main ──→ GitHub 仓库
  │                           https://github.com/feiniao87968492/History-Learning
  │
  └─ git push deploy main ──→ 服务器裸仓库
                               xuedeshi-server:/srv/git/...
                               ↓ post-receive hook
                               /var/www/xuedeshi-history-learning/
                               ↓ Nginx
                               http://118.178.140.171:9090
```

| Remote | 名称 | 地址 | 触发线上部署？ | 认证方式 |
|--------|------|------|-------------|---------|
| GitHub | `origin` | `https://github.com/feiniao87968492/History-Learning.git` | 否 | HTTPS + gh CLI |
| 服务器 | `deploy` | `xuedeshi-server:/srv/git/xuedeshi-history-learning.git` | 是 | SSH 密钥 |

两者完全独立，互不影响。推 GitHub 不会触发线上更新，推 deploy 不会影响 GitHub。

## 4. 身份验证设计

当前 `gh` 未安装，无 credential helper。

执行路径：

```
安装 GitHub CLI (winget)
     │
     ▼
gh auth login
  ├─ GitHub.com
  ├─ HTTPS
  ├─ Login with a web browser
  └─ 浏览器完成授权 → gh 自动管理 token
     │
     ▼
git push origin main → 自动通过 gh 认证
```

Token 仅存储在 `gh` 的本地凭证存储中（`%APPDATA%\GitHub CLI\`），不会写入：

- 仓库文件
- Shell 脚本
- README 或部署文档
- `.env` 文件
- Git remote URL

绝对禁止在 remote URL 中使用 `https://USERNAME:TOKEN@github.com/...` 格式。

## 5. 敏感文件检查设计

推送 GitHub 前执行三层扫描：

### 5.1 文件系统扫描

在项目目录搜索 `.env`、`*.pem`、`*.key`、`id_rsa*`、`id_ed25519*`、`*credential*`、`*secret*` 等文件名。

### 5.2 Git 跟踪扫描

检查敏感文件名是否已被 `git ls-files` 跟踪。

### 5.3 源码内容扫描

搜索 `password=`、`token=`、`secret=`、`private_key=`、`access_key=` 等模式。

### 处理规则

- 发现真实凭据（如 `ghp_` 前缀 token、IP + 密码组合）：立即停止推送，汇报位置
- 仅有变量名而无真实凭据值：标记为低风险，继续
- 发现发现已跟踪的敏感文件：汇报并建议用 `git rm --cached` 处理

## 6. .gitignore 扩展设计

以说明书要求为准，在现有基础上追加以下规则：

```gitignore
# Additional certificate types
*.p12
*.pfx

# Additional credential patterns
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

现有规则保留不变，新规则追加在末尾。

## 7. Remote 配置设计

当前 `origin` 不存在，适用情况 A：直接添加。

```bash
git remote add origin https://github.com/feiniao87968492/History-Learning.git
```

预期结果：

```text
deploy  xuedeshi-server:/srv/git/xuedeshi-history-learning.git (fetch)
deploy  xuedeshi-server:/srv/git/xuedeshi-history-learning.git (push)
origin  https://github.com/feiniao87968492/History-Learning.git (fetch)
origin  https://github.com/feiniao87968492/History-Learning.git (push)
```

不修改 `deploy` remote，不在 URL 中拼接凭据。

## 8. 远端状态处理

用 `git ls-remote origin` 探测远端仓库状态：

| 情况 | 判断 | 动作 |
|------|------|------|
| 返回空 | GitHub 仓库为空 | `git push -u origin main` |
| 返回有 refs，本地包含远端历史 | `git merge-base --is-ancestor origin/main main` 成功 | 正常 `git push origin main` |
| 返回有 refs，历史分叉 | `git merge-base --is-ancestor origin/main main` 失败 | **停止，汇报，等待用户决策** |

禁止操作：
- `git push --force` / `git push -f`
- `git reset --hard`
- 自动 rebase 或 merge

## 9. 脚本设计

三个脚本的职责边界：

```
scripts/push-github.sh    → git push origin main   → 仅同步 GitHub
scripts/deploy.sh         → git push deploy main   → 仅更新网站
scripts/publish-all.sh    → 先 push-github.sh      → 同步 + 上线
                           成功后再 deploy.sh
```

### push-github.sh

新增脚本。执行前检查：
1. 当前在 `main` 分支
2. 工作区无未提交修改
3. `origin` remote URL 匹配预期地址
4. 如远端存在 `main` 分支，本地历史包含远端历史（非分叉）

### deploy.sh

已有脚本，不修改。

### publish-all.sh

新增脚本。调用 `push-github.sh`，成功后调用 `deploy.sh`。前一步失败则后一步不执行。

## 10. 验收设计

### CP1 — GitHub 身份验证成功

- `gh auth status` 显示已登录 GitHub.com
- `git ls-remote origin` 返回仓库 refs（或空仓库无输出），不触发认证错误

### CP2 — 首次推送成功

- `./scripts/push-github.sh` 执行完成无错误
- GitHub 页面 `https://github.com/feiniao87968492/History-Learning` 可看到最新 `main` 分支提交
- `git remote -v` 确认 `deploy` 未被覆盖
- `git push deploy main`（或 `./scripts/deploy.sh`）仍然可用

## 11. 不纳入本次范围

- GitHub Actions CI/CD
- 分支保护规则配置
- GitHub Pages 部署
- 多分支推送策略
- Git LFS
