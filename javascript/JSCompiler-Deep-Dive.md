# Compiler Principles & Encoding — Deep Dive

> 📅 2026-02-13 · ⏱ 25 phút đọc
>
> Code → Executable, RegExp Internals, AST Parsing,
> Base64 Encoding, Number System Conversions trong JavaScript
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | CS Fundamentals cho Frontend Engineer

---

## Mục Lục

| #   | Phần                                               |
| --- | -------------------------------------------------- |
| 1   | Code là gì? Từ mã nguồn → chương trình thực thi    |
| 2   | RegExp Matching — Nguyên lý & Tối ưu hiệu suất     |
| 3   | AST — Parse JavaScript thành Abstract Syntax Tree  |
| 4   | Base64 — Nguyên lý mã hóa                          |
| 5   | Hệ cơ số — Chuyển đổi & Biểu diễn trong JavaScript |
| 6   | Tổng kết & Checklist phỏng vấn                     |

---

## §1. Code là gì? Từ mã nguồn → chương trình thực thi

```
CODE LÀ GÌ:
═══════════════════════════════════════════════════════════════

  Code (mã nguồn) = TẬP HỢP CÁC CHỈ THỊ viết bằng ngôn ngữ lập trình
  → Dạng TEXT mà CON NGƯỜI đọc được
  → Máy tính KHÔNG hiểu trực tiếp! (chỉ hiểu 0 và 1)
  → Cần BIÊN DỊCH (compile) hoặc THÔNG DỊCH (interpret) thành mã máy!

  2 CÁCH XỬ LÝ CODE:
  ┌────────────────────────┬────────────────────────┐
  │ COMPILED (Biên dịch)    │ INTERPRETED (Thông dịch)│
  ├────────────────────────┼────────────────────────┤
  │ C, C++, Rust, Go       │ Python, Ruby, PHP      │
  │ Source → Compiler       │ Source → Interpreter    │
  │ → Machine Code (1 lần) │ → Chạy từng dòng       │
  │ → Executable (.exe)    │ → Không tạo file riêng │
  │ Nhanh khi chạy! ⚡     │ Chậm hơn mỗi lần chạy  │
  └────────────────────────┴────────────────────────┘

  JAVASCRIPT = CẢ HAI! (JIT — Just-In-Time Compilation):
  → V8 Engine: Interpret + Compile kết hợp!
```

```
COMPILER — QUY TRÌNH BIÊN DỊCH 6 BƯỚC:
═══════════════════════════════════════════════════════════════

  Source Code (text)
       │
       ▼
  ┌─────────────────┐
  │ ① LEXICAL        │ Phân tích TỪ VỰNG (Tokenizer/Lexer)
  │    ANALYSIS       │ → Tách code thành tokens
  │                   │ → "let x = 1 + 2;"
  │                   │ → [let] [x] [=] [1] [+] [2] [;]
  └────────┬──────────┘
           ▼
  ┌─────────────────┐
  │ ② SYNTAX         │ Phân tích CÚ PHÁP (Parser)
  │    ANALYSIS       │ → Xây dựng AST (Abstract Syntax Tree)
  │                   │ → Kiểm tra cú pháp đúng/sai
  │                   │ → SyntaxError nếu sai!
  └────────┬──────────┘
           ▼
  ┌─────────────────┐
  │ ③ SEMANTIC        │ Phân tích NGỮ NGHĨA
  │    ANALYSIS       │ → Kiểm tra types, scopes, declarations
  │                   │ → ReferenceError, TypeError...
  └────────┬──────────┘
           ▼
  ┌─────────────────┐
  │ ④ INTERMEDIATE    │ Tạo mã TRUNG GIAN (IR)
  │    CODE GEN       │ → Bytecode (platform-independent)
  │                   │ → V8: Ignition → Bytecode
  └────────┬──────────┘
           ▼
  ┌─────────────────┐
  │ ⑤ OPTIMIZATION   │ Tối ưu hóa
  │                   │ → Constant folding: 1+2 → 3
  │                   │ → Dead code elimination
  │                   │ → Inline functions
  │                   │ → V8: TurboFan → Optimized Code
  └────────┬──────────┘
           ▼
  ┌─────────────────┐
  │ ⑥ CODE           │ Sinh mã MÁY
  │    GENERATION     │ → Machine code (CPU-specific)
  │                   │ → x86, ARM instructions
  └─────────────────┘
```

```
V8 ENGINE — JAVASCRIPT JIT COMPILATION:
═══════════════════════════════════════════════════════════════

  JavaScript Source
       │
       ▼
  ┌──────────┐
  │  PARSER  │ → Lexer + Parser → AST
  └────┬─────┘
       ▼
  ┌──────────────┐
  │  IGNITION    │ → AST → Bytecode (nhanh để bắt đầu!)
  │ (Interpreter)│ → Chạy bytecode NGAY
  │              │ → Thu thập profiling data ("hot functions")
  └────┬─────────┘
       │ Hot function detected! (chạy > N lần)
       ▼
  ┌──────────────┐
  │  TURBOFAN    │ → Bytecode → Optimized Machine Code ⚡
  │ (Compiler)   │ → Speculative optimization
  │              │ → Inline caching, type specialization
  └────┬─────────┘
       │ Type assumption sai? → DEOPTIMIZE!
       ▼
  Quay lại IGNITION (interpreted bytecode)

  VÍ DỤ:
  function add(a, b) { return a + b; }
  add(1, 2);    // Ignition: chạy bytecode
  add(3, 4);    // Ignition: profiling → "a, b toàn số!"
  // ... gọi 1000 lần với numbers
  add(5, 6);    // TurboFan: optimize → machine code chuyên numbers!
  add('a', 'b'); // 💀 DEOPT! Assumption sai → quay lại Ignition!
```

---

## §2. RegExp Matching — Nguyên lý & Tối ưu hiệu suất

```
REGEX ENGINE — 2 LOẠI:
═══════════════════════════════════════════════════════════════

  ① DFA (Deterministic Finite Automaton):
     → Mỗi trạng thái + input → CHÍNH XÁC 1 trạng thái tiếp
     → KHÔNG backtracking!
     → Thời gian: O(n) với n = length chuỗi input
     → Dùng bởi: awk, grep (một phần)
     → ❌ Không hỗ trợ: backreference, lookahead

  ② NFA (Nondeterministic Finite Automaton):
     → 1 trạng thái + input → NHIỀU trạng thái khả dĩ
     → CÓ backtracking!
     → Worst case: O(2^n) 💀 (catastrophic backtracking!)
     → JavaScript = NFA! (cũng như Python, Java, .NET, Perl)
     → ✅ Hỗ trợ mọi features: backreference, lookahead, lookbehind

  JAVASCRIPT RegExp Engine = NFA với BACKTRACKING!
```

```
NFA MATCHING — CÁCH HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  VÍ DỤ: /ab?c/ match "ac"

  FSM (Finite State Machine):
  ┌──┐  'a'   ┌──┐  'b'   ┌──┐  'c'   ┌═══┐
  │S0│───────→│S1│───────→│S2│───────→║S3 ║ (accept!)
  └──┘        └──┘        └──┘        └═══┘
                  │   'c'            ↗
                  └─────────────────┘
                  (skip 'b' vì ?)

  Match "ac":
  S0 → 'a' → S1 → thử 'b'? Không match 'c' → BACKTRACK!
  S1 → skip 'b' → thử 'c' → match! → S3 ✅

  BACKTRACKING = thử 1 đường → thất bại → quay lại thử đường khác!
```

```javascript
// ═══ CATASTROPHIC BACKTRACKING (ReDoS!) ═══
// Regex NGUY HIỂM: nested quantifiers!

// VÍ DỤ: /(a+)+b/ match "aaaaaaaaaaac"
// Engine thử:
// aaaaaaaaaa + c → fail
// aaaaaaaaa | a + c → fail
// aaaaaaaa | aa + c → fail
// aaaaaaaa | a | a + c → fail
// aaaaaaa | aaa + c → fail
// ... → 2^n combinations! 💀

// ĐO THỜI GIAN:
console.time("evil");
/(a+)+b/.test("a".repeat(25) + "c");
console.timeEnd("evil");
// → Có thể chạy vài GIÂY hoặc TREO! 💀

// PATTERNS NGUY HIỂM:
// /(a+)+/      → nested quantifiers
// /(a|a)+/     → alternation overlap
// /(a+)*b/     → quantifier on group with quantifier
// /([a-zA-Z]+)*/ → group với overlap

// ═══ FIX: Tránh nested quantifiers! ═══
// ❌ /(a+)+b/
// ✅ /a+b/

// ❌ /(\w+|\d+)*$/
// ✅ /[\w\d]+$/

// ═══ ATOMIC GROUPS (nếu engine hỗ trợ): ═══
// → Ngăn backtracking vào group đã match!
// → JS KHÔNG hỗ trợ trực tiếp (dùng lookahead trick):
// /(?>a+)b/  → KHÔNG hỗ trợ trong JS!
// /(?=(a+))\1b/ → Workaround qua lookahead backreference
```

```javascript
// ═══ REGEX PERFORMANCE OPTIMIZATION ═══

// ① Anchor! Dùng ^ và $ khi có thể:
// ❌ /pattern/  → scan toàn bộ string
// ✅ /^pattern/ → chỉ check đầu string

// ② Specific > General:
// ❌ /.*\d+/   → .* match tất cả → backtrack nhiều!
// ✅ /\D*\d+/  → \D* chỉ match non-digit → ít backtrack!

// ③ Tránh nested quantifiers:
// ❌ /(a+)+/
// ✅ /a+/

// ④ Lazy khi cần:
// ❌ /<div>.*<\/div>/    → greedy → match quá nhiều!
// ✅ /<div>.*?<\/div>/   → lazy → match vừa đủ!
// ✅✅ /<div>[^<]*<\/div>/ → negated class → NHANH NHẤT!

// ⑤ Cache regex object:
// ❌ Tạo mới mỗi lần:
// function validate(str) { return /pattern/.test(str); }
// ✅ Tạo 1 lần:
const PATTERN = /pattern/;
function validate(str) {
  return PATTERN.test(str);
}

// ⑥ Avoid capturing groups khi không cần:
// ❌ /(foo|bar)/  → capturing (tốn memory lưu group!)
// ✅ /(?:foo|bar)/ → non-capturing (?:...) → NHANH hơn!

// ⑦ Put common alternatives first:
// ❌ /rare|uncommon|common/
// ✅ /common|uncommon|rare/ → match sớm hơn!

// ⑧ Benchmark:
function benchRegex(regex, input, iterations = 100000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) regex.test(input);
  return performance.now() - start;
}
```

---

## §3. AST — Parse JavaScript thành Abstract Syntax Tree

```
AST LÀ GÌ:
═══════════════════════════════════════════════════════════════

  AST (Abstract Syntax Tree) = CÂY CÚ PHÁP TRỪU TƯỢNG

  → Biểu diễn cấu trúc code dưới dạng CÂY
  → "Abstract": bỏ qua chi tiết (dấu ;, \n, whitespace)
  → Chỉ giữ NGHĨA LOGIC của code

  VÍ DỤ: let x = 1 + 2;

           VariableDeclaration
           ├── kind: "let"
           └── declarations:
               └── VariableDeclarator
                   ├── id: Identifier (name: "x")
                   └── init: BinaryExpression
                       ├── operator: "+"
                       ├── left: NumericLiteral (value: 1)
                       └── right: NumericLiteral (value: 2)

  ỨNG DỤNG:
  → Babel: ES6+ → ES5 (transpile)
  → ESLint: kiểm tra style + bugs
  → Prettier: format code
  → Webpack/Rollup: tree-shaking, bundling
  → TypeScript: type checking
  → Code minifier: UglifyJS, Terser
```

```
PARSE CODE → AST = 2 BƯỚC:
═══════════════════════════════════════════════════════════════

  Source Code: "let x = 1 + 2;"
       │
       ▼
  ┌───────────────────────────┐
  │ ① LEXICAL ANALYSIS       │
  │    (Tokenization)         │
  │                           │
  │  Input: "let x = 1 + 2;" │
  │  Output: TOKENS:          │
  │  "let"  → Keyword         │
  │  "x"    → Identifier      │
  │  "="    → Punctuator      │
  │  "1"    → NumericLiteral  │
  │  "+"    → Punctuator      │
  │  "2"    → NumericLiteral  │
  │  ";"    → Punctuator      │
  └────────────┬──────────────┘
               ▼
  ┌───────────────────────────┐
  │ ② SYNTAX ANALYSIS        │
  │    (Parsing)              │
  │                           │
  │  Input: Tokens            │
  │  Output: AST (Tree)       │
  │                           │
  │  Thuật toán:              │
  │  → Recursive Descent      │
  │  → Pratt Parser          │
  │  → LR Parser             │
  └───────────────────────────┘
```

```javascript
// ═══ TỰ TRIỂN KHAI TOKENIZER (simplified) ═══

function tokenize(code) {
  const tokens = [];
  let current = 0;

  while (current < code.length) {
    let char = code[current];

    // Bỏ qua whitespace:
    if (/\s/.test(char)) {
      current++;
      continue;
    }

    // Numbers: 0-9
    if (/\d/.test(char)) {
      let value = "";
      while (/[\d.]/.test(code[current])) {
        value += code[current++];
      }
      tokens.push({ type: "Number", value });
      continue;
    }

    // Strings: "..." hoặc '...'
    if (char === '"' || char === "'") {
      const quote = char;
      let value = "";
      current++; // skip opening quote
      while (code[current] !== quote) {
        if (code[current] === "\\") {
          current++; // escape character
        }
        value += code[current++];
      }
      current++; // skip closing quote
      tokens.push({ type: "String", value });
      continue;
    }

    // Operators + Punctuators:
    if ("+-*/=;(){},".includes(char)) {
      // Xử lý multi-char operators: ==, ===, !=, >=...
      let op = char;
      if ("=!<>".includes(char) && code[current + 1] === "=") {
        op += code[++current];
        if (code[current + 1] === "=") op += code[++current]; // ===
      }
      tokens.push({ type: "Punctuator", value: op });
      current++;
      continue;
    }

    // Identifiers + Keywords:
    if (/[a-zA-Z_$]/.test(char)) {
      let value = "";
      while (/[a-zA-Z0-9_$]/.test(code[current])) {
        value += code[current++];
      }
      const keywords = [
        "let",
        "const",
        "var",
        "function",
        "return",
        "if",
        "else",
        "for",
        "while",
        "class",
      ];
      const type = keywords.includes(value) ? "Keyword" : "Identifier";
      tokens.push({ type, value });
      continue;
    }

    throw new SyntaxError(`Unexpected character: ${char}`);
  }

  return tokens;
}

// Test:
console.log(tokenize("let x = 1 + 2;"));
// [
//   { type: 'Keyword', value: 'let' },
//   { type: 'Identifier', value: 'x' },
//   { type: 'Punctuator', value: '=' },
//   { type: 'Number', value: '1' },
//   { type: 'Punctuator', value: '+' },
//   { type: 'Number', value: '2' },
//   { type: 'Punctuator', value: ';' }
// ]
```

```javascript
// ═══ TỰ TRIỂN KHAI PARSER — AST Builder (simplified) ═══

function parse(tokens) {
  let current = 0;

  function peek() {
    return tokens[current];
  }
  function consume(type, value) {
    const token = tokens[current];
    if (type && token.type !== type) throw new SyntaxError(`Expected ${type}`);
    if (value && token.value !== value)
      throw new SyntaxError(`Expected ${value}`);
    current++;
    return token;
  }

  // ① Parse Expression (xử lý + - * /):
  function parseExpression() {
    let left = parsePrimary();

    while (peek() && "+-*/".includes(peek().value)) {
      const operator = consume("Punctuator").value;
      const right = parsePrimary();
      left = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      };
    }
    return left;
  }

  // ② Parse Primary (number, string, identifier):
  function parsePrimary() {
    const token = peek();
    if (token.type === "Number") {
      consume("Number");
      return { type: "NumericLiteral", value: Number(token.value) };
    }
    if (token.type === "String") {
      consume("String");
      return { type: "StringLiteral", value: token.value };
    }
    if (token.type === "Identifier") {
      consume("Identifier");
      return { type: "Identifier", name: token.value };
    }
    throw new SyntaxError(`Unexpected token: ${token.value}`);
  }

  // ③ Parse Statement:
  function parseStatement() {
    const token = peek();
    if (
      token.type === "Keyword" &&
      ["let", "const", "var"].includes(token.value)
    ) {
      return parseVariableDeclaration();
    }
    return { type: "ExpressionStatement", expression: parseExpression() };
  }

  // ④ Parse Variable Declaration:
  function parseVariableDeclaration() {
    const kind = consume("Keyword").value; // let, const, var
    const name = consume("Identifier").value;
    consume("Punctuator", "=");
    const init = parseExpression();
    if (peek() && peek().value === ";") consume("Punctuator", ";");

    return {
      type: "VariableDeclaration",
      kind,
      declarations: [
        {
          type: "VariableDeclarator",
          id: { type: "Identifier", name },
          init,
        },
      ],
    };
  }

  // ⑤ Parse Program:
  const body = [];
  while (current < tokens.length) {
    body.push(parseStatement());
  }

  return { type: "Program", body };
}

// Test:
const code = "let x = 1 + 2;";
const tokens = tokenize(code);
const ast = parse(tokens);
console.log(JSON.stringify(ast, null, 2));
// {
//   "type": "Program",
//   "body": [{
//     "type": "VariableDeclaration",
//     "kind": "let",
//     "declarations": [{
//       "type": "VariableDeclarator",
//       "id": { "type": "Identifier", "name": "x" },
//       "init": {
//         "type": "BinaryExpression",
//         "operator": "+",
//         "left": { "type": "NumericLiteral", "value": 1 },
//         "right": { "type": "NumericLiteral", "value": 2 }
//       }
//     }]
//   }]
// }
```

```javascript
// ═══ THỰC TẾ: Dùng thư viện AST ═══

// ① Acorn (lightweight, fast):
import * as acorn from "acorn";
const ast = acorn.parse("let x = 1 + 2;", { ecmaVersion: 2022 });

// ② @babel/parser (feature-rich):
import { parse } from "@babel/parser";
const ast = parse("let x = 1 + 2;", {
  sourceType: "module",
  plugins: ["jsx", "typescript"],
});

// ③ AST TRAVERSAL — Visitor Pattern:
import traverse from "@babel/traverse";

traverse(ast, {
  // Mỗi node type = 1 visitor method:
  Identifier(path) {
    // path.node = AST node
    // path.parent = parent node
    // path.scope = scope info
    console.log("Found identifier:", path.node.name);
  },
  BinaryExpression(path) {
    // Constant folding: 1 + 2 → 3
    if (
      path.node.left.type === "NumericLiteral" &&
      path.node.right.type === "NumericLiteral"
    ) {
      const result = eval(
        `${path.node.left.value} ${path.node.operator} ${path.node.right.value}`,
      );
      path.replaceWith({ type: "NumericLiteral", value: result });
    }
  },
});

// ④ CODE GENERATION — AST → Code:
import generate from "@babel/generator";
const { code } = generate(ast);
console.log(code); // "let x = 3;" (sau constant folding!)

// PIPELINE ĐẦY ĐỦ:
// Source → Parse → AST → Transform (visitors) → AST' → Generate → Code'
```

---

## §4. Base64 — Nguyên lý mã hóa

```
BASE64 LÀ GÌ:
═══════════════════════════════════════════════════════════════

  → Mã hóa BINARY DATA thành TEXT (ASCII-safe characters)
  → KHÔNG phải mã hóa bảo mật! (ai cũng decode được!)
  → Mục đích: truyền binary qua các kênh chỉ hỗ trợ text
     → Email (MIME), URL params, JSON, HTML data URI, cookies

  BẢNG KÝ TỰ BASE64 (64 ký tự = 6 bits):
  0-25:  A-Z  (26)
  26-51: a-z  (26)
  52-61: 0-9  (10)
  62:    +     (1)
  63:    /     (1)
  Padding: =   (khi data không chia hết cho 3 bytes)

  URL-SAFE variant: + → -, / → _  (tránh conflict với URL encoding)
```

```
NGUYÊN LÝ HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  ① Lấy binary data (mỗi byte = 8 bits)
  ② Chia thành nhóm 6 bits (vì 2^6 = 64 ký tự)
  ③ Mỗi nhóm 6 bits → 1 ký tự Base64
  ④ Nếu bits cuối không đủ 6 → pad bằng 0, thêm "="

  VÍ DỤ: "Hi" → Base64

  "H"        "i"
  01001000   01101001     (2 bytes = 16 bits)

  Chia thành nhóm 6 bits:
  010010 | 000110 | 1001xx    (x = padding 0)
  010010 | 000110 | 100100    (thêm 00 cho đủ 6 bits)

  Tra bảng:
  010010 = 18 → 'S'
  000110 = 6  → 'G'
  100100 = 36 → 'k'
  (thiếu 1 nhóm → thêm '=')

  KẾT QUẢ: "Hi" → "SGk="

  3 bytes input → 24 bits → 4 nhóm 6-bit → 4 ký tự output
  → Base64 output LUÔN dài hơn input ~33%! (4/3 ratio)
```

```
TẠI SAO 3 BYTES → 4 KÝ TỰ:
═══════════════════════════════════════════════════════════════

  3 bytes = 24 bits
  24 bits ÷ 6 bits/group = 4 groups → 4 Base64 characters

  ┌─ Byte 1 ─┐ ┌─ Byte 2 ─┐ ┌─ Byte 3 ─┐
  │ 8 bits   │ │ 8 bits   │ │ 8 bits   │ = 24 bits
  └──────────┘ └──────────┘ └──────────┘

  ┌─ B64 1 ─┐ ┌─ B64 2 ─┐ ┌─ B64 3 ─┐ ┌─ B64 4 ─┐
  │ 6 bits  │ │ 6 bits  │ │ 6 bits  │ │ 6 bits  │ = 24 bits
  └─────────┘ └─────────┘ └─────────┘ └─────────┘

  PADDING RULES:
  Input mod 3 = 0 → Không padding
  Input mod 3 = 1 → THÊM 2 "==" (pad 16 bits → 2 nhóm 6-bit dư)
  Input mod 3 = 2 → THÊM 1 "="  (pad 8 bits → 1 nhóm 6-bit dư)

  VÍ DỤ:
  "Man"  (3 bytes) → "TWFu"      (no padding)
  "Ma"   (2 bytes) → "TWE="      (1 padding)
  "M"    (1 byte)  → "TQ=="      (2 padding)
```

```javascript
// ═══ TỰ TRIỂN KHAI BASE64 ENCODE/DECODE ═══

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64Encode(input) {
  let result = "";
  const bytes = new TextEncoder().encode(input); // String → UTF-8 bytes

  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    // 3 bytes → 4 groups of 6 bits:
    const g1 = b1 >> 2; // Top 6 bits of byte 1
    const g2 = ((b1 & 0x03) << 4) | (b2 >> 4); // Bottom 2 of b1 + Top 4 of b2
    const g3 = ((b2 & 0x0f) << 2) | (b3 >> 6); // Bottom 4 of b2 + Top 2 of b3
    const g4 = b3 & 0x3f; // Bottom 6 bits of byte 3

    result += BASE64_CHARS[g1] + BASE64_CHARS[g2];
    result += i + 1 < bytes.length ? BASE64_CHARS[g3] : "=";
    result += i + 2 < bytes.length ? BASE64_CHARS[g4] : "=";
  }

  return result;
}

function base64Decode(encoded) {
  const bytes = [];
  const cleanInput = encoded.replace(/=/g, "");

  for (let i = 0; i < cleanInput.length; i += 4) {
    const g1 = BASE64_CHARS.indexOf(cleanInput[i]);
    const g2 = BASE64_CHARS.indexOf(cleanInput[i + 1]);
    const g3 =
      i + 2 < cleanInput.length ? BASE64_CHARS.indexOf(cleanInput[i + 2]) : 0;
    const g4 =
      i + 3 < cleanInput.length ? BASE64_CHARS.indexOf(cleanInput[i + 3]) : 0;

    bytes.push((g1 << 2) | (g2 >> 4));
    if (i + 2 < cleanInput.length) bytes.push(((g2 & 0x0f) << 4) | (g3 >> 2));
    if (i + 3 < cleanInput.length) bytes.push(((g3 & 0x03) << 6) | g4);
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Test:
console.log(base64Encode("Hello World")); // "SGVsbG8gV29ybGQ="
console.log(base64Decode("SGVsbG8gV29ybGQ=")); // "Hello World"

// ═══ JavaScript Built-in API ═══
btoa("Hello"); // Browser: "SGVsbG8=" (Binary to ASCII)
atob("SGVsbG8="); // Browser: "Hello"    (ASCII to Binary)

// ⚠️ btoa/atob CHỈ hỗ trợ Latin1 (1 byte/char)!
// btoa('Xin chào 🌍');  // ❌ Error! (Unicode > 1 byte!)

// FIX cho Unicode:
function utoa(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  );
}
function atou(b64) {
  return decodeURIComponent(
    atob(b64)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(""),
  );
}

// ═══ ỨNG DỤNG THỰC TẾ ═══

// ① Data URI (nhúng ảnh trực tiếp trong HTML/CSS):
// <img src="data:image/png;base64,iVBORw0KGgo..." />
// → Giảm HTTP requests! Nhưng tăng HTML size 33%!

// ② JWT (JSON Web Token):
// header.payload.signature
// header = Base64URL({"alg":"HS256","typ":"JWT"})
// payload = Base64URL({"sub":"1234567890","name":"Alice"})

// ③ Upload preview (FileReader):
const reader = new FileReader();
reader.readAsDataURL(file); // → "data:image/png;base64,..."
reader.onload = () => {
  img.src = reader.result; // Preview ngay trên browser!
};
```

---

## §5. Hệ cơ số — Chuyển đổi & Biểu diễn trong JavaScript

```
CÁC HỆ CƠ SỐ:
═══════════════════════════════════════════════════════════════

  ┌──────┬──────────┬──────────┬────────────────────────────┐
  │ Hệ   │ Base     │ JS prefix│ Ký tự                      │
  ├──────┼──────────┼──────────┼────────────────────────────┤
  │ Binary│ 2       │ 0b       │ 0, 1                       │
  │ Octal │ 8       │ 0o       │ 0-7                        │
  │ Decimal│ 10     │ (none)   │ 0-9                        │
  │ Hex   │ 16      │ 0x       │ 0-9, A-F                   │
  └──────┴──────────┴──────────┴────────────────────────────┘

  VÍ DỤ: Số 255 trong các hệ:
  Binary:  0b11111111
  Octal:   0o377
  Decimal: 255
  Hex:     0xFF
```

```javascript
// ═══ JAVASCRIPT SỐ HỌC — NUMBER REPRESENTATION ═══

// Literal:
const bin = 0b1010; // 10 (binary)
const oct = 0o12; // 10 (octal)
const dec = 10; // 10 (decimal)
const hex = 0xa; // 10 (hex)

// typeof → tất cả đều là "number"!
// JS lưu trữ NỘI BỘ = IEEE 754 double (64-bit floating point)

// ═══ DECIMAL → CÁC HỆ KHÁC ═══
const num = 255;
num.toString(2); // "11111111" (binary)
num.toString(8); // "377"      (octal)
num.toString(10); // "255"      (decimal)
num.toString(16); // "ff"       (hex)
num.toString(36); // "73"       (base-36: 0-9 + a-z)

// padding:
num.toString(2).padStart(8, "0"); // "11111111" (8 bits)
num.toString(16).padStart(2, "0"); // "ff"       (2 hex digits)

// ═══ CÁC HỆ → DECIMAL ═══
parseInt("11111111", 2); // 255 (binary → decimal)
parseInt("377", 8); // 255 (octal → decimal)
parseInt("ff", 16); // 255 (hex → decimal)
parseInt("73", 36); // 255 (base-36 → decimal)

// Number() cũng hiểu prefix:
Number("0b11111111"); // 255
Number("0o377"); // 255
Number("0xff"); // 255
```

```javascript
// ═══ CHUYỂN ĐỔI GIỮA CÁC HỆ (universal function) ═══

function convertBase(value, fromBase, toBase) {
  // Bước 1: Chuyển sang decimal (số nguyên):
  const decimal = parseInt(value, fromBase);
  if (isNaN(decimal))
    throw new Error(`Invalid number: ${value} in base ${fromBase}`);

  // Bước 2: Chuyển từ decimal sang target base:
  return decimal.toString(toBase);
}

// Ví dụ:
convertBase("ff", 16, 2); // "11111111" (hex → binary)
convertBase("1010", 2, 16); // "a"        (binary → hex)
convertBase("377", 8, 16); // "ff"       (octal → hex)
convertBase("255", 10, 36); // "73"       (decimal → base-36)
```

```javascript
// ═══ THAO TÁC BIT (BITWISE) TRONG JAVASCRIPT ═══

// Bitwise operators (chuyển số về 32-bit integer!):
const a = 5; // 0101
const b = 3; // 0011

a & b; // 1  (AND:  0101 & 0011 = 0001)
a | b; // 7  (OR:   0101 | 0011 = 0111)
a ^ b; // 6  (XOR:  0101 ^ 0011 = 0110)
~a; // -6 (NOT:  ~0101 = ...11111010 = -6 two's complement)
a << 1; // 10 (Left shift:  0101 → 1010)
a >> 1; // 2  (Right shift: 0101 → 0010)
a >>> 1; // 2  (Unsigned right shift: no sign bit!)

// ═══ BITWISE TRICKS (phỏng vấn!) ═══

// ① Kiểm tra chẵn/lẻ:
function isOdd(n) {
  return (n & 1) === 1;
}
// n & 1: chỉ check bit cuối (1=lẻ, 0=chẵn)

// ② Nhân/Chia cho 2^n (nhanh hơn * /):
5 << 1; // 10 (5 * 2)
5 << 3; // 40 (5 * 8)
20 >> 2; // 5  (20 / 4)

// ③ Swap 2 số KHÔNG dùng biến tạm:
let x = 5,
  y = 3;
x ^= y;
y ^= x;
x ^= y;
// x=3, y=5 (XOR swap!)

// ④ Tìm số duy nhất (mọi số khác xuất hiện 2 lần):
function findUnique(arr) {
  return arr.reduce((acc, n) => acc ^ n, 0);
  // XOR: a^a=0, a^0=a → tất cả cặp triệt tiêu → còn lại unique!
}
findUnique([1, 2, 3, 2, 1]); // 3

// ⑤ Bit thấp nhất (rightmost set bit):
function lowestBit(n) {
  return n & -n;
}
// React Lanes: getHighestPriorityLane = lanes & -lanes!

// ⑥ Đếm số bit 1:
function countBits(n) {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>>= 1;
  }
  return count;
}
countBits(0b1011); // 3

// ⑦ Kiểm tra power of 2:
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}
// Power of 2 chỉ có 1 bit 1: 1000 & 0111 = 0000!

// ═══ IEEE 754 — SỐ THỰC FLOATING POINT ═══
// JavaScript Number = 64-bit double precision:
// ┌──┬────────────┬──────────────────────────────────────────────┐
// │S │ Exponent   │ Mantissa (Fraction)                          │
// │1 │ 11 bits    │ 52 bits                                      │
// └──┴────────────┴──────────────────────────────────────────────┘
// Value = (-1)^S × 2^(E-1023) × (1 + M)

// ⚠️ Floating point precision:
0.1 + 0.2; // 0.30000000000000004 (KHÔNG = 0.3!)
0.1 + 0.2 === 0.3; // false! 💀

// FIX:
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON; // true ✅
parseFloat((0.1 + 0.2).toFixed(10)); // 0.3 ✅

// Giới hạn:
Number.MAX_SAFE_INTEGER; // 2^53 - 1 = 9007199254740991
Number.MIN_SAFE_INTEGER; // -(2^53 - 1)
Number.isSafeInteger(9007199254740992); // false!
// → Dùng BigInt cho số lớn hơn!
```

---

## §6. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  Compiler Principles & Encoding
  ├── Compilation: Source → Tokens → AST → IR → Optimize → Machine Code
  │   ├── Compiled (C) vs Interpreted (Python) vs JIT (JavaScript)
  │   └── V8: Parser → Ignition (bytecode) → TurboFan (optimized) → Deopt
  ├── RegExp: NFA + Backtracking → O(2^n) worst case (ReDoS!)
  │   └── Optimize: anchor, specific classes, no nesting, non-capturing
  ├── AST: Tokenizer (lexical) → Parser (syntax) → AST tree
  │   ├── Babel: parse → traverse (visitors) → generate
  │   └── Used by: ESLint, Prettier, Webpack, TypeScript, Terser
  ├── Base64: 3 bytes → 4 chars (6-bit groups), +33% size
  │   ├── btoa/atob (Latin1 only!), Unicode = encodeURIComponent trick
  │   └── Data URI, JWT, file upload preview
  └── Number Systems: binary(0b), octal(0o), hex(0x), base-36
      ├── toString(radix)/parseInt(str, radix)
      ├── Bitwise: &, |, ^, ~, <<, >>, >>> (32-bit operations!)
      └── IEEE 754: 64-bit double, 0.1+0.2≠0.3, MAX_SAFE_INTEGER
```

### Checklist

- [ ] **Compilation 6 bước**: Lexical → Syntax → Semantic → IR → Optimize → Code Gen
- [ ] **Compiled vs Interpreted vs JIT**: C=compile 1 lần, Python=interpret từng dòng, JS=JIT (cả hai!)
- [ ] **V8 Pipeline**: Parser → Ignition (bytecode, nhanh start) → TurboFan (optimize hot functions) → Deopt khi type sai!
- [ ] **RegExp = NFA**: backtracking engine, worst case O(2^n), hỗ trợ backreference/lookahead
- [ ] **Catastrophic Backtracking (ReDoS)**: /(a+)+/ nested quantifiers → exponential → tránh!
- [ ] **RegExp optimize**: anchor ^$, negated class `[^<]`, non-capturing (?:), cache regex, common alternatives first
- [ ] **AST 2 bước**: Tokenization (code→tokens) + Parsing (tokens→AST tree)
- [ ] **Tokenizer**: scan từ trái, regex/switch phân loại: Keyword, Identifier, Number, String, Punctuator
- [ ] **Parser**: Recursive Descent, consume tokens, build tree nodes (Program→Statement→Expression)
- [ ] **Babel pipeline**: parse → traverse (visitor pattern) → generate; dùng @babel/parser, @babel/traverse, @babel/generator
- [ ] **AST ứng dụng**: Babel transpile, ESLint lint, Prettier format, Webpack tree-shake, TypeScript type-check, Terser minify
- [ ] **Base64**: 3 bytes (24 bits) → 4 chars (6 bits each), bảng 64 ký tự A-Za-z0-9+/, padding "="
- [ ] **Base64 size**: output dài hơn ~33% (4/3 ratio), padding mod 3: 0→0, 1→"==", 2→"="
- [ ] **btoa/atob**: chỉ Latin1! Unicode cần encodeURIComponent trick hoặc TextEncoder
- [ ] **Base64 ứng dụng**: Data URI (nhúng ảnh), JWT (header.payload), FileReader preview
- [ ] **Number systems**: binary 0b, octal 0o, hex 0x; toString(radix) encode, parseInt(str, radix) decode
- [ ] **Bitwise operators**: & AND, | OR, ^ XOR, ~ NOT, << left shift, >> right shift, >>> unsigned right
- [ ] **Bitwise tricks**: isOdd = n&1, swap = XOR, findUnique = reduce XOR, isPowerOfTwo = n&(n-1)===0
- [ ] **IEEE 754**: 64-bit double (1 sign + 11 exponent + 52 mantissa), 0.1+0.2≠0.3, MAX_SAFE_INTEGER=2^53-1

---

_Nguồn: ConardLi — "Compiler Principles" · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
