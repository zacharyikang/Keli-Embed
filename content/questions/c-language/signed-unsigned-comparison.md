---
id: "c-lang-signed-unsigned-001"
title: "有符号与无符号隐式类型转换"
type: "choice"
direction: "c-language"
difficulty: "medium"
tags: ["隐式类型转换", "有符号", "无符号", "数据类型"]
answer: "A"
explanation: "在 C 语言中，当 `unsigned int` 和 `int` 进行混合运算或比较时，`int` 会被隐式转换为 `unsigned int`（符号位被当做数值位解析）：\n1. `unsigned int a = 6;`\n2. `int b = -20;` 在转换为无符号数时，补码 `0xFFFFFFEC` 被当做巨大的正整数（对于 32 位系统，值是 4294967276）。\n3. 因此 `a + b` 运算结果是一个极大的无符号数，一定大于 6。\n4. 控制台会打印出 `> 6`。"
choices: [{"id": "A", "text": "> 6", "correct": true}, {"id": "B", "text": "<= 6", "correct": false}, {"id": "C", "text": "输出未定义的值", "correct": false}, {"id": "D", "text": "编译报错，无法混合运算", "correct": false}]
companies: ["huawei", "byd", "zte"]
interviewYear: 2024
interviewRound: "笔试"
isPremium: false
---
运行以下 C 语言代码，控制台打印输出的正确结果是：

```c
#include <stdio.h>

int main() {
    unsigned int a = 6;
    int b = -20;
    if (a + b > 6) {
        printf("> 6\n");
    } else {
        printf("<= 6\n");
    }
    return 0;
}
```
