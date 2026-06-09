---
title: PyTorch 训练流程
module: programming
group: Python
tags: [PyTorch, training, experiment]
---

# PyTorch 训练流程

这篇笔记记录一个基础 PyTorch 训练脚本应该包含的部分。

## 重点

- 数据集与 `DataLoader`。
- 模型定义、损失函数和优化器。
- 训练循环、验证循环和指标记录。
- 保存 checkpoint，保留实验配置。

## 模板意识

训练代码要尽量把配置、数据、模型、训练逻辑拆开，方便复现实验。
