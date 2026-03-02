# Babel Deep Dive — Tự Viết Compiler Bằng Tay & Kỹ Thuật Biên Dịch Front-End

> Tài liệu học chuyên sâu về Babel: từ nguyên lý compiler, tự implement AST parser/traverser/generator từ đầu không dùng thư viện, đến cấu hình production và viết plugin thực tế. Phân tích theo 6 pattern tư duy hệ thống.

---

## Mục Lục

1. [Tại Sao Cần Parse Code Thành AST?](#1-tại-sao-cần-parse-code-thành-ast)
2. [AST Trông Như Thế Nào?](#2-ast-trông-như-thế-nào)
3. [Core Implementation: Traverser](#3-core-implementation-traverser)
4. [Plugin: Chuyển Đổi Arrow Function](#4-plugin-chuyển-đổi-arrow-function)
5. [Code Generation (Generator)](#5-code-generation-generator)
6. [Kết Nối Toàn Bộ: Mini Compiler](#6-kết-nối-toàn-bộ-mini-compiler)
7. [Babel Engineering — Cấu Hình & Sử Dụng](#7-babel-engineering--cấu-hình--sử-dụng)
8. [Handwritten Plugin: babel-plugin-import](#8-handwritten-plugin-babel-plugin-import)
9. [Deep Analysis Patterns](#9-deep-analysis-patterns)
10. [Tổng Hợp & Quick Reference](#10-tổng-hợp--quick-reference)

---

## 1. Tại Sao Cần Parse Code Thành AST?

### 1.1 Bài Toán Gốc

Babel bản chất là một **compiler** — nó biến đổi code dạng này sang code dạng khác. Nhiệm vụ cốt lõi: **chuyển ES6+ thành ES5** để trình duyệt cũ hiểu được.

Xét ví dụ đơn giản:

```javascript
const add = (a, b) => a + b;
```

Nếu **không dùng AST** mà chỉ dùng regex thay thế `=>` → `function`, ta sẽ gặp thảm họa:

```javascript
const str = "mũi tên => này là string không phải code";
const func = () => {
  return "=>";
};
```

Regex **không phân biệt được** đâu là cú pháp, đâu là nội dung chuỗi. Chỉ khi **phân tách code thành cấu trúc cây** (AST) ta mới hiểu chính xác ý nghĩa thực sự của từng phần.

### 1.2 Workflow Của Mọi Compiler

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPILER WORKFLOW (3 Giai Đoạn)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Source Code         AST              Modified AST    Target Code  │
│   (String)           (Object)          (Object)        (String)     │
│                                                                     │
│   "const add =    ┌──────────┐     ┌──────────┐    "var add =      │
│    (a,b) => ..." ─┤  PARSE   ├────►│TRANSFORM ├───► function..."   │
│                   └──────────┘     └──────────┘                     │
│                        │                │              │            │
│                        ▼                ▼              ▼            │
│                   Tokenizer +      Visitor Pattern  Recursive      │
│                   Parser           (Plugin System)  String Build   │
│                                                                     │
│   ① PARSE: Code String → AST (Abstract Syntax Tree)               │
│   ② TRANSFORM: Duyệt AST, thay đổi node theo plugin              │
│   ③ GENERATE: AST đã sửa → Code String mới                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> **Điểm mấu chốt**: Bất kỳ compiler nào — Babel, TypeScript, ESLint, Prettier — đều tuân theo 3 bước này. Hiểu 1 là hiểu tất cả.

---

## 2. AST Trông Như Thế Nào?

### 2.1 Từ Code Đến Cây

Câu lệnh `const add = (a, b) => a + b;` được parse thành:

```
AST TREE VISUALIZATION:
═══════════════════════════════════════════════════

Program
  └── VariableDeclaration (kind: "const")
        └── VariableDeclarator
              ├── id: Identifier (name: "add")
              └── init: ArrowFunctionExpression  ◄── NODE CẦN THAY ĐỔI
                    ├── params:
                    │     ├── Identifier (name: "a")
                    │     └── Identifier (name: "b")
                    └── body: BinaryExpression
                          ├── left: Identifier (name: "a")
                          ├── operator: "+"
                          └── right: Identifier (name: "b")
```

### 2.2 Dạng JSON Của AST

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "kind": "const",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": { "type": "Identifier", "name": "add" },
          "init": {
            "type": "ArrowFunctionExpression",
            "params": [
              { "type": "Identifier", "name": "a" },
              { "type": "Identifier", "name": "b" }
            ],
            "body": {
              "type": "BinaryExpression",
              "left": { "type": "Identifier", "name": "a" },
              "operator": "+",
              "right": { "type": "Identifier", "name": "b" }
            }
          }
        }
      ]
    }
  ]
}
```

### 2.3 Mục Tiêu Chuyển Đổi

```
TRƯỚC (ES6):                          SAU (ES5):
═══════════════                       ═══════════════

ArrowFunctionExpression       →       FunctionExpression
├── params: [a, b]                    ├── params: [a, b]
└── body: BinaryExpression            └── body: BlockStatement
          (a + b)                           └── ReturnStatement
                                                  └── BinaryExpression
                                                            (a + b)

Thay đổi cần thực hiện:
① type: "ArrowFunctionExpression" → "FunctionExpression"
② body không phải BlockStatement → wrap vào { return ... }
```

---

## 3. Core Implementation: Traverser (Tự Viết Bằng Tay)

### 3.1 Tại Sao Cần Traverser?

AST là object lồng nhau nhiều cấp. Để tìm được node `ArrowFunctionExpression` nằm sâu bên trong, ta cần một hàm **đệ quy duyệt toàn bộ cây**. Khi gặp node cần xử lý, gọi hàm plugin tương ứng.

Đây chính là pattern **Visitor** — trái tim của Babel.

### 3.2 Implementation

```javascript
// ============================================================
// TRAVERSER — Tự viết bằng tay, KHÔNG dùng thư viện
// Duyệt đệ quy toàn bộ AST tree
// ============================================================

function traverse(ast, visitor) {
  // Duyệt mảng (ví dụ: body chứa nhiều statement)
  function traverseArray(array, parent) {
    array.forEach((child) => traverseNode(child, parent));
  }

  // Duyệt từng node
  function traverseNode(node, parent) {
    // Guard: bỏ qua null, undefined, primitive values
    if (!node || typeof node !== "object") return;

    // ① Kiểm tra visitor có handler cho node type này không
    // Ví dụ: visitor['ArrowFunctionExpression'](node, parent)
    const method = visitor[node.type];
    if (method) {
      method(node, parent);
    }

    // ② Đệ quy duyệt TẤT CẢ properties của node
    // Tìm tiếp các node con (params, body, left, right, ...)
    Object.keys(node).forEach((key) => {
      const child = node[key];
      if (Array.isArray(child)) {
        traverseArray(child, node); // body: [statement1, statement2, ...]
      } else if (child && typeof child === "object" && child.type) {
        traverseNode(child, node); // init: { type: "ArrowFunc..." }
      }
    });
  }

  // Bắt đầu từ root node
  traverseNode(ast, null);
}
```

### 3.3 Luồng Thực Thi

```
TRAVERSE FLOW — Ví dụ với "const add = (a, b) => a + b;"
═══════════════════════════════════════════════════════════

traverseNode(Program, null)
  │
  ├── visitor["Program"]? → Không có → bỏ qua
  │
  ├── Duyệt properties → body là Array
  │     └── traverseArray([VariableDeclaration], Program)
  │           └── traverseNode(VariableDeclaration, Program)
  │                 │
  │                 ├── visitor["VariableDeclaration"]? → Không → bỏ qua
  │                 │
  │                 └── declarations là Array
  │                       └── traverseNode(VariableDeclarator, VariableDeclaration)
  │                             │
  │                             ├── id → traverseNode(Identifier "add")
  │                             │
  │                             └── init → traverseNode(ArrowFunctionExpression)
  │                                   │
  │                                   ├── ★ visitor["ArrowFunctionExpression"]!
  │                                   │   → GỌI PLUGIN HANDLER ← Đây là lúc
  │                                   │                           transform xảy ra!
  │                                   │
  │                                   ├── params → traverseArray([Identifier a, b])
  │                                   │
  │                                   └── body → traverseNode(BinaryExpression)
  │                                         ├── left → Identifier "a"
  │                                         └── right → Identifier "b"
```

---

## 4. Plugin: Chuyển Đổi Arrow Function (Tự Viết)

### 4.1 Logic Chuyển Đổi

```
INPUT:  (a, b) => a + b
OUTPUT: function(a, b) { return a + b; }

Các bước:
┌─────────────────────────────────────────────────────────────┐
│ ① Đổi node.type: "ArrowFunctionExpression"                 │
│                 → "FunctionExpression"                       │
│                                                             │
│ ② Giữ nguyên params: [a, b]                                │
│                                                             │
│ ③ Xử lý body:                                              │
│    - Nếu body KHÔNG phải BlockStatement                     │
│      (tức là dạng concise: x => x + 1)                     │
│    → Wrap thành: { return <body gốc>; }                    │
│    - Nếu body ĐÃ LÀ BlockStatement → giữ nguyên           │
│                                                             │
│ ④ Set node.expression = false                               │
│    (regular function không dùng expression body)            │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Implementation

```javascript
// ============================================================
// TRANSFORMER — Plugin chuyển arrow function → regular function
// ============================================================

const transformer = {
  ArrowFunctionExpression(node) {
    // ① Đổi type
    node.type = "FunctionExpression";

    // ② Xử lý body
    // Arrow function concise: (a, b) => a + b
    // body.type = "BinaryExpression" (KHÔNG phải BlockStatement)
    // → Cần wrap: { return a + b; }
    if (node.body.type !== "BlockStatement") {
      node.body = {
        type: "BlockStatement",
        body: [
          {
            type: "ReturnStatement",
            argument: node.body, // giữ nguyên expression gốc
          },
        ],
      };
    }

    // ③ Regular function không dùng expression mode
    node.expression = false;
  },
};
```

> **Tại sao sửa trực tiếp node?** Vì AST là **object reference**. Khi ta sửa `node.type`, ta đang sửa trực tiếp trên cây gốc. Không cần tạo cây mới.

---

## 5. Code Generation — Generator (Tự Viết)

### 5.1 Nguyên Lý

Generator làm ngược lại Parser: đi từ AST object → ghép thành code string. Logic: **đệ quy theo từng node type**, ghép chuỗi theo đúng cú pháp JavaScript.

### 5.2 Implementation

```javascript
// ============================================================
// GENERATOR — Chuyển AST → Code String, tự viết bằng tay
// ============================================================

function generate(node) {
  switch (node.type) {
    case "Program":
      // Program chứa mảng body → generate từng statement
      return node.body.map(generate).join("\n");

    case "VariableDeclaration":
      // "const add = <init>;"
      return `${node.kind} ${node.declarations.map(generate).join(", ")};`;

    case "VariableDeclarator":
      // "add = function(a, b) { ... }"
      return `${generate(node.id)} = ${generate(node.init)}`;

    case "Identifier":
      // Trả về tên biến: "add", "a", "b"
      return node.name;

    case "FunctionExpression":
      // "function(a, b) { return a + b; }"
      const params = node.params.map(generate).join(", ");
      const body = generate(node.body);
      return `function(${params}) ${body}`;

    case "BlockStatement":
      // "{\n  return a + b;\n}"
      const statements = node.body.map((s) => "  " + generate(s)).join("\n");
      return `{\n${statements}\n}`;

    case "ReturnStatement":
      // "return a + b;"
      return `return ${generate(node.argument)};`;

    case "BinaryExpression":
      // "a + b"
      return `${generate(node.left)} ${node.operator} ${generate(node.right)}`;

    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}
```

### 5.3 Flow Ghép Chuỗi

```
GENERATE FLOW — Từ AST đã transform → Code String
═══════════════════════════════════════════════════

generate(Program)
  → body.map(generate).join('\n')
    │
    └── generate(VariableDeclaration)
          → "const " + declarations.map(generate) + ";"
            │
            └── generate(VariableDeclarator)
                  → generate(Identifier "add") + " = " + generate(FunctionExpression)
                    │                                      │
                    → "add"                                → "function(" + generate(a) + ", "
                                                               + generate(b) + ") "
                                                               + generate(BlockStatement)
                                                                   │
                                                                   → "{\n  " + generate(ReturnStatement)
                                                                       │
                                                                       → "return " + generate(BinaryExpression)
                                                                           │
                                                                           → generate(a) + " + " + generate(b)
                                                                           → "a + b"

KẾT QUẢ CUỐI CÙNG:
"const add = function(a, b) {\n  return a + b;\n};"
```

---

## 6. Kết Nối Toàn Bộ: Mini Compiler

### 6.1 Full Pipeline

```javascript
// ============================================================
// MINI BABEL COMPILER — Kết nối Parse + Transform + Generate
// ============================================================

// Ở đây ta mượn @babel/parser cho bước Parse
// (vì lexer/parser viết tay cần hàng ngàn dòng switch-case,
//  logic đơn giản nhưng code nhiều — không phải phần core cần học)
const parser = require("@babel/parser");

function myBabelCompiler(code) {
  // ① PARSE: Code String → AST
  const ast = parser.parse(code);

  // ② TRANSFORM: Duyệt AST, gọi plugin sửa node
  traverse(ast, transformer);

  // ③ GENERATE: AST đã sửa → Code String mới
  const output = generate(ast.program); // parser.parse wraps in .program

  return output;
}

// ============== TEST ==============
const sourceCode = "const add = (a, b) => a + b;";
const targetCode = myBabelCompiler(sourceCode);

console.log(targetCode);
// Output:
// const add = function(a, b) {
//   return a + b;
// };
```

### 6.2 Kiến Trúc Tổng Quan

```
MINI BABEL — KIẾN TRÚC 3 TẦNG
══════════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                    myBabelCompiler(code)                   │
  │                                                           │
  │   ┌─────────┐      ┌───────────┐      ┌──────────┐      │
  │   │  PARSE  │      │ TRANSFORM │      │ GENERATE │      │
  │   │         │      │           │      │          │      │
  │   │ String  │─────►│   AST     │─────►│  AST     │      │
  │   │   →     │      │   được    │      │   →      │      │
  │   │  AST    │      │   sửa đổi │      │  String  │      │
  │   │         │      │           │      │          │      │
  │   │ parser  │      │ traverse  │      │ generate │      │
  │   │ .parse()│      │    +      │      │ (switch/ │      │
  │   │         │      │transformer│      │  case)   │      │
  │   └─────────┘      └───────────┘      └──────────┘      │
  │                                                           │
  │   Bước nặng nhất    Bước QUAN       Bước tedious         │
  │   (lexer + parser)  TRỌNG nhất     (xử lý format)       │
  │   → Mượn thư viện   → Core logic    → Tự viết           │
  │                      → Plugin here                        │
  └──────────────────────────────────────────────────────────┘
```

---

## 7. Babel Engineering — Cấu Hình & Sử Dụng

### 7.1 Sự Thật Phản Trực Giác

> **Babel bản thân nó KHÔNG LÀM GÌ CẢ.**

Nếu chỉ cài `@babel/core` và chạy, ES6 code đầu vào → ES6 code đầu ra, y nguyên. Babel chỉ parse AST rồi in lại — không thay đổi gì. Bạn phải **nói rõ** muốn chuyển đổi gì thông qua **plugins** và **presets**.

```
BABEL = VỎ RỖNG + PLUGINS
══════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────┐
  │  @babel/core (compiler engine)                   │
  │  ├── Parser                                      │
  │  ├── Traverser                                   │
  │  └── Generator                                   │
  │                                                   │
  │  KHÔNG có logic chuyển đổi nào!                  │
  │                                                   │
  │  Plugin = Logic chuyển đổi cụ thể                │
  │  ├── @babel/plugin-transform-arrow-functions     │
  │  ├── @babel/plugin-transform-classes             │
  │  ├── @babel/plugin-transform-destructuring       │
  │  └── ... hàng trăm plugins khác                  │
  │                                                   │
  │  Preset = Bộ sưu tập plugins phổ biến            │
  │  └── @babel/preset-env = "tất cả plugins cần"   │
  │      → Tự chọn plugins dựa trên targets          │
  └─────────────────────────────────────────────────┘
```

### 7.2 Xây Dựng Từ Đầu

**Bước 1: Khởi tạo project**

```bash
npm init -y
npm install --save-dev @babel/core @babel/cli @babel/preset-env
```

- `@babel/core` — Engine compiler
- `@babel/cli` — Chạy babel từ terminal
- `@babel/preset-env` — Preset thông minh, chứa tất cả plugins cần thiết

**Bước 2: Cấu hình `babel.config.json`**

```json
{
  "presets": ["@babel/preset-env"]
}
```

**Bước 3: Test**

```javascript
// src/index.js
const sayHello = () => console.log("Hello");
```

```bash
npx babel src --out-dir dist
```

Mở `dist/index.js` → arrow function đã thành `function`, `const` thành `var`.

### 7.3 Biên Dịch Theo Mục Tiêu (Targets)

Vấn đề: Cấu hình mặc định **quá ngu** — convert TẤT CẢ sang ES5, kể cả khi browser đã hỗ trợ.

```
VẤN ĐỀ OVERCOMPILATION:
══════════════════════════════════════════════════════

  Chrome 88 đã hỗ trợ: const, arrow func, class, ...
  → Convert sang ES5 = LÃNG PHÍ
  → Tăng kích thước bundle
  → Giảm perf (ES5 code thường chậm hơn)

  GIẢI PHÁP: Nói cho Babel biết target environment

  ┌─────────────────────────────────────────────────┐
  │ targets: { chrome: "88" }                        │
  │   → Babel kiểm tra: Chrome 88 hỗ trợ const?    │
  │     → CÓ → Bỏ qua, không convert               │
  │   → Chrome 88 hỗ trợ arrow function?            │
  │     → CÓ → Bỏ qua                              │
  │   → Chrome 88 hỗ trợ optional chaining?         │
  │     → CÓ → Bỏ qua                              │
  │                                                   │
  │ targets: { ie: "11" }                             │
  │   → IE 11 hỗ trợ const? → KHÔNG → Convert!     │
  │   → IE 11 hỗ trợ arrow func? → KHÔNG → Convert!│
  └─────────────────────────────────────────────────┘
```

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": { "chrome": "88" }
      }
    ]
  ]
}
```

### 7.4 Polyfill: Syntax vs API

```
HAI LOẠI CHUYỂN ĐỔI — PHÂN BIỆT QUAN TRỌNG:
══════════════════════════════════════════════════════

  ┌───────────────────────┬───────────────────────────┐
  │   SYNTAX TRANSFORM    │   API POLYFILL            │
  ├───────────────────────┼───────────────────────────┤
  │ => → function         │ Promise                   │
  │ class → prototype     │ Array.from                │
  │ const → var           │ Map, Set, WeakMap         │
  │ let → var             │ Object.assign             │
  │ ...spread → concat    │ String.includes           │
  │ destructuring → var   │ Array.find                │
  ├───────────────────────┼───────────────────────────┤
  │ preset-env xử lý ✅   │ preset-env KHÔNG xử lý ❌│
  │                       │ Cần core-js + polyfill    │
  └───────────────────────┴───────────────────────────┘

  `new Promise()` — Cú pháp ĐÚNG (tạo object bình thường)
  → Babel KHÔNG sửa
  → IE 11 chạy → "Promise is not defined" 💥
```

**Giải pháp: core-js + `useBuiltIns: "usage"`**

```bash
npm install core-js
```

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": { "ie": "11" },
        "useBuiltIns": "usage",
        "corejs": 3
      }
    ]
  ]
}
```

Khi code có `new Promise()`, Babel tự thêm `require("core-js/modules/es.promise.js")`. Không dùng → không thêm. Đó là sức mạnh của mode `"usage"`.

### 7.5 Tích Hợp Webpack

```javascript
// webpack.config.js
module.exports = {
  mode: "development",
  entry: "./src/index.js",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/, // CỰC KỲ QUAN TRỌNG: không compile node_modules
        use: { loader: "babel-loader" },
        // babel-loader tự đọc babel.config.json
      },
    ],
  },
};
```

```
WEBPACK + BABEL INTEGRATION:
══════════════════════════════════════════════════════

  Webpack                    babel-loader              @babel/core
  ┌──────────┐              ┌──────────────┐          ┌──────────┐
  │ Đọc file │──── .js ────►│ Cầu nối      │────────►│ Parse    │
  │ theo rule│              │ Webpack↔Babel │          │ Transform│
  │          │◄── result ───│              │◄────────│ Generate │
  └──────────┘              └──────────────┘          └──────────┘

  babel-loader = CẦU NỐI duy nhất giữa 2 hệ thống
  → Webpack đọc file → nhận ra .js → giao cho babel-loader
  → babel-loader gọi @babel/core transform
  → Trả code đã transform về Webpack
```

---

## 8. Handwritten Plugin: Replicating babel-plugin-import

### 8.1 Bài Toán

UI component libraries (Ant Design, Lodash) rất lớn. Khi viết:

```javascript
import { Button, Alert } from "antd";
```

Webpack sẽ **bundle TOÀN BỘ** antd (hàng trăm components) dù chỉ dùng 2. Plugin sẽ tự động transform thành:

```javascript
import Button from "antd/lib/button";
import Alert from "antd/lib/alert";
```

→ **On-demand loading**, giảm bundle size ngay lập tức.

### 8.2 So Sánh AST: Trước vs Sau

```
TRƯỚC: import { Button } from 'antd'
═══════════════════════════════════════

ImportDeclaration
├── specifiers: [ImportSpecifier]    ◄── Named import { Button }
│     ├── imported: Identifier "Button"
│     └── local: Identifier "Button"
└── source: StringLiteral "antd"


SAU: import Button from 'antd/lib/button'
═══════════════════════════════════════

ImportDeclaration
├── specifiers: [ImportDefaultSpecifier]  ◄── Default import
│     └── local: Identifier "Button"
└── source: StringLiteral "antd/lib/button"  ◄── Path đã đổi


CHIẾN LƯỢC:
┌─────────────────────────────────────────────────────┐
│ ① Lắng nghe node ImportDeclaration                   │
│ ② Kiểm tra source có phải thư viện cần optimize     │
│ ③ Trích xuất tên components từ specifiers            │
│ ④ Tạo ImportDeclaration MỚI cho từng component      │
│ ⑤ Thay thế 1 node cũ bằng N node mới                │
└─────────────────────────────────────────────────────┘
```

### 8.3 Implementation

```javascript
// ============================================================
// my-import-plugin.js — Tự viết babel-plugin-import
// ============================================================

module.exports = function (babel) {
  const { types: t } = babel; // Factory tạo AST node mới

  return {
    visitor: {
      ImportDeclaration(path, state) {
        const { node } = path;

        // ① Kiểm tra: library có phải target không?
        // state.opts = params từ config file
        const libraryName = state.opts.libraryName || "antd";
        if (node.source.value !== libraryName) {
          return; // Không phải → bỏ qua
        }

        // ② Chỉ xử lý named import { Button, Modal }
        // Bỏ qua default import: import Antd from 'antd'
        if (!node.specifiers.every((s) => t.isImportSpecifier(s))) {
          return;
        }

        // ③ Core: Tạo import mới cho TỪNG component
        const newImports = node.specifiers.map((specifier) => {
          const componentName = specifier.imported.name; // "Button"
          const localName = specifier.local.name; // "Button" (local alias)

          // Tạo path mới: 'antd/lib/button'
          const newPath = `${libraryName}/lib/${componentName.toLowerCase()}`;

          // Dùng babel.types factory tạo node AST mới:
          // import <localName> from '<newPath>'
          return t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier(localName))],
            t.stringLiteral(newPath),
          );
        });

        // ④ Thay thế: 1 node cũ → N node mới
        // replaceWithMultiple: API chuyên dùng cho 1→many
        path.replaceWithMultiple(newImports);
      },
    },
  };
};
```

### 8.4 Cấu Hình & Test

```json
// babel.config.json
{
  "presets": ["@babel/preset-env"],
  "plugins": [["./my-import-plugin.js", { "libraryName": "antd" }]]
}
```

```javascript
// test.js — Input
import { Button, Modal } from "antd";
console.log(Button, Modal);
```

```bash
npx babel test.js
```

```javascript
// Output:
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
console.log(Button, Modal);
```

### 8.5 Vấn Đề Nâng Cao Trong Production

```
TẠI SAO CODE THỰC TẾ CẦN HÀNG TRĂM DÒNG?
══════════════════════════════════════════════════════

┌─── Vấn đề 1: CSS Loading ───────────────────────┐
│ On-demand JS chưa đủ, cần load CSS tương ứng     │
│ → Thêm: import 'antd/lib/button/style/css'       │
│ → Cần generate thêm 1 importDeclaration cho CSS  │
└──────────────────────────────────────────────────┘

┌─── Vấn đề 2: Scope Conflicts ───────────────────┐
│ Nếu code đã có biến "Button" → xung đột         │
│ → Dùng path.scope.generateUidIdentifier          │
│   để tạo tên biến unique (_Button2)              │
└──────────────────────────────────────────────────┘

┌─── Vấn đề 3: Path Conversion ───────────────────┐
│ Component: DatePicker → file: date-picker        │
│ Ta dùng .toLowerCase() quá đơn giản             │
│ → Cần thuật toán CamelCase → Kebab-Case         │
│ → "DatePicker" → "date-picker"                  │
└──────────────────────────────────────────────────┘

┌─── Vấn đề 4: Re-export Pattern ─────────────────┐
│ import { Button } có thể là re-export           │
│ → Cần resolve actual file path                   │
│ → Phức tạp hơn nhiều so với demo                │
└──────────────────────────────────────────────────┘
```

### 8.6 Tóm Tắt Quy Trình Viết Plugin

```
VÒNG LẶP 3 BƯỚC KHI VIẾT BABEL PLUGIN:
══════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                    │
  │  ① XEM AST                                        │
  │     → Dùng astexplorer.net                        │
  │     → Paste source code → xem cấu trúc           │
  │     → So sánh input AST vs output AST             │
  │                                                    │
  │         ↓                                          │
  │                                                    │
  │  ② TẠO NODE MỚI                                  │
  │     → Dùng babel.types (t) làm factory            │
  │     → t.importDeclaration(...)                    │
  │     → t.identifier(...)                           │
  │     → t.stringLiteral(...)                        │
  │                                                    │
  │         ↓                                          │
  │                                                    │
  │  ③ THAY THẾ NODE                                  │
  │     → path.replaceWith(newNode)      // 1 → 1     │
  │     → path.replaceWithMultiple(arr)  // 1 → nhiều │
  │     → path.remove()                  // Xóa node  │
  │     → path.insertBefore(node)        // Chèn trước│
  │                                                    │
  └──────────────────────────────────────────────────┘

  Nắm vững visitor + types → có quyền năng
  SỬA ĐỔI CHÍNH NGÔN NGỮ JAVASCRIPT.
```

---

## 9. Deep Analysis Patterns

### Pattern 1: Đệ Quy "Tại Sao" (5 Whys) — Truy Vết Từ Hiện Tượng Đến Bản Chất

**Áp dụng cho Babel:**

```
Q1: Tại sao cần Babel?
→ Vì browser cũ không hiểu ES6+ syntax.

Q2: Tại sao browser cũ không hiểu?
→ Vì JS engine (V8, SpiderMonkey) chỉ implement spec
  tại thời điểm browser đó release. IE11 ra 2013,
  ES6 spec hoàn thành 2015.

Q3: Tại sao không bắt browser update?
→ Vì enterprise/government dùng legacy browser.
  Có hàng triệu user trên IE11. Business không thể
  bỏ rơi họ.

Q4: Tại sao Babel chọn cách transform code thay vì polyfill tất cả?
→ Vì SYNTAX không thể polyfill. `=>` là cú pháp —
  parser sẽ throw SyntaxError trước khi code chạy.
  Chỉ có thể sửa tại BUILD TIME, không phải RUNTIME.

Q5: Tại sao Babel dùng AST thay vì string manipulation?
→ Vì CODE LÀ CẤU TRÚC, KHÔNG PHẢI TEXT.
  String manipulation (regex) không hiểu ngữ nghĩa.
  AST cho phép thao tác chính xác trên cấu trúc ngữ pháp,
  phân biệt code vs string content, xử lý scope và context.

  → GIỚI HẠN VẬT LÝ: Bất kỳ tool nào muốn "hiểu" code
    đều PHẢI parse thành cấu trúc trước. Đây là bản chất
    của compiler theory từ những năm 1950.
```

### Pattern 2: First Principles Thinking — Phân Rã Đến Nền Tảng

```
BABEL PHÂN RÃ THÀNH NỀN TẢNG:
══════════════════════════════════════════════════════

┌── Data Structures ──────────────────────────────────┐
│                                                      │
│  AST = TREE (cây)                                    │
│  → Node type: ~200 loại (ESTree spec)               │
│  → Mỗi node = object với type + properties          │
│  → Traverse = DFS (Depth-First Search)              │
│     Độ phức tạp: O(n) — n = tổng số nodes           │
│                                                      │
│  Không có gì "magic":                                │
│  → Parse = Tokenize (O(n)) + Build Tree (O(n))      │
│  → Transform = DFS traverse (O(n))                   │
│  → Generate = DFS traverse (O(n))                    │
│  → TỔNG: O(n) — linear theo kích thước code         │
│                                                      │
└──────────────────────────────────────────────────────┘

┌── Algorithms ───────────────────────────────────────┐
│                                                      │
│  Tokenizer: State Machine                            │
│  → Đọc từng ký tự, chuyển trạng thái               │
│  → Ví dụ: gặp `"` → vào STRING state                │
│  → Gặp `"` lần 2 → thoát STRING state               │
│                                                      │
│  Parser: Recursive Descent                           │
│  → Top-down parsing                                  │
│  → Mỗi grammar rule = 1 function                    │
│  → parseExpression() gọi parseBinary()              │
│    gọi parseUnary() gọi parsePrimary()...           │
│                                                      │
│  Traverser: Visitor Pattern                          │
│  → DFS + callback per node type                     │
│  → O(n) time, O(d) stack (d = tree depth)           │
│                                                      │
└──────────────────────────────────────────────────────┘

┌── Hardware Implications ────────────────────────────┐
│                                                      │
│  Parse: CPU-bound (string processing)                │
│  → Bottleneck: CPU cache misses khi parse file lớn  │
│                                                      │
│  Transform: Memory-bound (AST in RAM)                │
│  → AST tiêu tốn ~10-30x dung lượng source code     │
│  → 1MB source → ~10-30MB AST in memory              │
│  → Đây là lý do KHÔNG compile node_modules!         │
│                                                      │
│  Generate: CPU-bound (string concatenation)          │
│  → Modern V8 optimize string concat bằng rope/cons  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Pattern 3: Trade-off Analysis — Đánh Đổi

```
BABEL TRADE-OFFS:
══════════════════════════════════════════════════════

┌──────────────────┬──────────────────┬──────────────┐
│  ĐƯỢC GÌ         │   MẤT GÌ         │  KHI NÀO     │
├──────────────────┼──────────────────┼──────────────┤
│ Tương thích      │ Build time tăng  │ Hỗ trợ IE11  │
│ browser cũ       │ Bundle size tăng │ Legacy system │
├──────────────────┼──────────────────┼──────────────┤
│ Dùng syntax mới  │ Debug khó hơn   │ Developer     │
│ ngay hôm nay     │ (compiled code   │ experience    │
│                  │  khác source)    │ ưu tiên       │
├──────────────────┼──────────────────┼──────────────┤
│ Plugin ecosystem │ Config phức tạp  │ Cần customize │
│ mở rộng          │ (Babel hell)     │ transform     │
├──────────────────┼──────────────────┼──────────────┤
│ Polyfill tự động │ Bundle bloat     │ Nhiều API mới │
│ (useBuiltIns)    │ (core-js ~100KB) │ cần support   │
└──────────────────┴──────────────────┴──────────────┘

KỊCH BẢN BABEL THẤT BẠI HOÀN TOÀN:
┌─────────────────────────────────────────────────────┐
│ ① Target = chỉ Chrome latest                        │
│   → Babel không cần thiết, chỉ tăng build time      │
│   → Giải pháp: Bỏ Babel, dùng native ES modules    │
│                                                      │
│ ② Dự án quá lớn (monorepo hàng ngàn file)           │
│   → Babel quá chậm (single-threaded)                │
│   → Giải pháp: SWC (Rust) hoặc esbuild (Go)        │
│   → SWC nhanh hơn 20-70x so với Babel               │
│                                                      │
│ ③ TypeScript project                                 │
│   → tsc đã handle cả type checking + transform      │
│   → Dùng Babel = duplicate work + mất type checking │
│   → Trừ khi cần Babel plugin đặc biệt              │
└─────────────────────────────────────────────────────┘

SO SÁNH COMPILER SPEED:
┌──────────┬────────────┬──────────┬──────────────────┐
│ Tool     │ Ngôn ngữ   │ Tốc độ   │ Trade-off        │
├──────────┼────────────┼──────────┼──────────────────┤
│ Babel    │ JavaScript │ 1x       │ Plugin ecosystem │
│ SWC      │ Rust       │ 20-70x   │ Ít plugin hơn    │
│ esbuild  │ Go         │ 10-100x  │ Không có plugin  │
│ tsc      │ JavaScript │ ~1x      │ Type checking    │
└──────────┴────────────┴──────────┴──────────────────┘
```

### Pattern 4: Mental Mapping — Vị Trí Trong Bản Đồ Tổng Thể

```
BẢN ĐỒ HỆ THỐNG: BABEL Ở ĐÂU?
══════════════════════════════════════════════════════

  ┌─── TẦNG ỨNG DỤNG ────────────────────────────────┐
  │                                                    │
  │  React JSX → Babel transform → React.createElement│
  │  TypeScript → Babel strip types → JavaScript       │
  │  ES2024 → Babel downlevel → ES5                   │
  │                                                    │
  └────────────────────────┬───────────────────────────┘
                           │ Babel output = JS thuần
                           ▼
  ┌─── TẦNG BUILD TOOL ───────────────────────────────┐
  │                                                    │
  │  Webpack / Vite / Rollup                           │
  │  ├── babel-loader ← MỐI NỐI                       │
  │  ├── Bundle modules                                │
  │  ├── Code splitting                                │
  │  ├── Tree shaking                                  │
  │  └── Output: bundle.js                             │
  │                                                    │
  └────────────────────────┬───────────────────────────┘
                           │ Static files
                           ▼
  ┌─── TẦNG RUNTIME (BROWSER) ────────────────────────┐
  │                                                    │
  │  JS Engine (V8)                                    │
  │  ├── Parse script → Engine AST (khác Babel AST!)  │
  │  ├── Compile → Bytecode (Ignition)                │
  │  ├── Optimize → Machine Code (TurboFan)           │
  │  └── Execute                                       │
  │                                                    │
  └────────────────────────┬───────────────────────────┘
                           │
                           ▼
  ┌─── TẦNG OS / HARDWARE ────────────────────────────┐
  │                                                    │
  │  Process → Thread → CPU Instructions               │
  │  Memory: Stack (primitives) + Heap (objects)       │
  │  I/O: Network requests, File system               │
  │                                                    │
  └────────────────────────────────────────────────────┘


  MỘT DÒNG CODE CHẠY QUA BAO NHIỀU TẦNG?

  const add = (a, b) => a + b;  ← Bạn viết ở đây
       │
       ├── Babel parse → AST → transform → generate
       ├── Webpack bundle → dist/main.js
       ├── Browser download → V8 parse
       ├── V8 compile → bytecode
       ├── CPU execute machine instructions
       └── Result: số a+b stored in register → RAM
```

### Pattern 5: Reverse Engineering & Implementation — "What I Cannot Create, I Do Not Understand"

Toàn bộ sections 3-6 và 8 của tài liệu này chính là việc thực hành pattern này:

```
NHỮNG GÌ ĐÃ TỰ IMPLEMENT BẰNG TAY:
══════════════════════════════════════════════════════

  ✅ Traverser (Section 3)
     → Hiểu Visitor Pattern ở mức fundamental
     → Hiểu DFS traversal trên tree structure
     → Hiểu tại sao cần đệ quy

  ✅ Transformer Plugin (Section 4)
     → Hiểu object mutation vs immutable transform
     → Hiểu tại sao AST dùng reference semantics

  ✅ Code Generator (Section 5)
     → Hiểu recursive string building
     → Hiểu mối quan hệ 1-1 giữa node type và syntax

  ✅ babel-plugin-import (Section 8)
     → Hiểu real-world plugin architecture
     → Hiểu babel.types factory pattern
     → Hiểu path API (replaceWith, replaceWithMultiple)

  BÀI TẬP MỞ RỘNG:
  ┌─────────────────────────────────────────────────┐
  │ ① Viết Tokenizer/Lexer cho subset JS           │
  │   → Chỉ cần handle: let, const, =, =>, +,     │
  │     identifier, number, string, (, ), {, }, ;   │
  │                                                  │
  │ ② Viết Parser cho subset đó                     │
  │   → Recursive descent parser                    │
  │   → Output: AST giống format ở Section 2        │
  │                                                  │
  │ ③ Viết plugin: const/let → var                  │
  │   → Tương tự arrow function plugin              │
  │   → Chỉ cần đổi node.kind = "var"              │
  │                                                  │
  │ ④ Viết plugin: template literal → concatenation │
  │   → `Hello ${name}` → "Hello " + name           │
  └─────────────────────────────────────────────────┘
```

### Pattern 6: Lịch Sử & Sự Tiến Hóa — Tại Sao Babel Tồn Tại?

```
DÒNG THỜI GIAN EVOLUTION:
══════════════════════════════════════════════════════

  2009 │ ES5 release. JavaScript có spec ổn định đầu tiên.
       │ Mọi browser implement. Không cần transpile.
       │
  2011 │ CoffeeScript phổ biến.
       │ "JavaScript syntax xấu quá!" → Compile-to-JS
       │ → Ý tưởng: viết ngôn ngữ A, compile sang JS
       │
  2013 │ IE11 release (browser cuối cùng support IE).
       │ TypeScript 1.0 ra đời.
       │ Google Traceur: transpile ES6 → ES5 (thử nghiệm)
       │
  2014 │ ★ 6to5 ra đời (Sebastian McKenzie, 17 tuổi!)
       │ → Transpile ES6 → ES5, tập trung DX tốt
       │ → Nhanh chóng phổ biến hơn Traceur
       │
  2015 │ 6to5 đổi tên → BABEL
       │ ES2015 (ES6) spec hoàn thành chính thức.
       │ → Babel trở thành TIÊU CHUẨN cho transpilation
       │ → Plugin system: cộng đồng viết plugins
       │
  2016 │ Babel 6: Major rewrite
  -    │ → "Babel mặc định không làm gì" (empty shell)
  2018 │ → Plugin/Preset architecture hoàn thiện
       │ → preset-env: compile theo targets
       │
  2020 │ Babel 7: @babel/ scoped packages
       │ → TypeScript support built-in
       │ → Tốc độ cải thiện nhưng vẫn chậm
       │
  2021 │ ★ SWC (Rust) và esbuild (Go) nổi lên
  -    │ → 20-100x nhanh hơn Babel
  2023 │ → Next.js chuyển sang dùng SWC
       │ → Vite dùng esbuild cho dev mode
       │
  2024+│ Babel GIỮ GIÁ TRỊ nhờ:
       │ → Plugin ecosystem khổng lồ (không ai có)
       │ → Proposal plugins (test TC39 proposals)
       │ → Legacy project support


TẠI SAO BABEL CHIẾN THẮNG TRACEUR?
┌─────────────────────────────────────────────────────┐
│ ① DX (Developer Experience) tốt hơn               │
│   → Config đơn giản, error message rõ ràng          │
│                                                      │
│ ② Plugin system mở                                  │
│   → Traceur monolithic, Babel = composable plugins  │
│   → Cộng đồng đóng góp → ecosystem bùng nổ         │
│                                                      │
│ ③ Tốc độ adopt nhanh                                │
│   → Sebastian marketing tốt + community building    │
│   → React team chọn Babel cho JSX transform         │
│   → Angular, Vue cũng dùng → de facto standard      │
└─────────────────────────────────────────────────────┘

BABEL ĐÃ "THẮNG" NHƯNG ĐANG "THUA":
┌─────────────────────────────────────────────────────┐
│ Thắng: JavaScript ecosystem standard từ 2015-2020  │
│                                                      │
│ Thua: Performance war với native compilers          │
│   → JS single-threaded < Rust multi-threaded        │
│   → Đây là giới hạn VẬT LÝ của ngôn ngữ           │
│   → Không thể fix bằng optimization                │
│                                                      │
│ Nhưng: Plugin ecosystem = ECONOMIC MOAT              │
│   → Hàng ngàn plugins không thể port sang SWC      │
│   → Enterprise projects vẫn cần Babel               │
│   → Proposal testing vẫn chỉ có Babel               │
└─────────────────────────────────────────────────────┘
```

---

## 10. Tổng Hợp & Quick Reference

### 10.1 Core Logic Summary

```
BABEL = 3 BƯỚC ĐƠN GIẢN:
══════════════════════════════════════════════════════

  ① OBJECTIFY (Đối tượng hóa)
     Code là string → không sửa được theo cấu trúc
     → Parse thành AST (object tree)
     → Giờ có thể thao tác chính xác từng phần

  ② RECURSE (Đệ quy)
     AST nested sâu → dùng DFS recursive traversal
     → Visitor pattern: callback per node type
     → Plugin gắn vào node types cần xử lý

  ③ RESTORE (Phục hồi)
     Sau khi sửa object → ghép lại thành string
     → switch/case per node type
     → Recursive string concatenation
```

### 10.2 Config Cheat Sheet

```
BABEL CONFIG — QUICK REFERENCE:
══════════════════════════════════════════════════════

  ┌─── Packages Cần Cài ──────────────────────────────┐
  │ @babel/core        Engine chính                     │
  │ @babel/cli         Chạy từ terminal                │
  │ @babel/preset-env  All-in-one preset               │
  │ core-js            API polyfills                   │
  │ babel-loader       Cầu nối Webpack ↔ Babel         │
  └────────────────────────────────────────────────────┘

  ┌─── babel.config.json Tối Ưu ──────────────────────┐
  │ {                                                   │
  │   "presets": [                                      │
  │     ["@babel/preset-env", {                         │
  │       "targets": "> 0.25%, not dead",               │
  │       "useBuiltIns": "usage",                       │
  │       "corejs": 3                                   │
  │     }]                                              │
  │   ]                                                 │
  │ }                                                   │
  └────────────────────────────────────────────────────┘

  ┌─── 4 Quy Tắc Vàng ────────────────────────────────┐
  │ ① Babel core = vỏ rỗng → cần plugin/preset        │
  │ ② preset-env + targets = compile đúng mức cần     │
  │ ③ Syntax ≠ API: polyfill cần core-js riêng        │
  │ ④ LUÔN exclude node_modules khỏi babel-loader     │
  └────────────────────────────────────────────────────┘
```

### 10.3 Plugin API Cheat Sheet

```
BABEL PLUGIN API — QUICK REFERENCE:
══════════════════════════════════════════════════════

  module.exports = function(babel) {
    const { types: t } = babel;

    return {
      visitor: {
        // Node type handlers
        NodeType(path, state) {
          // path.node       → Current AST node
          // path.parent     → Parent node
          // path.scope      → Scope information
          // state.opts      → Plugin config options

          // Operations:
          path.replaceWith(newNode);           // 1 → 1
          path.replaceWithMultiple([n1, n2]);  // 1 → N
          path.remove();                       // Delete
          path.insertBefore(node);             // Insert
          path.insertAfter(node);              // Insert

          // Node creation (babel.types):
          t.identifier("name");
          t.stringLiteral("value");
          t.importDeclaration(specifiers, source);
          t.importDefaultSpecifier(local);
          t.functionExpression(id, params, body);
          t.blockStatement(body);
          t.returnStatement(argument);

          // Type checking:
          t.isIdentifier(node);
          t.isImportSpecifier(node);
          t.isFunctionExpression(node);
        }
      }
    };
  };
```

---

## Câu Hỏi Phỏng Vấn

```
CÁC CÂU HỎI THƯỜNG GẶP VỀ BABEL:
══════════════════════════════════════════════════════

① Babel hoạt động như thế nào? (Parse → Transform → Generate)

② Plugin và Preset khác nhau thế nào?
   → Plugin = 1 transform. Preset = bộ plugins.

③ preset-env làm gì? Tại sao cần targets?
   → Compile theo mục tiêu, tránh overcompilation.

④ Syntax transform vs API polyfill khác nhau thế nào?
   → Syntax: build-time (Babel). API: runtime (core-js).

⑤ Tại sao exclude node_modules?
   → Đã compiled, compile lại = waste + có thể break.

⑥ SWC/esbuild vs Babel? Khi nào chọn cái nào?
   → Speed vs Plugin ecosystem. New project → SWC.
   → Legacy/custom plugins → Babel.

⑦ Viết 1 Babel plugin đơn giản (ví dụ: console.log remover)
   → visitor: { CallExpression(path) {
        if (path.node.callee.object?.name === 'console')
          path.remove();
      }}

⑧ AST là gì? Tại sao cần?
   → Tree structure đại diện code. Cần vì string
     manipulation không hiểu ngữ nghĩa.
```

---

**Tài Liệu Tham Khảo:**

- [AST Explorer](https://astexplorer.net/) — Visualize AST trực tuyến
- [Babel Plugin Handbook](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md)
- [The Super Tiny Compiler](https://github.com/jamiebuilds/the-super-tiny-compiler) — ~200 dòng code, cùng tác giả
- [Babel Official Docs](https://babeljs.io/docs/)
- [ESTree Spec](https://github.com/estree/estree) — AST node type specification
