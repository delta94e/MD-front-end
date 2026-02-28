# optimizePackageImports — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. optimizePackageImports Là Gì?

```
  optimizePackageImports — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Optimize barrel imports cho large packages! ★★★         │
  │  → Chỉ load modules THỰC SỰ dùng! ★★★                    │
  │  → Giữ convenience of named exports! ★                    │
  │                                                              │
  │  VẤN ĐỀ — BARREL IMPORTS:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  // Package có 1000+ exports:                          │    │
  │  │  import { Button } from '@mui/material'               │    │
  │  │                                                       │    │
  │  │  KHÔNG có optimization:                                │    │
  │  │  → Load index.js → resolve ALL 1000+ exports! ★★★   │    │
  │  │  → Compile 1000+ modules! ★★★                         │    │
  │  │  → CHẬM dev + build lớn! ★★★                        │    │
  │  │                                                       │    │
  │  │  CÓ optimization:                                      │    │
  │  │  → import { Button } from '@mui/material'             │    │
  │  │  → Transform thành:                                   │    │
  │  │    import Button from '@mui/material/Button' ★★★     │    │
  │  │  → Chỉ load 1 module! NHANH! ★★★                    │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    experimental: {                                     │    │
  │  │      optimizePackageImports: ['package-name'] ★★★    │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Default Optimized Packages — 25+ Packages!

```
  DEFAULT PACKAGES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌─── UI Frameworks ───────────────────────────────────┐     │
  │  │  • @mui/material          (Material UI)              │     │
  │  │  • @mui/icons-material    (MUI icons)                │     │
  │  │  • @material-ui/core      (legacy MUI)               │     │
  │  │  • @material-ui/icons     (legacy MUI icons)         │     │
  │  │  • antd                   (Ant Design)               │     │
  │  │  • @ant-design/icons      (Ant icons)                │     │
  │  │  • react-bootstrap        (Bootstrap)                │     │
  │  │  • @tremor/react          (Tremor)                   │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  │  ┌─── Icon Libraries ──────────────────────────────────┐     │
  │  │  • lucide-react                                       │     │
  │  │  • @heroicons/react/20/solid                          │     │
  │  │  • @heroicons/react/24/solid                          │     │
  │  │  • @heroicons/react/24/outline                        │     │
  │  │  • @tabler/icons-react                                │     │
  │  │  • react-icons/*                                      │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  │  ┌─── Utility Libraries ───────────────────────────────┐     │
  │  │  • lodash-es              • date-fns                  │     │
  │  │  • ramda                  • rxjs                      │     │
  │  │  • ahooks                 • react-use                 │     │
  │  │  • effect                 • @effect/*                 │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  │  ┌─── Headless UI + Charts ────────────────────────────┐     │
  │  │  • @headlessui/react      • recharts                  │     │
  │  │  • @headlessui-float/react• @visx/visx                │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  │  → Tự động optimized! Không cần config! ★★★                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — OptimizeImportsEngine!

```javascript
var OptimizeImportsEngine = (function () {
  // ═══════════════════════════════════
  // 1. DEFAULT OPTIMIZED PACKAGES
  // ═══════════════════════════════════
  var DEFAULT_PACKAGES = [
    "lucide-react",
    "date-fns",
    "lodash-es",
    "ramda",
    "antd",
    "react-bootstrap",
    "ahooks",
    "@ant-design/icons",
    "@headlessui/react",
    "@heroicons/react",
    "@mui/material",
    "@mui/icons-material",
    "recharts",
    "react-use",
    "react-icons",
    "@tabler/icons-react",
    "rxjs",
    "effect",
  ];

  // ═══════════════════════════════════
  // 2. IMPORT TRANSFORMER
  // ═══════════════════════════════════
  function transformImport(importStmt, customPackages) {
    var allPackages = DEFAULT_PACKAGES.concat(customPackages || []);
    // Parse: import { X, Y } from 'package'
    var match = importStmt.match(
      /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/,
    );
    if (!match) return { original: importStmt, optimized: false };

    var names = match[1].split(",").map(function (n) {
      return n.trim();
    });
    var pkg = match[2];

    // Check if package should be optimized
    var shouldOptimize = false;
    for (var i = 0; i < allPackages.length; i++) {
      if (pkg === allPackages[i] || pkg.indexOf(allPackages[i]) === 0) {
        shouldOptimize = true;
        break;
      }
    }

    if (!shouldOptimize) {
      return { original: importStmt, optimized: false };
    }

    // Transform to direct imports
    var transformed = names.map(function (name) {
      return "import " + name + " from '" + pkg + "/" + name + "'";
    });

    return {
      original: importStmt,
      optimized: true,
      result: transformed,
      modulesSaved:
        names.length > 1
          ? "Only " + names.length + " modules instead of ALL! ★★★"
          : "Direct import! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. BUNDLE SIZE ESTIMATOR
  // ═══════════════════════════════════
  function estimateSavings(pkg, totalExports, usedExports) {
    var withoutOpt = totalExports * 5; // KB per module (estimated)
    var withOpt = usedExports * 5;
    var saved = withoutOpt - withOpt;

    return {
      package: pkg,
      total: totalExports + " exports",
      used: usedExports + " imports",
      withoutOptimization: withoutOpt + "KB",
      withOptimization: withOpt + "KB",
      saved: saved + "KB (" + Math.round((saved / withoutOpt) * 100) + "%)",
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ OptimizeImports Engine ═══");

    console.log("\n── 1. Transform ──");
    console.log(
      transformImport("import { Button, TextField } from '@mui/material'"),
    );
    console.log(transformImport("import { format, addDays } from 'date-fns'"));
    console.log(transformImport("import { useState } from 'react'")); // not optimized

    console.log("\n── 2. Savings ──");
    console.log(estimateSavings("@mui/material", 200, 5));
    console.log(estimateSavings("lodash-es", 300, 3));
    console.log(estimateSavings("lucide-react", 1500, 10));
  }

  return { demo: demo };
})();
// Chạy: OptimizeImportsEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: optimizePackageImports dùng làm gì?                     │
  │  → Optimize barrel imports! ★★★                            │
  │  → Chỉ load modules thực sự dùng! ★                       │
  │  → Packages export 100s-1000s modules → chỉ load cần! ★  │
  │                                                              │
  │  ❓ 2: Barrel import vấn đề gì?                                │
  │  → import { X } from 'big-package'                         │
  │  → Load + compile ALL exports! ★★★                        │
  │  → Chậm dev + bundle lớn! ★                               │
  │                                                              │
  │  ❓ 3: Packages nào optimized mặc định?                        │
  │  → @mui/material, antd, lodash-es, date-fns,              │
  │    lucide-react, react-icons, recharts...! ★★★            │
  │  → 25+ packages! Không cần config! ★                      │
  │                                                              │
  │  ❓ 4: Thêm custom package?                                    │
  │  → experimental.optimizePackageImports: ['pkg']! ★★★      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
