---
id: "c-lang-static-001"
title: "static 关键字三种用法"
type: "concept"
direction: "c-language"
difficulty: "easy"
tags: ["static", "作用域", "生命周期"]
answer: "1. 静态局部变量：在函数内声明，生命周期为整个程序运行期，但作用域仅限于该函数。用于保持函数调用之间的状态。\n2. 静态全局变量/函数：在文件作用域声明，限制符号的可见性为本编译单元（.c 文件），实现信息隐藏。\n3. 静态成员（C++ 中）：属于类而非对象，所有实例共享一份。"
explanation: "static 的核心是改变符号的链接属性（linkage）和存储周期（storage duration）。在嵌入式系统中常用于模块内部状态保持和接口封装。"
companies: ["huawei", "hikvision"]
interviewYear: 2023
interviewRound: "一面"
isPremium: false
---
请说明 C 语言中 static 关键字的三种主要用法及其作用。
