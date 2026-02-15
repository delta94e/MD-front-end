# Tự động thêm try/catch cho mọi async — Babel Plugin — Deep Dive

> 📅 2026-02-12 · ⏱ 12 phút đọc
>
> Alibaba round 3: "Làm sao thêm try/catch cho TẤT CẢ async functions?"
> AST fundamentals, Babel plugin architecture, visitor pattern,
> babel-template, 4 loại async function, error reporting.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: AST / Babel / Tooling

---

## Mục Lục

0. [Vấn đề — Tại sao cần?](#0-vấn-đề)
1. [AST Fundamentals](#1-ast)
2. [Babel Plugin Architecture](#2-babel-plugin)
3. [Implement từng bước](#3-implement)
4. [Code hoàn chỉnh](#4-code)
5. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#5-tóm-tắt)

---

## 0. Vấn đề — Tại sao cần?

### async không có try/catch = Uncaught Error

```javascript
async function fn() {
  let value = await new Promise((resolve, reject) => {
    reject("failure");
  });
  console.log("do something..."); // ← KHÔNG BAO GIỜ CHẠY!
}
fn(); // ❌ Uncaught (in promise): failure
```

```
VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  async function KHÔNG có try/catch:
  → await reject → Uncaught Promise rejection
  → Code sau await KHÔNG chạy
  → Browser console báo lỗi đỏ
  → Production: user thấy blank page, crash!

  GIẢI PHÁP TRUYỀN THỐNG:
  → Thêm try/catch THỦ CÔNG vào từng async function
  → Nhưng DỰ ÁN LỚN = hàng trăm async functions!
  → Quên 1 cái = bug trong production!

  💡 GIẢI PHÁP: Viết BABEL PLUGIN tự động thêm try/catch!
```

### Kết quả mong muốn

```javascript
// TRƯỚC (code gốc):
async function fn() {
  await new Promise((resolve, reject) => reject("报错"));
  await new Promise((resolve) => resolve(1));
  console.log("do something...");
}

// SAU (Babel plugin transform):
async function fn() {
  try {
    await new Promise((resolve, reject) => reject("报错"));
    await new Promise((resolve) => resolve(1));
    console.log("do something...");
  } catch (e) {
    console.log("\nfilePath: E:\\myapp\\src\\main.js\nfuncName: fn\nError:", e);
  }
}
```

```
ERROR OUTPUT:
  filePath: E:\myapp\src\main.js    ← File nào lỗi
  funcName: fn                       ← Function nào lỗi
  Error: 报错                        ← Lỗi cụ thể là gì

  → Locate bug NGAY LẬP TỨC!
```

---

## 1. AST Fundamentals

### AST là gì?

```
AST — ABSTRACT SYNTAX TREE:
═══════════════════════════════════════════════════════════════

  Code (string) → AST (tree) → Modified AST → New Code

  2 giai đoạn tạo AST:

  ① LEXICAL ANALYSIS (Phân tích từ vựng):
     Code string → Tokens (flat array)

     "let a = 1"
     → [
         { type: 'Keyword',    value: 'let' },
         { type: 'Identifier', value: 'a'   },
         { type: 'Punctuator', value: '='   },
         { type: 'Numeric',    value: '1'   }
       ]

  ② SYNTAX ANALYSIS (Phân tích cú pháp):
     Tokens → AST Tree (nested objects)

     { type: 'VariableDeclaration',
       kind: 'let',
       declarations: [{
         type: 'VariableDeclarator',
         id:   { type: 'Identifier', name: 'a' },
         init: { type: 'Literal',    value: 1  }
       }]
     }
```

### Ví dụ: function → AST

```javascript
function demo(n) {
  return n * n;
}
```

```
AST TREE:
═══════════════════════════════════════════════════════════════

  Program
  └── FunctionDeclaration
      ├── id: Identifier (name: "demo")
      ├── async: false
      ├── params: [Identifier (name: "n")]
      └── body: BlockStatement
          └── ReturnStatement
              └── argument: BinaryExpression
                  ├── left:  Identifier (name: "n")
                  ├── operator: "*"
                  └── right: Identifier (name: "n")
```

### Bảng AST Node Types thường gặp

```
AST NODE TYPES — REFERENCE:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────┬─────────────┬──────────────────┐
  │ Type                    │ Tên VN      │ Ví dụ            │
  ├─────────────────────────┼─────────────┼──────────────────┤
  │ Program                 │ Chương trình│ Toàn bộ code     │
  │ VariableDeclaration     │ Khai báo    │ let, const, var  │
  │ FunctionDeclaration     │ Hàm khai báo│ function fn(){}  │
  │ FunctionExpression      │ Hàm biểu thức│const f=function()│
  │ ArrowFunctionExpression │ Arrow func  │ const f=()=>{}   │
  │ ExpressionStatement     │ Biểu thức   │ console.log()    │
  │ BlockStatement          │ Khối code   │ { ... }          │
  │ ReturnStatement         │ Return      │ return x         │
  │ IfStatement             │ If          │ if(x){}else{}    │
  │ Identifier              │ Định danh   │ tên biến, hàm    │
  │ CallExpression          │ Gọi hàm    │ fn()             │
  │ BinaryExpression        │ Phép toán   │ a + b            │
  │ MemberExpression        │ Truy cập    │ console.log      │
  │ AwaitExpression         │ Await       │ await f()        │
  │ ObjectMethod            │ Method      │ { async fn(){} } │
  │ TryStatement            │ Try/Catch   │ try{}catch(e){}  │
  │ StringLiteral           │ Chuỗi       │ "hello"          │
  │ NumericLiteral          │ Số          │ 42               │
  └─────────────────────────┴─────────────┴──────────────────┘

  🔧 Online tools: astexplorer.net
```

### AST của async function với await

```
TRƯỚC — async function:
═══════════════════════════════════════════════════════════════

  FunctionDeclaration
  ├── id: Identifier (name: "fn")
  ├── async: true  ← ⭐ KEY: tìm async = true
  └── body: BlockStatement
      └── body: [
          ExpressionStatement
          └── expression: AwaitExpression  ← ⭐ Tìm node này!
              └── argument: CallExpression (f())
      ]


SAU — thêm try/catch:
═══════════════════════════════════════════════════════════════

  FunctionDeclaration
  ├── id: Identifier (name: "fn")
  ├── async: true
  └── body: BlockStatement
      └── body: [
          TryStatement  ← ⭐ Wrap body vào đây!
          ├── block: BlockStatement
          │   └── body: [
          │       ExpressionStatement     ← Body gốc chuyển vào đây
          │       └── AwaitExpression
          │   ]
          └── handler: CatchClause
              ├── param: Identifier (e)
              └── body: BlockStatement
                  └── console.log(...)
      ]

  CORE: lấy body gốc → bỏ vào TryStatement.block.body!
```

---

## 2. Babel Plugin Architecture

### Cấu trúc cơ bản

```javascript
// Format cơ bản của 1 Babel plugin
module.exports = function (babel) {
  let types = babel.types; // Thao tác AST nodes: create, validate, transform

  return {
    name: "my-plugin",
    visitor: {
      // Visitor Pattern: khai báo NODE TYPE muốn visit
      // Babel traverse AST → gặp node type này → gọi callback
      AwaitExpression(path, state) {
        // path: đường dẫn đến node hiện tại trong AST
        // state: chứa opts (user config), filename, etc.
        // do something...
      },
    },
  };
};
```

```
BABEL PLUGIN — KEY CONCEPTS:
═══════════════════════════════════════════════════════════════

  babel.types (t):
  → Tạo node:    t.stringLiteral('hello')
  → Validate:    t.isIdentifier(node)
  → Clone:       t.cloneNode(node)

  path (NodePath):
  → path.node           — AST node hiện tại
  → path.parent         — Parent node
  → path.findParent(fn) — Tìm ancestor thỏa condition
  → path.getSibling(key)— Lấy sibling node
  → path.isTryStatement() — Check type
  → path.replaceWith(node) — Thay thế node

  state:
  → this.opts           — User plugin options
  → this.filename       — File đang compile
  → this.file.opts      — Babel file options

  VISITOR PATTERN:
  → Babel traverse toàn bộ AST
  → Khi gặp node type = key trong visitor → gọi callback
  → Plugin KHÔNG CẦN tự traverse!
```

### Ý tưởng implement

```
PLUGIN FLOW — 4 BƯỚC:
═══════════════════════════════════════════════════════════════

  ① Tìm AwaitExpression trong AST
     → visitor: { AwaitExpression(path) { ... } }

  ② Từ await, tìm NGƯỢC LÊN async function (parent)
     → path.findParent(p => p.node.async && ...)
     → 4 loại async: Declaration, Expression, Arrow, ObjectMethod

  ③ Tạo try/catch node bằng babel-template
     → template(`try {} catch(e) { console.log(CatchError, e) }`)
     → Điền thông tin error (filePath, funcName)

  ④ Chuyển body gốc vào try block → replace
     → tryNode.block.body.push(...info.body)
     → info.body = [tryNode]
```

---

## 3. Implement từng bước

### Bước 1: Tìm AwaitExpression

```javascript
module.exports = function (babel) {
  let types = babel.types;
  return {
    visitor: {
      AwaitExpression(path) {
        let node = path.node; // Node await hiện tại
      },
    },
  };
};
```

### Bước 2: Tìm ngược lên async function

```javascript
// 4 LOẠI async function PHẢI xử lý:
// ① async function fn() {}           → FunctionDeclaration
// ② const fn = async function() {}   → FunctionExpression
// ③ const fn = async () => {}        → ArrowFunctionExpression
// ④ const obj = { async fn() {} }    → ObjectMethod

const asyncPath = path.findParent(
  (p) =>
    p.node.async &&
    (p.isFunctionDeclaration() ||
      p.isArrowFunctionExpression() ||
      p.isFunctionExpression() ||
      p.isObjectMethod()),
);
```

```
TẠI SAO CẦN CHECK 4 LOẠI?
═══════════════════════════════════════════════════════════════

  Nếu chỉ check FunctionDeclaration:
  → const fn = async () => { await f() }  ← BỎ SÓT!
  → methods: { async save() { await f() } } ← BỎ SÓT!

  Phải check TẤT CẢ 4 loại async function:
  ┌──────────────────────────┬──────────────────────────────┐
  │ Type                     │ Ví dụ                        │
  ├──────────────────────────┼──────────────────────────────┤
  │ FunctionDeclaration      │ async function fn() {}       │
  │ FunctionExpression       │ const fn = async function(){}│
  │ ArrowFunctionExpression  │ const fn = async () => {}    │
  │ ObjectMethod             │ { async fn() {} }            │
  └──────────────────────────┴──────────────────────────────┘
```

### Bước 3: Tạo try/catch bằng babel-template

```javascript
const template = require("babel-template");

// Template try/catch
let tryTemplate = `
try {
} catch (e) {
    console.log(CatchError, e)
}`;

const temp = template(tryTemplate);

// Tạo nội dung console.log
let tempArgumentObj = {
  CatchError: types.stringLiteral(
    `\nfilePath: ${filePath}\nfuncName: ${funcName}\nError:`,
  ),
};

// Tạo AST node cho try/catch
let tryNode = temp(tempArgumentObj);
```

```
BABEL-TEMPLATE:
═══════════════════════════════════════════════════════════════

  babel-template = viết CODE STRING → tạo AST nodes

  Template:   try {} catch(e) { console.log(CatchError, e) }
  CatchError: types.stringLiteral("...")  ← Placeholder

  → template PARSE string thành AST
  → Thay CatchError bằng StringLiteral node
  → Return TryStatement AST node hoàn chỉnh!

  TẠI SAO DÙNG TEMPLATE thay vì tạo node thủ công?
  → Tạo thủ công: t.tryStatement(t.blockStatement([...]),
                     t.catchClause(t.identifier('e'), ...))
  → Cực kỳ DÀI và KHÓ ĐỌC!
  → Template: viết code bình thường, tự convert → ELEGANT!
```

### Bước 4: Replace body

```javascript
// Lấy body gốc của async function
let info = asyncPath.node.body;

// Chuyển body gốc VÀO try block
tryNode.block.body.push(...info.body);

// Thay body = try/catch
info.body = [tryNode];
```

```
REPLACE FLOW:
═══════════════════════════════════════════════════════════════

  TRƯỚC:
  async function fn() {
      body: [                    ← info.body
          await f(),             ← statement 1
          console.log('...')     ← statement 2
      ]
  }

  THAO TÁC:
  tryNode.block.body = []         ← Try block rỗng
  tryNode.block.body.push(        ← Chuyển body gốc vào
      await f(),
      console.log('...')
  )
  info.body = [tryNode]           ← Replace body = try/catch

  SAU:
  async function fn() {
      body: [
          TryStatement {          ← info.body = [tryNode]
              block: [
                  await f(),      ← Body gốc ở đây
                  console.log()
              ],
              handler: catch(e) { ... }
          }
      ]
  }
```

### Bước 5: Skip nếu đã có try/catch

```javascript
// Nếu await ĐÃ nằm trong try/catch → KHÔNG thêm nữa!
if (path.findParent((p) => p.isTryStatement())) {
  return false;
}
```

```
EDGE CASE — ĐÃ CÓ TRY/CATCH:
═══════════════════════════════════════════════════════════════

  // Code này KHÔNG CẦN thêm try/catch
  async function fn() {
      try {
          await f();     ← await ĐÃ trong try
      } catch (e) {
          console.log(e);
      }
  }

  → findParent(isTryStatement) = true → SKIP!
  → Tránh wrap try trong try → code bloat!
```

### Bước 6: Lấy function name

```javascript
let asyncName = "";
let type = asyncPath.node.type;

switch (type) {
  // ① Function Expression + Arrow Function
  case "FunctionExpression":
  case "ArrowFunctionExpression":
    // const fn = async () => {}
    //       ↑ sibling 'id' chứa tên
    let identifier = asyncPath.getSibling("id");
    asyncName = identifier && identifier.node ? identifier.node.name : "";
    break;

  // ② Function Declaration
  case "FunctionDeclaration":
    // async function fn() {}
    //                ↑ node.id.name
    asyncName = (asyncPath.node.id && asyncPath.node.id.name) || "";
    break;

  // ③ Object Method
  case "ObjectMethod":
    // methods: { async save() {} }
    //                  ↑ node.key.name
    asyncName = asyncPath.node.key.name || "";
    break;
}

// Fallback: lấy từ callee name
let funcName =
  asyncName || (node.argument.callee && node.argument.callee.name) || "";
```

```
LẤY FUNCTION NAME — 4 CÁCH:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────┬─────────────────────┐
  │ Loại                           │ Cách lấy name       │
  ├─────────────────────────────────┼─────────────────────┤
  │ async function fn(){}          │ node.id.name        │
  │ const fn = async function(){}  │ getSibling('id')    │
  │ const fn = async () => {}      │ getSibling('id')    │
  │ { async fn(){} }               │ node.key.name       │
  └─────────────────────────────────┴─────────────────────┘

  getSibling('id'):
  → VariableDeclarator: { id: Identifier('fn'), init: ArrowFn }
  → Arrow function là init → sibling 'id' = Identifier('fn')
```

---

## 4. Code hoàn chỉnh

### index.js — Plugin chính

```javascript
const template = require("babel-template");
const {
  tryTemplate,
  catchConsole,
  mergeOptions,
  matchesFile,
} = require("./util");

module.exports = function (babel) {
  let types = babel.types;

  const visitor = {
    AwaitExpression(path) {
      // Validate options
      if (this.opts && typeof this.opts !== "object") {
        return console.error("[plugin]: options need to be an object.");
      }

      // ① Skip nếu đã có try/catch
      if (path.findParent((p) => p.isTryStatement())) {
        return false;
      }

      // ② Merge user options
      const options = mergeOptions(this.opts);

      // ③ Lấy file path
      const filePath = this.filename || this.file.opts.filename || "unknown";

      // ④ Check exclude/include
      if (matchesFile(options.exclude, filePath)) return;
      if (options.include.length && !matchesFile(options.include, filePath))
        return;

      // ⑤ Lấy await node
      let node = path.node;

      // ⑥ Tìm async function parent (4 loại)
      const asyncPath = path.findParent(
        (p) =>
          p.node.async &&
          (p.isFunctionDeclaration() ||
            p.isArrowFunctionExpression() ||
            p.isFunctionExpression() ||
            p.isObjectMethod()),
      );

      if (!asyncPath) return;

      // ⑦ Lấy function name
      let asyncName = "";
      let type = asyncPath.node.type;

      switch (type) {
        case "FunctionExpression":
        case "ArrowFunctionExpression":
          let identifier = asyncPath.getSibling("id");
          asyncName = identifier && identifier.node ? identifier.node.name : "";
          break;
        case "FunctionDeclaration":
          asyncName = (asyncPath.node.id && asyncPath.node.id.name) || "";
          break;
        case "ObjectMethod":
          asyncName = asyncPath.node.key.name || "";
          break;
      }

      let funcName =
        asyncName || (node.argument.callee && node.argument.callee.name) || "";

      // ⑧ Tạo try/catch từ template
      const temp = template(tryTemplate);
      let tempArgumentObj = {
        CatchError: types.stringLiteral(
          catchConsole(filePath, funcName, options.customLog),
        ),
      };
      let tryNode = temp(tempArgumentObj);

      // ⑨ Chuyển body gốc vào try block
      let info = asyncPath.node.body;
      tryNode.block.body.push(...info.body);

      // ⑩ Replace body
      info.body = [tryNode];
    },
  };

  return {
    name: "babel-plugin-await-add-trycatch",
    visitor,
  };
};
```

### util.js — Utilities

```javascript
const merge = require("deepmerge");

// Try/catch template
let tryTemplate = `
try {
} catch (e) {
    console.log(CatchError, e)
}`;

// Console output format
let catchConsole = (filePath, funcName, customLog) =>
  `\nfilePath: ${filePath}\nfuncName: ${funcName}\n${customLog}:`;

// Default config
const defaultOptions = {
  customLog: "Error",
  exclude: ["node_modules"],
  include: [],
};

// Check file match
function matchesFile(list, filename) {
  return list.find((name) => name && filename.includes(name));
}

// Merge options
function mergeOptions(options) {
  let { exclude, include } = options;
  if (exclude) options.exclude = toArray(exclude);
  if (include) options.include = toArray(include);
  return merge.all([defaultOptions, options]);
}

function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

module.exports = {
  tryTemplate,
  catchConsole,
  defaultOptions,
  mergeOptions,
  matchesFile,
  toArray,
};
```

### Cách sử dụng

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      require("babel-plugin-await-add-trycatch"),
      {
        exclude: ["build"], // Thư mục bỏ qua
        include: ["main.js"], // Chỉ compile file này
        customLog: "My customLog", // Custom error label
      },
    ],
  ],
};
```

```
PLUGIN OPTIONS:
═══════════════════════════════════════════════════════════════

  ┌──────────┬───────────────────┬──────────────────────────┐
  │ Option   │ Default           │ Mô tả                   │
  ├──────────┼───────────────────┼──────────────────────────┤
  │ exclude  │ ['node_modules']  │ Files/dirs bỏ qua       │
  │ include  │ []                │ Chỉ compile files này   │
  │ customLog│ 'Error'           │ Label trong console.log  │
  └──────────┴───────────────────┴──────────────────────────┘
```

---

## 5. Tóm Tắt

### Plugin Flow tổng quan

```
PLUGIN FLOW — TỔNG QUAN:
═══════════════════════════════════════════════════════════════

  Source Code → Babel Parse → AST
                               │
                      Traverse (visitor)
                               │
                     Gặp AwaitExpression?
                           │
                   ┌───────┴───────┐
                   │               │
              Đã có try?     Chưa có try
              → SKIP         → Continue
                               │
                     findParent(async)
                     → 4 loại function
                               │
                     Lấy funcName + filePath
                               │
                     babel-template tạo try/catch
                               │
                     body gốc → try.block.body
                     info.body = [tryNode]
                               │
                     Modified AST → Generate → New Code
```

### Quick Reference

```
ASYNC TRY/CATCH PLUGIN — QUICK REF:
═══════════════════════════════════════════════════════════════

  MỤC TIÊU: Tự động wrap async function body trong try/catch

  CORE APIS:
  → path.findParent(fn)    — tìm ancestor
  → path.isTryStatement()  — check đã có try
  → path.getSibling(key)   — lấy sibling
  → babel.types.stringLiteral(str) — tạo string node
  → template(str)(args)    — string → AST node

  4 LOẠI ASYNC:
  → FunctionDeclaration:   async function fn(){}
  → FunctionExpression:    const fn = async function(){}
  → ArrowFunctionExpression: const fn = async () => {}
  → ObjectMethod:          { async fn(){} }

  SKIP CONDITION:
  → findParent(isTryStatement) = true → đã có try → skip

  ERROR INFO:
  → filePath: this.filename
  → funcName: node.id.name / getSibling('id') / node.key.name
```

### Câu Hỏi Phỏng Vấn

**1. Làm sao thêm try/catch cho tất cả async functions? (Alibaba round 3)**

> Viết **Babel plugin** dùng **visitor pattern**: visit `AwaitExpression` → `findParent` tìm async function (4 loại: Declaration, Expression, Arrow, ObjectMethod) → check đã có try chưa (`isTryStatement`) → tạo try/catch node bằng `babel-template` → chuyển body gốc vào try block → replace body. Plugin hỗ trợ include/exclude files, tự động log filePath + funcName giúp debug nhanh.

**2. AST tạo ra như thế nào? 2 giai đoạn?**

> ① **Lexical Analysis** (phân tích từ vựng): code string → tokens (flat array), mỗi token có type + value + position. ② **Syntax Analysis** (phân tích cú pháp): tokens → AST tree (nested objects), mỗi node có `type` property (VariableDeclaration, FunctionDeclaration, AwaitExpression…). Tool: **astexplorer.net**.

**3. Babel plugin có cấu trúc thế nào?**

> Export 1 function nhận `babel` → return object `{ visitor: {} }`. **Visitor** dùng **visitor pattern**: khai báo node types muốn visit (key = type name, value = callback). Babel traverse AST → gặp node type match → gọi callback với `path` (NodePath — navigate + modify AST) và `state` (chứa options, filename). Dùng `babel.types` để tạo/validate AST nodes, `babel-template` để tạo nodes từ code string.

**4. Tại sao phải check 4 loại async function?**

> `async` có thể xuất hiện ở 4 nơi: **FunctionDeclaration** (`async function fn(){}`), **FunctionExpression** (`const fn = async function(){}`), **ArrowFunctionExpression** (`const fn = async () => {}`), **ObjectMethod** (`{ async fn(){} }`). Mỗi loại có cấu trúc AST khác nhau → cách lấy function name cũng khác: `node.id.name`, `getSibling('id')`, hoặc `node.key.name`. Bỏ sót loại nào → async function đó không được wrap try/catch.

**5. babel-template dùng để làm gì?**

> Cho phép viết **code dạng string** → tự động convert thành **AST nodes**. Thay vì gọi `types.tryStatement(types.blockStatement(...), types.catchClause(...))` rất dài, chỉ cần viết `template('try {} catch(e) { console.log(CatchError, e) }')`. **CatchError** là placeholder → truyền `types.stringLiteral(...)` vào → template tự replace. Elegant và maintainable hơn nhiều.

**6. Nếu async function đã có try/catch thì sao?**

> Dùng `path.findParent(p => p.isTryStatement())` — tìm ngược lên xem await node có nằm trong TryStatement không. Nếu **CÓ** → return false, SKIP. Nếu **KHÔNG** → wrap try/catch. Tránh duplicate try/catch gây code bloat.

---

## Checklist Học Tập

- [ ] AST = Code → Tokens (lexical) → Tree (syntax)
- [ ] 2 giai đoạn: Lexical Analysis + Syntax Analysis
- [ ] AwaitExpression: node type cho await
- [ ] Babel plugin: export function(babel) → { visitor: {} }
- [ ] Visitor pattern: khai báo node type → auto traverse
- [ ] path.findParent() tìm ancestor node
- [ ] path.isTryStatement() check có try chưa
- [ ] path.getSibling('id') lấy sibling node
- [ ] babel.types.stringLiteral() tạo string node
- [ ] babel-template: code string → AST nodes (elegant)
- [ ] 4 loại async: Declaration, Expression, Arrow, ObjectMethod
- [ ] Lấy funcName: node.id.name vs getSibling vs node.key.name
- [ ] Skip nếu đã có try/catch (findParent + isTryStatement)
- [ ] Plugin options: exclude, include, customLog
- [ ] Error info: filePath + funcName → quick debug

---

_Cập nhật lần cuối: Tháng 2, 2026_
