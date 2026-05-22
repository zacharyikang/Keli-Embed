---
id: "c-lang-pragma-pack-001"
title: "pragma pack 对结构体大小的影响"
type: "choice"
direction: "c-language"
difficulty: "medium"
tags: ["pragma pack", "结构体对齐", "内存对齐"]
answer: "A"
explanation: "在 32 位嵌入式系统中，虽然默认采用 4 字节对齐，但由于使用了 `#pragma pack(1)`，编译器会将对齐值修改为 1 字节。这意味着：\n1. char type 占用 1 字节（偏移量为 0）。\n2. int payload 按照 1 字节对齐，不需要填充字节，直接从偏移量 1 开始占用 4 字节（偏移量 1~4）。\n3. short checksum 按照 1 字节对齐，直接占用 2 字节（偏移量 5~6）。\n4. 结构体整体也按照 1 字节对齐，不需要在末尾进行任何填充。因此，sizeof(struct Packet) 的大小为 1 + 4 + 2 = 7 字节。"
choices: [{"id": "A", "text": "7 字节", "correct": true}, {"id": "B", "text": "8 字节", "correct": false}, {"id": "C", "text": "10 字节", "correct": false}, {"id": "D", "text": "12 字节", "correct": false}]
companies: ["zte", "meituan"]
interviewYear: 2023
interviewRound: "笔试"
isPremium: false
---
在 32 位嵌入式系统编译器下，使用 `#pragma pack(1)` 指令后，以下结构体占用内存的实际大小（即 `sizeof(struct Packet)`）是多少字节？

```c
#pragma pack(1)
struct Packet {
    char type;
    int payload;
    short checksum;
};
#pragma pack()
```
