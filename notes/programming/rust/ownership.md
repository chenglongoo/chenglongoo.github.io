---
title: 所有权模型
module: programming
group: Rust
tags: [ownership, borrow, memory]
---

# 所有权模型

这篇笔记记录 Rust 学习中最核心的所有权概念。

## 重点

- 每个值都有唯一的 owner。
- 同一时间可以有多个不可变引用，或者一个可变引用。
- 生命周期用于描述引用有效范围。

## 学习目标

能解释 move、borrow、clone 的区别，并在小项目里写出清晰的数据流。
 