# AST (Abstract Syntax Tree) — Nền Tảng Của Front-end Engineering

> Tìm hiểu sâu về AST và các ứng dụng rộng rãi trong thực tế.
> Độ khó: ⭐️⭐️⭐️ | Thời gian đọc: ~43 phút

---

## Table of Contents

1. [Giới Thiệu](#1-giới-thiệu)
2. [AST Là Gì?](#2-ast-là-gì)
3. [Viết Compiler Từ Đầu](#3-viết-compiler-từ-đầu)
4. [Babel — Nền Tảng Ứng Dụng AST](#4-babel--nền-tảng-ứng-dụng-ast)
5. [Ứng Dụng: Đổi Tên Hàm Với Babel](#5-ứng-dụng-đổi-tên-hàm-với-babel)
6. [Ứng Dụng: Viết Plugin Chuyển Arrow Function (Đơn Giản)](#6-ứng-dụng-viết-plugin-chuyển-arrow-function-đơn-giản)
7. [Ứng Dụng: Viết Plugin Chuyển Arrow Function (Phức Tạp — this)](#7-ứng-dụng-viết-plugin-chuyển-arrow-function-phức-tạp--this)
8. [Ứng Dụng: Plugin console.log Thông Minh](#8-ứng-dụng-plugin-consolelog-thông-minh)
9. [Ứng Dụng: Plugin Log Upload Cho Monitoring System](#9-ứng-dụng-plugin-log-upload-cho-monitoring-system)
10. [Ứng Dụng: Viết ESLint Đơn Giản](#10-ứng-dụng-viết-eslint-đơn-giản)
11. [Ứng Dụng: Nén Code Với AST](#11-ứng-dụng-nén-code-với-ast)
12. [Ứng Dụng: Plugin Import On-Demand](#12-ứng-dụng-plugin-import-on-demand)
13. [Ứng Dụng: TypeScript Type Validation](#13-ứng-dụng-typescript-type-validation)
14. [Best Practices](#14-best-practices)
15. [Tổng Kết](#15-tổng-kết)

---

## 1. Giới Thiệu

Đọc xong bài viết này, bạn sẽ trả lời được:

- AST (Abstract Syntax Tree) chính xác là gì?
- Cách xây dựng compiler hoàn chỉnh từ đầu?
- Triết lý thiết kế của Babel?
- Viết plugin console thông minh — không sợ màn hình console đầy log 😭
- ES6 chuyển thành ES5 như thế nào?
- Nén code bằng AST chỉ với ~30 dòng code?
- ESLint hoạt động ra sao — hiểu trong ~40 dòng code?
- Viết plugin import on-demand — đồng nghiệp khen "tuyệt vời!"
- Viết plugin TypeScript type checking (fork-ts-checker-webpack-plugin)
- Tích hợp plugin log upload trong hệ thống monitoring

---

## 2. AST Là Gì?

**Abstract Syntax Tree (AST)** là biểu diễn trừu tượng cấu trúc cú pháp của source code, ở dạng cây. Mỗi node trong cây đại diện cho một cấu trúc trong mã nguồn.

AST được dùng rộng rãi: kiểm tra cú pháp, kiểm tra code style, formatting, highlighting, auto-completion, báo lỗi...

### Ví Dụ Trực Quan — Phân Tích Câu Tiếng Việt

> Giống bài tập "tìm chỗ sai trong câu" ở tiểu học.

```
VÍ DỤ: "Bạn là con lợn,"
═══════════════════════════════════════════

  Bước 1: Xác định chủ ngữ, vị ngữ, tân ngữ

  [
    { type: "Chủ ngữ",     value: "Bạn" },
    { type: "Vị ngữ",      value: "là" },
    { type: "Tân ngữ",     value: "con lợn" },
    { type: "Dấu câu",     value: "," }     ← ❌ Dấu phẩy!
  ]

  → Lỗi 1: Cuối câu dùng dấu phẩy thay vì dấu chấm

  Bước 2: Phân tích ngữ nghĩa sâu hơn

  {
    type: "Câu",
    body: {
      type: "Câu khẳng định",
      declarations: [{
        type: "Tuyên bố",
        person: { type: "Identifier", name: "Bạn" },
        name:   { type: "animal",     value: "lợn" }
      }]
    }
  }

  → Lỗi 2: So sánh người với lợn 🐷 → không phù hợp
```

> **Bản chất AST**: Biểu diễn cấu trúc cú pháp nguồn dưới dạng cây — thực chất là một **object lồng nhau sâu**, mô tả mọi thông tin của code.

---

## 3. Viết Compiler Từ Đầu

### 3.1 Tổng Quan Quy Trình

```
QUY TRÌNH COMPILER — 3 BƯỚC:
═══════════════════════════════════════════════════════════════

  ❶ PARSING (Phân tích)
  ┌──────────────────────────────────────────────────────────┐
  │  Lexical Analysis (Phân tích từ vựng)                   │
  │  → Sinh ra Tokens                                       │
  │                                                          │
  │  Syntax Analysis (Phân tích cú pháp)                    │
  │  → Xây dựng AST từ Tokens                              │
  └──────────┬───────────────────────────────────────────────┘
             │
             ▼
  ❷ TRANSFORMATION (Chuyển đổi)
  ┌──────────────────────────────────────────────────────────┐
  │  Lấy AST đã parse → xử lý theo rules                   │
  │  → Tạo biểu diễn mới (new AST)                         │
  └──────────┬───────────────────────────────────────────────┘
             │
             ▼
  ❸ CODE GENERATION (Sinh code)
  ┌──────────────────────────────────────────────────────────┐
  │  Lấy new AST → chuyển thành code mới                   │
  └──────────────────────────────────────────────────────────┘
```

**Demo**: Compile Lisp → C:

```
LISP:  (add 2 (subtract 4 2))
C:     add(2, subtract(4, 2))
Nghĩa: 2 + (4 - 2)
```

### 3.2 Parsing — Lexical Analysis (Phân Tích Từ Vựng)

Dùng **tokenizer (bộ tách token)** để tách source code thành mảng tokens — mỗi token là một đơn vị thông tin (số, tên, dấu ngoặc, operator...).

```
INPUT:  (add 2 (subtract 4 2))

TOKENS:
═══════════════════════════════════════════

  [
    { type: "paren",  value: "(" },
    { type: "name",   value: "add" },
    { type: "number", value: "2" },
    { type: "paren",  value: "(" },
    { type: "name",   value: "subtract" },
    { type: "number", value: "4" },
    { type: "number", value: "2" },
    { type: "paren",  value: ")" },
    { type: "paren",  value: ")" }
  ]
```

**Code tokenizer:**

```javascript
function tokenizer(input) {
  let current = 0;
  let tokens = [];

  while (current < input.length) {
    let char = input[current];

    // Dấu ngoặc mở
    if (char === "(") {
      tokens.push({ type: "paren", value: "(" });
      current++;
      continue;
    }
    // Dấu ngoặc đóng
    if (char === ")") {
      tokens.push({ type: "paren", value: ")" });
      current++;
      continue;
    }
    // Khoảng trắng — bỏ qua
    if (/\s/.test(char)) {
      current++;
      continue;
    }

    // Số — đọc liên tục (22 → "22", không phải "2","2")
    if (/[0-9]/.test(char)) {
      let value = "";
      while (/[0-9]/.test(char)) {
        value += char;
        char = input[++current];
      }
      tokens.push({ type: "number", value });
      continue;
    }
    // Chuỗi — đọc giữa dấu ngoặc kép
    if (char === '"') {
      let value = "";
      char = input[++current];
      while (char !== '"') {
        value += char;
        char = input[++current];
      }
      char = input[++current];
      tokens.push({ type: "string", value });
      continue;
    }
    // Tên (name) — chuỗi ký tự liên tục
    if (/[a-z]/i.test(char)) {
      let value = "";
      while (/[a-z]/i.test(char)) {
        value += char;
        char = input[++current];
      }
      tokens.push({ type: "name", value });
      continue;
    }
    throw new TypeError("Ký tự không nhận dạng được: " + char);
  }
  return tokens;
}
```

### 3.3 Parsing — Syntax Analysis (Phân Tích Cú Pháp)

Sắp xếp lại tokens thành cấu trúc liên kết cú pháp — gọi là **AST**:

```
AST TỪ (add 2 (subtract 4 2)):
═══════════════════════════════════════════

  {
    type: 'Program',
    body: [{
      type: 'CallExpression',
      name: 'add',
      params: [
        { type: 'NumberLiteral', value: '2' },
        {
          type: 'CallExpression',
          name: 'subtract',
          params: [
            { type: 'NumberLiteral', value: '4' },
            { type: 'NumberLiteral', value: '2' }
          ]
        }
      ]
    }]
  }
```

**Code parser:**

```javascript
function parser(tokens) {
  let current = 0;

  function walk() {
    let token = tokens[current];

    // Số → NumberLiteral node
    if (token.type === "number") {
      current++;
      return { type: "NumberLiteral", value: token.value };
    }
    // String → StringLiteral node
    if (token.type === "string") {
      current++;
      return { type: "StringLiteral", value: token.value };
    }
    // Dấu mở ngoặc → CallExpression
    if (token.type === "paren" && token.value === "(") {
      token = tokens[++current]; // Bỏ qua '(', lấy name

      let node = {
        type: "CallExpression",
        value: token.value,
        params: [],
      };

      token = tokens[++current];
      // Đệ quy đọc params cho đến ')'
      while (
        token.type !== "paren" ||
        (token.type === "paren" && token.value !== ")")
      ) {
        node.params.push(walk());
        token = tokens[current];
      }
      current++; // Bỏ qua ')'
      return node;
    }
    throw new TypeError(token.type);
  }

  let ast = { type: "Program", body: [] };
  while (current < tokens.length) {
    ast.body.push(walk());
  }
  return ast;
}
```

### 3.4 Transformation — Traversal & Visitors

Trong quá trình Transformation, cần **duyệt (traverse)** AST để đọc nội dung từng node. Quá trình này dùng **thuật toán DFS (Depth-First Search)** — đi sâu vào từng nhánh trước khi sang nhánh kế tiếp.

Khi vào một node, node ngoài cùng giống như một **nhánh cây**. Bên trong nhánh đó còn có nhiều node con, giống như các cành nhỏ hơn. Chúng ta sẽ duyệt theo **nguyên tắc DFS** — đi sâu vào đến tận cùng nhánh hiện tại, khi đến innermost node thì coi như **truy cập xong nhánh đó**, rồi lần lượt **thoát ra** (exit) từ trong ra ngoài.

Để xử lý cả hai thời điểm **enter** (vào) và **exit** (ra), visitor cuối cùng sẽ có dạng object với 2 hooks:

```
TRAVERSAL — DEPTH-FIRST (DFS):
═══════════════════════════════════════════════════════

  → Vào Program (gốc)
     → Vào CallExpression (add)
        → Vào NumberLiteral (2)
        ← Rời NumberLiteral (2)
        → Vào CallExpression (subtract)
           → Vào NumberLiteral (4)
           ← Rời NumberLiteral (4)
           → Vào NumberLiteral (2)
           ← Rời NumberLiteral (2)
        ← Rời CallExpression (subtract)
     ← Rời CallExpression (add)
  ← Rời Program
```

**Visitor** — object xử lý từng loại node, với `enter` và `exit`:

```javascript
const visitor = {
  NumberLiteral: {
    enter(node, parent) {},
    exit(node, parent) {},
  },
  CallExpression: {
    enter(node, parent) {},
    exit(node, parent) {},
  },
};
```

**Code traverse:**

```javascript
function traverse(ast, visitor) {
  function traverseArray(array, parent) {
    array.forEach((child) => traverseNode(child, parent));
  }

  function traverseNode(node, parent) {
    let methods = visitor[node.type];
    if (methods && methods.enter) methods.enter(node, parent);

    switch (node.type) {
      case "Program":
        traverseArray(node.body, node);
        break;
      case "CallExpression":
        traverseArray(node.params, node);
        break;
      case "NumberLiteral":
      case "StringLiteral":
        break;
      default:
        throw new TypeError(node.type);
    }

    if (methods && methods.exit) methods.exit(node, parent);
  }

  traverseNode(ast, null);
}
```

### 3.5 Transformer — Tạo AST Mới

```
SO SÁNH AST CŨ vs AST MỚI:
═══════════════════════════════════════════════════════════════

  AST CŨ (Lisp)              │  AST MỚI (C)
  ────────────────────────────┼────────────────────────────────
  {                           │  {
    type: 'Program',          │    type: 'Program',
    body: [{                  │    body: [{
      type: 'CallExpression', │      type: 'ExpressionStatement',
      name: 'add',            │      expression: {
      params: [{              │        type: 'CallExpression',
        type: 'NumberLiteral',│        callee: {
        value: '2'            │          type: 'Identifier',
      }, {                    │          name: 'add'
        type:'CallExpression',│        },
        name: 'subtract',     │        arguments: [{
        params: [...]         │          type: 'NumberLiteral',
      }]                      │          value: '2'
    }]                        │        }, {
  }                           │          type: 'CallExpression',
                              │          callee: {
                              │            type: 'Identifier',
                              │            name: 'subtract'
                              │          },
                              │          arguments: [...]
                              │        }]
                              │      }
                              │    }]
                              │  }
```

**Code transformer:**

```javascript
function transformer(ast) {
  let newAst = { type: "Program", body: [] };
  // Tạo _context trên AST cũ trỏ đến body AST mới (reference)
  ast._context = newAst.body;

  traverse(ast, {
    NumberLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: "NumberLiteral",
          value: node.value,
        });
      },
    },
    StringLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: "StringLiteral",
          value: node.value,
        });
      },
    },
    CallExpression: {
      enter(node, parent) {
        let expression = {
          type: "CallExpression",
          callee: { type: "Identifier", name: node.value },
          arguments: [],
        };
        node._context = expression.arguments;

        if (parent.type !== "CallExpression") {
          expression = {
            type: "ExpressionStatement",
            expression: expression,
          };
        }
        parent._context.push(expression);
      },
    },
  });

  return newAst;
}
```

### 3.6 Code Generation

```javascript
function codeGenerator(node) {
  switch (node.type) {
    case "Program":
      return node.body.map(codeGenerator).join("\n");

    case "ExpressionStatement":
      return codeGenerator(node.expression) + ";";

    case "CallExpression":
      return (
        codeGenerator(node.callee) +
        "(" +
        node.arguments.map(codeGenerator).join(", ") +
        ")"
      );

    case "Identifier":
      return node.name;

    case "NumberLiteral":
      return node.value;

    case "StringLiteral":
      return '"' + node.value + '"';

    default:
      throw new TypeError(node.type);
  }
}
```

### 3.7 Hoàn Chỉnh Compiler

```javascript
function compiler(input) {
  let tokens = tokenizer(input); // Bước 1: Sinh tokens
  let ast = parser(tokens); // Bước 2: Sinh AST
  let newAst = transformer(ast); // Bước 3: AST mới
  let output = codeGenerator(newAst); // Bước 4: Sinh code mới
  return output;
}

compiler("(add 2 (subtract 4 2))");
// → "add(2, subtract(4, 2));"
```

```
FLOW TỔNG QUAN COMPILER:
═══════════════════════════════════════════════════════════════

  Source Code: (add 2 (subtract 4 2))
       │
       ▼ tokenizer()
  Tokens: [{paren:"("}, {name:"add"}, {number:"2"}, ...]
       │
       ▼ parser()
  AST: { type:"Program", body:[{CallExpression...}] }
       │
       ▼ transformer()
  New AST: { type:"Program", body:[{ExpressionStatement...}] }
       │
       ▼ codeGenerator()
  Output: add(2, subtract(4, 2));
```

---

## 4. Babel — Nền Tảng Ứng Dụng AST

Babel là JavaScript compiler phổ biến nhất — transpile ES2015+ về các phiên bản cũ hơn. Quy trình hoạt động **giống hệt** compiler chúng ta vừa viết:

```
BABEL — 3 GIAI ĐOẠN:
═══════════════════════════════════════════════════════

  ❶ Parsing   → Source code → AST (estree nodes)
  ❷ Transform → Biến đổi AST
  ❸ Generate  → AST mới → Code mới + sourcemap
```

### Các Package Của Babel

```
BABEL PACKAGES:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────┬──────────────────────────────────────┐
  │  Package            │  Chức năng                           │
  ├─────────────────────┼──────────────────────────────────────┤
  │  @babel/parser      │  Source code → AST                   │
  │  @babel/traverse    │  Duyệt AST, quản lý state           │
  │                     │  Thêm/xóa/thay thế nodes            │
  │  @babel/generator   │  AST → source code + sourcemap      │
  │  @babel/types       │  Lodash cho AST nodes                │
  │                     │  Tạo, validate, transform nodes      │
  │  @babel/template    │  Template code → AST nodes           │
  │  @babel/core        │  Core API: transform, parse          │
  └─────────────────────┴──────────────────────────────────────┘
```

```bash
yarn add @babel/core -D
# Đã bao gồm parser, traverse, generator, types
```

---

## 5. Ứng Dụng: Đổi Tên Hàm Với Babel

**Yêu cầu**: Đổi tên hàm `hello` → `world`

```javascript
// Source:   const hello = () => {};
// Target:   const world = () => {};
```

**Tư duy**: So sánh AST trước/sau → chỉ khác trường `name` của node `Identifier`.

```javascript
const parser = require("@babel/parser");
const traverse = require("@babel/traverse");
const generator = require("@babel/generator");

const code = `const hello = () => {};`;

// 1. Parse → AST
const ast = parser.parse(code);

// 2. Transform — visitor tìm node Identifier
const visitor = {
  Identifier(path) {
    const { node } = path;
    if (node.name === "hello") {
      node.name = "world"; // Đổi hello → world
    }
  },
};
traverse.default(ast, visitor);

// 3. Generate → Code mới
const result = generator.default(ast, {}, code);
console.log(result.code); // const world = () => {};
```

---

## 6. Ứng Dụng: Viết Plugin Chuyển Arrow Function (Đơn Giản)

**Yêu cầu**: Viết plugin giống `babel-plugin-transform-es2015-arrow-functions`.

### Cấu Trúc Babel Plugin

```
BABEL PLUGIN — CẤU TRÚC:
═══════════════════════════════════════════

  Babel plugin = một OBJECT có property visitor
  visitor = object, key là type, value là hàm

  const myPlugin = {
    visitor: {
      [NodeType]: (path) => {
        // Xử lý node
      }
    }
  };
```

### So Sánh AST Arrow vs Normal Function

```
SO SÁNH AST:
═══════════════════════════════════════════════════════

  Arrow Function          │  Normal Function
  ────────────────────────┼────────────────────────────
  ArrowFunctionExpression │  FunctionExpression
  (mọi thứ khác GIỐNG)   │
```

> Chỉ khác **type**! → Đổi type là xong.

```javascript
const core = require("@babel/core");

const sourceCode = `const sum = (a, b) => { return a + b; }`;

const arrowFunctionPlugin = {
  visitor: {
    ArrowFunctionExpression(path) {
      let { node } = path;
      node.type = "FunctionExpression"; // Đổi type!
    },
  },
};

let result = core.transform(sourceCode, {
  plugins: [arrowFunctionPlugin],
});
console.log(result.code);
// const sum = function (a, b) { return a + b; };
```

### Xử Lý Arrow Function Viết Tắt

```javascript
// Input:  const sum = (a, b) => a + b
// Output: const sum = function(a, b) { return a + b; }
// → Thiếu {} và return!
```

Dùng `@babel/types` để tạo `blockStatement` + `returnStatement`:

```javascript
const types = require("@babel/types");

const arrowFunctionPlugin = {
  visitor: {
    ArrowFunctionExpression(path) {
      let { node } = path;
      node.type = "FunctionExpression";

      // Nếu body KHÔNG phải block statement → tạo block + return
      if (!types.isBlockStatement(node.body)) {
        node.body = types.blockStatement([types.returnStatement(node.body)]);
      }
    },
  },
};
```

---

## 7. Ứng Dụng: Viết Plugin Chuyển Arrow Function (Phức Tạp — this)

Arrow function không có `this` riêng → cần chuyển `this` → `_this`.

### Khái Niệm Scope Trong AST

JavaScript dùng **lexical scope** (phạm vi từ vựng) — khi một code block tạo scope mới, nó hình thành **cấu trúc cây**, cô lập và không ảnh hưởng đến các scope khác.

Cấu trúc tổng quát của một scope trong Babel:

```javascript
{
  path: path,           // Path hiện tại
  block: path.node,     // Node tạo scope
  parentBlock: path.parent, // Node cha
  parent: parentScope,  // Scope cha
  bindings: [...]       // Các biến trong scope
}
```

> Để thêm biến `_this` vào scope, ta chỉ cần **thêm node mới** vào AST tree tại vị trí scope đó.

```
TƯ DUY — XỬ LÝ THIS TRONG ARROW FUNCTION:
═══════════════════════════════════════════════════════

  Bước 1: Tìm scope cha mà arrow function
          sẽ dùng this (không phải arrow function)

  Bước 2: Thêm var _this = this vào scope cha

  Bước 3: Tìm tất cả chỗ dùng this trong
          arrow function hiện tại

  Bước 4: Thay thế this → _this
```

```javascript
const core = require("@babel/core");
const types = require("@babel/types");

function hoistFunctionEnvironment(path) {
  // Bước 1: Tìm scope cha (function thường hoặc Program)
  const thisEnv = path.findParent((parent) => {
    return (
      (parent.isFunction() && !parent.isArrowFunctionExpression()) ||
      parent.isProgram()
    );
  });

  // Bước 2: Thêm var _this = this
  thisEnv.scope.push({
    id: types.identifier("_this"),
    init: types.thisExpression(),
  });

  // Bước 3: Thu thập tất cả this trong arrow function
  let thisPaths = [];
  path.traverse({
    ThisExpression(thisPath) {
      thisPaths.push(thisPath);
    },
  });

  // Bước 4: Thay thế this → _this
  thisPaths.forEach((thisPath) => {
    thisPath.replaceWith(types.identifier("_this"));
  });
}

const arrowFunctionPlugin = {
  visitor: {
    ArrowFunctionExpression(path) {
      let { node } = path;
      hoistFunctionEnvironment(path);
      node.type = "FunctionExpression";
      if (!types.isBlockStatement(node.body)) {
        node.body = types.blockStatement([types.returnStatement(node.body)]);
      }
    },
  },
};

const sourceCode = `
  const sum = (a, b) => {
    console.log(this);
    return a + b;
  };
`;

let result = core.transform(sourceCode, {
  plugins: [arrowFunctionPlugin],
});
console.log(result.code);
// var _this = this;
// const sum = function(a, b) {
//   console.log(_this);
//   return a + b;
// };
```

---

## 8. Ứng Dụng: Plugin console.log Thông Minh

**Scenario**: Dev in `console.log` để debug → project lớn → console tràn log → không biết log từ file nào, dòng nào.

**Giải pháp**: Plugin tự động thêm **tên file** + **vị trí dòng:cột** vào `console.log`.

```
TRƯỚC:  console.log("hello world")
SAU:    console.log("hello world", "2:2", "hello.js")
```

```
TƯ DUY — 3 BƯỚC:
═══════════════════════════════════════════════════════

  Bước 1: Tìm node console (callee.object.name)
  Bước 2: Kiểm tra method: log/info/warn/error
  Bước 3: Thêm arguments: vị trí + tên file
```

```javascript
const core = require("@babel/core");
const types = require("@babel/types");
const pathlib = require("path");

const sourceCode = `console.log("Log nè")`;

const logPlugin = {
  visitor: {
    CallExpression(path, state) {
      const { node } = path;
      if (types.isMemberExpression(node.callee)) {
        if (node.callee.object.name === "console") {
          if (
            ["log", "info", "warn", "error"].includes(node.callee.property.name)
          ) {
            // Lấy vị trí dòng:cột
            const { line, column } = node.loc.start;
            node.arguments.push(types.stringLiteral(`${line}:${column}`));
            // Lấy tên file (relative path)
            const filename = state.file.opts.filename;
            const relativeName = pathlib
              .relative(__dirname, filename)
              .replace(/\\/g, "/");
            node.arguments.push(types.stringLiteral(relativeName));
          }
        }
      }
    },
  },
};

let result = core.transform(sourceCode, {
  plugins: [logPlugin],
  filename: "hello.js",
});
console.log(result.code);
// console.log("Log nè", "1:0", "hello.js");
```

---

## 9. Ứng Dụng: Plugin Log Upload Cho Monitoring System

**Scenario**: Hệ thống monitoring cần thêm `loggerLib()` vào đầu MỌI hàm (cả 4 cách khai báo hàm).

```
TƯ DUY — 4 BƯỚC:
═══════════════════════════════════════════════════════

  Bước 1: Kiểm tra source code đã import logger chưa
  Bước 2: Nếu đã import → lấy tên biến để dùng
  Bước 3: Nếu chưa → thêm import logger ở đầu file
  Bước 4: Chèn loggerLib() vào đầu mỗi hàm
          (4 loại: function, function expression,
           arrow function, class method)
```

### Phát Hiện Import — 3 Kiểu Nhập

Có 3 cách import module, cần xử lý tất cả:

```javascript
import logger2 from "logger1"; // default import
import { logger4 } from "logger3"; // named import
import * as logger6 from "logger5"; // namespace import
```

Dù import kiểu nào, trong AST luôn có thể lấy:

- `source.value` → tên thư viện (`"logger"`)
- `specifiers[0].local.name` → tên biến đã import (`logger2`, `logger4`, `logger6`)

> Nhờ nhất quán này, ta chỉ cần kiểm tra `node.source.value === "logger"` là đủ.

### Dùng `@babel/template` — Sinh Node Trực Quan

Thay vì tạo node thủ công bằng `types.importDeclaration(...)`, dùng `@babel/template` đơn giản hơn nhiều:

```javascript
const template = require("@babel/template");

// 👎 Thủ công — phải tra AST rồi tạo từng node
types.importDeclaration(
  [types.importDefaultSpecifier(types.identifier(loggerId))],
  types.stringLiteral("logger"),
);

// 👍 Template — viết code trực tiếp, tự sinh AST node
template.statement(`import ${loggerId} from 'logger'`)();
template.statement(`${loggerId}()`)();
```

> `@babel/template` = viết template code → tự động sinh AST node tương ứng.

### Lưu Ý: `path.scope.generateUid()`

Để **tránh trùng tên biến**, dùng `path.scope.generateUid("loggerLib")`. Nếu source code đã có biến `loggerLib`, nó sẽ tự động trở thành `_loggerLib`.

### Chia Sẻ Dữ Liệu Qua `state`

`state` là **object dùng để lưu trữ tạm dữ liệu** giữa các visitor functions — hoạt động như container chia sẻ (state container).

```javascript
const core = require("@babel/core");
const types = require("@babel/types");
const template = require("@babel/template");

const sourceCode = `
  function sum(a, b) { return a + b; }
  const multiply = function(a, b) { return a * b; };
  const minus = (a, b) => a - b;
  class Calculator {
    divide(a, b) { return a / b; }
  }
`;

const autoImportLogPlugin = {
  visitor: {
    Program(path, state) {
      let loggerId;
      // Bước 1-2: Tìm import logger đã có chưa
      path.traverse({
        ImportDeclaration(path) {
          if (path.node.source.value === "logger") {
            loggerId = path.node.specifiers[0].local.name;
            path.stop();
          }
        },
      });
      // Bước 3: Chưa có → tự động import
      if (!loggerId) {
        loggerId = path.scope.generateUid("loggerLib");
        path.node.body.unshift(
          template.statement(`import ${loggerId} from 'logger'`)(),
        );
      }
      // Mount loggerLib() node lên state để dùng chung
      state.loggerNode = template.statement(`${loggerId}()`)();
    },

    // Bước 4: Xử lý cả 4 kiểu khai báo hàm
    "FunctionDeclaration|FunctionExpression|ArrowFunctionExpression|ClassMethod"(
      path,
      state,
    ) {
      const { node } = path;
      if (types.isBlockStatement(node.body)) {
        node.body.body.unshift(state.loggerNode);
      } else {
        // Arrow function không có {} → tạo block
        node.body = types.blockStatement([
          state.loggerNode,
          types.returnStatement(node.body),
        ]);
      }
    },
  },
};
```

> **Tip**: Dùng `@babel/template` thay vì tạo node thủ công → trực quan hơn nhiều!

---

## 10. Ứng Dụng: Viết ESLint Đơn Giản

**Background**: Babel AST traversal có lifecycle hooks: `pre` (trước duyệt) và `post` (sau duyệt).

**Demo**: Rule `no-console` — không cho phép `console.log` trong code.

```javascript
const core = require("@babel/core");

const sourceCode = `
  var a = 1;
  console.log(a);
  var b = 2;
`;

const eslintPlugin = ({ fix }) => ({
  pre(file) {
    file.set("errors", []);
  },
  visitor: {
    CallExpression(path, state) {
      const errors = state.file.get("errors");
      const { node } = path;
      if (node.callee.object && node.callee.object.name === "console") {
        errors.push(
          path.buildCodeFrameError(
            `Code không được có console statement`,
            Error,
          ),
        );
        if (fix) path.parentPath.remove(); // Auto-fix: xóa node
      }
    },
  },
  post(file) {
    console.log(...file.get("errors"));
  },
});

let result = core.transform(sourceCode, {
  plugins: [eslintPlugin({ fix: true })],
});
console.log(result.code);
// var a = 1;
// var b = 2;
// (console.log đã bị xóa + hiện lỗi trong terminal)
```

> Tất cả các rule ESLint — lớn nhỏ — đều dựa trên nguyên lý này!

---

## 11. Ứng Dụng: Nén Code Với AST

**Bản chất nén code**: Đổi tên biến có nghĩa → vô nghĩa, càng ngắn càng tốt (`_`, `a`, `b`...).

```
TƯ DUY:
═══════════════════════════════════════════════════════

  Bước 1: Bắt các node tạo scope (Scopable)
          → function, class method, block, if, while,
            for...

  Bước 2: Lấy tất cả biến trong scope
          (path.scope.bindings)
          → Đổi tên thành uid ngắn
```

**Khái niệm Bindings**: Tập hợp tham chiếu biến trong scope.

```javascript
// scope binding cho biến ref:
{
  identifier: node,
  scope: scope,
  path: path,
  kind: 'var',
  referenced: true,
  references: 3,
  referencePaths: [path, path, path],
  constant: false
}
```

```javascript
const { transformSync } = require("@babel/core");

const sourceCode = `
  function getAge() {
    var age = 12;
    console.log(age);
    var name = 'zhufeng';
    console.log(name);
  }
`;

const uglifyPlugin = () => ({
  visitor: {
    // Scopable = alias bắt TẤT CẢ node tạo scope
    Scopable(path) {
      Object.entries(path.scope.bindings).forEach(([key, binding]) => {
        const newName = path.scope.generateUid();
        binding.path.scope.rename(key, newName);
      });
    },
  },
});

const { code } = transformSync(sourceCode, {
  plugins: [uglifyPlugin()],
});
console.log(code);
// function _() {
//   var _2 = 12;
//   console.log(_2);
//   var _3 = 'zhufeng';
//   console.log(_3);
// }
```

---

## 12. Ứng Dụng: Plugin Import On-Demand

**Vấn đề**: Lodash không hỗ trợ on-demand loading → import 1 method = import TOÀN BỘ thư viện (~500KB).

```
CHUYỂN ĐỔI:
═══════════════════════════════════════════════════════

  TRƯỚC (full import ~500KB):
  import { flatten, concat } from "lodash";

  SAU (on-demand ~19KB):
  import flatten from "lodash/flatten";
  import concat from "lodash/concat";
```

```javascript
const types = require("@babel/types");

const visitor = {
  ImportDeclaration(path, state) {
    const { libraryName, libraryDirectory = "lib" } = state.opts;
    const { node } = path;
    const { specifiers } = node;

    // Chỉ xử lý đúng thư viện + không phải default import
    if (
      node.source.value === libraryName &&
      !types.isImportDefaultSpecifier(specifiers[0])
    ) {
      // Tạo mảng import mới — mỗi specifier 1 import riêng
      const declarations = specifiers.map((specifier) => {
        return types.importDeclaration(
          [types.importDefaultSpecifier(specifier.local)],
          types.stringLiteral(
            libraryDirectory
              ? `${libraryName}/${libraryDirectory}/${specifier.imported.name}`
              : `${libraryName}/${specifier.imported.name}`,
          ),
        );
      });
      path.replaceWithMultiple(declarations);
    }
  },
};

module.exports = function () {
  return { visitor };
};
```

**Webpack config:**

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            plugins: [
              [
                path.resolve(__dirname, "plugins/babel-plugin-import.js"),
                { libraryName: "lodash" },
              ],
            ],
          },
        },
      },
    ],
  },
};
```

> Kết quả: Bundle từ ~500KB → chỉ **19KB**!

---

## 13. Ứng Dụng: TypeScript Type Validation

### 13.1 Scenario — Gán Giá Trị Trực Tiếp

```typescript
var age: number = "12"; // ❌ Type error!
```

```
TƯ DUY — 3 BƯỚC:
═══════════════════════════════════════════════════════

  Bước 1: Lấy type khai báo (number → TSNumberKeyword)
  Bước 2: Lấy type giá trị thực ("12" → StringLiteral)
  Bước 3: So sánh → không khớp → BÁO LỖI
```

```javascript
const core = require("@babel/core");

const TypeAnnotationMap = {
  TSNumberKeyword: "NumericLiteral",
  TSStringKeyword: "StringLiteral",
};

const tsCheckPlugin = {
  pre(file) {
    file.set("errors", []);
  },
  visitor: {
    VariableDeclarator(path, state) {
      const errors = state.file.get("errors");
      const { node } = path;
      const idType =
        TypeAnnotationMap[node.id.typeAnnotation.typeAnnotation.type];
      const initType = node.init.type;

      if (idType !== initType) {
        errors.push(
          path
            .get("init")
            .buildCodeFrameError(
              `Không thể gán ${initType} cho ${idType}`,
              Error,
            ),
        );
      }
    },
  },
  post(file) {
    console.log(...file.get("errors"));
  },
};

core.transform(`var age:number="12";`, {
  parserOpts: { plugins: ["typescript"] },
  plugins: [tsCheckPlugin],
});
// → Error: Không thể gán StringLiteral cho NumericLiteral
```

### 13.2 Scenario — Khai Báo Trước, Gán Sau

```typescript
var age: number;
age = "12"; // ❌
```

```javascript
const tsCheckPlugin = () => ({
  pre(file) {
    file.set("errors", []);
  },
  visitor: {
    AssignmentExpression(path, state) {
      const errors = state.file.get("errors");
      // Bước 1: Tìm binding của biến bên trái
      const variable = path.scope.getBinding(path.get("left"));
      // Bước 2: Lấy type khai báo
      const variableAnnotation = variable.path.get("id").getTypeAnnotation();
      const variableType = transformType(variableAnnotation.type);
      // Bước 3: Lấy type giá trị bên phải
      const valueType = transformType(
        path.get("right").getTypeAnnotation().type,
      );
      // Bước 4: So sánh
      if (variableType !== valueType) {
        errors.push(
          path
            .get("init")
            .buildCodeFrameError(
              `Không thể gán ${valueType} cho ${variableType}`,
              Error,
            ),
        );
      }
    },
  },
  post(file) {
    console.log(...file.get("errors"));
  },
});

function transformType(type) {
  switch (type) {
    case "TSNumberKeyword":
    case "NumberTypeAnnotation":
      return "number";
    case "TSStringKeyword":
    case "StringTypeAnnotation":
      return "string";
  }
}
```

### 13.3 Scenario — Generic (Tư Duy)

Do độ phức tạp cao, phần này chỉ tập trung vào **tư duy giải quyết**, không code chi tiết.

```typescript
function join<T, W>(a: T, b: W) {}
join<number, string>(1, "2");
```

```
TƯ DUY GENERIC — 5 BƯỚC:
═══════════════════════════════════════════════════════

  Bước 1: Lấy mảng type của argument thực tế
          khi gọi hàm: (1, "2") → [number, string]

  Bước 2: Lấy mảng type generic được truyền
          khi gọi hàm: <number, string> → [number, string]

  Bước 3: Lấy generic [T, W] từ ĐỊNH NGHĨA hàm
          → kết hợp Bước 2 để gán:
          T = number, W = string
          → Kết quả: [T=number, W=string]

  Bước 4: Tính toán type parameter trong định nghĩa:
          a: T → a: number
          b: W → b: string
          → Mảng formal params: [number, string]

  Bước 5: So sánh từng cặp:
          Param 'a': actual=number vs formal=number ✅
          Param 'b': actual=string vs formal=string ✅
          → Nếu không khớp → báo lỗi!
```

> Tư duy rất rõ ràng — thực tế logic cũng **không quá phức tạp**, chỉ cần nắm vững cách duyệt AST node.

---

## 14. Best Practices

### ❶ Tránh Duyệt AST Không Cần Thiết

```
NGUYÊN TẮC HIỆU NĂNG:
═══════════════════════════════════════════════════════

  ⚠️ Duyệt AST RẤT TỐN CHI PHÍ
  → Dễ duyệt thừa hàng nghìn, vạn operations
```

**Gộp visitors:**

```javascript
// 👎 Duyệt 2 lần
path.traverse({
  Identifier(path) {
    /*...*/
  },
});
path.traverse({
  BinaryExpression(path) {
    /*...*/
  },
});

// 👍 Duyệt 1 lần
path.traverse({
  Identifier(path) {
    /*...*/
  },
  BinaryExpression(path) {
    /*...*/
  },
});
```

**Tìm thủ công thay vì duyệt:**

```javascript
// 👎 Duyệt toàn bộ subtree
const visitorOne = {
  Identifier(path) {
    /*...*/
  },
};
const MyVisitor = {
  FunctionDeclaration(path) {
    path.get("params").traverse(visitorOne);
  },
};

// 👍 Tìm trực tiếp — tránh duyệt tốn kém
const MyVisitor = {
  FunctionDeclaration(path) {
    path.node.params.forEach(function () {
      /*...*/
    });
  },
};
```

### ❷ Tối Ưu Nested Visitors

```javascript
// 👎 Tạo visitor object MỚI mỗi lần gọi
const MyVisitor = {
  FunctionDeclaration(path) {
    path.traverse({
      Identifier(path) {
        /*...*/
      }, // Object mới mỗi lần!
    });
  },
};

// 👍 Khai báo visitor NGOÀI — tái sử dụng
const visitorOne = {
  Identifier(path) {
    /*...*/
  },
};
const MyVisitor = {
  FunctionDeclaration(path) {
    path.traverse(visitorOne);
  },
};
```

**Truyền state cho nested visitor:**

```javascript
// 👍 Dùng tham số thứ 2 của traverse + this
const visitorOne = {
  Identifier(path) {
    if (path.node.name === this.exampleState) {
      /*...*/
    }
  },
};
const MyVisitor = {
  FunctionDeclaration(path) {
    var exampleState = path.node.params[0].name;
    path.traverse(visitorOne, { exampleState });
  },
};
```

### ❸ Cẩn Thận Cấu Trúc Lồng Nhau

```javascript
// ⚠️ Class có thể LỒNG NHAU → tìm sai constructor
class Foo {
  constructor() {
    class Bar {
      constructor() {
        /* Tìm nhầm vào đây! */
      }
    }
  }
}

// → Cần kiểm tra context chính xác khi traverse
```

---

## 15. Tổng Kết

```
TỔNG KẾT — AST DEEP DIVE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │  AST = Object lồng nhau sâu mô tả mọi thông tin code  │
  └──────────────────────────────────────────────────────────┘

  Pipeline: Source → Tokens → AST → New AST → New Code

  ┌──────────────────────────────────────────────────────────┐
  │  ỨNG DỤNG THỰC TẾ:                                     │
  │                                                          │
  │  ☑ Compiler     — Lisp → C (~180 dòng)                 │
  │  ☑ Babel Plugin — Arrow function → normal function      │
  │  ☑ Console      — Tự thêm file/line vào log            │
  │  ☑ Monitoring   — Tự chèn logger vào mọi hàm          │
  │  ☑ ESLint       — Rule no-console (~40 dòng)           │
  │  ☑ Nén code     — Đổi tên biến (~30 dòng)             │
  │  ☑ On-demand    — Import lodash giảm 500KB→19KB        │
  │  ☑ TS Check     — Validate type assignments            │
  └──────────────────────────────────────────────────────────┘

  BEST PRACTICES:
  ┌──────────────────────────────────────────────────────────┐
  │  ✅ Gộp visitors → giảm số lần duyệt                   │
  │  ✅ Tìm thủ công nếu node ở surface-level              │
  │  ✅ Khai báo visitor ngoài → tái sử dụng               │
  │  ✅ Truyền state qua traverse() param thứ 2            │
  │  ✅ Cẩn thận nested structures                          │
  └──────────────────────────────────────────────────────────┘
```
