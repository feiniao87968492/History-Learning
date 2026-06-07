# 学的是史

中国历史学习网站原型，当前以原生 HTML、CSS、JavaScript 和 JSON 静态数据实现。

## 本地运行

由于页面需要通过 `fetch` 加载 JSON 数据，请使用静态服务器运行项目。

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 当前项目结构

```text
.
├── index.html
├── assets/
│   ├── images/
│   ├── icons/
│   └── audio/
├── docs/
├── src/
│   ├── css/
│   │   ├── base.css
│   │   ├── components.css
│   │   └── pages.css
│   ├── js/
│   │   ├── app.js
│   │   ├── storage.js
│   │   ├── navigation.js
│   │   ├── favorites.js
│   │   ├── noun.js
│   │   ├── timeline.js
│   │   ├── podcast.js
│   │   └── ai-assistant.js
│   └── data/
│       ├── nouns.json
│       ├── timeline.json
│       ├── people.json
│       ├── podcasts.json
│       ├── books.json
│       └── memes.json
└── mini-program/
    └── README.md
```

## 当前技术方案

项目当前使用：

- 原生 HTML
- 原生 CSS
- 原生 JavaScript
- JSON 静态数据
- 浏览器 LocalStorage

暂未引入构建工具和第三方框架。

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
