---
id: "rtos-vs-linux-sched-001"
title: "RTOS 与 Linux 任务调度算法差异"
type: "concept"
direction: "rtos"
difficulty: "hard"
tags: ["RTOS", "Linux", "FreeRTOS", "CFS", "任务调度"]
answer: "FreeRTOS 与 Linux 的任务调度差异源于其不同的设计定位，主要体现在：\n1. 调度目标：FreeRTOS 追求硬实时确定性，必须在严格时间内完成响应；Linux 追求多用户多任务下的公平性与最大系统吞吐量。\n2. 算法类型：FreeRTOS 采用基于优先级的可抢占式调度算法，高优先级任务就绪立即抢占，同优先级按时间片轮转；Linux 默认使用完全公平调度（CFS）算法，基于任务的虚拟运行时间（vruntime）进行动态分配。\n3. 优先级机制：FreeRTOS 使用纯静态优先级，数值越大优先级越高，且高优先级绝对优先；Linux 使用静态优先级（Nice 值 -20~19）影响权重，且内核会根据任务睡眠/运行状态进行动态调整。\n4. 实时性：FreeRTOS 是硬实时，调度延迟微秒级且可预测；Linux 默认是软实时，调度延迟是毫秒级且不可精确预测。"
explanation: "在实际应用中，如果在 STM32 上运行 FreeRTOS 做电机控制，高优先级的任务能立即抢占其他任务进行响应，这保证了物理执行机构的安全与稳定。而在 Linux 上，普通进程哪怕设置了较高的优先级，也会因为系统负载较高、内核非抢占临界区等原因出现响应延迟，不适合用于要求微秒级响应强控的嵌入式场景。"
companies: ["dji"]
interviewYear: 2024
interviewRound: "一面"
isPremium: false
---
在 FreeRTOS 和 Linux 这类操作系统中，它们的任务/进程调度算法有什么主要的差异？请从调度目标、算法类型、优先级机制和实时性保障等方面进行对比。
