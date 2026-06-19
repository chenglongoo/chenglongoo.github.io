---
title: REST API 设计记录
module: engineering
group: Backend
tags: [REST, backend, API]
---

# REST API 设计记录

后端接口设计需要在资源建模、错误处理和文档维护之间保持一致，降低前后端协作和后续维护成本。

## 重点

- URL 表达资源，HTTP method 表达动作。
- 返回结构要稳定，错误码要可追踪。
- 接口文档和测试样例要同步维护。
