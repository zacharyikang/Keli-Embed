---
id: "c-lang-volatile-001"
title: "volatile 关键字在中断与嵌入式开发中的作用"
type: "concept"
direction: "c-language"
difficulty: "easy"
tags: ["volatile", "中断", "编译器优化"]
answer: "volatile 关键字在嵌入式开发中的核心作用是：1. 告知编译器不要对该变量进行编译优化（禁止指令重排和寄存器高速缓存）。2. 保证变量的可见性：每次对该变量的读写操作都直接从物理内存地址中访问，而不是从寄存器缓存中获取。\n在中断服务程序（ISR）里经常用到它，是因为 ISR 和主程序是两个异步的执行流。如果主函数里有一个循环查询 ISR 修改的共享全局变量，且变量不加 volatile，编译器在优化代码时可能会认为主循环中未对该变量进行修改，从而将其值永久缓存到寄存器中，导致主循环永远读不到 ISR 中更新的值，引发死循环或功能失效。"
explanation: "在多线程共享变量、外设 DMA 搬运目标缓冲区或映射硬件寄存器（寄存器值会由硬件异步改变）时，都必须使用 volatile 保障读写的可见性。需要注意的是，在 C 语言中 volatile 仅限制编译器层面的指令重排与优化，并不等同于 CPU 级别的硬件内存屏障，若要防范 CPU 的流水线乱序执行，仍需结合具体的硬件屏障指令（如 ARM 中的 DMB/DSB/ISB）。"
companies: ["huawei", "dji"]
interviewYear: 2024
interviewRound: "一面"
isPremium: false
---
在嵌入式开发中，volatile 关键字有什么作用？为什么在中断服务程序（ISR）里修改的全局变量必须声明为 volatile？如果不加 volatile 会出现什么问题？
