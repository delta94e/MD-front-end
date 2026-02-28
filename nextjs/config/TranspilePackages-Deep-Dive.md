# transpilePackages — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. transpilePackages Là Gì?

```
  transpilePackages — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Auto transpile + bundle dependencies! ★★★              │
  │  → Local packages (monorepo) ★★★                          │
  │  → External packages (node_modules) ★★★                   │
  │  → Thay thế next-transpile-modules package! ★             │
  │  → Built-in từ v13.0.0! ★                                 │
  │                                                              │
  │  VẤN ĐỀ:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  node_modules packages thường:                         │    │
  │  │  → Đã pre-compiled (CommonJS) ★                      │    │
  │  │  → KHÔNG cần transpile ★                              │    │
  │  │                                                       │    │
  │  │  Nhưng MỘT SỐ packages:                               │    │
  │  │  → Publish source code (ESM, JSX, TS) ★★★            │    │
  │  │  → Monorepo local packages ★★★                       │    │
  │  │  → CẦN transpile! ★★★                                │    │
  │  │                                                       │    │
  │  │  Không transpile → Error! ★★★                        │    │
  │  │  → SyntaxError: Unexpected token 'export'             │    │
  │  │  → Cannot use import statement                         │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const nextConfig = {                                  │    │
  │  │    transpilePackages: [                                │    │
  │  │      '@my-org/ui',         // monorepo pkg ★★★       │    │
  │  │      'some-esm-package',   // ESM-only pkg ★         │    │
  │  │      'lodash-es'           // ESM lodash ★            │    │
  │  │    ]                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  import { Button } from '@my-org/ui'                   │    │
  │  │       ↓                                                │    │
  │  │  '@my-org/ui' in transpilePackages? ★★★               │    │
  │  │       ↓ YES                     ↓ NO                   │    │
  │  │  Transpile with                Use as-is               │    │
  │  │  SWC/Babel! ★★★               (pre-compiled)          │    │
  │  │  JSX → JS                                              │    │
  │  │  TS → JS                                               │    │
  │  │  ESM → bundled                                         │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VERSION: v13.0.0 ★                                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Tự Viết — TranspilePackagesEngine!

```javascript
var TranspilePackagesEngine = (function () {
  // ═══════════════════════════════════
  // 1. PACKAGE RESOLVER
  // ═══════════════════════════════════
  function shouldTranspile(packageName, transpileList) {
    for (var i = 0; i < transpileList.length; i++) {
      if (packageName === transpileList[i]) return true;
      // Support scoped packages
      if (packageName.indexOf(transpileList[i] + "/") === 0) return true;
    }
    return false;
  }

  // ═══════════════════════════════════
  // 2. TRANSPILER SIMULATOR
  // ═══════════════════════════════════
  function transpile(source, format) {
    if (format === "esm") {
      return {
        original: format,
        output: "cjs",
        note: "ESM → CJS transpiled ★★★",
      };
    }
    if (format === "jsx") {
      return {
        original: format,
        output: "js",
        note: "JSX → JS transpiled ★★★",
      };
    }
    if (format === "ts") {
      return {
        original: format,
        output: "js",
        note: "TS → JS transpiled ★★★",
      };
    }
    return { original: format, output: format, note: "Already compiled ★" };
  }

  // ═══════════════════════════════════
  // 3. BUILD RESOLVER
  // ═══════════════════════════════════
  function resolve(imports, config) {
    var results = [];
    var transpileList = config.transpilePackages || [];

    for (var i = 0; i < imports.length; i++) {
      var imp = imports[i];
      var needsTranspile = shouldTranspile(imp.package, transpileList);

      if (needsTranspile) {
        results.push({
          package: imp.package,
          action: "transpile",
          transform: transpile(imp.source, imp.format),
        });
      } else if (imp.format !== "cjs" && imp.format !== "js") {
        results.push({
          package: imp.package,
          action: "ERROR",
          note: "❌ Not in transpilePackages! SyntaxError! ★★★",
        });
      } else {
        results.push({
          package: imp.package,
          action: "use-as-is",
          note: "Pre-compiled CJS, no transpile needed ★",
        });
      }
    }
    return results;
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ TranspilePackages Engine ═══");

    var imports = [
      { package: "@my-org/ui", format: "jsx" },
      { package: "lodash-es", format: "esm" },
      { package: "react", format: "cjs" },
      { package: "broken-esm", format: "esm" },
    ];

    var config = {
      transpilePackages: ["@my-org/ui", "lodash-es"],
    };

    console.log("\n── Resolve imports ──");
    var results = resolve(imports, config);
    for (var i = 0; i < results.length; i++) {
      console.log(results[i]);
    }
  }

  return { demo: demo };
})();
// Chạy: TranspilePackagesEngine.demo();
```

---

## §3. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: transpilePackages dùng khi nào?                        │
  │  → Monorepo local packages (JSX, TS)! ★★★                │
  │  → ESM-only packages trong node_modules! ★★★             │
  │  → Packages chưa pre-compiled! ★                          │
  │                                                              │
  │  ❓ 2: Thay thế gì?                                           │
  │  → Thay thế next-transpile-modules! ★★★                  │
  │  → Built-in từ v13.0.0! ★                                 │
  │                                                              │
  │  ❓ 3: Không dùng thì sao?                                    │
  │  → SyntaxError: Unexpected token 'export'! ★★★           │
  │  → Cannot use import statement! ★                         │
  │  → ESM/JSX/TS không được transpile! ★                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
