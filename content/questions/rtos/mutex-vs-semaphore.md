---
id: "rtos-sync-001"
title: "互斥量与信号量的区别"
type: "concept"
direction: "rtos"
difficulty: "hard"
tags: ["RTOS", "互斥量", "信号量", "优先级翻转"]
answer: "互斥量（Mutex）具有所有权概念，主要用于互斥访问共享资源，且通常支持优先级继承机制以防止优先级翻转；信号量（Semaphore）主要用于任务同步或资源计数，不具备所有权，也不支持优先级继承。"
explanation: "优先级继承是互斥量的重要特性：当高优先级任务等待互斥量时，持有该互斥量的低优先级任务会临时提升至高优先级。"
companies: ["dji"]
interviewYear: 2023
interviewRound: "二面"
isPremium: false
---
在 RTOS 中，互斥量（Mutex）和二值信号量（Binary Semaphore）在功能和实现上有哪些本质区别？
