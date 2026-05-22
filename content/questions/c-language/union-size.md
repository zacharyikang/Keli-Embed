---
id: "c-lang-union-size-001"
title: "联合体 (union) 大小计算"
type: "choice"
direction: "c-language"
difficulty: "medium"
tags: ["union", "联合体", "大小计算", "内存对齐"]
answer: "B"
explanation: "联合体（union）的大小计算遵循以下原则：\n1. 联合体的大小至少要能够容纳其最大的成员。最大成员是 `char c[9]`，其大小为 9 字节。\n2. 联合体总大小必须是其内部最大对齐基本类型的倍数。成员基本类型中，`int b` 的对齐要求为 4 字节，`char` 的对齐要求为 1 字节。因此联合体的最大对齐数是 4。\n3. 大小 9 必须向上舍入到最大对齐数 4 的整数倍，即最小为 12 字节。\n因此 `sizeof(union Data)` 的值 is 12。"
choices: [{"id": "A", "text": "9 字节", "correct": false}, {"id": "B", "text": "12 字节", "correct": true}, {"id": "C", "text": "16 字节", "correct": false}, {"id": "D", "text": "20 字节", "correct": false}]
companies: ["dji", "xiaomi"]
interviewYear: 2023
interviewRound: "笔试"
isPremium: false
---
在 32 位嵌入式系统中，以下联合体在内存中实际占用的空间大小（即 `sizeof(union Data)`）是多少字节？

```c
union Data {
    char a;
    int b;
    char c[9];
};
```
