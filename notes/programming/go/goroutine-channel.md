---
title: Goroutine 与 Channel
module: programming
group: Go
tags: [goroutine, channel, concurrency]
---

# Goroutine 与 Channel

Go 的并发模型强调通过 goroutine 执行任务，通过 channel 组织通信。设计并发程序时需要明确任务生命周期、错误传播和退出机制。

## 重点

- `goroutine` 是轻量级并发执行单元。
- `channel` 用于 goroutine 之间通信。
- `select` 可以同时等待多个 channel 操作。

## 练习

实现一个简单 worker pool，并记录任务分发、错误处理和退出逻辑。
