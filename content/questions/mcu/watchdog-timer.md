---
id: "mcu-watchdog-timer-001"
title: "看门狗 IWDG 与 WWDG 的特征辨析"
type: "choice"
direction: "mcu"
difficulty: "medium"
tags: ["看门狗", "IWDG", "WWDG", "安全性"]
answer: "B"
explanation: "1. 独立看门狗（IWDG）：由专用的低速内部时钟（LSI，如 32kHz 或 40kHz）驱动。即使主时钟（HCLK）损坏，IWDG 仍然能够工作。它是一个递减计数器，只要在计数到 0 之前喂狗即可。\n2. 窗口看门狗（WWDG）：由主时钟分频后的 APB1 时钟驱动。计数器值必须在指定的“时间窗口”内进行刷新。如果在上限（窗口寄存器值）之前或在下限（0x3F）之后喂狗，均会触发 MCU 复位。这能有效防止由于程序跑飞但进入死循环定时喂狗的极端异常情况。"
choices: [{"id": "A", "text": "IWDG 使用系统高速主时钟（HCLK）驱动，以保证定时的高精度", "correct": false}, {"id": "B", "text": "WWDG 必须在特定的时间窗口内进行刷新，过早或过晚喂狗均会触发复位", "correct": true}, {"id": "C", "text": "当 CPU 进入 Sleep 低功耗模式时，IWDG 和 WWDG 均会自动暂停计数", "correct": false}, {"id": "D", "text": "WWDG 可以随时喂狗，没有任何最早刷新时间的限制", "correct": false}]
companies: ["huawei", "byd"]
interviewYear: 2023
interviewRound: "笔试"
isPremium: false
---
关于微控制器（如 STM32）中的独立看门狗（IWDG）和窗口看门狗（WWDG），下列说法中正确的是：

