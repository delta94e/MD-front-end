# Tree Shaking — Performance Pattern Deep Dive

> 📅 2026-02-15 · ⏱ 30 phút đọc
>
> Tree Shaking, Dead Code Elimination, ES Modules,
> sideEffects flag, usedExports, Terser, /\*#\_\_PURE\_\_\*/,
> Tự viết Mini Tree Shaker từ đầu, AST Graph Traversal,
> Module Concatenation, CSS Side Effects Pitfall
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Performance / Bundler Internals
>
> _Dựa trên Webpack docs, patterns.dev — Addy Osmani_

---

## Mục Lục

| #   | Phần                                            |
| --- | ----------------------------------------------- |
| 1   | Tree Shaking là gì?                             |
| 2   | Tại sao CẦN ES Modules?                         |
| 3   | Graph Traversal — Cách bundler loại code        |
| 4   | Side Effects — Khái niệm then chốt              |
| 5   | sideEffects vs usedExports — 2 cơ chế khác nhau |
| 6   | /\*#\_\_PURE\_\_\*/ annotation                  |
| 7   | CSS Side Effects — Bẫy phổ biến nhất            |
| 8   | Tự viết Mini Tree Shaker                        |
| 9   | Tự viết Side Effects Analyzer                   |
| 10  | Webpack cấu hình thực tế                        |
| 11  | Sai lầm thường gặp & Cách khắc phục             |
| 12  | Tóm tắt phỏng vấn                               |

---

## §1. Tree Shaking là gì?

```
TREE SHAKING — LOẠI BỎ CODE CHẾT:
═══════════════════════════════════════════════════════════════

  Tưởng tượng ứng dụng = 1 CÂY:
  → Lá XANH = code ĐANG DÙNG!
  → Lá NÂU = code KHÔNG DÙNG (dead code!)
  → "Rung cây" → lá nâu RỤNG → chỉ còn lá xanh!

  VÍ DỤ:
  ┌──────────────── utilities.js ─────────────────┐
  │ export function read(props) {                  │
  │   return props.book;        ← ĐANG DÙNG! 🟢  │
  │ }                                              │
  │                                                │
  │ export function nap(props) {                   │
  │   return props.winks;       ← KHÔNG DÙNG! 🔴  │
  │ }                                              │
  └────────────────────────────────────────────────┘

  ┌──────────────── index.js ─────────────────────┐
  │ import { read } from 'utilities';              │
  │                                                │
  │ eventHandler = (e) => {                        │
  │   read({ book: e.target.value });              │
  │ }                                              │
  │ // nap() KHÔNG import → KHÔNG dùng!            │
  └────────────────────────────────────────────────┘

  KẾT QUẢ SAU TREE SHAKING:
  ┌──────────────── bundle.js ────────────────────┐
  │ function read(props) { return props.book; }    │
  │ // nap() ĐÃ BỊ LOẠI BỎ! ✅                    │
  └────────────────────────────────────────────────┘

  TÁC ĐỘNG:
  ┌────────────────────────────────────────────────┐
  │ → Bundle NHỎ hơn → tải NHANH hơn!             │
  │ → Parse/compile ÍT code hơn!                   │
  │ → Execute ÍT code hơn!                         │
  │ → FCP/LCP/TTI cải thiện!                       │
  │                                                │
  │ THỰC TẾ:                                       │
  │ → import { debounce } from 'lodash'           │
  │ → Không tree shake: TOÀN BỘ lodash 70KB!      │
  │ → Có tree shake: chỉ debounce ~1KB!            │
  │ → TIẾT KIỆM 69KB! (~99%!)                     │
  └────────────────────────────────────────────────┘
```

---

## §2. Tại sao CẦN ES Modules?

```
ES MODULES vs COMMONJS — ĐIỀU KIỆN TIÊN QUYẾT:
═══════════════════════════════════════════════════════════════

  ✅ ES MODULES (import/export) — TREE SHAKE ĐƯỢC!
  ┌────────────────────────────────────────────────┐
  │ → STATIC analysis!                             │
  │ → Bundler biết CHÍNH XÁC cái gì được import!  │
  │ → Biết TẠI THỜI ĐIỂM BUILD (không cần chạy!)  │
  │                                                │
  │ import { read } from './utils';                │
  │ // Bundler biết: chỉ cần "read"!              │
  │ // → "nap" có thể LOẠI BỎ!                    │
  └────────────────────────────────────────────────┘

  ❌ COMMONJS (require/module.exports) — KHÔNG ĐƯỢC!
  ┌────────────────────────────────────────────────┐
  │ → DYNAMIC analysis!                            │
  │ → require() có thể gọi TRONG if/else!         │
  │ → Bundler KHÔNG BIẾT cái gì dùng cho đến khi  │
  │   CHẠY code!                                   │
  │                                                │
  │ const utils = require('./utils');               │
  │ // Bundler không biết: dùng utils.read hay     │
  │ // utils.nap? → PHẢI GIỮ TẤT CẢ!             │
  │                                                │
  │ // TỆ HƠN:                                    │
  │ const name = condition ? './a' : './b';        │
  │ const mod = require(name);                     │
  │ // → DYNAMIC! Bundler KHÔNG THỂ phân tích!    │
  └────────────────────────────────────────────────┘

  ⚠️ BẪY BABEL:
  ┌────────────────────────────────────────────────┐
  │ @babel/preset-env MẶC ĐỊNH chuyển ESM → CJS!  │
  │ → Tree shaking BỊ PHÁ VỠ!                     │
  │                                                │
  │ FIX: { "modules": false }                      │
  │ → Giữ nguyên import/export cho bundler!        │
  │ → Bundler tự xử lý modules!                    │
  │                                                │
  │ // babel.config.js                             │
  │ presets: [                                     │
  │   ["@babel/preset-env", { modules: false }]    │
  │ ]                                              │
  └────────────────────────────────────────────────┘
```

---

## §3. Graph Traversal — Cách bundler loại code

```
GRAPH TRAVERSAL — BUNDLER HOẠT ĐỘNG NHƯ THẾ NÀO:
═══════════════════════════════════════════════════════════════

  ① Mỗi file = 1 NODE trong graph!
  ② Mỗi node có nhiều "PARTS" (top-level statements)!
  ③ Mỗi part: DECLARES symbols, REFERENCES symbols!
  ④ Traversal bắt đầu từ ENTRY POINT!
  ⑤ Đánh dấu parts ĐÃ DUYỆT → GIỮA!
  ⑥ Parts KHÔNG duyệt → LOẠI BỎ!

  VÍ DỤ:
  ┌────────── math.js ──────────┐
  │ Part 1: export function     │
  │         add(a,b) {          │
  │           return a + b;     │
  │         }                   │
  │                             │
  │ Part 2: export function     │
  │         multiply(a,b) {     │
  │           return a * b;     │
  │         }                   │
  │                             │
  │ Part 3: export function     │
  │         subtract(a,b) {     │
  │           return a - b;     │
  │         }                   │
  └─────────────────────────────┘

  ┌────────── index.js ─────────┐
  │ Part 1: import { add }      │
  │         from './math';      │
  │                             │
  │ Part 2: console.log(        │
  │           add(1, 2));       │
  └─────────────────────────────┘

  TRAVERSAL:
  ┌────────────────────────────────────────────────┐
  │ ① Bắt đầu: index.js                           │
  │ ② Part 1: import { add } → reference "add"!  │
  │ ③ Theo edge → math.js                         │
  │ ④ Part 1 (add): DECLARES "add" → ĐÁNH DẤU! ✅│
  │ ⑤ Part 2 (multiply): KHÔNG ai reference → ❌  │
  │ ⑥ Part 3 (subtract): KHÔNG ai reference → ❌  │
  │                                                │
  │ KẾT QUẢ: Chỉ giữ add()!                       │
  │ multiply() và subtract() bị LOẠI BỎ!           │
  └────────────────────────────────────────────────┘

  SƠ ĐỒ GRAPH:
  ┌──────────┐     reference "add"     ┌──────────┐
  │ index.js │ ──────────────────────→ │ math.js  │
  │          │                         │          │
  │ Part 1 ✅│                         │ Part 1 ✅│ add
  │ Part 2 ✅│                         │ Part 2 ❌│ multiply
  │          │                         │ Part 3 ❌│ subtract
  └──────────┘                         └──────────┘
```

---

## §4. Side Effects — Khái niệm then chốt

```
SIDE EFFECTS — KHI NÀO CODE KHÔNG THỂ LOẠI BỎ?
═══════════════════════════════════════════════════════════════

  ① KHÔNG CÓ SIDE EFFECTS (an toàn LOẠI BỎ!):
  ┌────────────────────────────────────────────────┐
  │ let firstName = 'Jane';                        │
  │ → Chỉ KHAI BÁO biến!                          │
  │ → Không ảnh hưởng GÌ nếu loại bỏ!             │
  │ → ✅ AN TOÀN!                                   │
  └────────────────────────────────────────────────┘

  ② CÓ SIDE EFFECTS (KHÔNG THỂ loại bỏ!):
  ┌────────────────────────────────────────────────┐
  │ let firstName = getName();                     │
  │ → GỌI function getName()!                     │
  │ → getName() có thể:                            │
  │   → Ghi log ra console!                        │
  │   → Thay đổi biến toàn cục!                    │
  │   → Gửi HTTP request!                          │
  │   → Đọc/ghi DOM!                               │
  │ → KHÔNG BIẾT có side effect không!             │
  │ → ❌ PHẢI GIỮ LẠI (an toàn!)                   │
  └────────────────────────────────────────────────┘

  CÁC LOẠI SIDE EFFECTS PHỔ BIẾN:
  ┌────────────────────────────────────────────────┐
  │ → import './polyfill';                         │
  │   → Thay đổi GLOBAL objects!                   │
  │                                                │
  │ → import './styles.css';                       │
  │   → Thêm styles vào DOM!                       │
  │                                                │
  │ → window.addEventListener('resize', fn);       │
  │   → Đăng ký global listener!                   │
  │                                                │
  │ → Array.prototype.myMethod = ...;              │
  │   → Modify prototype chain!                    │
  │                                                │
  │ → Polyfills (Promise, fetch, etc.)             │
  │   → Thêm API vào global scope!                 │
  └────────────────────────────────────────────────┘
```

---

## §5. sideEffects vs usedExports — 2 cơ chế khác nhau

```
2 CƠ CHẾ TỐI ƯU KHÁC NHAU:
═══════════════════════════════════════════════════════════════

  ① sideEffects (package.json):
  ┌────────────────────────────────────────────────┐
  │ LEVEL: MODULE (toàn bộ file!)                  │
  │ → Báo bundler: "File này KHÔNG có side effects"│
  │ → Bundler có thể BỎ QUA TOÀN BỘ file!         │
  │ → Bỏ qua CẢ SUBTREE dependencies!             │
  │ → HIỆU QUẢ HƠN NHIỀU!                         │
  │                                                │
  │ {                                              │
  │   "sideEffects": false                         │
  │ }                                              │
  │ → Tất cả files KHÔNG có side effects!          │
  │                                                │
  │ {                                              │
  │   "sideEffects": ["**/*.css", "./polyfill.js"] │
  │ }                                              │
  │ → Chỉ .css và polyfill.js CÓ side effects!    │
  │ → Còn lại an toàn bỏ qua!                     │
  └────────────────────────────────────────────────┘

  ② usedExports (tree shaking thật sự):
  ┌────────────────────────────────────────────────┐
  │ LEVEL: STATEMENT (từng dòng code!)             │
  │ → Bundler đánh dấu exports KHÔNG DÙNG!         │
  │ → Terser (minifier) loại bỏ dead code!         │
  │ → PHẢI phân tích side effects từng statement!  │
  │ → KHÓ hơn, CHẬM hơn, ÍT hiệu quả hơn!       │
  │                                                │
  │ → React HOC = rất KHÓ phân tích!               │
  │ → Terser KHÔNG CHẮC có side effect → GIỮ LẠI! │
  └────────────────────────────────────────────────┘

  SO SÁNH:
  ┌──────────────┬─────────────────┬────────────────┐
  │              │ sideEffects     │ usedExports    │
  ├──────────────┼─────────────────┼────────────────┤
  │ Level        │ Module/File     │ Statement      │
  │ Hiệu quả    │ CAO (skip file!)│ THẤP hơn       │
  │ Đánh giá bởi│ Developer       │ Terser (auto)  │
  │ Subtree      │ Bỏ qua ĐƯỢC!   │ Không bỏ được! │
  │ HOC/closures │ Xử lý tốt!     │ KHÓ xử lý!    │
  └──────────────┴─────────────────┴────────────────┘
```

```
VÍ DỤ SHOPIFY POLARIS — DECISION TREE:
═══════════════════════════════════════════════════════════════

  import { Button } from "@shopify/polaris";

  package.json:
  "sideEffects": ["**/*.css", "./esnext/index.js",
                   "./esnext/configure.js"]

  ĐÁNH GIÁ TỪNG FILE:
  ┌────────────────────────────────────────────────────┐
  │ FILE                    │ EXPORT USED? │ SIDE EFF? │ ACTION   │
  ├─────────────────────────┼──────────────┼───────────┼──────────┤
  │ index.js                │ Không trực   │ CÓ (list) │ INCLUDE  │
  │                         │ tiếp         │           │          │
  │ configure.js            │ Không        │ CÓ (list) │ INCLUDE  │
  │ types/index.js          │ Không        │ KHÔNG     │ EXCLUDE  │
  │ components/index.js     │ Không trực   │ KHÔNG     │ SKIP     │
  │                         │ (re-export)  │           │ OVER     │
  │ components/Breadcrumbs  │ Không        │ KHÔNG     │ EXCLUDE  │
  │ components/Button.js    │ CÓ!          │ -         │ INCLUDE  │
  │ components/Button.css   │ Không        │ CÓ (.css) │ INCLUDE  │
  └─────────────────────────┴──────────────┴───────────┴──────────┘

  3 HÀNH ĐỘNG:
  → INCLUDE: giữ module, đánh giá, phân tích deps!
  → SKIP OVER: không giữ, không đánh giá, NHƯNG
    tiếp tục phân tích deps (vì re-export!)
  → EXCLUDE: không giữ, không đánh giá,
    KHÔNG phân tích deps!

  KẾT QUẢ: Chỉ 4 modules trong bundle!
  → index.js (gần như rỗng!)
  → configure.js
  → components/Button.js
  → components/Button.css
```

---

## §6. /\*#\_\_PURE\_\_\*/ annotation

```
/*#__PURE__*/ — ĐÁNH DẤU HÀM KHÔNG CÓ SIDE EFFECTS:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: React HOC rất KHÓ phân tích!
  ┌────────────────────────────────────────────────┐
  │ const Button$1 = withAppProvider()(Button);    │
  │                                                │
  │ Terser tự hỏi:                                 │
  │ → withAppProvider() có side effect?             │
  │ → Return value gọi ()(Button) có side effect?  │
  │ → merge() bên trong có side effect?             │
  │ → hoistStatics() có side effect?                │
  │ → Gán .contextTypes có side effect (Setter)?   │
  │ → Đọc .contextTypes có side effect (Getter)?   │
  │                                                │
  │ → Terser: "KHÔNG CHẮC!" → GIỮ LẠI TẤT CẢ!   │
  │ → → Dead code KHÔNG bị loại!                   │
  └────────────────────────────────────────────────┘

  GIẢI PHÁP: /*#__PURE__*/ annotation!
  ┌────────────────────────────────────────────────┐
  │ const Button$1 =                               │
  │   /*#__PURE__*/ withAppProvider()(Button);      │
  │                                                │
  │ → Developer BẢO ĐẢM: lời gọi này PURE!        │
  │ → Terser TIN TƯỞNG → loại bỏ nếu không dùng! │
  │ → ⚠️ Arguments (Button) KHÔNG được đánh dấu!  │
  │ → Chỉ lời gọi (function call) được đánh dấu! │
  └────────────────────────────────────────────────┘

  VÍ DỤ KHÁC:
  ┌────────────────────────────────────────────────┐
  │ // KHÔNG có __PURE__:                          │
  │ const result = expensiveInit();                │
  │ // → Terser: giữ lại (có thể side effect!)    │
  │                                                │
  │ // CÓ __PURE__:                                │
  │ const result = /*#__PURE__*/ expensiveInit();  │
  │ // → Terser: result không dùng? → LOẠI BỎ!   │
  │                                                │
  │ // Standalone call:                            │
  │ /*#__PURE__*/ double(55);                      │
  │ // → Terser: pure + return value không dùng    │
  │ //   → LOẠI BỎ hoàn toàn!                     │
  └────────────────────────────────────────────────┘
```

---

## §7. CSS Side Effects — Bẫy phổ biến nhất

```
CSS IMPORTS + sideEffects: false = MẤT STYLES!
═══════════════════════════════════════════════════════════════

  VÍ DỤ: Thư viện "awesome-ui"

  awesome-ui/
  ├── package.json        { "sideEffects": false }  ← BẪY!
  ├── dist/
  │   ├── components/
  │   │   ├── Button/
  │   │   │   ├── index.js    → import "./Button.css"
  │   │   │   └── Button.css  → .button { color: blue }
  │   │   ├── Card/
  │   │   │   ├── index.js
  │   │   │   └── Card.css
  │   │   └── Modal/
  │   │       ├── index.js
  │   │       └── Modal.css

  Consumer code:
  ┌────────────────────────────────────────────────┐
  │ import { Button } from 'awesome-ui';           │
  └────────────────────────────────────────────────┘

  VỚI sideEffects: false:
  ┌────────────────────────────────────────────────┐
  │ → Webpack thấy Button.css = import KHÔNG có   │
  │   export → TRẢ VỀ gì? Không biết!             │
  │ → sideEffects: false → "file này pure!"       │
  │ → → LOẠI BỎ Button.css!                       │
  │ → → Button render KHÔNG CÓ STYLES! 😱         │
  └────────────────────────────────────────────────┘

  FIX: Đánh dấu CSS là side effect!
  ┌────────────────────────────────────────────────┐
  │ // package.json                                │
  │ {                                              │
  │   "sideEffects": ["**/*.css"]                  │
  │ }                                              │
  │                                                │
  │ → CSS files = CÓ side effects!                 │
  │ → Webpack GIỮA .css files!                     │
  │ → Button.css ĐƯỢC include! ✅                   │
  │ → Card.css, Modal.css → KHÔNG dùng → LOẠI! ✅  │
  └────────────────────────────────────────────────┘

  DECISION TREE CỦA WEBPACK:
  ┌────────────────────────────────────────────────┐
  │ ① Export của module được DÙNG trực tiếp?       │
  │ ├── CÓ → INCLUDE module!                      │
  │ └── KHÔNG → Bước 2                             │
  │                                                │
  │ ② Module được đánh dấu CÓ side effects?       │
  │ ├── CÓ (sideEffects list hoặc true) → INCLUDE!│
  │ └── KHÔNG (sideEffects false) → EXCLUDE!       │
  │     → BỎ QUA cả dependencies!                  │
  └────────────────────────────────────────────────┘
```

---

## §8. Tự viết Mini Tree Shaker

```javascript
// ═══ MINI TREE SHAKER — TỰ VIẾT TỪ ĐẦU ═══
// Minh họa nguyên lý graph traversal!

/**
 * BƯỚC 1: Parse file → tìm exports + imports
 * (Dùng regex đơn giản thay cho AST parser)
 */
function parseModule(content) {
  const exports = new Map(); // name → code
  const imports = new Map(); // name → source
  const sideEffectImports = []; // import './something'

  // Tìm named exports
  const exportRegex = /export\s+function\s+(\w+)\s*\([^)]*\)\s*\{([^}]*)\}/g;
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.set(match[1], match[0]); // name → full code
  }

  // Tìm export const/let/var
  const exportVarRegex = /export\s+(?:const|let|var)\s+(\w+)\s*=\s*([^;]+);/g;
  while ((match = exportVarRegex.exec(content)) !== null) {
    exports.set(match[1], match[0]);
  }

  // Tìm named imports
  const importRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"](.+?)['"]/g;
  while ((match = importRegex.exec(content)) !== null) {
    const names = match[1].split(",").map((s) => s.trim());
    names.forEach((name) => {
      const actual = name.split(" as ")[0].trim();
      imports.set(actual, match[2]);
    });
  }

  // Tìm side-effect imports: import './polyfill'
  const sideEffectRegex = /import\s+['"]([^'"]+)['"]\s*;?/g;
  while ((match = sideEffectRegex.exec(content)) !== null) {
    // Bỏ qua nếu đã match bởi named import regex
    if (
      !content.includes(`from '${match[1]}'`) &&
      !content.includes(`from "${match[1]}"`)
    ) {
      sideEffectImports.push(match[1]);
    }
  }

  return { exports, imports, sideEffectImports };
}

/**
 * BƯỚC 2: Xây dựng dependency graph
 */
function buildModuleGraph(entryContent, moduleContents) {
  // moduleContents = { './math': 'export function add...' }
  const graph = {};

  Object.entries(moduleContents).forEach(([path, content]) => {
    graph[path] = parseModule(content);
  });

  graph["entry"] = parseModule(entryContent);
  return graph;
}

/**
 * BƯỚC 3: TREE SHAKE — Graph traversal!
 * Chỉ giữ exports ĐƯỢC DÙNG!
 */
function treeShake(graph) {
  // Set các symbol đã dùng
  const usedSymbols = new Set();
  // Set các modules đã visit
  const visitedModules = new Set();
  // Kết quả: code ĐƯỢC GIỮ!
  const includedCode = [];

  function traverse(modulePath) {
    if (visitedModules.has(modulePath)) return;
    visitedModules.add(modulePath);

    const mod = graph[modulePath];
    if (!mod) return;

    // Duyệt imports → đánh dấu symbols!
    mod.imports.forEach((source, name) => {
      usedSymbols.add(`${source}:${name}`);
      traverse(source); // Đệ quy!
    });

    // Include side-effect imports!
    mod.sideEffectImports.forEach((source) => {
      const depMod = graph[source];
      if (depMod) {
        // Side effect → include TOÀN BỘ code!
        depMod.exports.forEach((code) => {
          includedCode.push(code);
        });
      }
    });
  }

  // Bắt đầu từ entry!
  traverse("entry");

  // Lọc: chỉ giữ exports ĐƯỢC DÙNG!
  Object.entries(graph).forEach(([path, mod]) => {
    if (path === "entry") {
      // Entry code giữ TẤT CẢ!
      return;
    }
    mod.exports.forEach((code, name) => {
      const key = `${path}:${name}`;
      if (usedSymbols.has(key)) {
        includedCode.push(code); // DÙNG → GIỮ! ✅
      }
      // KHÔNG DÙNG → LOẠI! ❌
    });
  });

  return includedCode;
}

// ═══ SỬ DỤNG ═══
const entry = `
  import { add } from './math';
  console.log(add(1, 2));
`;

const modules = {
  "./math": `
    export function add(a, b) { return a + b; }
    export function multiply(a, b) { return a * b; }
    export function subtract(a, b) { return a - b; }
  `,
};

const graph = buildModuleGraph(entry, modules);
const result = treeShake(graph);
console.log("Included code:", result);
// → Chỉ có: add()!
// → multiply() và subtract() bị LOẠI! ✅
```

---

## §9. Tự viết Side Effects Analyzer

```javascript
// ═══ SIDE EFFECTS ANALYZER — TỰ VIẾT ═══

/**
 * Phân tích 1 statement có side effects không?
 * (Phiên bản đơn giản — minh họa nguyên lý!)
 */
function hasSideEffects(statement) {
  const trimmed = statement.trim();

  // ① Khai báo biến với LITERAL → PURE!
  if (/^(const|let|var)\s+\w+\s*=\s*['"\d\[\{]/.test(trimmed)) {
    return false; // VD: const x = 42; → PURE!
  }

  // ② Function declaration → PURE!
  if (/^(export\s+)?function\s+\w+/.test(trimmed)) {
    return false; // VD: function add() {} → PURE!
  }

  // ③ Class declaration → PURE!
  if (/^(export\s+)?class\s+\w+/.test(trimmed)) {
    return false;
  }

  // ④ Khai báo biến với FUNCTION CALL → CÓ THỂ side effect!
  if (/^(const|let|var)\s+\w+\s*=\s*\w+\(/.test(trimmed)) {
    // Check /*#__PURE__*/ annotation
    if (/\/\*\s*#__PURE__\s*\*\//.test(trimmed)) {
      return false; // Được đánh dấu PURE!
    }
    return true; // VD: const x = getName(); → SIDE EFFECT!
  }

  // ⑤ import CSS/SCSS → SIDE EFFECT!
  if (/^import\s+['"].*\.(css|scss|sass|less)['"]/.test(trimmed)) {
    return true;
  }

  // ⑥ import side-effect-only → SIDE EFFECT!
  if (/^import\s+['"]/.test(trimmed) && !trimmed.includes(" from ")) {
    return true; // VD: import './polyfill'; → SIDE EFFECT!
  }

  // ⑦ Assignment to global/prototype → SIDE EFFECT!
  if (
    /^(window|document|global|globalThis)\.\w+\s*=/.test(trimmed) ||
    /\.prototype\.\w+\s*=/.test(trimmed)
  ) {
    return true;
  }

  // ⑧ Function call standalone → SIDE EFFECT!
  if (/^\w+\(/.test(trimmed) && !trimmed.startsWith("export")) {
    if (/\/\*\s*#__PURE__\s*\*\//.test(trimmed)) {
      return false;
    }
    return true; // VD: init(); → SIDE EFFECT!
  }

  return false; // Mặc định: PURE
}

/**
 * Kiểm tra sideEffects config cho 1 file
 */
function checkSideEffectsConfig(filePath, packageJson) {
  const { sideEffects } = packageJson;

  // Không có field → CÓ side effects (mặc định!)
  if (sideEffects === undefined) return true;
  // false → KHÔNG có side effects!
  if (sideEffects === false) return false;
  // true → CÓ side effects!
  if (sideEffects === true) return true;

  // Array → kiểm tra file có match pattern?
  if (Array.isArray(sideEffects)) {
    return sideEffects.some((pattern) => {
      // Đơn giản: kiểm tra extension match
      if (pattern.startsWith("**/*.")) {
        const ext = pattern.replace("**/", "").replace("*", "");
        return filePath.endsWith(ext);
      }
      return filePath.includes(pattern);
    });
  }

  return true;
}

// ═══ SỬ DỤNG ═══
console.log(hasSideEffects("const x = 42;")); // false
console.log(hasSideEffects("const x = getName();")); // true
console.log(hasSideEffects("import './polyfill';")); // true
console.log(hasSideEffects("import './styles.css';")); // true
console.log(hasSideEffects("export function add() {}")); // false
console.log(hasSideEffects("const x = /*#__PURE__*/ createHOC();")); // false (PURE annotation!)

console.log(
  checkSideEffectsConfig("Button.css", { sideEffects: ["**/*.css"] }),
); // true — CSS = side effect!
console.log(checkSideEffectsConfig("Button.js", { sideEffects: ["**/*.css"] })); // false — JS file not in list!
```

---

## §10. Webpack cấu hình thực tế

```javascript
// ═══ WEBPACK CẤU HÌNH TREE SHAKING ═══

// webpack.config.js
const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },

  // ① mode: "production" → bật tree shaking + terser!
  mode: "production",

  optimization: {
    // ② usedExports: đánh dấu exports KHÔNG DÙNG!
    usedExports: true,

    // ③ minimize: Terser loại bỏ dead code!
    minimize: true,

    // ④ concatenateModules: Module Concatenation!
    // → Gom modules vào 1 scope → tree shake TỐT HƠN!
    concatenateModules: true, // = ModuleConcatenationPlugin

    // ⑤ innerGraph: phân tích sâu hơn!
    // → Biết function NÀO trong module được gọi!
    innerGraph: true,

    // ⑥ sideEffects: đọc sideEffects từ package.json!
    sideEffects: true,
  },
};
```

```
// ═══ package.json — ĐÚNG CÁCH ═══

// ① Không có side effects:
{
  "name": "my-lib",
  "sideEffects": false
}

// ② Có CSS side effects:
{
  "name": "my-ui-lib",
  "sideEffects": ["**/*.css", "**/*.scss"]
}

// ③ Có polyfill + CSS:
{
  "name": "my-app",
  "sideEffects": [
    "**/*.css",
    "./src/polyfills.js",
    "./src/global-setup.js"
  ]
}

// ④ Babel config — GIỮ ES Modules:
// babel.config.js
{
  "presets": [
    ["@babel/preset-env", {
      "modules": false  // ← QUAN TRỌNG!
    }]
  ]
}
```

---

## §11. Sai lầm thường gặp & Cách khắc phục

```
5 SAI LẦM PHỔ BIẾN:
═══════════════════════════════════════════════════════════════

  ① sideEffects: false QUÁ LẠC QUAN!
  ┌────────────────────────────────────────────────┐
  │ ❌ "sideEffects": false                        │
  │ → CSS imports bị LOẠI BỎ!                     │
  │ → Polyfills bị LOẠI BỎ!                       │
  │ → Components render KHÔNG CÓ styles!           │
  │                                                │
  │ ✅ "sideEffects": ["**/*.css", "./polyfill.js"]│
  │ → CSS ĐƯỢC GIỮ! Polyfill ĐƯỢC GIỮ!            │
  └────────────────────────────────────────────────┘

  ② Babel chuyển ESM → CommonJS!
  ┌────────────────────────────────────────────────┐
  │ ❌ @babel/preset-env (mặc định modules: "auto")│
  │ → import/export → require/module.exports!      │
  │ → Tree shaking BỊ PHÁ!                         │
  │                                                │
  │ ✅ ["@babel/preset-env", { modules: false }]   │
  └────────────────────────────────────────────────┘

  ③ Chỉ test Development mode!
  ┌────────────────────────────────────────────────┐
  │ → Dev mode: tree shaking KHÔNG chạy đầy đủ!   │
  │ → Production: Terser + sideEffects HOẠT ĐỘNG!  │
  │ → Bug chỉ xuất hiện ở PRODUCTION!              │
  │ → → LUÔN test production build!                 │
  └────────────────────────────────────────────────┘

  ④ Re-exports với side effects:
  ┌────────────────────────────────────────────────┐
  │ ❌ import './polyfill';                        │
  │    export * from './components';               │
  │    // polyfill bị SKIP nếu sideEffects: false! │
  │                                                │
  │ ✅ Thêm vào sideEffects list!                  │
  └────────────────────────────────────────────────┘

  ⑤ Nested dependencies sai config:
  ┌────────────────────────────────────────────────┐
  │ → Package CỦA BẠN đánh dấu đúng!              │
  │ → Nhưng dependency bên trong đánh dấu SAI!     │
  │ → CSS của dependency bị mất!                   │
  │ → → Kiểm tra node_modules/pkg/package.json!   │
  └────────────────────────────────────────────────┘
```

---

## §12. Tóm tắt phỏng vấn

```
Q&A PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Tree Shaking là gì?"
  A: Loại bỏ dead code (code không dùng) khỏi bundle!
  Bundler duyệt graph từ entry → đánh dấu code dùng!
  Code không duyệt = dead → LOẠI BỎ!

  Q: "Tại sao phải dùng ES Modules?"
  A: ESM = static analysis → bundler biết imports lúc BUILD!
  CJS = dynamic → require() trong if/else → không biết!
  → Phải giữ TẤT CẢ! → Không tree shake được!

  Q: "sideEffects khác usedExports thế nào?"
  A: sideEffects: MODULE level → skip TOÀN BỘ file + deps!
  → Developer khai báo trong package.json!
  usedExports: STATEMENT level → Terser phân tích từng dòng!
  → Tự động nhưng khó + ít hiệu quả hơn!

  Q: "/*#__PURE__*/ dùng khi nào?"
  A: → Đánh dấu function call KHÔNG có side effects!
  → Terser không chắc HOC/factory có pure? → GIỮ LẠI!
  → /*#__PURE__*/ → developer BẢO ĐẢM → Terser LOẠI!

  Q: "Tại sao CSS bị mất khi tree shaking?"
  A: → import './style.css' = side effect!
  → sideEffects: false → bundler nghĩ: PURE → LOẠI!
  → Fix: sideEffects: ["**/*.css"]!

  Q: "Module Concatenation là gì?"
  A: → Nhiều modules → GOM vào 1 scope!
  → Giảm function wrappers!
  → Tree shake TỐT hơn (thấy rõ code nào dùng!)
  → = Scope Hoisting (Rollup gọi thế!)
```

---

### Checklist

- [ ] **ES Modules**: Dùng import/export, KHÔNG dùng require/module.exports!
- [ ] **Babel config**: modules: false — giữ ESM cho bundler!
- [ ] **package.json sideEffects**: Khai báo đúng files có side effects!
- [ ] **CSS side effects**: "sideEffects": ["**/*.css"] — giữ CSS imports!
- [ ] **/_#\_\_PURE\_\__/**: Đánh dấu HOC/factory calls là pure!
- [ ] **mode: "production"**: Bật Terser + tree shaking đầy đủ!
- [ ] **usedExports: true**: Đánh dấu unused exports!
- [ ] **concatenateModules**: Module Concatenation / Scope Hoisting!
- [ ] **Test production build**: Tree shaking chỉ chạy đầy đủ ở production!
- [ ] **Kiểm tra dependencies**: node_modules packages cấu hình đúng!

---

_Nguồn: Webpack Documentation — Tree Shaking_
_patterns.dev — Addy Osmani — "Tree Shaking"_
_Cập nhật lần cuối: Tháng 2, 2026_
