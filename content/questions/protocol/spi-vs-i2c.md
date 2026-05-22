---
id: "protocol-spi-i2c-001"
title: "SPI 与 I2C 总线协议深度对比"
type: "concept"
direction: "protocol"
difficulty: "easy"
tags: ["SPI", "I2C", "通信协议", "硬件接口"]
answer: "1. 连线与寻址方式：SPI 是 4 线制协议（MOSI, MISO, SCLK, SS/CS），每个从设备都需要一根独立的片选（CS）硬连线，无需软件寻址；I2C 是 2 线制协议（SDA, SCL），所有设备共享两条线，通过软件协议中的设备地址（7 位或 10 位）进行硬件/软件寻址。\n2. 双工模式与速度：SPI 支持全双工（同时发送与接收），速度快，时钟频率可达几十 MHz；I2C 仅支持半双工（同一时刻只能单向传输），速度慢，标准模式 100 kHz，快速模式 400 kHz，高速模式可达 3.4 MHz。\n3. 电气特性：I2C 接口引脚采用开漏（Open-Drain）配置，总线上必须接上拉电阻，依靠上拉电阻将电平拉高，支持时钟拉伸（Clock Stretching）和多主共存；SPI 接口引脚一般是推挽输出（Push-Pull），驱动能力强，信号边沿陡峭。\n4. 可靠性与校验：I2C 协议在每个字节传输后都有一个 ACK/NACK 应答位，具有基本的握手机制；SPI 没有内置应答或底层校验机制，数据可靠性需要应用层控制。"
explanation: "在低引脚资源、多传感器板级连接时优先选择 I2C；在大数据量吞吐（如 TFT 显示屏、外部 Flash 存储器、SD 卡）时则必须选用 SPI。"
companies: ["huawei", "nvidia"]
interviewYear: 2024
interviewRound: "一面"
isPremium: false
---
请从引脚连线、双工模式、时钟速率、寻址方式、电气特性以及传输可靠性等方面，详细对比 SPI 与 I2C 通信协议的区别。

