# Fast Refresh — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/architecture/fast-refresh
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. Fast Refresh Là Gì?

```
  Fast Refresh — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → React feature tích hợp trong Next.js! ★★★              │
  │  → Live reload GIỮA state không mất! ★★★                 │
  │  → Default ON từ Next.js 9.4+! ★                          │
  │  → Edit → thấy kết quả < 1 giây! ★★★                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. How It Works — 3 Trường Hợp!

```
  3 TRƯỜNG HỢP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Edit file → Fast Refresh check:                              │
  │                                                              │
  │  CASE 1: File CHỈ export React components ★★★               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Edit Button.tsx (only React component)               │    │
  │  │       ↓                                                │    │
  │  │  Update code CHỈ file đó! ★★★                        │    │
  │  │       ↓                                                │    │
  │  │  Re-render component! ★                               │    │
  │  │       ↓                                                │    │
  │  │  STATE GIỮ NGUYÊN! ✅ ★★★                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CASE 2: File export NON-React values ★★                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Edit theme.js (constants, utils, etc.)               │    │
  │  │       ↓                                                │    │
  │  │  Re-run file đó + TẤT CẢ files import nó! ★★★       │    │
  │  │       ↓                                                │    │
  │  │  Button.js imports theme.js → re-render Button!       │    │
  │  │  Modal.js imports theme.js → re-render Modal!         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CASE 3: File imported NGOÀI React tree ★                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  File exports component + constant                     │    │
  │  │  Non-React utility imports constant                    │    │
  │  │       ↓                                                │    │
  │  │  FULL RELOAD! ❌ ★★★                                  │    │
  │  │       ↓                                                │    │
  │  │  FIX: tách constant ra file riêng! ★★★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Error Resilience!

```
  ERRORS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  SYNTAX ERRORS:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Lỗi cú pháp → Fix → Save → Auto OK! ★★★            │    │
  │  │  → KHÔNG cần reload! ★                                │    │
  │  │  → KHÔNG mất state! ★★★                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  RUNTIME ERRORS:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Lỗi runtime → Overlay hiện ra! ★★★                  │    │
  │  │  Fix → Overlay tự mất! ★                              │    │
  │  │  → KHÔNG reload app! ★★★                              │    │
  │  │                                                       │    │
  │  │  Lỗi NGOÀI rendering → STATE GIỮ! ✅ ★★★             │    │
  │  │  Lỗi TRONG rendering → React REMOUNT! ❌ ★            │    │
  │  │                                                       │    │
  │  │  Error Boundaries:                                     │    │
  │  │  → Retry rendering sau khi fix! ★★★                   │    │
  │  │  → Không reset root state! ★                          │    │
  │  │  → Đừng quá granular! ★                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Limitations + Tips!

```
  LIMITATIONS + TIPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  STATE RESET KHI:                                             │
  │  → Class components (KHÔNG preserve state!) ★★★           │
  │  → File có exports khác ngoài React component! ★          │
  │  → HOC(WrappedComponent) trả về class! ★                  │
  │  → Anonymous: export default () => <div /> ★★★            │
  │    (dùng name-default-component codemod!) ★                │
  │                                                              │
  │  TIPS:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  → Function components + Hooks = GIỮ state! ★★★       │    │
  │  │  → // @refresh reset = FORCE remount! ★★★             │    │
  │  │  → console.log, debugger; trong components OK! ★      │    │
  │  │  → Imports CASE SENSITIVE! ★★★                        │    │
  │  │     './header' ≠ './Header' → FAIL! ★★★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Fast Refresh và Hooks!

```
  HOOKS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  GIỮ STATE:                                                   │
  │  → useState: GIỮ giá trị! ★★★                            │
  │  → useRef: GIỮ giá trị! ★★★                              │
  │  → Điều kiện: không đổi arguments + order! ★★★           │
  │                                                              │
  │  LUÔN RE-RUN:                                                 │
  │  → useEffect: LUÔN chạy lại! ★★★                        │
  │  → useMemo: LUÔN tính lại! ★★★                          │
  │  → useCallback: LUÔN tạo lại! ★★★                       │
  │  → Dependencies array bị IGNORE! ★★★                     │
  │                                                              │
  │  VÍ DỤ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  useMemo(() => x * 2, [x])                            │    │
  │  │       ↓ edit thành                                     │    │
  │  │  useMemo(() => x * 10, [x])                           │    │
  │  │       ↓                                                │    │
  │  │  RE-RUN! (dù x không đổi!) ★★★                       │    │
  │  │  → Nếu không → edit không hiển thị!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  useEffect([]):                                               │
  │  → Empty deps → vẫn re-run 1 lần! ★★★                   │
  │  → Good practice: viết code resilient! ★                  │
  │  → React Strict Mode cũng làm vậy! ★                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — FastRefreshEngine!

```javascript
var FastRefreshEngine = (function () {
  // ═══════════════════════════════════
  // 1. MODULE ANALYZER
  // ═══════════════════════════════════
  function analyzeModule(mod) {
    var hasReactExports = false;
    var hasNonReactExports = false;
    var hasOutsideImporters = false;

    for (var i = 0; i < mod.exports.length; i++) {
      if (mod.exports[i].type === "component") hasReactExports = true;
      else hasNonReactExports = true;
    }
    if (mod.importedByNonReact) hasOutsideImporters = true;

    return {
      hasReactExports: hasReactExports,
      hasNonReactExports: hasNonReactExports,
      hasOutsideImporters: hasOutsideImporters,
    };
  }

  // ═══════════════════════════════════
  // 2. REFRESH STRATEGY
  // ═══════════════════════════════════
  function determineStrategy(mod) {
    var analysis = analyzeModule(mod);

    // Case 3: outside React tree
    if (analysis.hasOutsideImporters) {
      return {
        strategy: "full-reload",
        preserveState: false,
        note: "❌ FULL RELOAD! File imported outside React tree ★★★",
      };
    }
    // Case 1: only React components
    if (analysis.hasReactExports && !analysis.hasNonReactExports) {
      return {
        strategy: "hot-update",
        preserveState: true,
        note: "✅ Hot update! State preserved! ★★★",
      };
    }
    // Case 2: mixed exports
    return {
      strategy: "re-run-cascade",
      preserveState: false,
      note: "⚠️ Re-run file + all importers! State may reset ★",
    };
  }

  // ═══════════════════════════════════
  // 3. HOOKS BEHAVIOR
  // ═══════════════════════════════════
  function hooksBehavior(hookType) {
    var preserve = ["useState", "useRef"];
    var rerun = ["useEffect", "useMemo", "useCallback"];

    if (preserve.indexOf(hookType) >= 0) {
      return { hook: hookType, behavior: "PRESERVE value ★★★" };
    }
    if (rerun.indexOf(hookType) >= 0) {
      return { hook: hookType, behavior: "ALWAYS re-run (deps ignored!) ★★★" };
    }
    return { hook: hookType, behavior: "Unknown ★" };
  }

  // ═══════════════════════════════════
  // 4. STATE RESET CHECKER
  // ═══════════════════════════════════
  function willResetState(component) {
    if (component.type === "class")
      return { reset: true, reason: "Class component ★★★" };
    if (component.anonymous)
      return { reset: true, reason: "Anonymous arrow function ★★★" };
    if (component.hocWrapped)
      return { reset: true, reason: "HOC returns class ★" };
    if (component.refreshReset)
      return { reset: true, reason: "// @refresh reset directive ★★★" };
    return {
      reset: false,
      reason: "Function component: state preserved! ✅ ★★★",
    };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ FastRefresh Engine ═══");

    console.log("\n── 1. Refresh Strategy ──");
    console.log(
      determineStrategy({
        exports: [{ type: "component" }],
        importedByNonReact: false,
      }),
    );
    console.log(
      determineStrategy({
        exports: [{ type: "component" }, { type: "constant" }],
        importedByNonReact: false,
      }),
    );
    console.log(
      determineStrategy({
        exports: [{ type: "component" }, { type: "constant" }],
        importedByNonReact: true,
      }),
    );

    console.log("\n── 2. Hooks Behavior ──");
    console.log(hooksBehavior("useState"));
    console.log(hooksBehavior("useEffect"));
    console.log(hooksBehavior("useMemo"));

    console.log("\n── 3. State Reset Check ──");
    console.log(willResetState({ type: "function", anonymous: false }));
    console.log(willResetState({ type: "class" }));
    console.log(willResetState({ type: "function", anonymous: true }));
    console.log(willResetState({ type: "function", refreshReset: true }));
  }

  return { demo: demo };
})();
// Chạy: FastRefreshEngine.demo();
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: 3 cases của Fast Refresh?                               │
  │  → Only React exports → hot update, state GIỮ! ★★★       │
  │  → Non-React exports → re-run cascade! ★★★               │
  │  → Outside React tree → FULL RELOAD! ★★★                 │
  │                                                              │
  │  ❓ 2: Hooks behavior?                                         │
  │  → useState, useRef: GIỮ values! ★★★                     │
  │  → useEffect, useMemo, useCallback: LUÔN re-run! ★★★    │
  │  → Dependencies array IGNORE! ★★★                        │
  │                                                              │
  │  ❓ 3: Khi nào state bị reset?                                 │
  │  → Class components! ★★★                                  │
  │  → Anonymous: export default () => ... ★★★                │
  │  → HOC trả về class! ★                                    │
  │  → // @refresh reset directive! ★                         │
  │                                                              │
  │  ❓ 4: Error handling?                                         │
  │  → Syntax error: fix → auto OK, state giữ! ★★★           │
  │  → Runtime error: overlay, fix → tự mất! ★★★            │
  │  → Error boundaries: retry after fix! ★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
