---
id: "c-lang-stack-heap-001"
title: "栈 (Stack) 与堆 (Heap) 的区别"
type: "concept"
direction: "c-language"
difficulty: "medium"
tags: ["内存管理", "栈", "堆", "内存碎片"]
answer: "1. 分配方式：栈由编译器自动分配和释放，用于存放局部变量、函数参数和返回地址；堆由程序员手动申请（如 malloc/new）和释放（如 free/delete）。\n2. 申请效率：栈使用 CPU 专用寄存器（如 SP）和指令（Push/Pop）直接操作，速度极快且完全确定；堆由内存管理算法在运行时寻找空闲块，速度较慢且耗时具有不确定性。\n3. 空间大小：栈的空间通常较小且在编译/链接时固定（由启动文件或链接脚本配置）；堆的空间通常较大，取决于物理 RAM 大小。\n4. 安全与碎片：栈的分配是连续的，不会产生碎片，但存在栈溢出（Stack Overflow）导致系统崩溃的风险；堆频繁分配释放会产生大量外部内存碎片，导致长期运行的嵌入式系统可能因无法分配出连续内存而报错。"
explanation: "在嵌入式/硬实时系统中，通常会限制甚至完全禁止使用堆（malloc），以保证代码的执行时间可确定（Deterministic）并规避内存碎片及内存泄漏问题。若必须使用，建议使用 RTOS 提供的静态内存池（Memory Pool）进行代替。"
companies: ["huawei", "byd"]
interviewYear: 2023
interviewRound: "一面"
isPremium: false
---
请从分配方式、申请效率、空间大小以及内存碎片/安全性等维度，简述嵌入式开发中栈（Stack）与堆（Heap）的区别。

