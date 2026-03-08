# 📘 JavaScript: The Hard Parts, v2 — Study Documents

> **Khoá học**: [JavaScript: The Hard Parts, v2](https://frontendmasters.com/courses/javascript-hard-parts-v2/) — Frontend Masters
>
> **Giảng viên**: Will Sentance (CEO, Codesmith)
>
> **Ngôn ngữ tài liệu**: Tiếng Việt 🇻🇳 (giữ thuật ngữ kỹ thuật tiếng Anh)
>
> **Phương pháp**: Giải thích chi tiết + ASCII diagrams + Code tự implement + 6 Deep Analysis Patterns

---

## 📑 Mục Lục Tổng Hợp

### Phần 0: Giới Thiệu

| #   | Bài học                                                 | Nội dung chính                                    |
| --- | ------------------------------------------------------- | ------------------------------------------------- |
| 0   | [Introduction & Overview](./0-Introduction-Overview.md) | Tổng quan khoá học, 5 trụ cột JS, phương pháp học |

---

### Phần 1: JavaScript Principles — Execution Context & Call Stack

| #   | Bài học                                       | Nội dung chính                                                 |
| --- | --------------------------------------------- | -------------------------------------------------------------- |
| 1   | [Execution Context](./1-Execution-Context.md) | Thread of Execution, Memory, Global EC, Function EC            |
| 1.2 | [Call Stack](./1.2-Call-Stack.md)             | LIFO, Big Three (Thread + Memory + Call Stack), Stack Overflow |

---

### Phần 2: Higher-Order Functions & Callbacks

| #   | Bài học                                                           | Nội dung chính                                                 |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| 2   | [HOF — Why Generalize?](./2-HOF-Why-Generalize.md)                | DRY, 3 cấp generalization, First-class functions               |
| 2.2 | [Copy Array → HOF](./2.2-Copy-Array-To-HOF.md)                    | copyArrayAndMultiplyBy2 → DRY violation → HOF solution         |
| 2.3 | [Pass Function As Argument](./2.3-Pass-Function-As-Argument.md)   | copyArrayAndManipulate trace, label transformation             |
| 2.4 | [Declarative & Readable Code](./2.4-Declarative-Readable-Code.md) | First-class objects, HOF vs callback, declarative style        |
| 2.5 | [Arrow Functions](./2.5-Arrow-Functions.md)                       | 4 versions of syntax, .map(), this binding, implicit return    |
| 2.6 | [Non-Mutating Array Methods](./2.6-Non-Mutating-Array-Methods.md) | ES2023 toReversed/toSorted/toSpliced, flat, groupBy            |
| 2.7 | [Pair Programming](./2.7-Pair-Programming.md)                     | Navigator/Driver, technical communication, practice challenges |

---

### Phần 3: Closure — Persistent Memory 🎒

| #   | Bài học                                                                       | Nội dung chính                                               |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 3   | [Closure Introduction](./3-Closure-Introduction.md)                           | Vấn đề (temp memory bị xoá), giải pháp (persistent backpack) |
| 3.2 | [Return A Function](./3.2-Return-A-Function.md)                               | createFunction → generatedFunc, FKA concept                  |
| 3.3 | [Calling Function Within Function](./3.3-Calling-Function-Within-Function.md) | Lexical vs Dynamic scope, câu hỏi quyết định                 |
| 3.4 | [Function Scope Backpack ⭐](./3.4-Function-Scope-Backpack.md)                | **THE REVEAL**: Hidden bond, [[Environment]], backpack 🎒    |
| 3.5 | [Function Scope Q&A](./3.5-Function-Scope-QA.md)                              | Two types of memory, selective closure, GC optimization      |
| 3.6 | [Closure Scope](./3.6-Closure-Scope.md)                                       | [[Scope]], C.O.V.E., P.L.S.R.D., thuật ngữ chính thức        |
| 3.7 | [Multiple Closures](./3.7-Multiple-Closures.md)                               | 2 backpacks độc lập, what-if scenarios (local/global)        |
| 3.8 | [Multiple Closures Q&A](./3.8-Multiple-Closures-QA.md)                        | outer = no backpack, zero relationship, GC, IIFE module      |
| 3.9 | [Closure Use Cases](./3.9-Closure-Use-Cases.md)                               | once, memoize, iterator, generator, module pattern, async    |

---

## 📊 Tiến Độ

| Phần | Chủ đề                  | Số bài | Trạng thái      |
| ---- | ----------------------- | ------ | --------------- |
| 0    | Introduction            | 1      | ✅ Hoàn thành   |
| 1    | JS Principles           | 2      | ✅ Hoàn thành   |
| 2    | Higher-Order Functions  | 7      | ✅ Hoàn thành   |
| 3    | Closure                 | 9      | ✅ Hoàn thành   |
| 4    | Asynchronous JavaScript | —      | ⬜ Chưa bắt đầu |
| 5    | Promises                | —      | ⬜ Chưa bắt đầu |
| 6    | Classes & Prototypes    | —      | ⬜ Chưa bắt đầu |

**Tổng cộng**: 19 / ~35 bài · **Hoàn thành ~54%**

---

## 🧠 6 Deep Analysis Patterns

Mỗi bài học đều áp dụng 6 patterns phân tích sâu:

| #   | Pattern                 | Mô tả                                              |
| --- | ----------------------- | -------------------------------------------------- |
| ①   | **5 Whys**              | Hỏi "tại sao?" 5 lần → đến gốc rễ vấn đề           |
| ②   | **First Principles**    | Phân tích từ ECMAScript spec, V8 internals         |
| ③   | **Trade-off Analysis**  | So sánh ưu/nhược điểm các approach                 |
| ④   | **Mental Mapping**      | Map concept → real-world codebase (React, Express) |
| ⑤   | **Reverse Engineering** | Tự build lại cơ chế từ đầu, chứng minh hoạt động   |
| ⑥   | **History & Evolution** | Lịch sử phát triển concept trong CS                |

---

## 🔗 Tài Nguyên

- [Khoá học trên Frontend Masters](https://frontendmasters.com/courses/javascript-hard-parts-v2/)
- [Slides (Google Drive)](https://static.frontendmasters.com/resources/2019-09-18-javascript-hard-parts-v2/javascript-hard-parts-v2.pdf)
- [ECMAScript Specification](https://tc39.es/ecma262/)
- [You Don't Know JS — Kyle Simpson](https://github.com/getify/You-Dont-Know-JS)
