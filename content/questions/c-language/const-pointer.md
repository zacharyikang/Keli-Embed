---
id: "c-lang-const-001"
title: "const 指针辨析"
type: "concept"
direction: "c-language"
difficulty: "medium"
tags: ["const", "指针", "类型限定"]
answer: "1. const int *p（或 int const *p）：指针指向的内容不可修改，但指针本身可以指向别处。称为\"指向常量的指针\"。\n2. int * const p：指针本身是常量，不可指向别处，但可以修改指向的内容。称为\"常量指针\"。\n3. const int * const p：指针本身和指向的内容都不可修改。"
explanation: "阅读技巧：从右向左读，遇到 * 读作\"pointer to\"。const 修饰其右边的类型。在嵌入式开发中，const 用于将数据放到 Flash（.rodata 段），节省 RAM。"
companies: ["huawei"]
interviewYear: 2022
interviewRound: "笔试"
isPremium: false
---
请解释以下三种声明的区别：
const int *p;
int * const p;
const int * const p;
