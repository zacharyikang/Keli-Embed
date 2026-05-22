---
id: "c-lang-pointer-arithmetic-001"
title: "经典指针与数组算术运算"
type: "choice"
direction: "c-language"
difficulty: "medium"
tags: ["指针运算", "数组退化", "地址操作"]
answer: "A"
explanation: "1. `a` 在作为值使用时会退化为指向数组首元素 `a[0]` 的指针（`int *` 类型），因此 `*(a + 1)` 指向的是 `a[1]`，其值为 2。\n2. `&a` 取的是整个数组的地址（其类型为指针 `int(*)[5]`）。当进行 `&a + 1` 运算时，指针会移动整个数组的大小（即 5 * sizeof(int) = 20 字节），指向数组 `a` 之后紧邻的内存位置。\n3. `(int *)(&a + 1)` 将其强制类型转换为整型指针 `ptr`。\n4. `ptr - 1` 将整型指针向前移动 1 个 `int` 大小（即 4 字节），正好指向数组的最后一个元素 `a[4]`。因此 `*(ptr - 1)` 的值是 5。"
choices: [{"id": "A", "text": "2, 5", "correct": true}, {"id": "B", "text": "2, 1", "correct": false}, {"id": "C", "text": "1, 5", "correct": false}, {"id": "D", "text": "2, 未定义随机值", "correct": false}]
companies: ["alibaba", "vivo"]
interviewYear: 2024
interviewRound: "笔试"
isPremium: false
---
在 32 位系统下运行以下代码，控制台打印输出的正确结果是：

```c
#include <stdio.h>

int main() {
    int a[5] = {1, 2, 3, 4, 5};
    int *ptr = (int *)(&a + 1);
    printf("%d, %d\n", *(a + 1), *(ptr - 1));
    return 0;
}
```
