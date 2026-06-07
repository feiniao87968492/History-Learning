# "学的是史"部署说明

## 一、线上地址

```text
http://118.178.140.171:9090
```

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

- 不要把服务器密码写入仓库
- 不要把 SSH 私钥提交到仓库
- 不要通过聊天、文档或脚本传播服务器密码

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

1. 检查当前是否位于 `main` 分支
2. 检查是否存在未提交的代码
3. 测试 SSH 连接
4. 推送到服务器
5. 检查网站是否可以访问

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

1. 修改服务器登录密码
2. 妥善保存服务器管理信息
3. 不要把密码写入仓库
4. 不要把私钥上传到服务器
5. 定期检查：

```bash
cat ~/.ssh/authorized_keys
```

6. 若未来需要进一步加固 SSH，先保留一个已验证可用的 SSH 会话，再考虑关闭密码登录。
