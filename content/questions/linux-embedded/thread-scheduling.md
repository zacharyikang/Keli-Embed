---
id: "linux-thread-sched-001"
title: "Linux 线程调度与单核并发实现"
type: "concept"
direction: "linux-embedded"
difficulty: "medium"
tags: ["Linux", "线程调度", "调度策略", "分时复用", "并发"]
answer: "Linux 里线程调度的核心是：内核把线程当成独立的调度实体，会给每个线程分配 CPU 时间片，通过切换线程执行来实现“并发”。\n单核 CPU 上没有真正的“同时”运行，而是靠 CPU 快速切换线程——每个线程执行一小段时间（时间片，比如 10ms）就被暂停，保存当前运行状态，然后加载下一个线程的状态继续执行。切换速度快到用户感觉不到，就像同时运行一样。"
explanation: "三个就绪线程谁先执行，取决于调度策略和线程优先级：\n1. SCHED_FIFO（先进先出）：实时策略。高优先级线程优先执行，直到它主动放弃或被更高优先级线程抢占。\n2. SCHED_RR（时间片轮转）：实时策略。同优先级线程按时间片轮流执行，避免单个线程独占 CPU。\n3. SCHED_OTHER（默认策略）：普通分时策略。基于完全公平调度（CFS）算法，根据 Nice 值动态分配 CPU 比例，保证各个任务获得公平的 CPU 执行时间。"
companies: ["dji"]
interviewYear: 2024
interviewRound: "一面"
isPremium: false
---
Linux里线程是怎么调度的？如果是在单核CPU上，多个线程如何实现“同时”运行？多个就绪线程谁先执行？取决于哪些调度策略？
