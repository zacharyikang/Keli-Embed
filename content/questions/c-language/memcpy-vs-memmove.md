---
id: "c-lang-memcpy-memmove-001"
title: "memcpy 与 memmove 的本质区别与重叠处理"
type: "concept"
direction: "c-language"
difficulty: "medium"
tags: ["内存拷贝", "memcpy", "memmove", "内存重叠"]
answer: "1. memcpy 不处理源地址和目的地址重叠的情况，它直接单向拷贝。如果重叠可能导致数据被提前覆盖。\n2. memmove 会检查源和目的地址的相对位置，如果发生重叠，它会改变拷贝方向（从后往前拷），从而保证拷贝结果正确。"
explanation: "在标准 C 库中：\n- `memcpy` 假设 `src` 和 `dest` 不会发生内存重叠，以求达到最大化的拷贝性能。若发生重叠（如 `dest` 在 `src` 之后但差值小于拷贝长度），后面的拷贝会读到已经被覆盖的新数据，导致数据损毁。\n- `memmove` 则会主动做重叠检查：\n  - 当 `dest < src` 或 `dest >= src + count` 时，没有覆盖风险，直接由前向后复制。\n  - 当 `dest > src` 且 `dest < src + count` 时，发生了尾部重叠，`memmove` 会从后向前（从最后一个字节开始）逆向复制，确保尚未复制的内容不会被覆盖。\n\n手写 memmove 实现逻辑示例：\n```c\nvoid* my_memmove(void* dest, const void* src, size_t count) {\n    char* d = (char*)dest;\n    const char* s = (const char*)src;\n    if (d < s || d >= s + count) {\n        while (count--) {\n            *d++ = *s++;\n        }\n    } else {\n        d += count - 1;\n        s += count - 1;\n        while (count--) {\n            *d-- = *s--;\n        }\n    }\n    return dest;\n}\n```"
companies: ["byd", "zte", "baidu"]
interviewYear: 2024
interviewRound: "一面"
isPremium: false
---
简述 `memcpy` 与 `memmove` 函数的区别。为什么在源地址与目的地址发生重叠时，使用 `memcpy` 是危险的？请写出 `memmove` 解决内存重叠的基本逻辑。
