# Chenglong Portfolio

个人技术主页源码，用于展示简历信息、技术能力、项目实践和学习笔记。站点采用纯静态架构，内容以 JSON 和 Markdown 维护，通过 GitHub Actions 构建并部署到 GitHub Pages。

访问地址：

```text
https://chenglongoo.github.io/
```

## Features

- Profile：个人简介、方向和基础信息入口。
- Programming：按语言组织编程能力和学习笔记。
- Algorithms：按数据结构、解题方法和复杂度分析组织算法积累。
- Engineering：按后端、大数据、机器学习、AI Agent、知识图谱组织工程能力。
- Research：按问题定义、方法拆解、实验复现组织科研训练。
- Projects：展示项目实践和技术产出。
- Notes：Markdown 笔记在构建阶段生成独立静态阅读页。

## Architecture

```text
index.html              # 页面结构
app.js                  # 前端路由和数据渲染
background.js           # 背景动效
styles.css              # 样式
data/                   # 结构化展示数据
notes/                  # Markdown 学习笔记
scripts/build.mjs       # 构建、校验、笔记生成和部署产物生成
.github/workflows/      # GitHub Pages 自动部署
```

构建过程会校验结构化数据和笔记 front matter，生成：

```text
data/notes.json
generated/notes/*.html
dist/
dist/sitemap.xml
dist/robots.txt
```

## Content Model

每篇笔记使用 YAML front matter 声明所属模块和分组：

```md
---
title: STL 常用容器
module: programming
group: C++
tags: [STL, container]
---
```

构建脚本会校验 `module/group` 是否能匹配到能力模块，避免页面中出现失联笔记。

## Development

```bash
npm install
npm run build
npm run serve
```

本地预览地址：

```text
http://localhost:4173
```

`npm run serve` 会先构建 `dist/`，再直接服务部署产物，保证本地预览与线上行为一致。

## Quality Checks

```bash
npm run check
```

当前检查包含 JavaScript 语法检查。构建阶段还会执行：

- 数据结构校验
- 笔记 front matter 校验
- 笔记分组覆盖校验
- Markdown 解析与 HTML 清理
- sitemap 和 robots 生成

## Deployment

仓库推送到 `main` 或 `master` 后，GitHub Actions 会执行构建并将 `dist/` 发布到 GitHub Pages。
