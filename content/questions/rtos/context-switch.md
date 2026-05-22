---
id: "rtos-context-switch-001"
title: "RTOS 任务上下文切换的内容"
type: "choice"
direction: "rtos"
difficulty: "medium"
tags: ["RTOS", "上下文切换", "Cortex-M", "寄存器"]
answer: "C"
explanation: "在 ARM Cortex-M 架构的 RTOS 上下文切换过程中，当前任务的执行现场（CPU 寄存器状态）必须被保存到该任务的私有栈中：\n1. 硬件自动压栈：当进入挂起的 PendingSV 中断时，Cortex-M 硬件会自动将 xPSR、PC (R15)、LR (R14)、R12 以及 R0~R3 压入当前任务的栈中。\n2. 软件手动压栈：在 PendSV 中断服务程序中，RTOS 调度器（汇编代码）会手动将剩余的 CPU 寄存器 R4~R11 以及可能存在的 FPU 浮点寄存器（如果启用了硬件浮点）压入任务栈中，最后保存任务栈指针 SP 并切换到新任务。\n整个 RAM 的全局/静态变量和代码段不需要也不应该被搬运或保存。"
choices: [{"id": "A", "text": "仅保存程序计数器 (PC)，因为通过 PC 就可以恢复代码执行位置", "correct": false}, {"id": "B", "text": "仅保存栈指针 (SP)，其余 CPU 寄存器均由硬件自动保存", "correct": false}, {"id": "C", "text": "保存程序计数器 (PC)、链接寄存器 (LR)、状态寄存器 (xPSR) 以及通用的 CPU 寄存器 (R0~R12)", "correct": true}, {"id": "D", "text": "保存该任务在 RAM 中分配的所有代码与局部变量的全部物理内存拷贝", "correct": false}]
companies: ["huawei", "dji", "nvidia"]
interviewYear: 2024
interviewRound: "笔试"
isPremium: false
---
在基于 ARM Cortex-M 内核的微控制器上运行的实时操作系统（RTOS，如 FreeRTOS）中，当触发任务上下文切换（Context Switch）时，以下哪项内容必须被保存到被挂起任务的任务栈（Task Stack）中以用于恢复现场？

