---
id: "rtos-task-001"
title: "RTOS 任务调度的基本原理"
type: "concept"
direction: "rtos"
difficulty: "medium"
tags: ["RTOS", "调度", "抢占式", "时间片"]
answer: "大多数实时操作系统（如 FreeRTOS）采用基于优先级的全抢占式调度。高优先级任务就绪时会立即打断低优先级任务。若优先级相同，则通常采用时间片轮转（Round Robin）调度。"
explanation: "调度器在 SysTick 中断或任务主动让出 CPU 时运行，从就绪列表中选择优先级最高的任务进行上下文切换。"
companies: ["dji", "huawei"]
interviewYear: 2024
interviewRound: "笔试"
isPremium: false
---
请简述 RTOS（如 FreeRTOS）中任务调度的核心机制，包括优先级抢占和时间片轮转。
