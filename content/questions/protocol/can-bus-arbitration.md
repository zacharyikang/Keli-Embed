---
id: "protocol-can-001"
title: "CAN 总线的非破坏性仲裁机制"
type: "concept"
direction: "protocol"
difficulty: "hard"
tags: ["CAN", "仲裁", "标识符", "显性隐性"]
answer: "CAN 总线采用线与逻辑，0 为显性（占据总线），1 为隐性。多个节点同时发送时，逐位比较标识符（ID）。发送 1 的节点若检测到总线为 0，则发现冲突并主动退出，ID 越小的节点优先级越高，且不会破坏正在发送的高优先级帧。"
explanation: "这种机制确保了总线利用率，在高负载下依然能保证高优先级消息的实时性。"
companies: ["byd", "huawei"]
interviewYear: 2024
interviewRound: "一面"
isPremium: false
---
请详细解释 CAN 总线是如何通过标识符（ID）实现多节点无冲突仲裁的。
