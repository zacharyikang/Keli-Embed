---
id: "rtos-priority-inversion-001"
title: "RTOS 中的优先级翻转 (Priority Inversion) 机制"
type: "concept"
direction: "rtos"
difficulty: "hard"
tags: ["RTOS", "优先级翻转", "互斥锁", "任务调度"]
answer: "1. 定义与产生场景：优先级翻转指高优先级任务被低优先级任务阻塞，且被中等优先级任务抢占，导致高优先级任务被无限期延迟（无法满足硬实时 deadline）的异常调度现象。\n   * 经典场景：低优先级任务 L 获取共享资源锁（Mutex）后继续执行。此时高优先级任务 H 唤醒并抢占 L，也试图获取该锁。因锁被 L 持有，H 进入阻塞状态挂起。L 恢复执行准备释放锁。但在 L 释放前，不相关的中等优先级任务 M 抢占了低优先级的 L 并持续运行。由于 L 无法获取 CPU 执行时间来释放锁，H 也只能无限期等待，结果变成 M 优先于 H 运行。\n2. 解决方案：\n   * 优先级继承协议（Priority Inheritance Protocol, PIP）：当高优先级任务 H 在低优先级任务 L 持有的资源锁上阻塞时，RTOS 临时将 L 的优先级提升至与 H 相同的水平。这样 L 就不会被中等优先级任务 M 抢占。L 快速执行完毕并释放锁后，RTOS 再恢复 L 的原始优先级，高优先级任务 H 随即获取锁开始运行。\n   * 优先级天花板协议（Priority Ceiling Protocol, PCP）：给每个锁预先设定一个“优先级天花板”（即可能使用该锁的所有任务中的最高优先级）。一旦任务 L 获取了该锁，其优先级无条件直接提升至锁的天花板优先级。此方案除了防翻转，还能彻底避免多锁嵌套时的死锁。"
explanation: "经典的“火星探路者号”（Mars Pathfinder）由于系统底层的实时线程通信存在优先级翻转缺陷，导致主控系统发生看门狗复位。在 FreeRTOS 中，信号量（Semaphore）不支持优先级继承，而互斥量（Mutex）原生支持优先级继承，因此共享资源保护必须使用 Mutex。"
companies: ["dji", "google", "apple"]
interviewYear: 2024
interviewRound: "一面"
isPremium: false
---
请详细描述在实时操作系统（RTOS）中何为“优先级翻转（Priority Inversion）”现象，结合高、中、低三个优先级的任务说明其发生的典型场景，并解释解决该问题的“优先级继承协议”与“优先级天花板协议”的工作原理。

