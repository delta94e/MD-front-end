# typescript — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/typescript
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. typescript Config Là Gì?

```
  typescript — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Configure TypeScript behavior trong Next.js! ★★★       │
  │  → 2 options: ignoreBuildErrors + tsconfigPath! ★          │
  │                                                              │
  │  2 OPTIONS:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ┌─────────────────────┬──────────┬─────────────┐     │    │
  │  │  │ Option              │ Type     │ Default     │     │    │
  │  │  ├─────────────────────┼──────────┼─────────────┤     │    │
  │  │  │ ignoreBuildErrors   │ boolean  │ false       │     │    │
  │  │  │ tsconfigPath        │ string   │ tsconfig.json│    │    │
  │  │  └─────────────────────┴──────────┴─────────────┘     │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    typescript: {                                       │    │
  │  │      ignoreBuildErrors: false,  ★                     │    │
  │  │      tsconfigPath: 'tsconfig.json' ★                 │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. ignoreBuildErrors + tsconfigPath!

```
  CHI TIẾT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ignoreBuildErrors:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  DEFAULT (false):                                      │    │
  │  │  next build → TS errors → BUILD FAIL! ★★★            │    │
  │  │                                                       │    │
  │  │  src/page.tsx                                          │    │
  │  │    → Type 'string' is not assignable...               │    │
  │  │    → BUILD FAILED! ❌                                  │    │
  │  │                                                       │    │
  │  │  ENABLED (true):                                       │    │
  │  │  next build → TS errors → BUILD SUCCESS! ⚠️ ★★★       │    │
  │  │  → ⚠️ DANGEROUS! Production có thể lỗi! ★★★          │    │
  │  │  → PHẢI chạy type check riêng! ★★★                  │    │
  │  │  → CI/CD: tsc --noEmit trước deploy! ★               │    │
  │  │                                                       │    │
  │  │  KHI NÀO DÙNG:                                        │    │
  │  │  → Migration JS → TS (nhiều errors chưa fix)! ★      │    │
  │  │  → CI đã có type check step riêng! ★                 │    │
  │  │  → Urgent hotfix cần deploy nhanh! ★                 │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  tsconfigPath:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  DEFAULT: dùng tsconfig.json ★                        │    │
  │  │                                                       │    │
  │  │  CUSTOM:                                               │    │
  │  │  typescript: {                                         │    │
  │  │    tsconfigPath: 'tsconfig.build.json' ★★★            │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  KHI NÀO DÙNG:                                        │    │
  │  │  → tsconfig.json cho dev (strict)                     │    │
  │  │  → tsconfig.build.json cho build (khác options)! ★   │    │
  │  │  → Monorepo: nhiều tsconfig files! ★                  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BUILD FLOW:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  next build                                            │    │
  │  │       ↓                                                │    │
  │  │  Load tsconfig (tsconfigPath) ★                       │    │
  │  │       ↓                                                │    │
  │  │  Type check ALL .ts/.tsx files                         │    │
  │  │       ↓                                                │    │
  │  │  ┌─── Errors? ───┐                                    │    │
  │  │  │                │                                    │    │
  │  │  ↓ YES            ↓ NO                                 │    │
  │  │  ignoreBuild      Build success! ✅                    │    │
  │  │  Errors?                                               │    │
  │  │  ↓ true    ↓ false                                     │    │
  │  │  ⚠️ WARN    ❌ FAIL                                     │    │
  │  │  Continue  Stop!                                       │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — TypescriptConfigEngine!

```javascript
var TypescriptConfigEngine = (function () {
  // ═══════════════════════════════════
  // 1. TYPE CHECKER SIMULATOR
  // ═══════════════════════════════════
  function typeCheck(files) {
    var errors = [];
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (file.errors && file.errors.length > 0) {
        for (var j = 0; j < file.errors.length; j++) {
          errors.push({ file: file.name, error: file.errors[j] });
        }
      }
    }
    return errors;
  }

  // ═══════════════════════════════════
  // 2. BUILD DECISION
  // ═══════════════════════════════════
  function build(files, config) {
    var tsConfig = config || {};
    var ignoreBuildErrors = tsConfig.ignoreBuildErrors || false;
    var tsconfigPath = tsConfig.tsconfigPath || "tsconfig.json";

    var errors = typeCheck(files);

    if (errors.length === 0) {
      return {
        success: true,
        tsconfig: tsconfigPath,
        errors: 0,
        note: "Build SUCCESS! No TS errors! ✅ ★★★",
      };
    }

    if (ignoreBuildErrors) {
      return {
        success: true,
        tsconfig: tsconfigPath,
        errors: errors.length,
        ignored: true,
        note: "⚠️ DANGEROUS! " + errors.length + " errors IGNORED! ★★★",
        details: errors,
      };
    }

    return {
      success: false,
      tsconfig: tsconfigPath,
      errors: errors.length,
      note: "❌ BUILD FAILED! Fix " + errors.length + " TS errors! ★★★",
      details: errors,
    };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ TypescriptConfig Engine ═══");

    var files = [
      {
        name: "page.tsx",
        errors: ["Type 'string' not assignable to 'number'"],
      },
      { name: "utils.ts", errors: [] },
      { name: "api.ts", errors: ["Property 'x' does not exist on type 'Y'"] },
    ];

    console.log("\n── 1. Default (fail on errors) ──");
    console.log(build(files, {}));

    console.log("\n── 2. ignoreBuildErrors: true ──");
    console.log(build(files, { ignoreBuildErrors: true }));

    console.log("\n── 3. Custom tsconfig ──");
    console.log(
      build([{ name: "ok.tsx", errors: [] }], {
        tsconfigPath: "tsconfig.build.json",
      }),
    );
  }

  return { demo: demo };
})();
// Chạy: TypescriptConfigEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: ignoreBuildErrors dùng khi nào?                        │
  │  → Migration JS → TS (nhiều errors)! ★                    │
  │  → CI đã có type check riêng! ★★★                        │
  │  → ⚠️ DANGEROUS! Production có thể runtime error! ★★★     │
  │                                                              │
  │  ❓ 2: tsconfigPath?                                           │
  │  → Custom tsconfig file cho build! ★                      │
  │  → VD: tsconfig.build.json (khác dev)! ★★★               │
  │  → Monorepo: nhiều tsconfig files! ★                      │
  │                                                              │
  │  ❓ 3: Default behavior?                                       │
  │  → next build type check → errors → FAIL! ★★★            │
  │  → An toàn: không deploy code lỗi type! ★                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
