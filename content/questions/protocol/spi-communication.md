---
id: "protocol-spi-comm-001"
title: "SPI 通信基本过程与速率配置"
type: "concept"
direction: "protocol"
difficulty: "easy"
tags: ["SPI", "通信协议", "时钟配置", "CPOL", "CPHA"]
answer: "SPI 是主从式同步串行通信。基本过程是：主设备拉低片选信号（CS/SS）选中从设备，然后产生 SCLK 时钟信号，在时钟的特定边沿（上升沿或下降沿），主从设备通过 MOSI 和 MISO 线同步移入和移出数据，完成数据传输。SPI 最少需要 4 根线：SCLK（时钟）、MOSI（主发从收）、MISO（主收从发）、CS（片选）。\n实际项目中配置速率：首先根据从设备数据手册确定其支持的最大速率限制，然后配置主设备（如 MCU）SPI 外设的分频系数（Prescaler），使分频后的 SPI 速率低于从设备上限，并保证物理信号波形上升沿陡峭且稳定。"
explanation: "SPI 工作模式由以下两个参数的 4 种组合决定，主从设备必须配置一致：\n1. CPOL（时钟极性）：决定空闲时的电平。CPOL=0 为低电平，CPOL=1 为高电平。\n2. CPHA（时钟相位）：决定在哪个边沿采样。CPHA=0 在第一个边沿（奇数沿）采样，CPHA=1 在第二个边沿（偶数沿）采样。"
companies: ["dji"]
interviewYear: 2024
interviewRound: "一面"
isPremium: false
---
请简述 SPI 通信的基本过程。它最少需要几根线？在实际项目中，应该如何配置通信速率？工作模式由哪些参数决定？
