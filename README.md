# Personal Capability Platform

纯静态个人能力平台，用于维护简历、编程语言、算法、工程、科研、项目和学习笔记。

## 本地开发

首次安装依赖：

```bash
npm install
```

生成笔记页面和部署产物：

```bash
npm run build
```

启动本地服务器：

```bash
npm run serve
```

访问 `http://localhost:4173`。

## 内容维护

结构化内容位于：

```text
data/profile.json
data/capabilities.json
data/projects.json
```

学习笔记位于 `notes/`。每篇 Markdown 使用标准 YAML front matter：

```md
---
title: STL 常用容器
module: programming
group: C++
tags: [STL, container]
---
```

支持的 `module`：

```text
programming
algorithms
engineering
research
```

新增或修改笔记后运行 `npm run build`。构建脚本会：

1. 校验 front matter。
2. 使用 `marked` 解析 Markdown。
3. 使用 `sanitize-html` 清理输出。
4. 生成 `data/notes.json`。
5. 为每篇笔记生成独立 HTML 阅读页。
6. 生成可部署的 `dist/` 目录。

## GitHub Pages

工作流位于 `.github/workflows/pages.yml`。推送到 `master` 或 `main` 后会自动：

1. 使用 `npm ci` 安装锁定版本依赖。
2. 执行 `npm run build`。
3. 部署 `dist/` 到 GitHub Pages。

在仓库 Settings → Pages 中将 Source 设置为 **GitHub Actions**。

## 页面路由

主页使用 query-string 静态路由：

```text
/?page=programming
/?page=engineering
```

笔记使用构建时生成的静态页面，因此不需要后端或运行时 Markdown 解析器。
