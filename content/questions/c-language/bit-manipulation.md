---
id: "c-lang-bit-manipulation-001"
title: "寄存器位操作（置位与清零）"
type: "choice"
direction: "c-language"
difficulty: "easy"
tags: ["位运算", "寄存器", "置位", "清零"]
answer: "A"
explanation: "在嵌入式开发中，对寄存器的操作必须遵循“不影响其他位”的原则：\n1. 置位（设为 1）：使用按位或操作 `|=`，通过掩码 `(1 << n)` 对第 n 位置 1。如果要将第 4 和第 6 位置 1，掩码为 `(1 << 4) | (1 << 6)`，操作为 `REG |= (1 << 4) | (1 << 6)`。\n2. 清零（设为 0）：使用按位与非操作 `&= ~`，通过掩码 `~(1 << n)` 对第 n 位清零。如果要将第 3 位清零，操作为 `REG &= ~(1 << 3)`。\n综合这两步即可实现题目要求且不影响其他无关位。"
choices: [{"id": "A", "text": "REG |= (1 << 4) | (1 << 6); REG &= ~(1 << 3);", "correct": true}, {"id": "B", "text": "REG &= (1 << 4) | (1 << 6); REG |= ~(1 << 3);", "correct": false}, {"id": "C", "text": "REG ^= (1 << 4) | (1 << 6); REG |= (1 << 3);", "correct": false}, {"id": "D", "text": "REG |= (1 << 4) & (1 << 6); REG &= (1 << 3);", "correct": false}]
companies: ["huawei", "lenovo"]
interviewYear: 2024
interviewRound: "笔试"
isPremium: false
---
如何将一个 32 位寄存器 `REG` 的第 4 位和第 6 位置 1，同时将第 3 位清 0，其他位保持不变？（假设最低位为第 0 位）
