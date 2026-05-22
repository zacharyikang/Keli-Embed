---
id: "c-lang-endianness-001"
title: "大小端字节序检测"
type: "concept"
direction: "c-language"
difficulty: "medium"
tags: ["字节序", "大端", "小端", "union", "指针"]
answer: "1. 指针法：利用 int 型变量地址强制转换为 char* 指针，读取首字节内容判定。\n2. 联合体法：利用 union 所有成员共享起始地址的特性，通过对不同成员的读写来判定。"
explanation: "大小端是指多字节数据在内存中的存放顺序。小端（Little-Endian）是低位字节存在低地址，大端（Big-Endian）是高位字节存在低地址。大部分 ARM 和 x86 芯片默认为小端。\n\n指针法示例代码：\n```c\nint is_little_endian() {\n    int val = 1;\n    return *(char *)&val == 1; // 若首字节为 1 则是小端\n}\n```\n\n联合体法示例代码：\n```c\nint is_little_endian_union() {\n    union {\n        int val;\n        char c;\n    } test;\n    test.val = 1;\n    return test.c == 1;\n}\n```"
companies: ["huawei", "xiaomi", "dji"]
interviewYear: 2024
interviewRound: "一面"
isPremium: false
---
请编写一个 C 语言程序来检测当前 CPU 是大端字节序（Big-Endian）还是小端字节序（Little-Endian）。请给出两种不同的实现方式（如指针强制类型转换、联合体 union），并解释其底层工作原理。
