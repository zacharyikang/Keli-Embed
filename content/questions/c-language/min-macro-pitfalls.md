---
id: "c-lang-min-macro-001"
title: "MIN 宏定义坑点与安全改进"
type: "concept"
direction: "c-language"
difficulty: "medium"
tags: ["宏定义", "宏陷阱", "预处理", "typeof"]
answer: "1. 经典宏定义：#define MIN(A, B) ((A) <= (B) ? (A) : (B))。必须对参数及整个表达式加括号，防止优先级问题。\n2. 副作用：若传入自增操作，如 MIN(++a, b)，在比较和返回时，++a 会被执行两次，导致 a 被错误累加。\n3. GCC 安全设计：利用 GNU C 声明表达式和 typeof 关键字，引入局部临时变量，只计算一次参数。"
explanation: "当使用最基础的宏定义时：\n`#define MIN(A, B) ((A) <= (B) ? (A) : (B))`\n如果调用 `MIN(++a, b)`，展开后为 `((++a) <= (b) ? (++a) : (b))`。如果 `++a` 确实小于 `b`，则 `++a` 在条件成立后又被执行了一次，导致最终 a 增加了 2。而我们预期的行为是只自增 1 次。\n\n为了避免这种多重求值的副作用，可以使用 GCC 的特殊语法扩充（typeof 关键字和语句表达式）：\n```c\n#define MIN(A, B) ({ \\\n    typeof(A) _a = (A); \\\n    typeof(B) _b = (B); \\\n    _a <= _b ? _a : _b; \\\n})\n```\n通过将 A 和 B 缓存到局部临时变量 `_a` 和 `_b` 中，自增操作 `++a` 只在初始化临时变量时求值一次，从而避免了多重自增产生的副作用。"
companies: ["huawei", "dji", "nvidia"]
interviewYear: 2024
interviewRound: "二面"
isPremium: false
---
写一个标准宏 `MIN`，计算两个数中的最小值，并分析如果在调用该宏时传入带有副作用的表达式（例如 `MIN(++a, b)`）会发生什么问题，以及在 GCC 中如何使用 `typeof` 来规避这种问题？
