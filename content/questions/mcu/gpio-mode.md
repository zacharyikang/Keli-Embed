---
id: "mcu-gpio-001"
title: "GPIO 的推挽输出与开漏输出"
type: "concept"
direction: "mcu"
difficulty: "medium"
tags: ["GPIO", "推挽", "开漏", "硬件基础"]
answer: "推挽输出（Push-Pull）可以主动输出高电平和低电平，驱动能力强；开漏输出（Open-Drain）只能主动输出低电平，输出高电平需要外部上拉电阻，适用于电平转换或线与（Wired-AND）逻辑。"
explanation: "推挽使用两个互补的 MOS 管；开漏只使用一个下方的 MOS 管。开漏在多设备通信（如 I2C）中非常重要。"
companies: ["hikvision", "byd"]
interviewYear: 2024
interviewRound: "一面"
isPremium: false
---
请解释 GPIO 的推挽输出（Push-Pull）和开漏输出（Open-Drain）的区别，并说明各自的应用场景。
