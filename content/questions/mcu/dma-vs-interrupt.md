---
id: "mcu-dma-interrupt-001"
title: "DMA 与中断数据传输方式的对比"
type: "concept"
direction: "mcu"
difficulty: "medium"
tags: ["DMA", "中断", "STM32", "缓存一致性"]
answer: "1. CPU 参与度：中断传输方式下，每传输一个数据（字节/字）就需要触发一次中断，CPU 必须暂停当前程序并执行中断服务程序（ISR）来搬运数据，CPU 开销极大；DMA（直接内存访问）方式下，数据搬运完全由 DMA 控制器硬件执行，不经过 CPU。CPU 仅在传输启动前进行配置，并在整体传输完成时处理一次中断，极大降低了 CPU 负载。\n2. 适用场景：中断适用于数据量小、发生频率低或实时响应要求极高的场景（如按键触发、传感器报警、I2C 字节应答）；DMA 适用于大数据量、高速连续传输的场景（如 ADC 连续多通道采集、SPI/UART 数据帧收发、显示屏刷屏）。\n3. 缓存一致性（Cache Coherency）问题：在带有 Cache 的高性能 MCU（如 ARM Cortex-M7）中，DMA 将外设数据直接写入 SRAM 中，而 CPU 仍可能从缓存（D-Cache）中读取旧数据。解决此问题需要在 CPU 读取 DMA 接收区前手动执行 Cache Invalidate（使无效操作），或者通过 MPU（内存保护单元）将该 DMA 缓冲区配置为非缓存属性（Non-cacheable）。"
explanation: "掌握双缓冲区（Ping-Pong Buffer）是 DMA 高阶开发的核心。DMA 通过半传输中断（Half-Transfer）与传输完成中断（Transfer Complete）配合，可以在填充缓冲区前半部分时由 CPU 处理后半部分，实现无缝连续数据流传输。"
companies: ["dji", "nvidia"]
interviewYear: 2024
interviewRound: "一面"
isPremium: false
---
请简述在微控制器（MCU）开发中，中断驱动的数据传输方式与直接内存访问（DMA）数据传输方式的核心区别，并说明在高性能 MCU 中使用 DMA 时常遇到的“缓存一致性（Cache Coherency）”问题及其解决方法。

