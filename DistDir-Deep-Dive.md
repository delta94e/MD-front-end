# distDir — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/distDir
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. distDir Là Gì?

```
  distDir — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Custom build DIRECTORY name! ★                           │
  │  → Thay .next (mặc định) bằng tên khác! ★★★               │
  │  → PHẢI nằm trong project directory! ★★★                  │
  │  → ../build = INVALID! ★★★                                 │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // next.config.js                                    │    │
  │  │  module.exports = {                                   │    │
  │  │    distDir: 'build'  ← thay .next bằng build! ★★★    │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BEFORE vs AFTER:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  MẶC ĐỊNH:              VỚI distDir: 'build':         │    │
  │  │  my-app/                my-app/                        │    │
  │  │  ├── .next/ ★           ├── build/ ★★★                │    │
  │  │  │   ├── static/        │   ├── static/                │    │
  │  │  │   ├── server/        │   ├── server/                │    │
  │  │  │   └── cache/         │   └── cache/                 │    │
  │  │  ├── app/               ├── app/                       │    │
  │  │  ├── public/            ├── public/                    │    │
  │  │  └── next.config.js     └── next.config.js             │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ CONSTRAINT:                                                │
  │  ✅ 'build'           → my-app/build/ OK! ★                  │
  │  ✅ 'dist'            → my-app/dist/ OK! ★                   │
  │  ✅ '.output'         → my-app/.output/ OK! ★                │
  │  ❌ '../build'        → NGOÀI project! INVALID! ★★★          │
  │  ❌ '/tmp/build'      → NGOÀI project! INVALID! ★★★          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Khi Nào Cần?

```
  USE CASES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① CI/CD naming conventions:                                  │
  │  → distDir: 'dist' (phổ biến trong nhiều frameworks)! ★   │
  │                                                              │
  │  ② Monorepo conflict:                                         │
  │  → Nhiều Next.js apps dùng chung thư mục! ★               │
  │  → distDir: 'build-app1', 'build-app2'! ★                 │
  │                                                              │
  │  ③ Docker / deployment scripts:                               │
  │  → Script expect folder 'build'! ★                         │
  │  → distDir: 'build' cho compatibility! ★                   │
  │                                                              │
  │  ④ .gitignore:                                                │
  │  → Đã ignore 'build' nhưng không ignore '.next'! ★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — DistDirEngine!

```javascript
var DistDirEngine = (function () {
  // ═══════════════════════════════════
  // 1. CONFIG VALIDATOR
  // ═══════════════════════════════════
  function validateDistDir(distDir) {
    if (!distDir || typeof distDir !== "string") {
      return {
        value: ".next",
        source: "DEFAULT! ★",
        valid: true,
      };
    }

    // Must not leave project directory
    if (distDir.indexOf("..") >= 0) {
      return {
        value: distDir,
        valid: false,
        error: "KHÔNG được dùng ../! Phải trong project! ★★★",
      };
    }

    if (distDir.charAt(0) === "/") {
      return {
        value: distDir,
        valid: false,
        error: "KHÔNG được dùng absolute path! ★★★",
      };
    }

    return {
      value: distDir,
      valid: true,
      note: "Build output → ./" + distDir + "/ ★",
    };
  }

  // ═══════════════════════════════════
  // 2. DIRECTORY STRUCTURE GENERATOR
  // ═══════════════════════════════════
  function generateStructure(distDir) {
    var dir = distDir || ".next";
    return {
      root: dir + "/",
      children: [
        dir + "/static/       ← JS, CSS, media! ★",
        dir + "/server/       ← server bundles! ★",
        dir + "/cache/        ← build cache! ★",
        dir + "/BUILD_ID      ← build identifier! ★",
        dir + "/build-manifest.json",
      ],
    };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ DistDir Engine ═══");

    console.log("\n── 1. Validate ──");
    console.log("Default:", validateDistDir(null));
    console.log("'build':", validateDistDir("build"));
    console.log("'dist':", validateDistDir("dist"));
    console.log("'../build':", validateDistDir("../build"));
    console.log("'/tmp/build':", validateDistDir("/tmp/build"));

    console.log("\n── 2. Structure ──");
    console.log("Default:", generateStructure(null));
    console.log("Custom:", generateStructure("build"));
  }

  return { demo: demo };
})();
// Chạy: DistDirEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: distDir dùng làm gì?                                    │
  │  → Đổi tên build directory! ★                              │
  │  → Mặc định: .next! ★                                      │
  │  → VD: distDir: 'build' → my-app/build/! ★                │
  │                                                              │
  │  ❓ 2: Constraint?                                             │
  │  → PHẢI trong project directory! ★★★                       │
  │  → ../build = INVALID! ★★★                                 │
  │  → /tmp/build = INVALID! ★★★                               │
  │                                                              │
  │  ❓ 3: Khi nào cần?                                            │
  │  → CI/CD naming, monorepo, Docker scripts! ★               │
  │  → .gitignore compatibility! ★                              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
