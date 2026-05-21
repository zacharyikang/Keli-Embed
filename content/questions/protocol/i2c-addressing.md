---
id: "protocol-i2c-001"
title: "I2C 协议的起始和停止信号"
type: "concept"
direction: "protocol"
difficulty: "easy"
tags: ["I2C", "通信协议", "波形"]
answer: "起始信号（Start）：在 SCL 为高电平时，SDA 由高电平跳变到低电平；停止信号（Stop）：在 SCL 为高电平时，SDA 由低电平跳变到高电平。"
explanation: "这是 I2C 协议中唯二允许在 SCL 高电平时改变 SDA 状态的情况，其他数据传输必须在 SCL 低电平时改变 SDA。"
companies: ["xiaomi", "hikvision"]
interviewYear: 2022
interviewRound: "笔试"
isPremium: false
---
请描述 I2C 总线通信中“起始信号”和“停止信号”的具体电平跳变逻辑。
