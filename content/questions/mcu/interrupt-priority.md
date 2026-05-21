---
id: "mcu-nvic-001"
title: "中断优先级：抢占优先级与响应优先级"
type: "concept"
direction: "mcu"
difficulty: "medium"
tags: ["NVIC", "中断优先级", "抢占", "响应"]
answer: "抢占优先级决定了中断是否可以打断正在执行的其他中断（嵌套）；响应优先级（也称子优先级）决定了当多个中断同时挂起且抢占优先级相同时，谁先执行。数值越小，优先级越高。"
explanation: "在 ARM Cortex-M 中，由 NVIC 管理。如果抢占优先级相同，即使响应优先级高，也无法打断正在执行的中断。"
companies: ["huawei", "xiaomi"]
interviewYear: 2023
interviewRound: "一面"
isPremium: false
---
在 STM32 等 MCU 中，如何理解抢占优先级（Preemption Priority）和响应优先级（Subpriority）的关系？
