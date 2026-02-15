# Static Import — Deep Dive

> 📅 2026-02-15 · ⏱ 20 phút đọc
>
> ES Modules & Static Import,
> Named vs Default Export/Import,
> Module Execution Order,
> Bundling & Initial Bundle Size,
> Tree Shaking,
> Circular Dependencies,
> Dynamic Import so sánh,
> Webpack/Vite Bundle Analysis,
> Real-World Patterns & Tradeoffs
> Độ khó: ⭐️⭐️⭐️ | JavaScript Performance Pattern

---

## Mục Lục

| #   | Phần                              |
| --- | --------------------------------- |
| 1   | Static Import là gì?              |
| 2   | ES Modules — export/import cơ bản |
| 3   | Named vs Default Export           |
| 4   | Module Execution Order            |
| 5   | Bundling — Initial Bundle         |
| 6   | Tree Shaking                      |
| 7   | Import Aggregation — Barrel Files |
| 8   | Circular Dependencies             |
| 9   | Static vs Dynamic Import          |
| 10  | Bundle Analysis — Webpack/Vite    |
| 11  | Code Splitting Strategies         |
| 12  | Real-World Patterns               |
| 13  | Tradeoffs — Ưu & Nhược điểm       |
| 14  | Tóm tắt                           |

---

## §1. Static Import là gì?

```
STATIC IMPORT — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Static Import = import module ở ĐẦU FILE!
  → Dùng cú pháp: import X from 'module'!
  → Engine PHÂN TÍCH import TRƯỚC khi chạy code!
  → TẤT CẢ static imports → vào INITIAL BUNDLE!

  import React from 'react';           ← Static!
  import UserInfo from './UserInfo';    ← Static!
  import ChatList from './ChatList';    ← Static!
  import ChatInput from './ChatInput';  ← Static!

  ĐẶC ĐIỂM:
  → ① PHẢI ở TOP-LEVEL (không trong if/for/function!)
  → ② PHẢI dùng string LITERAL (không dùng biến!)
  → ③ Engine biết TẤT CẢ dependencies TẠI COMPILE TIME!
  → ④ Bundler (Webpack/Vite) PHÂN TÍCH được dependency graph!
  → ⑤ Cho phép TREE SHAKING (loại bỏ code không dùng!)

  VÍ DỤ THỰC TẾ: ĐẶT HÀNG TRƯỚC!
  → Static Import = đặt hàng TRƯỚC khi mở cửa!
  → Tất cả hàng GIAO NGAY khi mở cửa!
  → Dù bạn có DÙNG hay KHÔNG!
  → → Ưu: có ngay khi cần!
  → → Nhược: tốn không gian lưu trữ!
```

---

## §2. ES Modules — export/import cơ bản

```javascript
// ═══ ES MODULES — CƠ BẢN ═══

// ① NAMED EXPORT — export NHIỀU thứ:
// math.js:
export const PI = 3.14159;
export const E = 2.71828;

export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}

// ② NAMED IMPORT — import CHỌN LỌC:
import { add, multiply } from "./math.js";
//       ↑ destructuring-like syntax!
//       ↑ PHẢI đúng tên!

add(1, 2); // 3
multiply(3, 4); // 12

// ③ IMPORT TẤT CẢ — namespace:
import * as MathUtils from "./math.js";

MathUtils.add(1, 2); // 3
MathUtils.multiply(3, 4); // 12
MathUtils.PI; // 3.14159

// ④ RENAME khi import:
import { add as sum, multiply as mul } from "./math.js";

sum(1, 2); // 3
mul(3, 4); // 12
```

```javascript
// ═══ DEFAULT EXPORT ═══

// ① DEFAULT EXPORT — export 1 thứ CHÍNH:
// Calculator.js:
export default class Calculator {
    add(a, b) { return a + b; }
    subtract(a, b) { return a - b; }
}

// ② DEFAULT IMPORT — tên TÙY Ý:
import Calculator from './Calculator.js';   // ✅ OK!
import Calc from './Calculator.js';         // ✅ OK! Tên tùy ý!
import MyCalc from './Calculator.js';       // ✅ OK!

// ③ KẾT HỢP default + named:
// utils.js:
export default function formatDate(date) { /* ... */ }
export function formatCurrency(amount) { /* ... */ }
export function formatNumber(num) { /* ... */ }

// Import kết hợp:
import formatDate, { formatCurrency, formatNumber } from './utils.js';
//     ↑ default     ↑ named exports!
```

```
NAMED vs DEFAULT EXPORT:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬─────────────────────────────────────────┐
  │                │ Named Export       │ Default Export      │
  ├────────────────┼────────────────────┼─────────────────────┤
  │ Số lượng/file  │ NHIỀU              │ CHỈ 1               │
  │ Tên import     │ PHẢI đúng tên      │ TÙY Ý               │
  │ Cú pháp        │ import { X }       │ import X             │
  │ Rename         │ import { X as Y }  │ import Y (tự rename) │
  │ Tree Shaking   │ ✅ TỐT            │ ❌ Khó hơn           │
  │ IDE Support    │ ✅ Autocomplete    │ ❌ Không autocomplete│
  │ Refactoring    │ ✅ Find/Replace    │ ❌ Tên tùy ý = khó  │
  └────────────────┴────────────────────┴─────────────────────┘

  → Named Export = KHUYẾN KHÍCH!
  → → Tên nhất quán, dễ refactor!
  → → Tree Shaking tốt hơn!
  → → IDE autocomplete!

  → Default Export = dùng cho MAIN entity của module!
  → → React component (1 component/file!)
  → → Class chính của module!
```

---

## §3. Module Execution Order

```javascript
// ═══ THỨ TỰ THỰC THI MODULE ═══

// App.js:
import React from "react";
import UserInfo from "./components/UserInfo";
import ChatList from "./components/ChatList";
import ChatInput from "./components/ChatInput";

console.log("App loading", Date.now());

// → Console output:
// → "UserInfo loading"   ← Module 1 chạy TRƯỚC!
// → "ChatList loading"   ← Module 2!
// → "ChatInput loading"  ← Module 3!
// → "EmojiPicker loading" ← Sub-module của ChatInput!
// → "App loading"        ← App chạy SAU TẤT CẢ imports!
```

```
THỨ TỰ THỰC THI:
═══════════════════════════════════════════════════════════════

  ① Engine GẶP import statement!
  ② Engine TẠM DỪNG module hiện tại!
  ③ Engine CHẠY module được import!
  ④ Nếu module đó CÓ imports → REPEAT từ ①!
  ⑤ Sau khi TẤT CẢ imports chạy xong → TIẾP TỤC module hiện tại!

  DEPENDENCY GRAPH:

  App.js
    ├── UserInfo.js ← Chạy 1st!
    ├── ChatList.js ← Chạy 2nd!
    └── ChatInput.js ← Chạy 3rd!
          └── EmojiPicker.js ← Chạy trước ChatInput!

  → TẤT CẢ modules chạy TRƯỚC khi App.js body chạy!
  → → EmojiPicker chạy DÙ user CHƯA cần emoji!
  → → Tăng INITIAL LOAD TIME!

  QUAN TRỌNG:
  → Mỗi module CHỈ CHẠY 1 LẦN!
  → Import cùng module 10 lần → vẫn chỉ chạy 1 lần!
  → Module được CACHE sau lần chạy đầu!
```

---

## §4. Bundling — Initial Bundle

```
BUNDLING — MỌI THỨ VÀO 1 FILE:
═══════════════════════════════════════════════════════════════

  SOURCE FILES:          BUNDLE:
  ┌──────────┐           ┌────────────────────────┐
  │ App.js   │──┐        │                        │
  ├──────────┤  │        │   main.bundle.js       │
  │UserInfo  │──┤        │   (1.5 MiB!)           │
  ├──────────┤  ├──→     │                        │
  │ChatList  │──┤        │   TẤT CẢ code          │
  ├──────────┤  │        │   trong 1 file!        │
  │ChatInput │──┤        │                        │
  ├──────────┤  │        │   EmojiPicker cũng     │
  │EmojiPkr  │──┘        │   ở trong đây!         │
  └──────────┘           └────────────────────────┘

  Asset           Size      Chunks           Chunk Names
  main.bundle.js  1.5 MiB   main [emitted]   main

  VẤN ĐỀ:
  → Browser phải DOWNLOAD 1.5 MiB TRƯỚC khi hiển thị!
  → EmojiPicker (500KB?) nằm trong bundle DÙ CHƯA CẦN!
  → User PHẢI CHỜ download + parse + execute TẤT CẢ!
  → Mạng chậm (3G) → 5-10 giây trắng màn hình!

  → → GIẢI PHÁP: Dynamic Import cho EmojiPicker!
  → → Chỉ load khi user CLICK toggle emoji!
  → → Initial bundle NHẸ hơn đáng kể!
```

```javascript
// ═══ CHAT APP — STATIC IMPORT ═══

// App.js — TẤT CẢ import ở ĐẦU:
import React from "react";
import UserInfo from "./components/UserInfo";
import ChatList from "./components/ChatList";
import ChatInput from "./components/ChatInput";

import "./styles.css";

const App = () => (
  <div className="App">
    <UserInfo />
    <ChatList />
    <ChatInput />
  </div>
);

export default App;

// ChatInput.js — EmojiPicker STATIC import:
import React, { useState } from "react";
import EmojiPicker from "./EmojiPicker"; // ← 500KB! STATIC!

function ChatInput() {
  const [showEmoji, setShowEmoji] = useState(false);

  return (
    <div>
      <input type="text" placeholder="Type a message..." />
      <button onClick={() => setShowEmoji(!showEmoji)}>😀</button>
      {showEmoji && <EmojiPicker />}
      {/* → EmojiPicker đã LOAD rồi dù chưa show! */}
      {/* → 500KB trong initial bundle! LÃNG PHÍ! */}
    </div>
  );
}
```

---

## §5. Tree Shaking

```javascript
// ═══ TREE SHAKING — LOẠI BỎ CODE KHÔNG DÙNG ═══

// math.js — export NHIỀU functions:
export function add(a, b) {
  return a + b;
}
export function subtract(a, b) {
  return a - b;
}
export function multiply(a, b) {
  return a * b;
}
export function divide(a, b) {
  return a / b;
}
export function power(a, b) {
  return a ** b;
}
export function sqrt(a) {
  return Math.sqrt(a);
}

// app.js — CHỈ import 2 functions:
import { add, multiply } from "./math.js";

console.log(add(1, 2));
console.log(multiply(3, 4));

// → Tree Shaking LOẠI BỎ:
// → subtract, divide, power, sqrt → KHÔNG vào bundle!
// → Bundle CHỈ chứa add + multiply!
// → → TIẾT KIỆM bundle size!
```

```
TREE SHAKING — CÁCH HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  ① Bundler PHÂN TÍCH static imports!
  ② Xây dựng DEPENDENCY GRAPH!
  ③ Đánh dấu exports ĐƯỢC DÙNG!
  ④ LOẠI BỎ exports KHÔNG được import!
  ⑤ Dead code elimination!

  TRƯỚC Tree Shaking:            SAU Tree Shaking:
  ┌─────────────────┐           ┌─────────────────┐
  │ add()       ✅  │           │ add()       ✅  │
  │ subtract()  ❌  │           │ multiply()  ✅  │
  │ multiply()  ✅  │    →      └─────────────────┘
  │ divide()    ❌  │           Bundle NHỎ hơn!
  │ power()     ❌  │
  │ sqrt()      ❌  │
  └─────────────────┘

  YÊU CẦU ĐỂ TREE SHAKING HOẠT ĐỘNG:
  → ✅ ES Modules (import/export!)
  → ❌ CommonJS (require/module.exports!) → KHÔNG tree shake!
  → ✅ Named exports → dễ tree shake!
  → ❌ Default export object → khó tree shake!
  → ✅ Pure functions (no side effects!)
  → ❌ Side effects trong module → giữ lại hết!
```

```javascript
// ═══ TREE SHAKING — CÁC BẪY THƯỜNG GẶP ═══

// ❌ BAD — import * → KHÔNG tree shake:
import * as MathUtils from './math.js';
MathUtils.add(1, 2);
// → Bundler KHÔNG biết bạn dùng gì!
// → GIỮ LẠI TẤT CẢ! (tùy bundler!)

// ❌ BAD — re-export tất cả:
// index.js (barrel file!):
export * from './math.js';
export * from './string.js';
export * from './date.js';
// → Import từ index → có thể kéo TẤT CẢ!

// ❌ BAD — side effects:
// analytics.js:
export function track(event) { /* ... */ }

// Side effect khi import!
window.addEventListener('error', (e) => {
    track('error', e.message);
});
// → Bundler KHÔNG THỂ loại bỏ!
// → File có side effect = GIỮ HẾT!

// ✅ GOOD — pure named exports:
export function add(a, b) { return a + b; }
// → Không side effect → tree shake OK!

// ✅ GOOD — sideEffects: false trong package.json:
// package.json:
{
    "name": "my-lib",
    "sideEffects": false
    // → Báo bundler: TẤT CẢ files đều PURE!
    // → Tree shake MẠNH nhất!
}

// Hoặc chỉ định files CÓ side effects:
{
    "sideEffects": ["*.css", "*.scss", "./src/polyfills.js"]
    // → CHỈ CÓ CSS và polyfills có side effects!
    // → Còn lại → tree shake thoải mái!
}
```

---

## §6. Import Aggregation — Barrel Files

```javascript
// ═══ BARREL FILES — RE-EXPORT TỪ INDEX ═══

// ① Cấu trúc thư mục:
// components/
// ├── index.js          ← Barrel file!
// ├── Button.js
// ├── Input.js
// ├── Modal.js
// └── Tooltip.js

// ② Barrel file (index.js):
export { default as Button } from "./Button";
export { default as Input } from "./Input";
export { default as Modal } from "./Modal";
export { default as Tooltip } from "./Tooltip";

// ③ Import SẠCH từ barrel:
import { Button, Input, Modal } from "./components";
// → Thay vì:
import Button from "./components/Button";
import Input from "./components/Input";
import Modal from "./components/Modal";

// ═══ BARREL FILE — CẢNH BÁO PERFORMANCE ═══

// ❌ VẤN ĐỀ: import 1 → LOAD TẤT CẢ?
import { Button } from "./components";
// → Tùy bundler, có thể LOAD Modal, Tooltip dù không dùng!
// → Webpack 5 + sideEffects: false → Tree shake OK!
// → Nhưng bundler cũ hoặc config sai → LOAD HẾT!

// ✅ SAFE: import trực tiếp nếu lo performance:
import Button from "./components/Button";
// → CHẮC CHẮN chỉ load Button!
```

```
BARREL FILES — KHI NÀO DÙNG:
═══════════════════════════════════════════════════════════════

  ✅ NÊN DÙNG:
  → Library/package exports (lodash, @mui/material!)
  → Shared components folder!
  → Utils/helpers folder!
  → Types folder (TypeScript!)
  → Khi có sideEffects: false!

  ❌ CẨN THẬN:
  → Không có sideEffects config → có thể load TẤT CẢ!
  → Barrel file CỰC LỚN (100+ exports!) → slow!
  → Next.js đặc biệt NHẠY CẢM với barrel files!
  → → modularizeImports config cần thiết!

  → → Rule: NẾU nghi ngờ → import TRỰC TIẾP!
```

---

## §7. Circular Dependencies

```javascript
// ═══ CIRCULAR DEPENDENCIES — VÒNG LẶP IMPORT ═══

// ❌ BAD — A import B, B import A:

// fileA.js:
import { funcB } from "./fileB.js";
export function funcA() {
  console.log("funcA");
  funcB();
}

// fileB.js:
import { funcA } from "./fileA.js";
export function funcB() {
  console.log("funcB");
  funcA(); // → CÓ THỂ undefined!
}

// → fileA import fileB → fileB chưa chạy xong!
// → fileB import fileA → fileA CHƯA export funcA!
// → funcA = undefined tại thời điểm import!
// → → ReferenceError hoặc undefined behavior!
```

```
CIRCULAR DEPENDENCY — GIẢI PHÁP:
═══════════════════════════════════════════════════════════════

  ① RESTRUCTURE — tách shared code:

  TRƯỚC (circular!):
  A ←→ B (import lẫn nhau!)

  SAU (no circular!):
  A → C ← B (shared module C!)

  // shared.js:
  export function sharedFunc() { /* ... */ }

  // fileA.js:
  import { sharedFunc } from './shared.js';

  // fileB.js:
  import { sharedFunc } from './shared.js';

  ② DEPENDENCY INJECTION:
  → Truyền dependency qua PARAMETER!
  → Không import trực tiếp!

  ③ LAZY EVALUATION:
  → Dùng function wrapper!
  → Import chỉ khi CẦN (dynamic import!)

  ④ DETECT:
  → ESLint plugin: eslint-plugin-import!
  → Rule: import/no-cycle!
  → Webpack: circular-dependency-plugin!
```

---

## §8. Static vs Dynamic Import

```javascript
// ═══ STATIC vs DYNAMIC IMPORT ═══

// ① STATIC IMPORT — compile time:
import EmojiPicker from "./EmojiPicker";
// → Load NGAY khi app start!
// → Vào INITIAL bundle!
// → PHẢI ở top-level!

// ② DYNAMIC IMPORT — runtime:
const EmojiPicker = React.lazy(() => import("./EmojiPicker"));
// → Load KHI CẦN (user click!)
// → TÁCH thành chunk riêng!
// → Có thể ở BẤT KỲ ĐÂU!

// ③ Dynamic import thuần JavaScript:
async function loadModule() {
  const module = await import("./heavyModule.js");
  module.doSomething();
}
// → import() trả về PROMISE!
// → Load on demand!
```

```
STATIC vs DYNAMIC IMPORT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬─────────────────┬──────────────────┐
  │                  │ Static Import   │ Dynamic Import   │
  ├──────────────────┼─────────────────┼──────────────────┤
  │ Thời điểm load   │ COMPILE time    │ RUNTIME          │
  │ Vị trí           │ TOP-LEVEL only  │ BẤT KỲ ĐÂU      │
  │ String           │ CHỈ literal     │ Biến OK          │
  │ Bundle           │ Initial bundle  │ Separate chunk   │
  │ Tree Shaking     │ ✅ Có           │ ❌ Không         │
  │ Conditional      │ ❌ Không thể    │ ✅ if/else OK    │
  │ Error Handling   │ Build error     │ try/catch        │
  │ Performance      │ Tốt cho small   │ Tốt cho large    │
  │ First Load       │ CHẬM (load hết) │ NHANH (load ít)  │
  │ Subsequent Use   │ NHANH (đã load) │ Có delay lần đầu │
  └──────────────────┴─────────────────┴──────────────────┘

  KHI NÀO DÙNG GÌ:

  Static Import:
  → Components CẦN NGAY (Header, Footer, Layout!)
  → Dependencies nhỏ (utilities, constants!)
  → Code chạy trên EVERY page!

  Dynamic Import:
  → Components NẶNG (EmojiPicker, ChartLibrary!)
  → Code chạy trên SPECIFIC routes!
  → Code chạy sau USER INTERACTION!
  → Code chạy CONDITIONAL (admin panel!)
```

---

## §9. Bundle Analysis — Webpack/Vite

```javascript
// ═══ PHÂN TÍCH BUNDLE SIZE ═══

// ① Webpack Bundle Analyzer:
// webpack.config.js:
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  plugins: [new BundleAnalyzerPlugin()],
};
// → npm run build → mở treemap visualizer!
// → Thấy TỪNG module chiếm bao nhiêu bytes!

// ② Vite — rollup-plugin-visualizer:
// vite.config.js:
import { visualizer } from "rollup-plugin-visualizer";

export default {
  plugins: [visualizer({ open: true })],
};

// ③ Next.js — @next/bundle-analyzer:
// next.config.js:
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  // next config...
});
// → ANALYZE=true npm run build
```

```
BUNDLE SIZE — READING THE TREEMAP:
═══════════════════════════════════════════════════════════════

  main.bundle.js (1.5 MiB):
  ┌────────────────────────────────────────────┐
  │ node_modules/              (800 KB)        │
  │ ┌──────────────┐ ┌───────────────────────┐ │
  │ │ react-dom    │ │ moment.js  (300 KB!)  │ │
  │ │ (120 KB)     │ │ ← QUÁ LỚN!          │ │
  │ └──────────────┘ └───────────────────────┘ │
  │ ┌──────────────┐ ┌───────────┐            │
  │ │ lodash       │ │ emoji-pkr │            │
  │ │ (72 KB!)     │ │ (200 KB!) │            │
  │ └──────────────┘ └───────────┘            │
  ├────────────────────────────────────────────┤
  │ src/                       (700 KB)        │
  │ ┌───────────┐ ┌──────────┐ ┌────────────┐ │
  │ │ App       │ │ ChatList │ │ ChatInput  │ │
  │ │ (50 KB)   │ │ (100 KB) │ │ (150 KB)   │ │
  │ └───────────┘ └──────────┘ └────────────┘ │
  └────────────────────────────────────────────┘

  OPTIMIZATION TARGETS:
  → moment.js (300KB) → date-fns (tree shakeable!)
  → lodash (72KB) → lodash-es + named imports!
  → emoji-picker (200KB) → DYNAMIC import!
```

---

## §10. Code Splitting Strategies

```javascript
// ═══ STRATEGY 1: ROUTE-BASED SPLITTING ═══

// ❌ Static — TẤT CẢ routes trong initial bundle:
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";

// ✅ Dynamic — mỗi route = 1 chunk riêng:
const Home = React.lazy(() => import("./pages/Home"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Settings = React.lazy(() => import("./pages/Settings"));
const AdminPanel = React.lazy(() => import("./pages/AdminPanel"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Suspense>
  );
}

// ═══ STRATEGY 2: COMPONENT-BASED SPLITTING ═══

function ChatInput() {
  const [showEmoji, setShowEmoji] = useState(false);
  const EmojiPicker = React.lazy(() => import("./EmojiPicker"));

  return (
    <div>
      <input type="text" />
      <button onClick={() => setShowEmoji(true)}>😀</button>
      {showEmoji && (
        <Suspense fallback={<span>Loading...</span>}>
          <EmojiPicker />
        </Suspense>
      )}
    </div>
  );
}

// ═══ STRATEGY 3: LIBRARY-BASED SPLITTING ═══

// Heavy library → dynamic import:
async function renderChart(data) {
  const { Chart } = await import("chart.js");
  // Chart.js CHỈ load khi gọi renderChart!
  const chart = new Chart(canvas, { data });
}
```

```
STATIC vs DYNAMIC — QUYẾT ĐỊNH:
═══════════════════════════════════════════════════════════════

  GIỮA Static Import KHI:
  → Module NHỎ (<10KB!)
  → Module DÙNG NGAY khi page load!
  → Module dùng ở EVERY page!
  → Utilities, constants, types!
  → Core UI components (Button, Input!)

  CHUYỂN sang Dynamic Import KHI:
  → Module LỚN (>30KB!)
  → Module dùng SAU user interaction!
  → Module dùng CHỈ ở 1 route!
  → Module dùng CONDITIONAL (admin only!)
  → Heavy libraries (chart.js, moment, monaco-editor!)
  → Below-the-fold content!
```

---

## §11. Real-World Patterns

```javascript
// ═══ IMPORT PATTERNS THỰC TẾ ═══

// ① Constants/Config — LUÔN static:
import { API_URL, MAX_RETRIES } from './config';
import { ROUTES } from './constants/routes';
// → Nhỏ, cần ngay, dùng mọi nơi!

// ② Types (TypeScript) — LUÔN static + import type:
import type { User, Post, Comment } from './types';
// → import type KHÔNG vào bundle!
// → Chỉ dùng lúc TYPE CHECK!
// → Build xong → BIẾN MẤT!

// ③ Hooks/Utilities — LUÔN static:
import { useState, useEffect, useCallback } from 'react';
import { formatDate, debounce } from './utils';
// → Nhỏ, tree shakeable!

// ④ Heavy Components — Dynamic:
const RichTextEditor = React.lazy(() => import('./RichTextEditor'));
const VideoPlayer = React.lazy(() => import('./VideoPlayer'));
const PDFViewer = React.lazy(() => import('./PDFViewer'));
// → Nặng, dùng conditional!

// ⑤ Conditional Features — Dynamic:
async function loadAdminFeatures() {
    if (user.role === 'admin') {
        const { AdminDashboard } = await import('./admin');
        renderAdmin(AdminDashboard);
    }
}

// ⑥ Polyfills — Conditional Dynamic:
async function loadPolyfills() {
    if (!('IntersectionObserver' in window)) {
        await import('intersection-observer');
    }
    if (!('fetch' in window)) {
        await import('whatwg-fetch');
    }
}
// → CHỈ load polyfill nếu browser CHƯA CÓ!
```

```javascript
// ═══ LIBRARY IMPORT — BEST PRACTICES ═══

// ❌ BAD — import TOÀN BỘ lodash:
import _ from "lodash";
_.debounce(fn, 300);
// → 72KB vào bundle! CHỈ dùng 1 function!

// ✅ GOOD — cherry-pick:
import debounce from "lodash/debounce";
// → Chỉ load debounce! ~1KB!

// ✅ BETTER — lodash-es (tree shakeable!):
import { debounce } from "lodash-es";
// → Tree shaking loại bỏ phần còn lại!

// ❌ BAD — import TOÀN BỘ moment:
import moment from "moment";
// → 300KB! Bao gồm TẤT CẢ locales!

// ✅ GOOD — dùng date-fns:
import { format, parseISO } from "date-fns";
// → Tree shakeable! Chỉ load functions cần!
// → ~5KB thay vì 300KB!

// ❌ BAD — import tất cả icons:
import * as Icons from "@heroicons/react";
// → Hàng trăm icons vào bundle!

// ✅ GOOD — import từng icon:
import { HomeIcon, UserIcon } from "@heroicons/react/24/solid";
// → Chỉ 2 icons!
```

---

## §12. Tradeoffs — Ưu & Nhược điểm

```
ƯU ĐIỂM CỦA STATIC IMPORT:
═══════════════════════════════════════════════════════════════

  ✅ TREE SHAKING:
  → Bundler BIẾT chính xác dùng gì!
  → Loại bỏ dead code!
  → Bundle NHỎ hơn!

  ✅ STATIC ANALYSIS:
  → IDE autocomplete!
  → TypeScript type checking!
  → ESLint import rules!
  → Find references! Rename!

  ✅ PREDICTABLE EXECUTION:
  → Thứ tự chạy RÕ RÀNG!
  → Dependencies loaded TRƯỚC!
  → Không có async surprise!

  ✅ BUNDLER OPTIMIZATION:
  → Webpack/Vite tối ưu tốt nhất!
  → Scope hoisting!
  → Module concatenation!
  → Dead code elimination!

  ✅ ĐƠN GIẢN:
  → Dễ đọc, dễ hiểu!
  → Import ở đầu file → nhìn là biết dependencies!
```

```
NHƯỢC ĐIỂM CỦA STATIC IMPORT:
═══════════════════════════════════════════════════════════════

  ❌ INITIAL BUNDLE SIZE:
  → TẤT CẢ static imports → initial bundle!
  → Bundle lớn = load CHẬM!
  → Đặc biệt trên mobile/3G!

  ❌ KHÔNG CONDITIONAL:
  → Không thể import trong if/else!
  → Không thể import based on runtime condition!
  → → Admin module load cho TẤT CẢ users!

  ❌ UPFRONT COST:
  → TẤT CẢ modules chạy trước khi app render!
  → Modules NẶNG block rendering!
  → TTFB (Time to First Byte) chậm hơn!

  ❌ LÃNG PHÍ:
  → Components chưa cần → vẫn load!
  → Below-the-fold content → vẫn load!
  → Features ít dùng → vẫn load!
```

---

## §13. Tóm tắt

```
STATIC IMPORT — TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Static Import là gì?"
  A: Import module ở ĐẦU FILE bằng import X from 'Y'!
  Engine phân tích TRƯỚC khi chạy! Tất cả vào
  INITIAL BUNDLE! Cho phép tree shaking!

  Q: "Static vs Dynamic?"
  A: Static = compile time, top-level, initial bundle!
  Dynamic = runtime, anywhere, separate chunk!
  Static cho small/critical; Dynamic cho large/lazy!

  Q: "Tree Shaking?"
  A: Bundler LOẠI BỎ exports không được import!
  Cần: ES Modules + Named exports + No side effects!
  sideEffects: false trong package.json!

  Q: "Barrel Files?"
  A: index.js re-export tất cả từ folder!
  Import SẠCH: import { X } from './components'!
  CẢNH BÁO: có thể load TẤT CẢ nếu config sai!

  Q: "Circular Dependencies?"
  A: A imports B, B imports A → undefined behavior!
  Fix: tách shared code, dependency injection!
  Detect: eslint-plugin-import + no-cycle rule!

  Q: "Khi nào static, khi nào dynamic?"
  A: Static: small, critical, core components!
  Dynamic: large (>30KB), user interaction,
  conditional, specific routes!
```

---

### Checklist

- [ ] **Static Import**: `import X from 'Y'` ở đầu file; compile time; vào initial bundle!
- [ ] **Named vs Default Export**: Named = tên chính xác, tree shake tốt; Default = tên tùy ý, 1/file!
- [ ] **Module Execution Order**: imports chạy TRƯỚC body; mỗi module chỉ chạy 1 LẦN; cached!
- [ ] **Initial Bundle**: tất cả static imports → 1 bundle; lớn = slow load!
- [ ] **Tree Shaking**: loại bỏ unused exports; cần ESM + named exports + no side effects!
- [ ] **sideEffects**: `"sideEffects": false` trong package.json; cho phép aggressive tree shaking!
- [ ] **Barrel Files**: index.js re-export; clean imports nhưng CẨN THẬN performance!
- [ ] **Circular Dependencies**: A ↔ B = bug; fix: shared module, DI; detect: eslint no-cycle!
- [ ] **Static vs Dynamic**: Static = compile time; Dynamic = runtime + separate chunk!
- [ ] **Bundle Analysis**: webpack-bundle-analyzer, rollup-plugin-visualizer, @next/bundle-analyzer!
- [ ] **Library imports**: cherry-pick (`lodash/debounce`); dùng ESM versions (`lodash-es`)!
- [ ] **import type**: TypeScript only; KHÔNG vào bundle; chỉ type checking!

---

_Nguồn: patterns.dev — Static Import, Webpack Documentation, MDN — ES Modules_
_Cập nhật lần cuối: Tháng 2, 2026_
