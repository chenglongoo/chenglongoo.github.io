---
title: Goroutine 与 Channel
module: programming
group: Go
tags: [goroutine, channel, concurrency]
---

# Goroutine 与 Channel

这篇笔记记录 Go 并发模型的基础用法。

## 重点

- `goroutine` 是轻量级并发执行单元。
- `channel` 用于 goroutine 之间通信。
- `select` 可以同时等待多个 channel 操作。

## 练习

实现一个简单 worker pool，并记录任务分发、错误处理和退出逻辑。
