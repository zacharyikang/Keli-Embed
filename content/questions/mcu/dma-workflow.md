---
id: "mcu-dma-workflow-001"
title: "DMA 的解决问题与工作流程"
type: "concept"
direction: "mcu"
difficulty: "medium"
tags: ["DMA", "MCU", "数据传输", "硬件外设"]
answer: "DMA（直接存储器访问）主要用来解决“CPU 在数据传输时被占用”的问题，允许外设与内存（或内存与内存）之间直接传输数据而无需 CPU 干预，从而解放了 CPU，提升系统整体并发与响应速度。\n以 ADC 循环采集为例，其大致工作流程为：\n1. 初始化：CPU 配置 DMA 控制器，设定数据源地址（如 ADC 数据寄存器 DR）、目标内存地址（如 SRAM 数组）、传输数据长度、数据宽度及传输方向。\n2. 触发传输：外设产生触发信号（如 ADC 转换完成请求），通知 DMA 开始传输。\n3. 数据传输：DMA 控制器接管总线，自动将数据从源地址写入目标地址，并递增目标地址、递减计数器。\n4. 传输完成：当计数器归零时，DMA 产生传输完成中断，通知 CPU 处理数据，期间 CPU 不需要全程参与传输过程。"
explanation: "掌握双缓冲区（Ping-Pong Buffer）与 DMA 半传输/传输完成中断的配合，是避免数据在传输与处理时冲突的常用高阶技巧。DMA 可让 CPU 在搬运大量数据时专注于其他计算任务（如姿态解算、控制算法或交互检测）。"
companies: ["dji"]
interviewYear: 2024
interviewRound: "一面"
isPremium: false
---
在嵌入式系统开发中，DMA（直接存储器访问）主要是用来解决什么问题的？请描述一下它大致的工作流程。
