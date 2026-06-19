---
title: STL 常用容器
module: programming
group: C++
tags: [STL, container, algorithm]
---

# STL 常用容器

C++ STL 容器选择需要结合访问模式、插入删除位置、排序需求和迭代器稳定性进行判断。

## 重点

- `vector` 适合连续存储和随机访问。
- `deque` 适合两端插入删除。
- `unordered_map` 适合平均 O(1) 查询，但要注意哈希冲突。
- `set` 和 `map` 基于有序结构，适合需要排序或区间查询的场景。

## 复盘问题

- 什么时候不应该默认使用 `unordered_map`？
- `vector` 扩容时迭代器为什么可能失效？
