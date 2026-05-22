---
id: "c-lang-char-ptr-001"
title: "字符数组与字符指针的区别"
type: "choice"
direction: "c-language"
difficulty: "medium"
tags: ["字符数组", "字符指针", "内存分区", "sizeof"]
answer: "B"
explanation: "C 语言中对字符数组和字符指针的初始化存在根本区别：\n1. `char str1[] = \"hello\";` 在栈上分配一个包含 6 个元素的字符数组（包含末尾的 \\0 结束符），因此 `sizeof(str1)` 为 6。对 `str1[0] = 'H'` 是合法且安全的。\n2. `char *str2 = \"hello\";` 在栈上分配一个指针变量 `str2`，该指针指向保存在只读常量区（.rodata 段）的字符串常量 `\"hello\"`。在 32 位系统下，指针大小为 4 字节，故 `sizeof(str2)` 为 4。对 `str2[0] = 'H'` 会触发系统异常（如 Segmentation Fault），因为不能修改只读内存。"
choices: [{"id": "A", "text": "str1 和 str2 中的字符都可以通过下标进行安全修改", "correct": false}, {"id": "B", "text": "sizeof(str1) 值为 6，而在 32 位系统下 sizeof(str2) 值为 4", "correct": true}, {"id": "C", "text": "str1 存储在只读常量区，而 str2 存储在栈区", "correct": false}, {"id": "D", "text": "使用 == 比较两个相同的声明（如 str1 == \"hello\" 和 str2 == \"hello\"）结果都会是 true", "correct": false}]
companies: ["intel", "amd"]
interviewYear: 2024
interviewRound: "笔试"
isPremium: false
---
在 32 位系统下，有以下两个声明：

```c
char str1[] = "hello";
char *str2 = "hello";
```

关于这两个声明的区别，以下哪项叙述是正确的？
