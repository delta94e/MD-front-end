# Project Building — Deep Dive

> 📅 2026-02-13 · ⏱ 30 phút đọc
>
> npm/yarn, Scripts, Babel, ESLint, Polyfill,
> Webpack Internals, Loaders & Plugins
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Build Toolchain Interview

---

## Mục Lục

| #   | Phần                                         |
| --- | -------------------------------------------- |
| 1   | npm & yarn — Dependency Management           |
| 2   | npm Scripts — Custom Commands                |
| 3   | Babel, ESLint, Webpack — Vai trò trong dự án |
| 4   | ESLint — Nguyên lý & Cấu hình                |
| 5   | Babel — Core Principle & Custom Plugin       |
| 6   | Polyfill — Frontend Compatibility            |
| 7   | Webpack — Compiler Principles & HMR          |
| 8   | Loaders & Plugins — Cấu hình & Tự viết       |
| 9   | Tổng kết & Checklist phỏng vấn               |

---

## §1. npm & yarn — Dependency Management

```
PACKAGE MANAGER:
═══════════════════════════════════════════════════════════════

  npm (Node Package Manager) — Default! (Node.js built-in!)
  yarn (Yet Another Resource Negotiator) — Facebook (2016!)
  pnpm (Performant npm) — Hiệu quả nhất! (2017!)

  DEPENDENCY RESOLUTION:
  → Đọc package.json → resolve versions → download → node_modules/

  SEMVER (Semantic Versioning):
  MAJOR.MINOR.PATCH  →  4.17.21
  → MAJOR: breaking changes! API incompatible!
  → MINOR: new features! backward compatible!
  → PATCH: bug fixes! backward compatible!

  VERSION RANGES:
  ┌─────────┬───────────────────────────────────────┐
  │ Symbol  │ Ý nghĩa                               │
  ├─────────┼───────────────────────────────────────┤
  │ ^4.17.0 │ >=4.17.0 <5.0.0 (MINOR + PATCH!)     │
  │         │ → Default! Cho phép minor updates!    │
  │ ~4.17.0 │ >=4.17.0 <4.18.0 (chỉ PATCH!)        │
  │         │ → An toàn hơn! Chỉ bug fixes!        │
  │ 4.17.0  │ Exact! Chỉ version này!               │
  │ *       │ Any version!                           │
  │ >=4.0.0 │ 4.0.0 trở lên                         │
  └─────────┴───────────────────────────────────────┘
```

```
npm vs yarn vs pnpm:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────┬──────────────┬───────────┐
  │ Feature          │ npm          │ yarn         │ pnpm      │
  ├──────────────────┼──────────────┼──────────────┼───────────┤
  │ Lock file        │ package-     │ yarn.lock    │ pnpm-     │
  │                  │ lock.json    │              │ lock.yaml │
  │ Install speed    │ ⭐⭐⭐      │ ⭐⭐⭐⭐    │ ⭐⭐⭐⭐⭐│
  │ Disk space       │ Heavy 💀     │ Heavy        │ Light! ⚡ │
  │ node_modules     │ Flat         │ Flat/PnP     │ Symlinks! │
  │ Workspaces       │ ✅ (v7+)    │ ✅           │ ✅        │
  │ Phantom deps     │ ❌ Có!      │ ❌ Có!       │ ✅ Không! │
  │ Deterministic    │ ✅ (lock)   │ ✅           │ ✅        │
  │ Security audit   │ ✅ audit    │ ✅ audit     │ ✅ audit  │
  └──────────────────┴──────────────┴──────────────┴───────────┘

  npm: node_modules/ FLAT HOISTING:
  ┌── node_modules/
  │   ├── lodash/            ← hoisted lên top!
  │   ├── react/
  │   └── my-lib/
  │       └── node_modules/
  │           └── lodash@3/  ← conflict → nested!
  └──
  → ⚠️ PHANTOM DEPENDENCIES: code import lodash VẪN ĐƯỢC
  →    dù package.json KHÔNG list lodash! (hoisted từ dependency khác!)

  pnpm: CONTENT-ADDRESSABLE STORE + SYMLINKS:
  ┌── node_modules/
  │   ├── .pnpm/             ← flat store! Hard links!
  │   │   ├── lodash@4.17.21/node_modules/lodash/
  │   │   └── react@18.2.0/node_modules/react/
  │   ├── lodash → .pnpm/lodash@4.17.21/...  ← symlink!
  │   └── react → .pnpm/react@18.2.0/...     ← symlink!
  └── ~/.pnpm-store/         ← GLOBAL content-addressable store!
  → ✅ Không phantom deps! Không duplicate storage!
  → ✅ 10 projects dùng lodash → 1 copy trên disk!
```

```
LOCK FILE — TẠI SAO QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  package.json: "lodash": "^4.17.0"
  → npm install ngày 1: lodash@4.17.20
  → npm install ngày 2: lodash@4.17.21 (mới release!)
  → KHÁC VERSION! Bug tiềm ẩn!

  Lock file: GHI CHÍNH XÁC version + integrity hash!
  → npm ci (clean install) — dùng LOCK FILE! Deterministic!
  → ✅ MỌI NGƯỜI = CÙNG versions = CÙNG kết quả!

  ⚠️ LUÔN commit lock file vào git!
  ⚠️ Dùng "npm ci" trong CI/CD (không phải "npm install"!)
```

---

## §2. npm Scripts — Custom Commands

```javascript
// package.json:
{
    "scripts": {
        // ═══ LIFECYCLE SCRIPTS ═══
        "preinstall": "echo 'Before install!'",
        "postinstall": "echo 'After install!'",
        "prepublishOnly": "npm run build",

        // ═══ CUSTOM SCRIPTS ═══
        "dev": "vite --port 3000",
        "build": "tsc && vite build",
        "preview": "vite preview",
        "test": "vitest run",
        "test:watch": "vitest --watch",
        "test:coverage": "vitest --coverage",
        "lint": "eslint 'src/**/*.{ts,tsx}'",
        "lint:fix": "eslint 'src/**/*.{ts,tsx}' --fix",
        "format": "prettier --write 'src/**/*.{ts,tsx,css}'",
        "typecheck": "tsc --noEmit",
        "clean": "rm -rf dist node_modules/.cache",

        // ═══ CHAINING ═══
        "validate": "npm run typecheck && npm run lint && npm run test",
        // && = sequential (dừng nếu lỗi!)
        // & = parallel (chạy song song!)

        // ═══ CROSS-ENV (environment variables) ═══
        "build:prod": "cross-env NODE_ENV=production webpack",
        "build:staging": "cross-env NODE_ENV=staging webpack"
    }
}
```

```
NPM SCRIPTS — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  "npm run dev" thực ra làm gì?

  ① Tìm script "dev" trong package.json
  ② Thêm node_modules/.bin vào PATH!
     → Nên lệnh "vite" chạy được (thay vì ./node_modules/.bin/vite!)
  ③ Execute command trong shell mới!

  LIFECYCLE HOOKS:
  npm install → preinstall → install → postinstall
  npm test    → pretest → test → posttest
  npm publish → prepublishOnly → prepare → publish
  npm run X   → preX → X → postX

  ⚠️ npx = tìm trong node_modules/.bin → nếu không có → download tạm!
  → npx create-react-app → download + run + XÓA!
```

---

## §3. Babel, ESLint, Webpack — Vai trò

```
BUILD TOOLCHAIN — AI LÀM GÌ?
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │ SOURCE CODE (ES6+, TypeScript, JSX, SCSS, ...)          │
  │                                                         │
  │  ┌──────────┐                                          │
  │  │ ESLint   │ → CODE QUALITY! Check lỗi, style,       │
  │  │          │   best practices, potential bugs!         │
  │  └──────────┘                                          │
  │       ↓                                                 │
  │  ┌──────────┐                                          │
  │  │ Babel    │ → TRANSPILE! ES6+ → ES5 (compatibility!) │
  │  │          │   JSX → JS, TypeScript → JS              │
  │  │          │   Custom syntax transforms!               │
  │  └──────────┘                                          │
  │       ↓                                                 │
  │  ┌──────────┐                                          │
  │  │ Webpack  │ → BUNDLE! Multiple files → 1+ bundles!   │
  │  │          │   Loaders: transform files!               │
  │  │          │   Plugins: optimize, inject, analyze!     │
  │  │          │   Code splitting, tree shaking, HMR!      │
  │  └──────────┘                                          │
  │       ↓                                                 │
  │ PRODUCTION BUNDLE (minified, optimized, compatible!)    │
  └─────────────────────────────────────────────────────────┘

  MỖI TOOL = 1 TRÁCH NHIỆM:
  ESLint:   → "Code này có lỗi logic/style không?"
  Prettier: → "Code này FORMAT đúng chưa?"
  Babel:    → "Code này browser CŨ có hiểu không?"
  TypeScript: → "Code này có TYPE errors không?"
  Webpack:  → "Gộp tất cả files thành bundles tối ưu!"
  PostCSS:  → "CSS này cần autoprefixer/modern transforms!"
```

---

## §4. ESLint — Nguyên lý & Cấu hình

```
ESLINT — NGUYÊN LÝ HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  Source Code → Parser (espree/TypeScript) → AST
       → Traverse AST → Apply RULES → Report errors!

  ① PARSE: Source code → AST (Abstract Syntax Tree!)
     → Default parser: espree (ESLint built-in!)
     → TypeScript: @typescript-eslint/parser
     → JSX/TSX: babel-eslint hoặc @typescript-eslint/parser

  ② RULES: Mỗi rule = 1 function kiểm tra AST node!
     → Rule nhận AST node → check → report error/warning!
     → Có thể auto-fix! (--fix flag!)

  ③ REPORT: errors + warnings + suggestions!
```

```javascript
// ═══ ESLINT CONFIG — eslint.config.js (Flat Config — ESLint 9+!) ═══

import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  // Base recommended rules:
  js.configs.recommended,

  // TypeScript files:
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      react: react,
      "react-hooks": reactHooks,
    },
    rules: {
      // ═══ ERROR — Phải sửa! ═══
      "no-console": "warn",
      "no-debugger": "error",
      "no-unused-vars": "off", // Dùng TS version thay thế!
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_", // _unused OK!
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // ═══ REACT ═══
      "react/jsx-uses-react": "off", // React 17+ không cần!
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error", // CRITICAL!
      "react-hooks/exhaustive-deps": "warn",

      // ═══ BEST PRACTICES ═══
      eqeqeq: ["error", "always"], // === thay vì ==!
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  // Ignore patterns:
  { ignores: ["dist/", "node_modules/", "*.config.js"] },
];

// ═══ CUSTOM ESLINT RULE ═══
// Nguyên lý: visit AST node → check → report!

const noConsoleLog = {
  meta: {
    type: "suggestion",
    docs: { description: "Disallow console.log" },
    fixable: "code",
    schema: [],
  },
  create(context) {
    return {
      // Visit CallExpression nodes:
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.name === "console" &&
          node.callee.property.name === "log"
        ) {
          context.report({
            node,
            message: "Unexpected console.log!",
            fix(fixer) {
              return fixer.remove(node.parent);
            },
          });
        }
      },
    };
  },
};
// → Rule visit MỌI CallExpression trong AST
// → Kiểm tra: console.log()?
// → Report + auto-fix (xóa statement!)
```

---

## §5. Babel — Core Principle & Custom Plugin

```
BABEL — 3 BƯỚC:
═══════════════════════════════════════════════════════════════

  Source Code (ES6+/JSX/TS)
       │
       ▼
  ┌──────────┐
  │ ① PARSE  │ → @babel/parser (babylon!)
  │          │ → Source → AST (Abstract Syntax Tree!)
  └────┬─────┘
       ▼
  ┌──────────┐
  │②TRANSFORM│ → @babel/traverse
  │          │ → Visit AST nodes → apply PLUGINS!
  │          │ → Plugin: modify/replace/add/remove nodes!
  │          │ → Preset = collection of plugins!
  └────┬─────┘
       ▼
  ┌──────────┐
  │③ GENERATE│ → @babel/generator
  │          │ → Modified AST → Output code + sourcemap!
  └──────────┘

  PRESETS (preset = bộ plugins!):
  → @babel/preset-env: ES6+ → ES5 (theo target browsers!)
  → @babel/preset-react: JSX → React.createElement()
  → @babel/preset-typescript: TS → JS (chỉ strip types!)
```

```javascript
// ═══ BABEL CONFIG — babel.config.js ═══
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: "> 0.25%, not dead",
        // → Chỉ transpile features mà target browsers CHƯA hỗ trợ!
        // → Giảm bundle size!
        useBuiltIns: "usage",
        // → 'usage': import polyfills CHỈ KHI DÙNG!
        // → 'entry': import TẤT CẢ polyfills (nặng!)
        // → false: không import polyfills
        corejs: 3,
      },
    ],
    [
      "@babel/preset-react",
      {
        runtime: "automatic", // React 17+ (không cần import React!)
      },
    ],
    "@babel/preset-typescript",
  ],
  plugins: [
    // Thêm plugins cụ thể:
    "@babel/plugin-proposal-decorators",
    [
      "@babel/plugin-transform-runtime",
      {
        regenerator: true, // async/await support!
      },
    ],
  ],
};

// ═══ VÍ DỤ BABEL TRANSFORM ═══
// Input (ES6 + JSX):
const App = () => (
  <div className="app">
    {items.map((i) => (
      <span>{i}</span>
    ))}
  </div>
);

// Output (ES5):
var App = function () {
  return React.createElement(
    "div",
    { className: "app" },
    items.map(function (i) {
      return React.createElement("span", null, i);
    }),
  );
};
```

```javascript
// ═══ CUSTOM BABEL PLUGIN ═══
// Ví dụ: Auto-add console.log cho mọi function (debug!)

module.exports = function ({ types: t }) {
  return {
    name: "auto-console-log",
    visitor: {
      // Visit mọi Function nodes (FunctionDeclaration, ArrowFunction, etc.):
      "FunctionDeclaration|FunctionExpression|ArrowFunctionExpression"(path) {
        const functionName = path.node.id?.name || "anonymous";

        // Tạo AST node: console.log("Entering: functionName")
        const logStatement = t.expressionStatement(
          t.callExpression(
            t.memberExpression(t.identifier("console"), t.identifier("log")),
            [t.stringLiteral(`Entering: ${functionName}`)],
          ),
        );

        // Thêm vào ĐẦU function body:
        if (path.node.body.type === "BlockStatement") {
          path.node.body.body.unshift(logStatement);
        }
      },
    },
  };
};

// Input:
function greet(name) {
  return `Hello ${name}`;
}

// Output:
function greet(name) {
  console.log("Entering: greet"); // ← AUTO-ADDED!
  return `Hello ${name}`;
}

// ═══ GIẢI THÍCH ═══
// types (t): helpers tạo AST nodes!
// visitor: pattern → khai báo LOẠI NODE muốn visit!
// path: wrapper của node → .node, .parent, .replaceWith(), .remove()...
// → Babel traverse AST → gặp Function → gọi visitor function!
// → Plugin modify AST → Babel generate code mới!
```

---

## §6. Polyfill — Frontend Compatibility

```
POLYFILL vs TRANSPILE:
═══════════════════════════════════════════════════════════════

  TRANSPILE (Babel): thay đổi SYNTAX!
  → Arrow function → regular function
  → const/let → var
  → Template literal → string concatenation
  → Class → prototype-based constructor
  → KHÔNG THÊM API MỚI!

  POLYFILL: thêm API MỚI mà browser cũ CHƯA CÓ!
  → Promise, Map, Set, Symbol, Array.from
  → fetch, IntersectionObserver, Array.prototype.includes
  → THÊM implementation vào global scope!

  ⚠️ Babel transpile SYNTAX, Polyfill thêm APIS!
  → Cần CẢ HAI cho full compatibility!
```

```javascript
// ═══ POLYFILL STRATEGIES ═══

// ① core-js + @babel/preset-env (useBuiltIns: 'usage'):
// → THÔNG MINH NHẤT! Chỉ import polyfills cho features ĐANG DÙNG!
// → Babel analyze code → thấy Promise.all → import core-js/promise!

// babel.config.js:
[
  "@babel/preset-env",
  {
    targets: "> 0.25%, not dead",
    useBuiltIns: "usage", // ← CHỈ polyfill features DÙNG!
    corejs: 3,
  },
];

// Input:
const result = Promise.all([fetch("/api"), fetch("/api2")]);
const arr = Array.from(nodeList);

// Babel auto-thêm (chỉ nếu target browser cần!):
import "core-js/modules/es.promise.js";
import "core-js/modules/es.array.from.js";

// ② core-js (useBuiltIns: 'entry'):
// → Import TẤT CẢ polyfills cho targets!
// → Nặng hơn! Nhưng chắc chắn không miss!
import "core-js/stable";
import "regenerator-runtime/runtime"; // async/await support

// ③ @babel/plugin-transform-runtime:
// → Polyfill KHÔNG THAY ĐỔI global! (sandboxed!)
// → Dùng cho LIBRARIES! (không ghi đè global Promise!)
// → Tạo alias: var _Promise = require('@babel/runtime/core-js/promise');

// ④ Polyfill.io (CDN service):
// <script src="https://polyfill.io/v3/polyfill.min.js?features=Promise,fetch">
// → Server detect User-Agent → trả polyfills CHỈ CHO BROWSER ĐÓ!
// → Chrome mới nhất: trả file RỖNG! IE11: trả đầy đủ!

// ═══ BROWSERSLIST — Target Browsers ═══
// .browserslistrc:
// > 0.25%       ← market share > 0.25%
// not dead      ← browser vẫn được support
// last 2 versions ← 2 versions gần nhất
// not ie 11     ← loại IE 11!

// → Babel, PostCSS, ESLint, Autoprefixer ĐỀU đọc browserslist!
// → 1 config → consistent targets!
```

---

## §7. Webpack — Compiler Principles & HMR

```
WEBPACK — BUILD PROCESS:
═══════════════════════════════════════════════════════════════

  ① INITIALIZATION:
     → Đọc webpack.config.js + CLI args → merge config
     → Tạo Compiler instance
     → Load tất cả plugins (apply method!)

  ② COMPILATION — Build Module Graph:
     → Bắt đầu từ ENTRY point(s)!
     → entry: './src/index.js'
     │
     ③ RESOLVE:
     │  → Tìm file path (resolve extensions, aliases, modules!)
     │
     ④ LOAD + TRANSFORM (Loaders!):
     │  → Match file → apply loaders → transform content!
     │  → .ts → ts-loader → JS
     │  → .scss → sass-loader → css-loader → style-loader
     │
     ⑤ PARSE:
     │  → Parse transformed code → AST
     │  → Tìm import/require statements → dependencies!
     │
     ⑥ RECURSE:
     │  → Cho mỗi dependency → lặp lại ③④⑤
     │  → Xây dựng DEPENDENCY GRAPH!
     │
     └── Kết quả: Module Graph (tất cả modules + dependencies!)

  ⑦ SEAL:
     → Dependency graph → CHUNKS!
     → Entry chunk, async chunks (code splitting!)
     → Tree shaking: loại code KHÔNG DÙNG!

  ⑧ EMIT:
     → Chunks → output files (bundles!)
     → Apply plugins (optimize, minify, hash filenames!)
     → Viết files ra dist/

  ┌─── Entry ─────────────────────────────────────┐
  │ index.js                                      │
  │  ├── import App from './App.jsx'              │
  │  │   ├── import Header from './Header'        │
  │  │   ├── import utils from './utils'          │
  │  │   └── import './App.css'                   │
  │  ├── import React from 'react'                │
  │  └── import './index.css'                     │
  └── → Build Dependency Graph → Chunks → Bundles!┘
```

```
MODULE vs CHUNK vs BUNDLE:
═══════════════════════════════════════════════════════════════

  MODULE:
  → 1 file = 1 module! (JS, CSS, image, JSON...)
  → Mỗi import/require = 1 module!
  → Webpack xử lý TỪNG module (loaders!)

  CHUNK:
  → 1 nhóm modules được GỘP!
  → Webpack tạo chunks từ:
    → Entry point → entry chunk
    → Dynamic import() → async chunk (code splitting!)
    → SplitChunksPlugin → shared chunk (vendor!)

  BUNDLE:
  → Output FILE cuối cùng!
  → 1 chunk → 1+ bundles (+ sourcemap!)
  → dist/main.abc123.js ← đây là bundle!

  VÍ DỤ:
  ┌─── Modules ────────────────┐
  │ index.js                   │
  │ App.jsx                    │ → main chunk → main.abc123.js (bundle!)
  │ Header.jsx                 │
  │ utils.js                   │
  │ index.css                  │
  ├────────────────────────────┤
  │ react (node_modules)       │ → vendor chunk → vendor.def456.js
  │ react-dom                  │
  ├────────────────────────────┤
  │ HeavyPage.jsx              │ → async chunk → heavy.ghi789.js
  │ (dynamic import!)          │    (lazy loaded!)
  └────────────────────────────┘
```

```
WEBPACK HMR (Hot Module Replacement):
═══════════════════════════════════════════════════════════════

  → Thay đổi code → CẬP NHẬT module NGAY trong browser!
  → KHÔNG full reload! → Giữ state! ⚡

  NGUYÊN LÝ:
  ┌─── Dev Server ───────────────────────────────┐
  │ ① File thay đổi → Webpack recompile module!  │
  │ ② Tạo update manifest (JSON) + update chunk! │
  │ ③ WebSocket push notification → browser!      │
  └───────────────────┬──────────────────────────┘
                      ▼
  ┌─── Browser ──────────────────────────────────┐
  │ ④ HMR Runtime nhận notification!              │
  │ ⑤ Fetch update manifest (hash!) + chunk!      │
  │ ⑥ Apply updates:                              │
  │    → Module cũ dispose() → dọn dẹp!           │
  │    → Module mới execute!                       │
  │    → module.hot.accept() xử lý update!        │
  │ ⑦ Nếu thất bại → FULL RELOAD (fallback!)     │
  └──────────────────────────────────────────────┘

  ⚠️ CSS HMR: style-loader inject/replace <style> → TỰ ĐỘNG!
  ⚠️ JS HMR: cần module.hot.accept() → React Fast Refresh xử lý!
```

```javascript
// ═══ WEBPACK CONFIG ═══

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  // ① ENTRY:
  entry: {
    main: "./src/index.js",
    admin: "./src/admin.js", // Multiple entries → multiple bundles!
  },

  // ② OUTPUT:
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash:8].js", // contenthash = cache!
    chunkFilename: "[name].[contenthash:8].chunk.js",
    clean: true, // Xóa dist/ trước mỗi build!
  },

  // ③ MODE:
  mode: "production", // 'development' | 'production' | 'none'
  // production: minify, tree shaking, scope hoisting!
  // development: source maps, readable output, HMR!

  // ④ RESOLVE:
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
    },
  },

  // ⑤ MODULE (Loaders):
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "babel-loader", // hoặc ts-loader!
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, // Extract CSS to files!
          "css-loader",
          "postcss-loader", // Autoprefixer, etc.
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: "asset", // Webpack 5: built-in asset modules!
        parser: {
          dataUrlCondition: { maxSize: 8 * 1024 }, // < 8KB = inline!
        },
      },
    ],
  },

  // ⑥ PLUGINS:
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash:8].css",
    }),
  ],

  // ⑦ OPTIMIZATION:
  optimization: {
    splitChunks: {
      chunks: "all", // Split shared code!
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: 10,
        },
      },
    },
    runtimeChunk: "single", // Webpack runtime riêng!
  },

  // ⑧ DEV SERVER:
  devServer: {
    port: 3000,
    hot: true, // HMR!
    historyApiFallback: true, // SPA routing!
    proxy: {
      "/api": "http://localhost:8080", // Proxy API requests!
    },
  },

  // ⑨ SOURCE MAPS:
  devtool: "source-map", // Production: source-map (external!)
  // devtool: 'eval-source-map', // Development: fast + accurate!
};
```

---

## §8. Loaders & Plugins — Cấu hình & Tự viết

```
LOADERS vs PLUGINS:
═══════════════════════════════════════════════════════════════

  LOADERS:
  → Transform INDIVIDUAL files!
  → File → Loader pipeline → Transformed content!
  → Chạy TỪ PHẢI SANG TRÁI (bottom to top trong array!)
  → Ví dụ: sass-loader → css-loader → style-loader

  PLUGINS:
  → Hook vào Webpack BUILD PROCESS!
  → Thao tác trên COMPILATION level!
  → Ví dụ: tạo HTML file, extract CSS, define globals, analyze bundle

  ┌──── LOADERS ────────────────────────────────┐
  │ Input: file content (string/buffer)          │
  │ Output: transformed content                  │
  │ Scope: 1 file at a time!                    │
  │                                              │
  │ sass-loader ← css-loader ← style-loader     │
  │ (SCSS→CSS)    (resolve    (inject to         │
  │               @import,     <style> tag!)     │
  │               url())                         │
  └──────────────────────────────────────────────┘

  ┌──── PLUGINS ────────────────────────────────┐
  │ Input: compiler/compilation hooks!           │
  │ Output: modified build output               │
  │ Scope: ENTIRE build process!                │
  │                                              │
  │ HtmlWebpackPlugin → generate HTML!           │
  │ MiniCssExtractPlugin → extract CSS files!    │
  │ DefinePlugin → define global constants!      │
  │ BundleAnalyzerPlugin → visualize bundle!     │
  └──────────────────────────────────────────────┘
```

```javascript
// ═══ CUSTOM LOADER ═══
// Loader = function nhận source → return transformed source!

// markdown-loader.js:
const marked = require("marked");

module.exports = function (source) {
  // "this" = loader context!
  this.cacheable && this.cacheable(); // Enable caching!

  // Transform markdown → HTML:
  const html = marked.parse(source);

  // Return JS module:
  return `export default ${JSON.stringify(html)};`;
};

// Sử dụng:
// webpack.config.js:
// { test: /\.md$/, use: './loaders/markdown-loader.js' }
// Component: import content from './README.md'; // → HTML string!

// ═══ ASYNC LOADER ═══
module.exports = function (source) {
  const callback = this.async(); // Async mode!

  processAsync(source)
    .then((result) => callback(null, result))
    .catch((err) => callback(err));
};

// ═══ LOADER VỚI OPTIONS ═══
// banner-loader.js — Thêm comment/banner vào đầu file:
const { getOptions } = require("loader-utils");
const { validate } = require("schema-utils");

const schema = {
  type: "object",
  properties: { banner: { type: "string" } },
  required: ["banner"],
};

module.exports = function (source) {
  const options = getOptions(this);
  validate(schema, options, { name: "Banner Loader" });

  return `/* ${options.banner} */\n${source}`;
};

// webpack.config.js:
// { test: /\.js$/, use: { loader: './loaders/banner-loader',
//   options: { banner: 'Built by My Team — 2026' } } }
```

```javascript
// ═══ CUSTOM PLUGIN ═══
// Plugin = class với apply(compiler) method!
// → Hook vào compiler lifecycle events!

class FileSizePlugin {
  apply(compiler) {
    // Hook vào 'emit' — trước khi viết files!
    compiler.hooks.emit.tapAsync("FileSizePlugin", (compilation, callback) => {
      let report = "=== Bundle Size Report ===\n\n";

      for (const [filename, source] of Object.entries(compilation.assets)) {
        const size = source.size();
        const sizeKB = (size / 1024).toFixed(2);
        report += `${filename}: ${sizeKB} KB\n`;
      }

      // Thêm report file vào output!
      compilation.assets["bundle-report.txt"] = {
        source: () => report,
        size: () => report.length,
      };

      callback();
    });
  }
}

module.exports = FileSizePlugin;

// webpack.config.js:
// plugins: [new FileSizePlugin()]
// → Output: dist/bundle-report.txt với size report!

// ═══ PLUGIN HOOKS (LIFECYCLE) ═══
// compiler.hooks:
// → environment     - setup environment
// → beforeRun       - trước khi bắt đầu
// → run/watchRun    - bắt đầu compile
// → beforeCompile   - trước compilation
// → compilation     - compilation được tạo!
// → make            - bắt đầu build modules
// → afterCompile    - sau compilation
// → emit            - trước khi viết assets!
// → afterEmit       - sau khi viết
// → done            - build xong!

// compilation.hooks:
// → buildModule     - module bắt đầu build
// → succeedModule   - module build thành công!
// → seal            - compilation sealed
// → optimizeAssets  - optimize output assets!

// ═══ COMMON PLUGINS ═══
// ┌───────────────────────────┬──────────────────────────────────┐
// │ Plugin                    │ Chức năng                        │
// ├───────────────────────────┼──────────────────────────────────┤
// │ HtmlWebpackPlugin         │ Tạo HTML, auto-inject bundles!  │
// │ MiniCssExtractPlugin      │ Extract CSS ra files riêng!     │
// │ DefinePlugin               │ Define global constants!        │
// │ CopyWebpackPlugin         │ Copy static files → dist!       │
// │ BundleAnalyzerPlugin      │ Visualize bundle sizes!         │
// │ CompressionPlugin         │ Gzip/Brotli compress!           │
// │ CleanWebpackPlugin        │ Clean dist/ (WP5: output.clean)│
// │ TerserPlugin              │ Minify JS! (built-in WP5!)     │
// │ CssMinimizerPlugin        │ Minify CSS!                    │
// │ ProvidePlugin              │ Auto-import globals!            │
// │ IgnorePlugin               │ Ignore modules (locale...)     │
// └───────────────────────────┴──────────────────────────────────┘
```

```
WEBPACK vs VITE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬────────────────┬────────────────┐
  │ Feature          │ Webpack        │ Vite           │
  ├──────────────────┼────────────────┼────────────────┤
  │ Dev server       │ Bundle ALL     │ No bundle!     │
  │                  │ then serve     │ Native ESM!    │
  │ Dev startup      │ SLOW (seconds) │ INSTANT! ⚡    │
  │ HMR speed        │ Slow (re-bundle│ FAST (1 module)│
  │ Build (prod)     │ Webpack        │ Rollup!        │
  │ Config           │ Complex! 😓    │ Simple! 😊     │
  │ Ecosystem        │ Huge! ⭐⭐⭐⭐⭐│ Growing ⭐⭐⭐⭐│
  │ History          │ 2012+          │ 2020+          │
  │ Creator          │ Tobias K.      │ Evan You (Vue!)│
  └──────────────────┴────────────────┴────────────────┘

  VITE DEV — tại sao NHANH:
  → KHÔNG bundle toàn bộ app!
  → Browser native ESM: import trực tiếp modules!
  → Chỉ transform file KHI BROWSER REQUEST!
  → HMR: chỉ cập nhật 1 module (không re-build!)
  → Dependency pre-bundling: esbuild (Go, cực nhanh!)
```

---

## §9. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  Project Building
  ├── Package Manager: npm(default) vs yarn(fast) vs pnpm(disk-efficient!)
  │   ├── Semver: ^(minor+patch) ~(patch only) exact
  │   ├── Lock file: deterministic! npm ci in CI/CD!
  │   └── pnpm: content-addressable store + symlinks, NO phantom deps!
  ├── npm Scripts: lifecycle hooks, && sequential, npx = temp install!
  ├── ESLint: parse→AST→rules→report; flat config (v9+), custom rule = visitor!
  ├── Babel: parse→transform(plugins!)→generate; preset-env+react+ts
  │   └── Custom plugin: visitor pattern, types helpers, path manipulation
  ├── Polyfill: syntax(Babel) vs API(core-js); useBuiltIns:'usage' = SMART!
  │   └── Browserslist: 1 config → all tools!
  ├── Webpack: entry→resolve→loaders→parse→dependency graph→chunks→bundles
  │   ├── Module(file) vs Chunk(group) vs Bundle(output!)
  │   ├── HMR: WebSocket notify→fetch update→apply→fallback reload
  │   └── contenthash filenames = cache busting!
  ├── Loaders: transform files (right→left!), cacheable, async support
  ├── Plugins: hook compiler lifecycle, operate on compilation/assets
  └── Vite: no-bundle dev (native ESM!), Rollup prod, INSTANT startup!
```

### Checklist

- [ ] **npm vs yarn vs pnpm**: pnpm content-addressable store + symlinks = no phantom deps + disk efficient!
- [ ] **Semver**: ^=minor+patch, ~=patch only, exact=pinned; Lock file = deterministic → npm ci!
- [ ] **npm Scripts**: node_modules/.bin thêm vào PATH, lifecycle hooks (pre/post), && sequential, npx = temp install
- [ ] **ESLint nguyên lý**: Source → Parser → AST → Traverse + Apply Rules → Report; custom rule = visitor pattern!
- [ ] **ESLint config**: flat config (v9+), parser (@typescript-eslint), plugins (react-hooks!), rules (error/warn/off)
- [ ] **Babel 3 bước**: Parse (@babel/parser) → Transform (@babel/traverse + plugins!) → Generate (@babel/generator)
- [ ] **Babel presets**: preset-env (ES6→ES5 theo targets), preset-react (JSX→createElement), preset-typescript (strip types)
- [ ] **Custom Babel plugin**: visitor pattern, types (t) helpers, path manipulation; thêm/xóa/thay AST nodes!
- [ ] **Polyfill vs Transpile**: Transpile=syntax (Babel), Polyfill=APIs (core-js); useBuiltIns:'usage' = chỉ polyfill cái DÙNG!
- [ ] **Browserslist**: .browserslistrc, "> 0.25%, not dead"; Babel+PostCSS+ESLint đều đọc!
- [ ] **Webpack build flow**: entry → resolve → loaders → parse → dependency graph → chunks → emit bundles
- [ ] **Module vs Chunk vs Bundle**: Module=1 file; Chunk=nhóm modules (entry/async/vendor); Bundle=output file!
- [ ] **Webpack HMR**: file change → recompile module → WebSocket notify → fetch manifest+chunk → apply/fallback reload
- [ ] **Loaders**: transform individual files, RIGHT→LEFT pipeline, cacheable; custom: function(source) → return transformed
- [ ] **Plugins**: hook compiler.hooks lifecycle, operate on compilation + assets; custom: class + apply(compiler) method
- [ ] **Webpack vs Vite**: WP=bundle-all-then-serve (slow dev); Vite=native-ESM-no-bundle (instant dev!) + Rollup (prod)

---

_Nguồn: ConardLi — "Project Building" · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
