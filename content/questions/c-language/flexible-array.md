---
id: "c-lang-flexible-array-001"
title: "柔性数组的定义、大小计算与使用"
type: "concept"
direction: "c-language"
difficulty: "hard"
tags: ["柔性数组", "结构体", "内存管理", "C99"]
answer: "1. 柔性数组成员是结构体中最后一个长度未知的数组（例如 `char data[];`）。\n2. 结构体大小计算时不包含柔性数组所占的空间（即 `sizeof(struct Packet)` 等于前面成员的大小）。\n3. 通过一次性 `malloc(sizeof(struct Packet) + array_length)` 进行动态内存分配，实现结构体和变长数据的内存连续性，避免二次申请和内存碎片。"
explanation: "柔性数组成员（Flexible Array Member）是 C99 标准引入的。在很多网络协议包或串口通信包中，包头是固定的，而负载数据长度是可变的，这时使用柔性数组非常合适。\n\n**使用示例：**\n```c\nstruct Packet {\n    int length;       // 4 字节\n    char payload[];   // 柔性数组，不占结构体空间\n};\n```\n这里 `sizeof(struct Packet)` 的结果是 4 字节（仅计算 int 成员，不包含 payload）。\n\n**分配空间代码：**\n```c\nint data_size = 100;\nstruct Packet *p = (struct Packet*)malloc(sizeof(struct Packet) + data_size);\np->length = data_size;\n// payload 现在拥有 100 字节的连续可用空间\nstrcpy(p->payload, \"hello world\");\n```\n**优势：**\n1. **释放方便**：只需要执行一次 `free(p)`，如果使用指针 `char *payload`，则需要先释放 payload 再释放 p，容易导致内存泄漏。\n2. **内存连续**：提升 CPU 缓存（Cache）命中率，且减少内存碎片。"
companies: ["huawei", "nvidia", "intel"]
interviewYear: 2024
interviewRound: "二面"
isPremium: false
---
什么是 C 语言中的“柔性数组”（Flexible Array）？请写出含有柔性数组的结构体定义，并说明在计算结构体大小时柔性数组的影响，以及如何正确地为它分配和释放内存。
