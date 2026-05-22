---
id: "c-lang-struct-padding-001"
title: "结构体内存对齐与字节填充"
type: "choice"
direction: "c-language"
difficulty: "medium"
tags: ["结构体", "内存对齐", "字节填充"]
answer: "C"
explanation: "在 32 位嵌入式系统中，默认采用 4 字节对齐机制：\n1. char a 占用 1 字节（偏移量为 0）。\n2. int b 需要 4 字节对齐，因此在其前填充 3 个空闲字节，自偏移量 4 开始占用 4 字节（占用偏移量 4~7）。\n3. short c 占用 2 字节（偏移量为 8~9）。\n4. 结构体整体对齐标准取决于最大基本类型成员（这里为 int，4 字节），所以总大小必须是 4 的整数倍。因此在末尾填充 2 字节以凑齐 12 字节（占用偏移量 10~11）。"
choices: [{"id": "A", "text": "7 字节", "correct": false}, {"id": "B", "text": "8 字节", "correct": false}, {"id": "C", "text": "12 字节", "correct": true}, {"id": "D", "text": "16 字节", "correct": false}]
companies: ["tencent", "xiaomi"]
interviewYear: 2024
interviewRound: "笔试"
isPremium: false
---
在 32 位嵌入式系统（默认 4 字节对齐）中，有如下结构体定义。请问该结构体变量在内存中实际占用的空间大小是多少字节？

```c
struct Sample {
    char a;
    int b;
    short c;
};
```

