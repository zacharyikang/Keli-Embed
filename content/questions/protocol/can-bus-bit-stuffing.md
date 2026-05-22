---
id: "protocol-can-bitstuff-001"
title: "CAN 总线的位填充 (Bit Stuffing) 机制"
type: "choice"
direction: "protocol"
difficulty: "hard"
tags: ["CAN", "位填充", "物理层", "同步"]
answer: "C"
explanation: "在 CAN 总线（如 CAN 2.0B）中，由于没有随路发送的时钟线，接收端需要通过检测差分电平的跳变沿来对系统时钟进行重同步。为防止数据帧中连续出现相同电平导致接收器丢失时钟同步，协议规定：发送器在输入位流中检测到连续 5 个相同极性的位（显性或隐性）后，必须自动插入 1 个相反极性的填充位。接收端在接收到位流中连续 5 个相同极性位后，也会自动剥离其后紧跟的那个相反极性填充位。"
choices: [{"id": "A", "text": "连续传输 3 个相同极性的位后插入 1 个相反极性的位", "correct": false}, {"id": "B", "text": "连续传输 4 个相同极性的位后插入 1 个相反极性的位", "correct": false}, {"id": "C", "text": "连续传输 5 个相同极性的位后插入 1 个相反极性的位", "correct": true}, {"id": "D", "text": "连续传输 6 个相同极性的位后插入 1 个相反极性的位", "correct": false}]
companies: ["byd", "catl", "tesla"]
interviewYear: 2023
interviewRound: "笔试"
isPremium: false
---
在 CAN 总线通信协议中，为了在没有独立时钟线的情况下实现收发端时钟的重同步，数据链路层采用了位填充（Bit Stuffing）机制。请问位填充的触发规则是：

