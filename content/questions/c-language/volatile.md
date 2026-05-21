---
id: "c-lang-volatile-001"
title: "volatile 关键字在中断中的作用"
type: "concept"
direction: "c-language"
difficulty: "easy"
tags: ["volatile", "中断", "编译器优化"]
answer: "volatile 告诉编译器不要对该变量进行优化，每次访问都必须从内存地址重新读取，而不是使用寄存器缓存的值。在 ISR 中修改的全局变量如果不加 volatile，编译器可能将变量缓存在寄存器中，导致主循环永远读不到 ISR 更新的值。"
explanation: "编译器在优化级别较高时会将频繁访问的变量缓存在寄存器中。ISR 是异步执行的，编译器无法预见 ISR 何时修改该变量，因此需要 volatile 强制每次从内存读取。"
companies: ["huawei", "dji"]
interviewYear: 2023
interviewRound: "笔试"
isPremium: false
---
在嵌入式系统中，为什么中断服务函数（ISR）中修改的全局变量必须声明为 volatile？如果不加 volatile 会出现什么问题？
