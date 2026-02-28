# Next.js Compiler (SWC) — Deep Dive!

> **Chủ đề**: Next.js Compiler — SWC, Code Transforms, Minification
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. Next.js Compiler Là Gì?](#1)
2. [§2. Tại Sao SWC? — Babel vs SWC!](#2)
3. [§3. Supported Features — Cấu Hình!](#3)
4. [§4. Tự Viết — Code Transform Engine!](#4)
5. [§5. Tự Viết — Minifier!](#5)
6. [§6. Tự Viết — Compiler Plugin System!](#6)
7. [§7. Experimental & Unsupported!](#7)
8. [§8. Tổng Kết & Câu Hỏi Phỏng Vấn!](#8)
9. [§9. Tự Viết — AST Parser!](#9)
10. [§10. Turbopack vs Webpack!](#10)
11. [§11. optimizePackageImports & Tree-Shaking!](#11)
12. [§12. Source Maps — Debug Production!](#12)
13. [§13. CSS-in-JS SSR — Styled-Components!](#13)
14. [§14. Fast Refresh (HMR)!](#14)
15. [§15. Code Splitting & Dynamic Imports!](#15)
16. [§16. TypeScript Compilation — SWC vs TSC!](#16)

---

## §1. Next.js Compiler Là Gì?

```
  NEXT.JS COMPILER — TỔNG QUAN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Next.js Compiler = BỘ BIÊN DỊCH viết bằng RUST      │
  │  sử dụng SWC (Speedy Web Compiler)                    │
  │                                                        │
  │  CHỨC NĂNG:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① TRANSFORM — biến đổi JavaScript/TypeScript:  │  │
  │  │     JSX → JS, TS → JS, ES2024 → ES5            │  │
  │  │     Thay thế: BABEL                              │  │
  │  │                                                  │  │
  │  │  ② MINIFY — nén code cho production:            │  │
  │  │     Xóa whitespace, rút gọn tên biến           │  │
  │  │     Thay thế: TERSER                             │  │
  │  │                                                  │  │
  │  │  ③ BUNDLE — đóng gói modules:                   │  │
  │  │     Tree-shaking, code splitting                │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  TỐC ĐỘ:                                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Babel (JavaScript) ████████████████████ 17x     │  │
  │  │  SWC   (Rust)        █ 1x  ← NHANH HƠN 17 LẦN! │  │
  │  │                                                  │  │
  │  │  Terser (JavaScript) ███████████████ 7x          │  │
  │  │  SWC    (Rust)        ██ 1x ← NHANH HƠN 7 LẦN! │  │
  │  │                                                  │  │
  │  │  Fast Refresh: ~3x nhanh hơn                    │  │
  │  │  Full Build:   ~5x nhanh hơn                    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  MẶC ĐỊNH từ Next.js 12+ (không cần cấu hình!)       │
  │  Nếu có .babelrc → tự động FALLBACK về Babel!        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  BUILD PIPELINE — TRƯỚC vs SAU SWC:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  TRƯỚC (Next.js < 12):                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Source Code                                     │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  BABEL (JavaScript) ← CHẬM!                     │  │
  │  │  Parse → Transform → Generate                   │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  WEBPACK (JavaScript) — bundle                  │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  TERSER (JavaScript) ← CHẬM!                    │  │
  │  │  Minify output bundles                          │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  Production Build                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SAU (Next.js 12+):                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Source Code                                     │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  SWC (Rust) ← SIÊU NHANH!                      │  │
  │  │  Parse + Transform + Minify — TẤT CẢ TRONG 1!  │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  WEBPACK/TURBOPACK — bundle                     │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  Production Build                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Tại Sao SWC? — Babel vs SWC!

```
  BABEL vs SWC — SO SÁNH CHI TIẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─────────────┬──────────────┬──────────────────────┐ │
  │  │             │ BABEL        │ SWC                  │ │
  │  ├─────────────┼──────────────┼──────────────────────┤ │
  │  │ Ngôn ngữ   │ JavaScript   │ Rust                 │ │
  │  │ Tốc độ     │ 1x (baseline)│ 17x nhanh hơn!      │ │
  │  │ Lý do chậm │ Single-thread│ Multi-thread + SIMD  │ │
  │  │            │ GC overhead  │ Zero-cost abstracts  │ │
  │  │            │ AST cloning  │ In-place mutation    │ │
  │  ├─────────────┼──────────────┼──────────────────────┤ │
  │  │ Extensible │ Plugin JS    │ Plugin WASM          │ │
  │  │ Ecosystem  │ Rất lớn      │ Đang phát triển     │ │
  │  │ Config     │ .babelrc     │ next.config.js       │ │
  │  ├─────────────┼──────────────┼──────────────────────┤ │
  │  │ TypeScript │ Strip types  │ Strip types          │ │
  │  │ JSX        │ ✅           │ ✅                   │ │
  │  │ Minify     │ ❌ (Terser)  │ ✅ built-in!         │ │
  │  │ WASM       │ ❌           │ ✅ (Rust → WASM)     │ │
  │  └─────────────┴──────────────┴──────────────────────┘ │
  │                                                        │
  │  TẠI SAO RUST NHANH HƠN JAVASCRIPT?                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  JavaScript:                                     │  │
  │  │  Source → V8 Parse → Bytecode → JIT Compile     │  │
  │  │  + Garbage Collector DỪNG execution (stop-world) │  │
  │  │  + Object shapes thay đổi → deoptimize          │  │
  │  │  + Single-threaded (1 CPU core)                  │  │
  │  │                                                  │  │
  │  │  Rust:                                           │  │
  │  │  Source → Compile → Machine Code TRỰC TIẾP!     │  │
  │  │  + KHÔNG có GC (ownership model → zero overhead)│  │
  │  │  + Types cố định → compiler tối ưu cực mạnh    │  │
  │  │  + Multi-threaded (TẤT CẢ CPU cores)            │  │
  │  │  + SIMD instructions cho batch processing       │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  4 LÝ DO NEXT.JS CHỌN SWC:                           │
  │  ① Extensibility — dùng như Rust Crate, không fork   │
  │  ② Performance — 3x Fast Refresh, 5x builds          │
  │  ③ WebAssembly — Rust compile sang WASM dễ dàng     │
  │  ④ Community — Rust ecosystem đang phát triển mạnh  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Supported Features — Cấu Hình!

```
  COMPILER OPTIONS — BẢN ĐỒ TỔNG QUAN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  next.config.js                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  compiler: {                                     │  │
  │  │    styledComponents  — CSS-in-JS support         │  │
  │  │    emotion           — CSS-in-JS support         │  │
  │  │    relay             — GraphQL Relay              │  │
  │  │    reactRemoveProperties — xóa data-test*        │  │
  │  │    removeConsole     — xóa console.log           │  │
  │  │    define            — thay biến lúc build       │  │
  │  │    defineServer      — thay biến server-only     │  │
  │  │    runAfterProductionCompile — lifecycle hook     │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  transpilePackages   — transpile node_modules    │  │
  │  │                                                  │  │
  │  │  experimental: {                                 │  │
  │  │    swcTraceProfiling — debug SWC performance     │  │
  │  │    swcPlugins        — WASM plugins              │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  tsconfig.json / jsconfig.json (tự detect):           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  experimentalDecorators — legacy @decorator      │  │
  │  │  jsxImportSource        — theme-ui, emotion      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### ① Styled Components

```javascript
// next.config.js
module.exports = {
  compiler: {
    // Đơn giản — bật tất cả defaults:
    styledComponents: true,

    // Hoặc chi tiết:
    styledComponents: {
      displayName: true, // dev: component name trong class
      ssr: true, // server-side rendering support
      fileName: true, // thêm filename vào class
      minify: true, // minify CSS
      transpileTemplateLiterals: true, // tối ưu template
      pure: false, // đánh dấu pure cho tree-shaking
      cssProp: true, // support css prop
      namespace: "", // prefix cho class names
    },
  },
};

// TẠI SAO CẦN displayName + ssr?
// → displayName: debug dễ hơn (thấy tên component trong DevTools)
// → ssr: đảm bảo styles render đúng trên server
//   (không bị flash of unstyled content — FOUC!)
```

### ② Jest Integration

```javascript
// jest.config.js — Next.js tự config SWC cho Jest!
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });
// → Tự động:
//   ✅ Mock .css/.scss/.module.css imports
//   ✅ Mock image imports (jpg, png, svg...)
//   ✅ Setup SWC transform (thay Babel!)
//   ✅ Load .env vào process.env
//   ✅ Ignore node_modules + .next

const customJestConfig = {
  setupFilesAfterSetup: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
};

module.exports = createJestConfig(customJestConfig);
```

### ③ Remove Properties & Console

```javascript
// next.config.js

module.exports = {
  compiler: {
    // XÓA data-test attributes khỏi production build:
    reactRemoveProperties: true,
    // → <button data-testid="submit"> → <button>
    // → Giảm bundle size + ẩn test selectors!

    // Hoặc custom regex:
    reactRemoveProperties: {
      properties: ["^data-test$", "^data-cy$"],
      // ⚠️ Regex xử lý bởi Rust → cú pháp khác JS RegExp!
    },

    // XÓA console.* khỏi production:
    removeConsole: true,
    // → console.log("debug") → bị XÓA hoàn toàn!
    // → Giảm bundle size + không lộ debug info!

    // Giữ lại console.error (cho error tracking):
    removeConsole: {
      exclude: ["error", "warn"],
    },
  },
};
```

### ④ Define — Thay Biến Lúc Build

```javascript
// next.config.js
module.exports = {
  compiler: {
    // Thay cho TẤT CẢ environments (server + edge + client):
    define: {
      APP_VERSION: '"1.2.3"',
      "process.env.API_URL": '"https://api.prod.com"',
      __DEV__: "false",
    },
    // Chỉ thay cho SERVER (server + edge):
    defineServer: {
      DB_HOST: '"db.internal.com"',
      SECRET_KEY: '"abc123"', // ← KHÔNG lộ ra client!
    },
  },
};

// Trong code:
// if (__DEV__) { console.log("debug"); }
// → Build production: if (false) { console.log("debug"); }
// → Minifier: XÓA LUÔN dead code!
```

### ⑤ Module Transpilation & Lifecycle Hooks

```javascript
// next.config.js
module.exports = {
  // Transpile packages từ node_modules:
  // (thay thế next-transpile-modules!)
  transpilePackages: ["@acme/ui", "lodash-es"],
  // → Tại sao? Một số packages chỉ ship ES modules
  // → Node.js/Webpack cần transpile về CommonJS

  compiler: {
    // Hook SAU KHI build xong, TRƯỚC type-check + static gen:
    runAfterProductionCompile: async ({ distDir, projectDir }) => {
      // Upload sourcemaps lên Sentry:
      console.log("Build output:", distDir); // ".next"
      console.log("Project root:", projectDir); // "/app"
      // await uploadSourcemaps(distDir);
    },
  },
};
```

---

## §4. Tự Viết — Code Transform Engine!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleCodeTransformer
// Mô phỏng cách SWC/Babel transform code!
// ═══════════════════════════════════════════════════════════

var SimpleCodeTransformer = (function () {
  // ① TOKENIZER — tách code thành tokens:
  function tokenize(code) {
    var tokens = [];
    var i = 0;
    while (i < code.length) {
      var ch = code[i];

      // Bỏ qua whitespace:
      if (/\s/.test(ch)) {
        var ws = "";
        while (i < code.length && /\s/.test(code[i])) ws += code[i++];
        tokens.push({ type: "whitespace", value: ws });
        continue;
      }
      // String literals:
      if (ch === '"' || ch === "'" || ch === "`") {
        var quote = ch;
        var str = ch;
        i++;
        while (i < code.length && code[i] !== quote) {
          if (code[i] === "\\") {
            str += code[i++];
          }
          str += code[i++];
        }
        str += code[i++]; // closing quote
        tokens.push({ type: "string", value: str });
        continue;
      }
      // Identifiers & keywords:
      if (/[a-zA-Z_$]/.test(ch)) {
        var id = "";
        while (i < code.length && /[a-zA-Z0-9_$.]/.test(code[i]))
          id += code[i++];
        var keywords = [
          "const",
          "let",
          "var",
          "function",
          "return",
          "if",
          "else",
          "for",
          "while",
          "class",
          "import",
          "export",
          "from",
          "async",
          "await",
        ];
        tokens.push({
          type: keywords.indexOf(id) > -1 ? "keyword" : "identifier",
          value: id,
        });
        continue;
      }
      // Numbers:
      if (/[0-9]/.test(ch)) {
        var num = "";
        while (i < code.length && /[0-9.]/.test(code[i])) num += code[i++];
        tokens.push({ type: "number", value: num });
        continue;
      }
      // Operators & punctuation:
      tokens.push({ type: "punct", value: ch });
      i++;
    }
    return tokens;
  }

  // ② TRANSFORMS:

  // Transform: Remove console.* calls
  function removeConsole(code, options) {
    var exclude = (options && options.exclude) || [];
    // Regex: console.method(...) kể cả nested parens
    return code.replace(
      /console\.([\w]+)\s*\([^)]*(?:\([^)]*\)[^)]*)*\);?/g,
      function (match, method) {
        if (exclude.indexOf(method) > -1) return match; // giữ lại
        return ""; // XÓA!
      },
    );
  }

  // Transform: Remove data-test* props từ JSX
  function removeTestProps(code, patterns) {
    patterns = patterns || ["^data-test"];
    var regexes = patterns.map(function (p) {
      return new RegExp(p);
    });

    return code.replace(
      /\s+([\w-]+)=(?:"[^"]*"|{[^}]*}|\{[^}]*\})/g,
      function (match, propName) {
        for (var j = 0; j < regexes.length; j++) {
          if (regexes[j].test(propName)) return ""; // XÓA prop!
        }
        return match;
      },
    );
  }

  // Transform: Define — thay thế biến:
  function defineReplace(code, definitions) {
    var result = code;
    for (var key in definitions) {
      // Thay thế identifier (word boundary):
      var regex = new RegExp("\\b" + key.replace(/\./g, "\\.") + "\\b", "g");
      result = result.replace(regex, definitions[key]);
    }
    return result;
  }

  // Transform: Arrow functions → regular functions (ES5):
  function arrowToFunction(code) {
    // (args) => expression
    return code
      .replace(
        /\(([^)]*)\)\s*=>\s*([^{][^;\n]*)/g,
        "function($1) { return $2; }",
      )
      .replace(
        // (args) => { body }
        /\(([^)]*)\)\s*=>\s*\{/g,
        "function($1) {",
      );
  }

  // Transform: const/let → var (ES5):
  function constLetToVar(code) {
    return code.replace(/\b(const|let)\b/g, "var");
  }

  // Transform: Template literals → string concat:
  function templateToConcat(code) {
    return code.replace(/`([^`]*)`/g, function (match, content) {
      if (content.indexOf("${") === -1) return '"' + content + '"';
      var parts = content.split(/\$\{([^}]+)\}/);
      var result = [];
      for (var k = 0; k < parts.length; k++) {
        if (k % 2 === 0) {
          if (parts[k]) result.push('"' + parts[k] + '"');
        } else {
          result.push("(" + parts[k] + ")");
        }
      }
      return result.join(" + ");
    });
  }

  return {
    tokenize: tokenize,
    transforms: {
      removeConsole: removeConsole,
      removeTestProps: removeTestProps,
      defineReplace: defineReplace,
      arrowToFunction: arrowToFunction,
      constLetToVar: constLetToVar,
      templateToConcat: templateToConcat,
    },
    // Chạy pipeline transforms (giống SWC!):
    transform: function (code, config) {
      var result = code;
      if (config.removeConsole) {
        var opts = config.removeConsole === true ? {} : config.removeConsole;
        result = removeConsole(result, opts);
      }
      if (config.reactRemoveProperties) {
        var patterns = config.reactRemoveProperties.properties || [
          "^data-test",
        ];
        result = removeTestProps(result, patterns);
      }
      if (config.define) {
        result = defineReplace(result, config.define);
      }
      if (config.target === "es5") {
        result = arrowToFunction(result);
        result = constLetToVar(result);
        result = templateToConcat(result);
      }
      return result;
    },
  };
})();

// ═══════════════════════════════════════════════════════════
// SỬ DỤNG:
// ═══════════════════════════════════════════════════════════

var input = `
  const greet = (name) => \`Hello \${name}!\`;
  console.log(greet("World"));
  console.error("keep this");
  <Button data-testid="submit" onClick={fn}>Submit</Button>
`;

var output = SimpleCodeTransformer.transform(input, {
  removeConsole: { exclude: ["error"] },
  reactRemoveProperties: { properties: ["^data-test"] },
  target: "es5",
});
// → console.log: XÓA!
// → console.error: GIỮ!
// → data-testid: XÓA!
// → const → var, arrow → function, template → concat!
```

```
  TRANSFORM PIPELINE (giống SWC/Babel):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Source Code                                           │
  │      │                                                 │
  │      ▼                                                 │
  │  ┌──────────┐                                          │
  │  │ TOKENIZE │ → tách thành tokens                     │
  │  └──────────┘                                          │
  │      │                                                 │
  │      ▼                                                 │
  │  ┌──────────┐                                          │
  │  │  PARSE   │ → tạo AST (Abstract Syntax Tree)       │
  │  └──────────┘                                          │
  │      │                                                 │
  │      ▼                                                 │
  │  ┌──────────────────────────────────────┐              │
  │  │  TRANSFORM PLUGINS (chạy tuần tự):  │              │
  │  │  ① removeConsole                     │              │
  │  │  ② removeTestProps                   │              │
  │  │  ③ defineReplace                     │              │
  │  │  ④ arrowToFunction (ES5)             │              │
  │  │  ⑤ constLetToVar (ES5)              │              │
  │  │  ⑥ templateToConcat (ES5)           │              │
  │  └──────────────────────────────────────┘              │
  │      │                                                 │
  │      ▼                                                 │
  │  ┌──────────┐                                          │
  │  │ GENERATE │ → tạo output code                       │
  │  └──────────┘                                          │
  │      │                                                 │
  │      ▼                                                 │
  │  Transformed Code                                      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — Minifier!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleMinifier (mô phỏng SWC minify):
// ═══════════════════════════════════════════════════════════

var SimpleMinifier = (function () {
  // ① Xóa comments:
  function removeComments(code) {
    // Single-line comments:
    var result = code.replace(/\/\/[^\n]*/g, "");
    // Multi-line comments:
    result = result.replace(/\/\*[\s\S]*?\*\//g, "");
    return result;
  }

  // ② Xóa whitespace thừa:
  function removeWhitespace(code) {
    return code
      .replace(/\s+/g, " ") // nhiều space → 1 space
      .replace(/\s*([{}();,=+\-*/<>!&|?:])\s*/g, "$1")
      .replace(/;\s*}/g, "}") // xóa ; trước }
      .trim();
  }

  // ③ Rút gọn tên biến (mangle):
  function mangleVariables(code) {
    var chars = "abcdefghijklmnopqrstuvwxyz";
    var varIndex = 0;
    var mapping = {};
    var reserved = [
      "if",
      "else",
      "for",
      "while",
      "return",
      "var",
      "let",
      "const",
      "function",
      "class",
      "new",
      "this",
      "true",
      "false",
      "null",
      "undefined",
      "typeof",
      "instanceof",
      "void",
      "delete",
      "in",
      "of",
      "try",
      "catch",
      "throw",
      "switch",
      "case",
      "break",
      "continue",
      "do",
      "export",
      "import",
      "from",
      "default",
      "async",
      "await",
      "yield",
      "console",
      "window",
      "document",
      "Math",
      "JSON",
      "Array",
      "Object",
      "String",
      "Number",
      "Boolean",
      "Date",
      "Error",
      "Promise",
      "RegExp",
      "Map",
      "Set",
      "parseInt",
      "parseFloat",
      "setTimeout",
      "setInterval",
      "clearTimeout",
      "clearInterval",
      "alert",
      "fetch",
      "module",
      "require",
      "process",
      "React",
      "useState",
      "useEffect",
      "useRef",
      "useCallback",
      "useMemo",
    ];

    // Tìm tất cả var/let/const declarations:
    return code.replace(
      /\b(var|let|const)\s+([a-zA-Z_$][\w$]*)/g,
      function (match, keyword, name) {
        if (reserved.indexOf(name) > -1) return match;
        if (!mapping[name]) {
          var short = chars[varIndex % 26];
          if (varIndex >= 26) short += Math.floor(varIndex / 26);
          mapping[name] = short;
          varIndex++;
        }
        // Thay tên biến trong toàn bộ scope (simplified):
        return keyword + " " + mapping[name];
      },
    );
  }

  // ④ Dead code elimination:
  function removeDeadCode(code) {
    // Xóa if (false) { ... }:
    return code
      .replace(/if\s*\(\s*false\s*\)\s*\{[^}]*\}/g, "")
      .replace(/if\s*\(\s*!1\s*\)\s*\{[^}]*\}/g, "");
  }

  // ⑤ Constant folding:
  function foldConstants(code) {
    // true → !0, false → !1 (ngắn hơn!):
    return code
      .replace(/\btrue\b/g, "!0")
      .replace(/\bfalse\b/g, "!1")
      .replace(/\bvoid 0\b/g, "void 0")
      .replace(/\bundefined\b(?!\s*[:(])/g, "void 0");
  }

  return {
    minify: function (code, options) {
      options = options || {};
      var result = code;

      result = removeComments(result);
      result = removeDeadCode(result);
      if (options.mangle !== false) result = mangleVariables(result);
      result = foldConstants(result);
      result = removeWhitespace(result);

      return {
        code: result,
        originalSize: code.length,
        minifiedSize: result.length,
        savings: Math.round((1 - result.length / code.length) * 100) + "%",
      };
    },
  };
})();

// SỬ DỤNG:
var code = `
  // Helper function
  const greeting = "Hello";
  const isActive = true;
  let counter = 0;

  function calculateTotal(price, tax) {
    /* Calculate with tax */
    if (false) {
      console.log("debug mode");
    }
    const result = price + (price * tax);
    return result;
  }
`;
var minified = SimpleMinifier.minify(code);
// → code: "var a="Hello";var b=!0;var c=0;function calculateTotal(d,e){var f=d+(d*e);return f}"
// → savings: ~65%!
```

---

## §6. Tự Viết — Compiler Plugin System!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleCompilerConfig
// Mô phỏng next.config.js compiler options:
// ═══════════════════════════════════════════════════════════

var SimpleCompilerConfig = (function () {
  // Plugin registry (giống SWC plugin system):
  var plugins = [];

  function registerPlugin(name, transformFn) {
    plugins.push({ name: name, transform: transformFn });
  }

  // Built-in plugins (giống Next.js compiler options):

  // styled-components: thêm displayName
  registerPlugin("styledComponents", function (code, opts) {
    if (!opts || (!opts.displayName && opts !== true)) return code;
    // Tìm styled.X`` và thêm .withConfig:
    return code.replace(
      /const\s+(\w+)\s*=\s*styled\.(\w+)`/g,
      function (match, name, tag) {
        return (
          "const " +
          name +
          " = styled." +
          tag +
          '.withConfig({ displayName: "' +
          name +
          '" })`'
        );
      },
    );
  });

  // Emotion: thêm source map + label
  registerPlugin("emotion", function (code, opts) {
    if (!opts) return code;
    return code.replace(/css`([^`]*)`/g, function (match, styles) {
      var label = opts.autoLabel === "always" ? "/*label:component*/" : "";
      return "css`" + label + styles + "`";
    });
  });

  // Module transpilation checker:
  function shouldTranspile(modulePath, transpilePackages) {
    if (!transpilePackages) return false;
    for (var i = 0; i < transpilePackages.length; i++) {
      if (modulePath.indexOf(transpilePackages[i]) > -1) return true;
    }
    return false;
  }

  return {
    // Compile file với config (giống next.config.js):
    compile: function (code, config) {
      var result = code;

      // Chạy registered plugins:
      for (var i = 0; i < plugins.length; i++) {
        var pluginOpts = config.compiler && config.compiler[plugins[i].name];
        if (pluginOpts) {
          result = plugins[i].transform(result, pluginOpts);
        }
      }

      // Built-in transforms:
      if (config.compiler) {
        result = SimpleCodeTransformer.transform(result, config.compiler);
      }

      return result;
    },

    shouldTranspile: shouldTranspile,
    registerPlugin: registerPlugin,
  };
})();

// ═══════════════════════════════════════════════════════════
// SỬ DỤNG — giống next.config.js:
// ═══════════════════════════════════════════════════════════

var nextConfig = {
  compiler: {
    styledComponents: true,
    removeConsole: { exclude: ["error"] },
    reactRemoveProperties: true,
    define: { __DEV__: "false" },
  },
  transpilePackages: ["@acme/ui", "lodash-es"],
};

var sourceCode = `
  const Button = styled.button\`color: red;\`;
  console.log("hello");
  console.error("keep");
`;

var compiled = SimpleCompilerConfig.compile(sourceCode, nextConfig);
// → Button có displayName
// → console.log: XÓA
// → console.error: GIỮ
```

---

## §7. Experimental & Unsupported!

```
  EXPERIMENTAL FEATURES:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① SWC Trace Profiling:                               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  experimental: { swcTraceProfiling: true }       │  │
  │  │                                                  │  │
  │  │  → Tạo file: .next/swc-trace-profile-{ts}.json  │  │
  │  │  → Mở bằng: chrome://tracing/                   │  │
  │  │  → Hoặc: https://ui.perfetto.dev/               │  │
  │  │  → Xem: transform nào CHẬM nhất!                │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② SWC Plugins (WASM):                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  experimental: {                                 │  │
  │  │    swcPlugins: [                                 │  │
  │  │      ['plugin-name', { ...options }]             │  │
  │  │    ]                                             │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  Plugin = WASM binary (viết bằng Rust)           │  │
  │  │  → npm package hoặc absolute path .wasm          │  │
  │  │  → Array of tuples: [pluginPath, options]        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  UNSUPPORTED — FALLBACK VỀ BABEL:                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Nếu project có .babelrc hoặc babel.config.js:  │  │
  │  │  → Next.js TỰ ĐỘNG dùng Babel thay SWC!        │  │
  │  │  → Đảm bảo backward compatibility!              │  │
  │  │                                                  │  │
  │  │  ⚠️ MẤT 17x performance boost!                  │  │
  │  │  → Nên migrate Babel plugins sang SWC khi có thể│  │
  │  │                                                  │  │
  │  │  Kiểm tra: nếu build chậm → check .babelrc!    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  VERSION HISTORY:
  ┌──────────┬─────────────────────────────────────────────┐
  │ Version  │ Changes                                      │
  ├──────────┼─────────────────────────────────────────────┤
  │ v12.0.0  │ 🎉 Next.js Compiler ra mắt!                │
  │ v12.1.0  │ + Styled Components, Jest, Relay,           │
  │          │   Remove Props, Decorators, Console         │
  │ v12.2.0  │ + SWC Plugins (experimental)                │
  │ v12.3.0  │ ✅ SWC Minifier STABLE                      │
  │ v13.0.0  │ ✅ SWC Minifier MẶC ĐỊNH                    │
  │ v13.1.0  │ ✅ Module Transpilation STABLE               │
  │ v15.0.0  │ ❌ Xóa swcMinify flag (luôn bật!)          │
  └──────────┴─────────────────────────────────────────────┘
```

---

## §8. Tổng Kết & Câu Hỏi Phỏng Vấn!

```
  TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │  Next.js Compiler = SWC (Rust) thay Babel + Terser    │
  │  17x nhanh hơn Babel, 7x nhanh hơn Terser            │
  │  Mặc định từ v12+, có .babelrc → fallback Babel      │
  │  Config qua next.config.js: compiler: { ... }         │
  │  Hỗ trợ: styled-components, emotion, jest, relay      │
  │  Transforms: removeConsole, removeProperties, define  │
  │  Experimental: swcTraceProfiling, swcPlugins (WASM)   │
  └────────────────────────────────────────────────────────┘
```

**❓ Q1: Next.js Compiler là gì? Tại sao dùng SWC?**

> Next.js Compiler là bộ biên dịch viết bằng **Rust** sử dụng **SWC** (Speedy Web Compiler), thay thế **Babel** (transform) và **Terser** (minify). Nhanh hơn 17x vì Rust compile sang machine code trực tiếp, không có GC overhead, multi-threaded. Mặc định từ v12+!

**❓ Q2: Khi nào Next.js fallback về Babel?**

> Khi project có file `.babelrc` hoặc `babel.config.js` → Next.js tự động dùng Babel thay SWC. Điều này **mất 17x performance boost**! Nên migrate Babel plugins sang SWC options (styledComponents, emotion, relay...) trong `next.config.js` khi có thể.

**❓ Q3: removeConsole và reactRemoveProperties dùng khi nào?**

> `removeConsole: true` xóa tất cả `console.*` trong production (giảm bundle size, không lộ debug info). Có thể `exclude: ['error']` giữ lại error logging. `reactRemoveProperties: true` xóa `data-test*` attributes (không cần test selectors trong production). Cả hai chỉ áp dụng cho app code, KHÔNG ảnh hưởng node_modules.

**❓ Q4: define vs defineServer khác gì?**

> `define` thay thế biến cho **tất cả** environments (server + edge + client). `defineServer` chỉ thay cho **server-side** (server + edge) → dùng cho secrets, DB config không muốn lộ ra client. Dead code elimination tự xóa `if (false) {...}` sau khi define.

**❓ Q5: SWC Plugin hoạt động thế nào?**

> SWC Plugins là **WASM binaries** (viết bằng Rust, compile sang WebAssembly). Config trong `experimental.swcPlugins` dạng array of tuples `[pluginPath, options]`. Plugin path có thể là npm package hoặc absolute path tới file `.wasm`. Khác Babel plugins (JavaScript) → SWC plugins chạy trong WASM sandbox, nhanh hơn nhiều!

---

## §9. Tự Viết — AST Parser (Cách SWC Parse Code)!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleAST Parser
// Mô phỏng cách SWC/Babel parse code thành AST!
// ═══════════════════════════════════════════════════════════
//
// AST = Abstract Syntax Tree = CÂY CÚ PHÁP TRỪU TƯỢNG
// Mọi compiler đều PHẢI parse code → AST trước khi transform!

var SimpleAST = (function () {
  // ① Parse variable declaration: const x = 5;
  function parseVariableDeclaration(tokens, pos) {
    // keyword(const/let/var) identifier(name) punct(=) value punct(;)
    var kind = tokens[pos].value; // 'const', 'let', 'var'
    pos++;

    // Bỏ whitespace:
    while (pos < tokens.length && tokens[pos].type === "whitespace") pos++;

    var name = tokens[pos].value; // identifier
    pos++;

    while (pos < tokens.length && tokens[pos].type === "whitespace") pos++;
    pos++; // bỏ '='
    while (pos < tokens.length && tokens[pos].type === "whitespace") pos++;

    var value = tokens[pos]; // giá trị
    pos++;

    while (pos < tokens.length && tokens[pos].type === "whitespace") pos++;
    if (pos < tokens.length && tokens[pos].value === ";") pos++; // bỏ ';'

    return {
      node: {
        type: "VariableDeclaration",
        kind: kind, // 'const' | 'let' | 'var'
        declarations: [
          {
            type: "VariableDeclarator",
            id: { type: "Identifier", name: name },
            init: {
              type:
                value.type === "number" ? "NumericLiteral" : "StringLiteral",
              value:
                value.type === "number" ? Number(value.value) : value.value,
            },
          },
        ],
      },
      nextPos: pos,
    };
  }

  // ② Parse function declaration: function foo(a, b) { return a + b; }
  function parseFunctionDeclaration(tokens, pos) {
    pos++; // bỏ 'function'
    while (pos < tokens.length && tokens[pos].type === "whitespace") pos++;

    var name = tokens[pos].value;
    pos++;

    // Parse params: ( a, b )
    while (pos < tokens.length && tokens[pos].value !== "(") pos++;
    pos++; // bỏ '('
    var params = [];
    while (pos < tokens.length && tokens[pos].value !== ")") {
      if (tokens[pos].type === "identifier") {
        params.push({ type: "Identifier", name: tokens[pos].value });
      }
      pos++;
    }
    pos++; // bỏ ')'

    // Parse body (simplified): lấy tất cả tokens giữa { }
    while (pos < tokens.length && tokens[pos].value !== "{") pos++;
    pos++; // bỏ '{'
    var bodyTokens = [];
    var braceCount = 1;
    while (pos < tokens.length && braceCount > 0) {
      if (tokens[pos].value === "{") braceCount++;
      if (tokens[pos].value === "}") braceCount--;
      if (braceCount > 0) bodyTokens.push(tokens[pos]);
      pos++;
    }

    return {
      node: {
        type: "FunctionDeclaration",
        id: { type: "Identifier", name: name },
        params: params,
        body: { type: "BlockStatement", body: bodyTokens },
      },
      nextPos: pos,
    };
  }

  // ③ Main parser — tạo AST Program:
  function parse(code) {
    var tokens = SimpleCodeTransformer.tokenize(code);
    var body = [];
    var pos = 0;

    while (pos < tokens.length) {
      var token = tokens[pos];

      // Bỏ whitespace:
      if (token.type === "whitespace") {
        pos++;
        continue;
      }

      // Variable: const/let/var
      if (
        token.type === "keyword" &&
        (token.value === "const" ||
          token.value === "let" ||
          token.value === "var")
      ) {
        var result = parseVariableDeclaration(tokens, pos);
        body.push(result.node);
        pos = result.nextPos;
        continue;
      }

      // Function:
      if (token.type === "keyword" && token.value === "function") {
        var result = parseFunctionDeclaration(tokens, pos);
        body.push(result.node);
        pos = result.nextPos;
        continue;
      }

      pos++; // skip unknown tokens
    }

    return {
      type: "Program",
      body: body,
    };
  }

  // ④ AST → Code generator (ngược lại parse):
  function generate(ast) {
    var output = "";
    for (var i = 0; i < ast.body.length; i++) {
      var node = ast.body[i];

      if (node.type === "VariableDeclaration") {
        var decl = node.declarations[0];
        var val =
          decl.init.type === "NumericLiteral"
            ? decl.init.value
            : decl.init.value;
        output += node.kind + " " + decl.id.name + " = " + val + ";\n";
      }

      if (node.type === "FunctionDeclaration") {
        var paramNames = node.params.map(function (p) {
          return p.name;
        });
        output +=
          "function " +
          node.id.name +
          "(" +
          paramNames.join(", ") +
          ") { ... }\n";
      }
    }
    return output;
  }

  // ⑤ AST Visitor — duyệt + transform (giống Babel visitor!):
  function traverse(ast, visitor) {
    function visit(node) {
      if (!node || typeof node !== "object") return;
      // Gọi visitor cho node type:
      if (visitor[node.type]) visitor[node.type](node);
      // Duyệt children:
      for (var key in node) {
        var child = node[key];
        if (Array.isArray(child)) {
          child.forEach(function (c) {
            visit(c);
          });
        } else if (child && typeof child === "object" && child.type) {
          visit(child);
        }
      }
    }
    visit(ast);
  }

  return { parse: parse, generate: generate, traverse: traverse };
})();

// ═══════════════════════════════════════════════════════════
// SỬ DỤNG:
// ═══════════════════════════════════════════════════════════

var code = "const count = 42;";
var ast = SimpleAST.parse(code);
// → {
//     type: 'Program',
//     body: [{
//       type: 'VariableDeclaration',
//       kind: 'const',
//       declarations: [{
//         type: 'VariableDeclarator',
//         id: { type: 'Identifier', name: 'count' },
//         init: { type: 'NumericLiteral', value: 42 }
//       }]
//     }]
//   }

// TRANSFORM BẰNG VISITOR (đổi const → var):
SimpleAST.traverse(ast, {
  VariableDeclaration: function (node) {
    if (node.kind === "const") node.kind = "var"; // ← MUTATE!
  },
});
var output = SimpleAST.generate(ast);
// → "var count = 42;"  (const → var!)
```

```
  AST PIPELINE — SWC INTERNAL:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  "const x = 5;"                                        │
  │      │                                                 │
  │      ▼  ① LEXER/TOKENIZER                             │
  │  [keyword:const] [ident:x] [punct:=] [num:5] [punct:;]│
  │      │                                                 │
  │      ▼  ② PARSER                                      │
  │  Program                                               │
  │  └── VariableDeclaration (kind: "const")              │
  │      └── VariableDeclarator                           │
  │          ├── id: Identifier (name: "x")               │
  │          └── init: NumericLiteral (value: 5)          │
  │      │                                                 │
  │      ▼  ③ TRANSFORM (visitor pattern)                 │
  │  Program                                               │
  │  └── VariableDeclaration (kind: "var") ← ĐÃ ĐỔI!    │
  │      └── VariableDeclarator                           │
  │          ├── id: Identifier (name: "x")               │
  │          └── init: NumericLiteral (value: 5)          │
  │      │                                                 │
  │      ▼  ④ CODE GENERATOR                              │
  │  "var x = 5;"                                          │
  │                                                        │
  │  ⚡ SWC khác Babel:                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Babel: Clone AST → tạo AST mới → generate     │  │
  │  │  SWC:  In-place mutation → KHÔNG clone!         │  │
  │  │  → Tiết kiệm memory + nhanh hơn nhiều!         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §10. Turbopack vs Webpack — Next.js Bundler!

```
  TURBOPACK vs WEBPACK — SO SÁNH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─────────────┬──────────────┬──────────────────────┐ │
  │  │             │ WEBPACK      │ TURBOPACK            │ │
  │  ├─────────────┼──────────────┼──────────────────────┤ │
  │  │ Ngôn ngữ   │ JavaScript   │ Rust                 │ │
  │  │ Tốc độ HMR │ 1x baseline  │ 10x nhanh hơn!      │ │
  │  │ Cold Start │ 1x baseline  │ ~4x nhanh hơn       │ │
  │  │ Caching    │ Disk-based   │ Incremental (memory) │ │
  │  │ Loại       │ Bundler      │ Bundler (incremental)│ │
  │  ├─────────────┼──────────────┼──────────────────────┤ │
  │  │ Compiler   │ Babel/SWC    │ SWC (built-in)       │ │
  │  │ Minifier   │ Terser/SWC   │ SWC (built-in)       │ │
  │  │ Stability  │ ✅ Stable    │ ⚠️ Dev mode only     │ │
  │  │ Production │ ✅           │ ❌ chưa hỗ trợ      │ │
  │  └─────────────┴──────────────┴──────────────────────┘ │
  │                                                        │
  │  SWC vs TURBOPACK — KHÁC NHAU:                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  SWC = COMPILER (transform từng FILE)           │  │
  │  │  → JSX→JS, TS→JS, minify                       │  │
  │  │                                                  │  │
  │  │  Turbopack = BUNDLER (đóng gói NHIỀU files)     │  │
  │  │  → Resolve imports, tree-shake, code-split      │  │
  │  │  → Dùng SWC bên trong để transform!             │  │
  │  │                                                  │  │
  │  │  Tương tự:                                      │  │
  │  │  Babel = Compiler  ←→  SWC = Compiler           │  │
  │  │  Webpack = Bundler ←→  Turbopack = Bundler      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  INCREMENTAL COMPUTATION (tại sao Turbopack nhanh):   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Webpack: sửa 1 file → rebuild TOÀN BỘ graph!  │  │
  │  │                                                  │  │
  │  │  Turbopack: sửa 1 file → CHỈ rebuild file đó!  │  │
  │  │  ┌─────────────────────────────────────────┐    │  │
  │  │  │  File A ──→ Module A ✅ (cached)        │    │  │
  │  │  │  File B ──→ Module B ✅ (cached)        │    │  │
  │  │  │  File C ──→ Module C � (SỬA→rebuild!) │    │  │
  │  │  │  File D ──→ Module D ✅ (cached)        │    │  │
  │  │  │                                         │    │  │
  │  │  │  → Chỉ re-compile Module C!             │    │  │
  │  │  │  → Các module khác lấy từ CACHE!        │    │  │
  │  │  └─────────────────────────────────────────┘    │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// Bật Turbopack trong Next.js:
// Terminal:
// next dev --turbopack

// Hoặc trong package.json:
// "scripts": { "dev": "next dev --turbopack" }

// ⚠️ Turbopack chỉ hỗ trợ DEV MODE (2026)!
// Production build vẫn dùng Webpack!
```

---

## §11. optimizePackageImports & Tree-Shaking!

```javascript
// ═══════════════════════════════════════════════════════════
// optimizePackageImports — Tối Ưu Import!
// ═══════════════════════════════════════════════════════════
//
// VẤN ĐỀ: Barrel files (index.js export tất cả)
// → Import 1 component → LOAD TOÀN BỘ library!

// ❌ TRƯỚC — barrel file problem:
// import { Button } from '@mui/material';
// → Webpack phải load @mui/material/index.js
// → index.js export 100+ components
// → Bundle chứa TẤT CẢ dù chỉ dùng Button!

// ✅ SAU — optimizePackageImports:
// Next.js TỰ ĐỘNG transform:
// import { Button } from '@mui/material';
// → import Button from '@mui/material/Button';
// → Chỉ load Button, KHÔNG load 99 components khác!

// next.config.js:
module.exports = {
  experimental: {
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "lodash",
      "date-fns",
      "rxjs",
      "@heroicons/react",
      "@headlessui/react",
      "lucide-react",
    ],
  },
};

// ⚠️ Từ Next.js 13.5: nhiều packages ĐÃ optimize mặc định!
// Chỉ cần thêm packages CHƯA có trong default list.
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleTreeShaker
// Mô phỏng cách SWC/Webpack tree-shake dead code!
// ═══════════════════════════════════════════════════════════

var SimpleTreeShaker = (function () {
  // ① Phân tích exports từ module:
  function analyzeExports(moduleCode) {
    var exports = {};
    // Named exports: export const X = ...
    var namedRegex = /export\s+(const|let|var|function|class)\s+(\w+)/g;
    var match;
    while ((match = namedRegex.exec(moduleCode)) !== null) {
      exports[match[2]] = { type: match[1], used: false };
    }
    // Default export:
    if (/export\s+default/.test(moduleCode)) {
      exports["default"] = { type: "default", used: false };
    }
    return exports;
  }

  // ② Phân tích imports (cái gì ĐƯỢC DÙNG):
  function analyzeImports(consumerCode) {
    var used = [];
    // import { A, B } from '...'
    var importRegex = /import\s*\{([^}]+)\}\s*from/g;
    var match;
    while ((match = importRegex.exec(consumerCode)) !== null) {
      var names = match[1].split(",").map(function (n) {
        return n.trim().split(/\s+as\s+/)[0]; // handle aliasing
      });
      used = used.concat(names);
    }
    // import Default from '...'
    var defaultRegex = /import\s+(\w+)\s+from/g;
    while ((match = defaultRegex.exec(consumerCode)) !== null) {
      if (match[1] !== "{") used.push("default");
    }
    return used;
  }

  // ③ Tree-shake — xóa exports KHÔNG DÙNG:
  function shake(moduleCode, consumerCode) {
    var allExports = analyzeExports(moduleCode);
    var usedImports = analyzeImports(consumerCode);

    // Đánh dấu exports được dùng:
    usedImports.forEach(function (name) {
      if (allExports[name]) allExports[name].used = true;
    });

    // Xóa exports KHÔNG được dùng:
    var result = moduleCode;
    for (var name in allExports) {
      if (!allExports[name].used && name !== "default") {
        // Xóa export statement:
        var removeRegex = new RegExp(
          "export\\s+(const|let|var)\\s+" + name + "\\s*=[^;]*;",
          "g",
        );
        result = result.replace(removeRegex, "/* TREE-SHAKED: " + name + " */");
      }
    }

    return {
      code: result,
      kept: Object.keys(allExports).filter(function (k) {
        return allExports[k].used;
      }),
      removed: Object.keys(allExports).filter(function (k) {
        return !allExports[k].used;
      }),
    };
  }

  return {
    analyzeExports: analyzeExports,
    analyzeImports: analyzeImports,
    shake: shake,
  };
})();

// SỬ DỤNG:
var libraryCode = `
  export const Button = "ButtonComponent";
  export const Modal = "ModalComponent";
  export const Tooltip = "TooltipComponent";
  export const Drawer = "DrawerComponent";
`;
var appCode = `import { Button, Modal } from './library';`;

var result = SimpleTreeShaker.shake(libraryCode, appCode);
// → kept: ['Button', 'Modal']
// → removed: ['Tooltip', 'Drawer']
// → Tooltip + Drawer bị XÓA khỏi bundle!
```

```
  TREE-SHAKING FLOW:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Library (barrel file):                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  export { Button }    ← DÙNG ✅                 │  │
  │  │  export { Modal }     ← DÙNG ✅                 │  │
  │  │  export { Tooltip }   ← KHÔNG DÙNG ❌ → XÓA!   │  │
  │  │  export { Drawer }    ← KHÔNG DÙNG ❌ → XÓA!   │  │
  │  │  export { Popover }   ← KHÔNG DÙNG ❌ → XÓA!   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  App:                                                  │
  │  import { Button, Modal } from './library';            │
  │                                                        │
  │  Bundle TRƯỚC tree-shaking:                            │
  │  ████████████████████████████████████ 100kb             │
  │                                                        │
  │  Bundle SAU tree-shaking:                              │
  │  ██████████████ 40kb ← giảm 60%!                      │
  │                                                        │
  │  ⚠️ ĐIỀU KIỆN để tree-shake hoạt động:                │
  │  ① Phải dùng ES Modules (import/export)               │
  │  ② KHÔNG dùng CommonJS (require/module.exports)       │
  │  ③ Package phải có "sideEffects": false trong         │
  │     package.json                                       │
  │  ④ KHÔNG có side effects trong module scope           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §12. Source Maps — Debug Production!

```
  SOURCE MAP — TẠI SAO CẦN?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Code gốc (readable):                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  function calculateTotal(price, tax) {           │  │
  │  │    const subtotal = price * (1 + tax);           │  │
  │  │    return Math.round(subtotal * 100) / 100;      │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  Code production (minified — KHÔNG ĐỌC ĐƯỢC!):       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  function a(b,c){var d=b*(1+c);return            │  │
  │  │  Math.round(d*100)/100}                          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  Source Map = BẢN ĐỒ ánh xạ:                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  a (minified) → calculateTotal (original)       │  │
  │  │  b → price                                      │  │
  │  │  c → tax                                        │  │
  │  │  d → subtotal                                   │  │
  │  │  line 1, col 15 → line 1, col 25               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  → DevTools hiện code GỐC khi debug!                   │
  │  → Error stack traces hiện ĐÚNG file + line!          │
  │  → Sentry/error tracking map về source!               │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleSourceMap
// Mô phỏng cách SWC tạo source maps!
// ═══════════════════════════════════════════════════════════

var SimpleSourceMap = (function () {
  // ① Tạo mapping giữa original → minified:
  function createMapping(originalCode, minifiedCode, variableMap) {
    var mappings = [];
    // Map variable names:
    for (var original in variableMap) {
      var minified = variableMap[original];
      mappings.push({
        original: original,
        generated: minified,
        type: "variable",
      });
    }
    // Map line numbers (simplified):
    var origLines = originalCode.split("\n");
    var genLines = minifiedCode.split("\n");
    for (var i = 0; i < Math.min(origLines.length, genLines.length); i++) {
      mappings.push({
        originalLine: i + 1,
        generatedLine: Math.min(i + 1, genLines.length),
        type: "line",
      });
    }
    return mappings;
  }

  // ② Tạo source map object (V3 format):
  function generate(options) {
    return {
      version: 3,
      file: options.outputFile || "bundle.min.js",
      sources: [options.sourceFile || "source.js"],
      sourcesContent: [options.originalCode],
      mappings: createMapping(
        options.originalCode,
        options.minifiedCode,
        options.variableMap || {},
      ),
      // Thêm comment vào cuối minified file:
      comment:
        "//# sourceMappingURL=" +
        (options.outputFile || "bundle.min.js") +
        ".map",
    };
  }

  // ③ Lookup: từ minified position → original position:
  function lookup(sourceMap, generatedLine, generatedCol) {
    var lineMappings = sourceMap.mappings.filter(function (m) {
      return m.type === "line" && m.generatedLine === generatedLine;
    });
    if (lineMappings.length > 0) {
      return {
        originalFile: sourceMap.sources[0],
        originalLine: lineMappings[0].originalLine,
        message:
          "Line " +
          generatedLine +
          " (minified) → Line " +
          lineMappings[0].originalLine +
          " (original)",
      };
    }
    return null;
  }

  return { generate: generate, lookup: lookup };
})();

// SỬ DỤNG:
var sourceMap = SimpleSourceMap.generate({
  sourceFile: "utils.js",
  outputFile: "utils.min.js",
  originalCode: "function calculateTotal(price, tax) { ... }",
  minifiedCode: "function a(b,c){...}",
  variableMap: {
    calculateTotal: "a",
    price: "b",
    tax: "c",
  },
});
// → Error tại line 1 minified → tra ra line 1 original!
// → Sentry hiện: "Error in calculateTotal (utils.js:1)"
//    thay vì: "Error in a (utils.min.js:1)"
```

---

**❓ Q6: Turbopack khác SWC thế nào?**

> **SWC** = Compiler (transform từng file: JSX→JS, TS→JS, minify). **Turbopack** = Bundler (đóng gói nhiều files: resolve imports, tree-shake, code-split). Turbopack dùng SWC bên trong để compile. Tương tự: Babel↔SWC (compiler), Webpack↔Turbopack (bundler). Turbopack nhanh hơn nhờ **incremental computation** — chỉ rebuild file thay đổi, không rebuild toàn bộ graph!

**❓ Q7: optimizePackageImports giải quyết vấn đề gì?**

> Giải quyết **barrel file problem**: khi `import { Button } from '@mui/material'`, Webpack phải load toàn bộ index.js chứa 100+ exports. `optimizePackageImports` tự động transform thành `import Button from '@mui/material/Button'` → chỉ load đúng component cần dùng. Từ Next.js 13.5, nhiều packages phổ biến đã được optimize mặc định!

**❓ Q8: Tree-shaking cần điều kiện gì?**

> ① Phải dùng **ES Modules** (`import`/`export`), KHÔNG dùng CommonJS (`require`). ② Package phải khai báo `"sideEffects": false` trong `package.json`. ③ Module scope KHÔNG có side effects (console.log, DOM manipulation...). ④ SWC/Webpack phân tích dependency graph → xóa exports không ai import → giảm bundle size đáng kể!

**❓ Q9: Source Map dùng để làm gì?**

> Source Map = bản đồ ánh xạ từ **minified code** về **original code**. Khi error xảy ra ở `a(b,c)` line 1 → source map tra ra `calculateTotal(price, tax)` line 15. Dùng cho: DevTools debug production, Sentry/error tracking hiện đúng file + line + tên biến gốc. SWC tạo source maps **cùng lúc** khi compile → nhanh hơn tạo riêng!

---

## §13. CSS-in-JS SSR — Styled-Components Trên Server!

```
  CSS-IN-JS SSR — VẤN ĐỀ FOUC:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ❌ KHÔNG CÓ SSR:                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Server gửi HTML (KHÔNG có styles!)             │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  Browser hiện HTML TRẮNG (no CSS!) ← FOUC!     │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  JS load → styled-components chạy              │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  Inject <style> vào DOM → hiện CSS!             │  │
  │  │  (User thấy "nhấp nháy" = FOUC!)               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ✅ CÓ SSR (SWC compiler hỗ trợ):                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Server render component                        │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  Thu thập TẤT CẢ CSS từ styled-components      │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  Inject <style> VÀO HTML (trong <head>)         │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  Browser nhận HTML + CSS ĐÃ CÓ SẴN!           │  │
  │  │  → Hiện đúng ngay! KHÔNG nhấp nháy!            │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleSSRStyleCollector
// Mô phỏng cách styled-components thu thập CSS trên server!
// ═══════════════════════════════════════════════════════════

var SimpleSSRStyleCollector = (function () {
  // ① Style sheet registry (lưu tất cả CSS trên server):
  var styleSheet = [];
  var classCounter = 0;

  // ② Tạo hash class name (giống styled-components):
  function generateClassName(componentName) {
    classCounter++;
    var hash = componentName + "-" + classCounter.toString(36);
    return "sc-" + hash; // sc = styled-component
  }

  // ③ Đăng ký style (khi component render trên server):
  function registerStyle(componentName, cssRules) {
    var className = generateClassName(componentName);
    styleSheet.push({
      className: className,
      css: "." + className + " { " + cssRules + " }",
      componentName: componentName,
    });
    return className;
  }

  // ④ Thu thập TẤT CẢ CSS → inject vào HTML:
  function getStyleTags() {
    if (styleSheet.length === 0) return "";
    var css = styleSheet
      .map(function (s) {
        return s.css;
      })
      .join("\n");
    return '<style data-styled="active">\n' + css + "\n</style>";
  }

  // ⑤ Tạo HTML hoàn chỉnh (server-side):
  function renderToHTML(componentHTML) {
    var styleTags = getStyleTags();
    return (
      "<!DOCTYPE html>\n<html>\n<head>\n" +
      styleTags +
      "\n</head>\n<body>\n" +
      componentHTML +
      "\n</body>\n</html>"
    );
  }

  // ⑥ Reset (giữa các requests):
  function reset() {
    styleSheet = [];
    classCounter = 0;
  }

  return {
    registerStyle: registerStyle,
    getStyleTags: getStyleTags,
    renderToHTML: renderToHTML,
    reset: reset,
  };
})();

// SỬ DỤNG:
SimpleSSRStyleCollector.reset();

// Component "Button" render trên server:
var btnClass = SimpleSSRStyleCollector.registerStyle(
  "Button",
  "color: white; background: blue; padding: 8px 16px;",
);
// Component "Card" render trên server:
var cardClass = SimpleSSRStyleCollector.registerStyle(
  "Card",
  "border: 1px solid #ddd; border-radius: 8px;",
);

var html = SimpleSSRStyleCollector.renderToHTML(
  '<button class="' +
    btnClass +
    '">Click</button>' +
    '<div class="' +
    cardClass +
    '">Content</div>',
);
// → HTML chứa <style> TRONG <head>!
// → Browser hiện đúng ngay, KHÔNG FOUC!

// ⚠️ SWC compiler option: styledComponents.ssr = true
// → Tự động làm việc này cho bạn!
```

---

## §14. Fast Refresh (HMR) — SWC Tăng Tốc!

```
  FAST REFRESH — CƠ CHẾ HOẠT ĐỘNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  HMR = Hot Module Replacement                          │
  │  Fast Refresh = HMR cho React (giữ state!)            │
  │                                                        │
  │  Flow:                                                 │
  │  ① Dev sửa file → Save                                │
  │      │                                                 │
  │      ▼                                                 │
  │  ② File System watcher phát hiện thay đổi             │
  │      │                                                 │
  │      ▼                                                 │
  │  ③ SWC compile LẠI file đã sửa (CỰC NHANH!)         │
  │     (Chỉ file đó, KHÔNG compile lại toàn bộ!)        │
  │      │                                                 │
  │      ▼                                                 │
  │  ④ WebSocket gửi module mới → Browser                 │
  │      │                                                 │
  │      ▼                                                 │
  │  ⑤ React Fast Refresh runtime:                        │
  │     ┌──────────────────────────────────────────────┐   │
  │     │  Module mới có REACT COMPONENTS?             │   │
  │     │  ├── CÓ → Re-render components (GIỮ STATE!) │   │
  │     │  └── KHÔNG → Full page reload               │   │
  │     └──────────────────────────────────────────────┘   │
  │      │                                                 │
  │      ▼                                                 │
  │  ⑥ UI cập nhật NGAY (< 200ms!) ← GIỮ NGUYÊN STATE! │
  │                                                        │
  │  ⚠️ Khi nào KHÔNG giữ state:                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  • File KHÔNG chứa React component              │  │
  │  │  • Export không phải component (class, object)   │  │
  │  │  • Lỗi syntax → full reload                     │  │
  │  │  • File nằm ngoài src/ directory                 │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  TỐC ĐỘ SO SÁNH:                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Babel HMR:  ████████████████ ~2000ms            │  │
  │  │  SWC HMR:    █████ ~600ms  ← 3x NHANH HƠN!     │  │
  │  │                                                  │  │
  │  │  Tại sao? SWC compile single file:              │  │
  │  │  Babel: ~200ms/file (JS, single-thread)         │  │
  │  │  SWC:  ~12ms/file  (Rust, multi-thread!)        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleHMRClient
// Mô phỏng cách Fast Refresh hoạt động!
// ═══════════════════════════════════════════════════════════

var SimpleHMRClient = (function () {
  // ① Module registry (lưu tất cả modules hiện tại):
  var modules = {};
  var listeners = [];

  // ② Đăng ký module:
  function registerModule(id, factory) {
    modules[id] = {
      id: id,
      factory: factory,
      exports: {},
      hot: {
        accept: function (callback) {
          // Đăng ký callback khi module được update:
          listeners.push({ id: id, callback: callback });
        },
      },
    };
    // Chạy factory lần đầu:
    factory(modules[id].exports, modules[id].hot);
  }

  // ③ Kiểm tra module có phải React component không:
  function isReactComponent(moduleExports) {
    for (var key in moduleExports) {
      var exp = moduleExports[key];
      // React component = function bắt đầu bằng chữ HOA:
      if (typeof exp === "function" && /^[A-Z]/.test(exp.name)) {
        return true;
      }
    }
    return false;
  }

  // ④ Nhận module update từ server (qua WebSocket):
  function applyUpdate(moduleId, newFactory) {
    var oldModule = modules[moduleId];
    if (!oldModule) {
      console.warn("[HMR] Module not found: " + moduleId);
      return { type: "full-reload" };
    }

    // Chạy factory MỚI:
    var newExports = {};
    newFactory(newExports, oldModule.hot);

    // Kiểm tra có phải React component không:
    if (isReactComponent(newExports)) {
      // ✅ Fast Refresh — chỉ re-render, GIỮ STATE!
      modules[moduleId].exports = newExports;
      modules[moduleId].factory = newFactory;

      // Gọi accept callbacks:
      listeners.forEach(function (l) {
        if (l.id === moduleId && l.callback) l.callback();
      });

      return {
        type: "fast-refresh",
        message: "Component updated, state preserved!",
      };
    } else {
      // ❌ Không phải component → full reload:
      return {
        type: "full-reload",
        message: "Non-component module changed, reloading...",
      };
    }
  }

  return {
    registerModule: registerModule,
    applyUpdate: applyUpdate,
    getModules: function () {
      return modules;
    },
  };
})();

// SỬ DỤNG:
SimpleHMRClient.registerModule("./Button.jsx", function (exports, hot) {
  exports.Button = function Button(props) {
    return "<button>" + props.label + "</button>";
  };
  hot.accept(); // Đăng ký nhận updates
});

// Dev sửa Button.jsx → server gửi module mới:
var result = SimpleHMRClient.applyUpdate(
  "./Button.jsx",
  function (exports, hot) {
    exports.Button = function Button(props) {
      return '<button class="new-style">' + props.label + "</button>";
    };
    hot.accept();
  },
);
// → { type: 'fast-refresh', message: 'Component updated, state preserved!' }
// → Button re-render với style mới, STATE GIỮ NGUYÊN!
```

---

## §15. Code Splitting & Dynamic Imports!

```
  CODE SPLITTING — TẠI SAO CẦN?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ❌ KHÔNG code splitting:                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  1 file bundle.js = 2MB (TẤT CẢ code!)         │  │
  │  │  User vào trang Home → tải 2MB                  │  │
  │  │  (dù chỉ cần 200kb cho Home!)                   │  │
  │  │  → Chậm! Time to Interactive (TTI) cao!         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ✅ CÓ code splitting:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  home.js    = 200kb ← tải ngay                  │  │
  │  │  about.js   = 150kb ← tải khi cần               │  │
  │  │  admin.js   = 500kb ← tải khi vào /admin        │  │
  │  │  chart.js   = 300kb ← tải khi hiện chart        │  │
  │  │                                                  │  │
  │  │  User vào Home → chỉ tải 200kb!                 │  │
  │  │  → Nhanh! TTI thấp hơn nhiều!                   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  NEXT.JS CODE SPLITTING TỰ ĐỘNG:                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① Route-based: mỗi page = 1 chunk riêng       │  │
  │  │  ② Component-based: next/dynamic lazy load      │  │
  │  │  ③ Shared chunks: common code tách riêng        │  │
  │  │                                                  │  │
  │  │  pages/index.js   → chunks/pages/index.js       │  │
  │  │  pages/about.js   → chunks/pages/about.js       │  │
  │  │  shared (React..) → chunks/commons.js           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleCodeSplitter
// Mô phỏng cách Next.js/Webpack code-split!
// ═══════════════════════════════════════════════════════════

var SimpleCodeSplitter = (function () {
  // ① Chunk registry (lưu các chunks đã tải):
  var loadedChunks = {};
  var chunkPromises = {};

  // ② Giả lập dynamic import (tải chunk async):
  function loadChunk(chunkId, factory) {
    if (loadedChunks[chunkId]) {
      // Đã tải rồi → trả về cache:
      return Promise.resolve(loadedChunks[chunkId]);
    }
    if (chunkPromises[chunkId]) {
      // Đang tải → trả về promise đang chờ:
      return chunkPromises[chunkId];
    }

    // Giả lập network delay:
    chunkPromises[chunkId] = new Promise(function (resolve) {
      console.log("[CodeSplit] Loading chunk: " + chunkId + "...");
      setTimeout(function () {
        // Chạy factory → lấy exports:
        var exports = {};
        factory(exports);
        loadedChunks[chunkId] = exports;
        delete chunkPromises[chunkId];
        console.log("[CodeSplit] Chunk loaded: " + chunkId + " ✅");
        resolve(exports);
      }, 100); // Giả lập 100ms network
    });

    return chunkPromises[chunkId];
  }

  // ③ Dynamic import (giống next/dynamic):
  function dynamic(loader, options) {
    options = options || {};
    var loadingMessage = options.loading || "Loading...";
    var loaded = null;

    return {
      // Render placeholder trước khi chunk tải xong:
      renderPlaceholder: function () {
        return '<div class="dynamic-loading">' + loadingMessage + "</div>";
      },
      // Load + render component:
      load: function () {
        return loader().then(function (mod) {
          loaded = mod.default || mod;
          return loaded;
        });
      },
      isLoaded: function () {
        return loaded !== null;
      },
    };
  }

  // ④ Phân tích dependency graph → tạo chunks:
  function createChunks(modules) {
    var chunks = {};
    var shared = { id: "shared", modules: [] };

    // Đếm module được import bao nhiêu lần:
    var importCount = {};
    for (var route in modules) {
      var deps = modules[route].dependencies || [];
      deps.forEach(function (dep) {
        importCount[dep] = (importCount[dep] || 0) + 1;
      });
    }

    // Module import >= 2 lần → shared chunk:
    for (var dep in importCount) {
      if (importCount[dep] >= 2) shared.modules.push(dep);
    }
    chunks["shared"] = shared;

    // Mỗi route = 1 chunk riêng:
    for (var route in modules) {
      var routeDeps = (modules[route].dependencies || []).filter(function (d) {
        return shared.modules.indexOf(d) === -1;
      });
      chunks[route] = {
        id: route,
        modules: [route].concat(routeDeps),
      };
    }

    return chunks;
  }

  return { loadChunk: loadChunk, dynamic: dynamic, createChunks: createChunks };
})();

// SỬ DỤNG:
// Phân tích chunks:
var chunks = SimpleCodeSplitter.createChunks({
  "/home": { dependencies: ["react", "utils", "Header"] },
  "/about": { dependencies: ["react", "utils", "Markdown"] },
  "/admin": { dependencies: ["react", "AdminPanel", "Charts"] },
});
// → chunks:
//   shared: ['react', 'utils']  (dùng chung 2+ routes)
//   /home:  ['/home', 'Header']
//   /about: ['/about', 'Markdown']
//   /admin: ['/admin', 'AdminPanel', 'Charts']

// Dynamic import (lazy load):
var DynamicChart = SimpleCodeSplitter.dynamic(
  function () {
    return SimpleCodeSplitter.loadChunk("chart-lib", function (exp) {
      exp.default = function Chart(data) {
        return "<canvas>Chart</canvas>";
      };
    });
  },
  { loading: "Đang tải biểu đồ..." },
);
// → Ban đầu hiện: "Đang tải biểu đồ..."
// → Sau 100ms: hiện <canvas>Chart</canvas>
```

---

## §16. TypeScript Compilation — SWC vs TSC!

```
  SWC vs TSC — XỬ LÝ TYPESCRIPT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ⚡ SWC (Next.js Compiler):                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  STRIP TYPES — chỉ XÓA types, KHÔNG CHECK!     │  │
  │  │                                                  │  │
  │  │  Input:  const x: number = 5;                   │  │
  │  │  Output: const x = 5;                           │  │
  │  │                                                  │  │
  │  │  Input:  interface User { name: string; }       │  │
  │  │  Output: (XÓA HOÀN TOÀN — chỉ là type!)        │  │
  │  │                                                  │  │
  │  │  Input:  function greet(name: string): void {}  │  │
  │  │  Output: function greet(name) {}                │  │
  │  │                                                  │  │
  │  │  Tốc độ: ~12ms/file (CỰC NHANH!)               │  │
  │  │  ❌ KHÔNG type-check (không báo lỗi type!)     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  🐢 TSC (TypeScript Compiler):                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  FULL TYPE-CHECK — kiểm tra types + generate!   │  │
  │  │                                                  │  │
  │  │  ① Parse → AST                                  │  │
  │  │  ② Symbol Resolution (tìm type definitions)     │  │
  │  │  ③ Type Checking (kiểm tra assign, params...)   │  │
  │  │  ④ Emit (generate JS output)                    │  │
  │  │                                                  │  │
  │  │  Tốc độ: ~200ms/file (CHẬM — phải check!)      │  │
  │  │  ✅ Báo lỗi type compile-time!                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  NEXT.JS STRATEGY:                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  BUILD:    SWC strip types → NHANH!             │  │
  │  │  PARALLEL: TSC type-check → chạy SONG SONG!    │  │
  │  │                                                  │  │
  │  │  Cách Next.js làm:                              │  │
  │  │  ┌─────────────────────────────┐                │  │
  │  │  │  Thread 1: SWC compile ──→ Output JS        │  │
  │  │  │  Thread 2: TSC check ───→ Report errors     │  │
  │  │  └─────────────────────────────┘                │  │
  │  │  → Build KHÔNG chờ type-check!                  │  │
  │  │  → Type errors hiện RIÊNG (next lint)           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleTypeStripper
// Mô phỏng cách SWC strip TypeScript types!
// ═══════════════════════════════════════════════════════════

var SimpleTypeStripper = (function () {
  // ① Xóa type annotations (: Type):
  function stripTypeAnnotations(code) {
    // Xóa : type sau parameter/variable:
    // const x: number → const x
    // function(a: string, b: number) → function(a, b)
    return code.replace(
      /:\s*(string|number|boolean|any|void|never|null|undefined|object|unknown|bigint|symbol|[\w\[\]<>,\s|&]+?)(?=\s*[=,);}\n])/g,
      "",
    );
  }

  // ② Xóa interface declarations:
  function stripInterfaces(code) {
    // interface Foo { ... }
    return code.replace(
      /\binterface\s+\w+(?:\s+extends\s+[\w,\s]+)?\s*\{[^}]*\}/g,
      "/* [interface stripped] */",
    );
  }

  // ③ Xóa type aliases:
  function stripTypeAliases(code) {
    // type Foo = ...;
    return code.replace(
      /\btype\s+\w+(?:<[^>]*>)?\s*=\s*[^;]+;/g,
      "/* [type alias stripped] */",
    );
  }

  // ④ Xóa generics (< >):
  function stripGenerics(code) {
    // Array<string> → Array, useState<number>() → useState()
    return code.replace(/<[^<>]*>/g, "");
  }

  // ⑤ Xóa enum (convert sang object):
  function transformEnums(code) {
    return code.replace(
      /\benum\s+(\w+)\s*\{([^}]*)\}/g,
      function (match, name, body) {
        var members = body
          .split(",")
          .map(function (m) {
            return m.trim();
          })
          .filter(Boolean);

        var obj = "var " + name + " = {\n";
        members.forEach(function (member, i) {
          var parts = member.split("=").map(function (p) {
            return p.trim();
          });
          var key = parts[0];
          var value = parts[1] || i;
          obj += "  " + key + ": " + value + ",\n";
        });
        obj += "};";
        return obj;
      },
    );
  }

  // ⑥ Xóa "as Type" assertions:
  function stripTypeAssertions(code) {
    return code.replace(/\bas\s+([\w\[\]<>,\s|&]+?)(?=\s*[;,)\]}])/g, "");
  }

  // ⑦ Xóa non-null assertion (!.):
  function stripNonNullAssertions(code) {
    return code.replace(/!(?=\.)/g, "");
  }

  // Main strip function:
  function strip(tsCode) {
    var result = tsCode;
    result = stripInterfaces(result);
    result = stripTypeAliases(result);
    result = transformEnums(result);
    result = stripTypeAnnotations(result);
    result = stripGenerics(result);
    result = stripTypeAssertions(result);
    result = stripNonNullAssertions(result);
    // Clean up empty lines:
    result = result.replace(/\n\s*\n\s*\n/g, "\n\n");
    return result;
  }

  return { strip: strip };
})();

// SỬ DỤNG:
var tsCode = `
  interface User {
    name: string;
    age: number;
  }

  type Status = 'active' | 'inactive';

  enum Color {
    Red = '#ff0000',
    Blue = '#0000ff'
  }

  const greeting: string = "Hello";
  const user: User = { name: "Jun", age: 30 };
  const items: Array<string> = [];

  function greet(name: string): void {
    console.log(name as string);
    const el = document.querySelector('.btn')!.textContent;
  }
`;

var jsCode = SimpleTypeStripper.strip(tsCode);
// → interface User → XÓA!
// → type Status → XÓA!
// → enum Color → var Color = { Red: '#ff0000', Blue: '#0000ff' };
// → const greeting: string → const greeting
// → Array<string> → Array
// → (name: string): void → (name)
// → as string → XÓA!
// → !. → . (xóa non-null assertion)
```

---

**❓ Q10: CSS-in-JS SSR hoạt động thế nào? FOUC là gì?**

> **FOUC** = Flash of Unstyled Content — khi HTML hiện TRƯỚC khi CSS load xong, user thấy "nhấp nháy". CSS-in-JS SSR giải quyết bằng cách **thu thập tất cả CSS** trên server, inject vào `<style>` trong `<head>` của HTML → browser nhận HTML + CSS sẵn, hiện đúng ngay. SWC option `styledComponents.ssr: true` tự động kích hoạt!

**❓ Q11: Fast Refresh khác HMR thường thế nào?**

> HMR thường reload **toàn bộ module** → mất state. Fast Refresh nhận diện **React components** trong module → chỉ re-render component đó, **giữ nguyên state** (useState, useRef...). SWC compile single file ~12ms (vs Babel ~200ms) → Fast Refresh 3x nhanh hơn. Không giữ state khi: file không chứa component, lỗi syntax, hoặc export non-component!

**❓ Q12: Next.js code splitting hoạt động thế nào?**

> Next.js code-split **tự động**: ① Route-based — mỗi page = 1 chunk riêng. ② Component-based — `next/dynamic` lazy load component. ③ Shared chunks — modules dùng chung (React, utils) tách vào `commons.js`. User vào `/home` chỉ tải `home.js` + `commons.js`, KHÔNG tải admin/about code → giảm TTI đáng kể!

**❓ Q13: SWC xử lý TypeScript khác TSC thế nào?**

> SWC chỉ **strip types** (xóa `: number`, `interface`, `type`, `as Type`...) → output JavaScript, KHÔNG type-check! ~12ms/file. TSC (tsc) thực hiện **full type-check** (symbol resolution, type inference, error reporting) → ~200ms/file. Next.js chạy **song song**: SWC compile → output JS nhanh, TSC check → báo lỗi type riêng. Build không chờ type-check xong!

---

> 📝 **Ghi nhớ cuối cùng:**
> "SWC = Rust thay Babel+Terser, 17x nhanh hơn! Mặc định v12+, .babelrc → fallback Babel (mất perf)! Config trong next.config.js compiler: {}. removeConsole + removeProperties = clean production! define → thay biến build-time, defineServer → secrets server-only! transpilePackages thay next-transpile-modules! SWC Plugins = WASM binaries! Turbopack = Bundler (dùng SWC bên trong), incremental rebuild! optimizePackageImports → fix barrel file problem! Tree-shaking cần ESM + sideEffects:false! Source maps = debug production! CSS-in-JS SSR = thu thập CSS trên server, tránh FOUC! Fast Refresh = HMR giữ state, SWC 12ms/file! Code Splitting = route-based + dynamic + shared chunks! SWC strip types (không check) + TSC check song song!"
