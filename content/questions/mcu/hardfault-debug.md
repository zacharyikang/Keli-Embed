---
id: "mcu-hardfault-debug-001"
title: "ARM Cortex-M HardFault 定位与栈回溯"
type: "concept"
direction: "mcu"
difficulty: "hard"
tags: ["ARM Cortex-M", "HardFault", "栈回溯", "调试", "MCU"]
answer: "定位 HardFault 的常用三种方法：\n1. 仿真器在线调试：在异常入口打断点，查看发生异常瞬间的 PC、LR 寄存器值，PC 所指的指令就是故障源头。\n2. 栈回溯：从栈内存中提取函数调用帧信息，恢复函数调用链。\n3. 记录日志：在代码中添加关键路径和死机前的数据输出到 Flash 或串口。\n栈回溯的核心思路：\nCortex-M 内核发生 HardFault 异常时，硬件会自动将关键寄存器（R0-R3, R12, LR, PC, xPSR）按顺序压入当前使用的栈中（根据状态可能为进程栈指针 PSP 或主栈指针 MSP，方向由高地址向低地址压栈）。调试时找到当前的 SP 指针，读取栈中的 PC 值即可准确定位导致崩溃的指令地址，读取 LR 可获取原函数的返回/调用地址。配合反汇编或编译器生成的 .map 文件，可直接锁定由于非法内存访问、数组越界或栈溢出导致的根本原因。"
explanation: "在实际调试中，可以通过异常返回时 LR（R14）的值（EXC_RETURN）判断压栈使用的是 MSP 还是 PSP：若第 2 位（bit 2）为 0，则压入了主栈 MSP，读取 MSP；若为 1 则压入了进程栈 PSP，读取 PSP。在对应的 SP 栈指针地址偏移处（一般 PC 在 SP+24，LR 在 SP+20 字节偏移处），提取出 PC 的 32 位地址，并在反汇编代码中搜索该地址，能极快找到导致死机的某行 C 代码。"
companies: ["dji"]
interviewYear: 2024
interviewRound: "一面"
isPremium: false
---
如果在 ARM Cortex-M 内核的系统中发生了 HardFault（硬故障）异常，你通常会通过什么方法来定位根本原因？栈回溯的思路是怎样的？
