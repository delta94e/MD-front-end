# src Folder — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/src-folder
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + "Good to know" callout!

---

## §1. src Folder Là Gì?

```
  src FOLDER — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Thay vì đặt app/ hoặc pages/ ở ROOT project...           │
  │  → Next.js HỖ TRỢ đặt chúng vào src/! ★                    │
  │  → src/app hoặc src/pages! ★                                 │
  │                                                              │
  │  WHY:                                                         │
  │  → TÁCH application code khỏi config files! ★               │
  │  → Config files (package.json, tsconfig, next.config)        │
  │    thường ở ROOT! ★                                          │
  │  → Application code (components, lib, utils) vào src/! ★    │
  │  → Clean structure! Team preference! ★                       │
  │                                                              │
  │  ⚠️ KHÔNG BẮT BUỘC! Tùy team quyết định! ★                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cấu Trúc Thư Mục — So Sánh!

```
  KHÔNG CÓ src/:                    CÓ src/:
  ┌──────────────────────┐          ┌──────────────────────┐
  │ my-project/           │          │ my-project/           │
  │ ├── app/               │          │ ├── src/               │
  │ │   ├── layout.tsx    │          │ │   ├── app/           │
  │ │   ├── page.tsx      │          │ │   │   ├── layout.tsx│
  │ │   └── globals.css   │          │ │   │   ├── page.tsx  │
  │ ├── components/       │          │ │   │   └── globals.css│
  │ │   ├── Header.tsx    │          │ │   ├── components/   │
  │ │   └── Footer.tsx    │          │ │   │   ├── Header.tsx│
  │ ├── lib/               │          │ │   │   └── Footer.tsx│
  │ │   └── utils.ts      │          │ │   └── lib/           │
  │ ├── public/           │          │ │       └── utils.ts  │
  │ │   └── favicon.ico   │          │ ├── public/       ★   │
  │ ├── .env.local        │          │ │   └── favicon.ico   │
  │ ├── next.config.js    │          │ ├── .env.local    ★   │
  │ ├── package.json      │          │ ├── next.config.js ★  │
  │ ├── tsconfig.json     │          │ ├── package.json  ★   │
  │ └── tailwind.config.js│          │ ├── tsconfig.json ★   │
  └──────────────────────┘          │ └── tailwind.config★  │
                                     └──────────────────────┘

  ★ = VẪN Ở ROOT! KHÔNG vào src/!
```

```
  CÁI GÌ VÀO src/ vs CÁI GÌ Ở ROOT:
  ┌──────────────────────┬──────────────────────────────────┐
  │ VÀO src/ ✅          │ Ở ROOT ★ (KHÔNG vào src!)       │
  ├──────────────────────┼──────────────────────────────────┤
  │ app/ (App Router!)   │ /public ★                        │
  │ pages/ (Pages Router)│ package.json ★                   │
  │ components/          │ next.config.js ★                 │
  │ lib/                 │ tsconfig.json ★                  │
  │ hooks/               │ .env.* files ★                   │
  │ utils/               │ tailwind.config.js ★             │
  │ styles/              │ postcss.config.js ★              │
  │ middleware.ts        │ .gitignore ★                     │
  │ Proxy (nếu dùng!)   │ README.md ★                      │
  └──────────────────────┴──────────────────────────────────┘
```

---

## §3. 8 Quy Tắc Quan Trọng! (từ "Good to know")

```
  8 QUY TẮC:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① /public → ở ROOT! ★                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → public/ chứa static assets (images, fonts...)      │    │
  │  │ → PHẢI ở root! Next.js serve từ root/public!         │    │
  │  │ → src/public ❌ KHÔNG hoạt động!                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② Config files → ở ROOT! ★                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → package.json, next.config.js, tsconfig.json        │    │
  │  │ → PHẢI ở root! Build tools đọc từ root!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ .env.* files → ở ROOT! ★                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → .env, .env.local, .env.production, .env.development│    │
  │  │ → Next.js ĐỌC từ root! src/.env ❌ bị ignore!        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ ROOT app/ ĐÈ src/app! ★★★                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Nếu có CẢ HAI: root/app + src/app                  │    │
  │  │ → root/app THẮNG! src/app bị IGNORE! ★★★              │    │
  │  │ → Tương tự: root/pages ĐÈ src/pages! ★                │    │
  │  │ → CHỈ dùng MỘT chỗ! Không mix! ★                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑤ Nên di chuyển /components, /lib vào src/ luôn! ★           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Dùng src → di chuyển TẤT CẢ app code vào!         │    │
  │  │ → components/, lib/, hooks/, utils/, styles/...       │    │
  │  │ → Giữ root SẠCH! Chỉ có config + public! ★           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑥ Proxy → đặt trong src/! ★                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Nếu dùng Next.js Proxy feature                     │    │
  │  │ → PHẢI đặt trong src/ folder! ★                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑦ Tailwind CSS → cập nhật content path! ★                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // tailwind.config.js                                 │    │
  │  │                                                       │    │
  │  │ TRƯỚC (không có src/):                                 │    │
  │  │ content: ['./app/**/*.{js,ts,jsx,tsx}',               │    │
  │  │           './components/**/*.{js,ts,jsx,tsx}']         │    │
  │  │                                                       │    │
  │  │ SAU (có src/): THÊM /src prefix! ★                    │    │
  │  │ content: ['./src/**/*.{js,ts,jsx,tsx}']               │    │
  │  │                                                       │    │
  │  │ → Không thêm → Tailwind KHÔNG scan files! ❌          │    │
  │  │ → Classes không generate → styles bị mất! ❌          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑧ TypeScript paths → cập nhật tsconfig! ★                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // tsconfig.json                                      │    │
  │  │                                                       │    │
  │  │ TRƯỚC (không có src/):                                 │    │
  │  │ "paths": { "@/*": ["./*"] }                           │    │
  │  │                                                       │    │
  │  │ SAU (có src/): THÊM src/! ★                           │    │
  │  │ "paths": { "@/*": ["./src/*"] }                       │    │
  │  │                                                       │    │
  │  │ → Không update → import @/... bị RESOLVE SAI! ❌      │    │
  │  │ → Module not found errors! ❌                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Migration Flow — Chuyển Sang src/!

```
  MIGRATION FLOW:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  BƯỚC 1: Tạo src/ folder ở root! ★                            │
  │  mkdir src                                                    │
  │                                                              │
  │  BƯỚC 2: Di chuyển app/ (hoặc pages/) vào src/! ★             │
  │  mv app src/app                                               │
  │  mv components src/components                                 │
  │  mv lib src/lib                                               │
  │  mv hooks src/hooks                                           │
  │  mv utils src/utils                                           │
  │                                                              │
  │  BƯỚC 3: Cập nhật tsconfig.json! ★                             │
  │  "paths": { "@/*": ["./src/*"] }                              │
  │                                                              │
  │  BƯỚC 4: Cập nhật tailwind.config.js! ★                        │
  │  content: ['./src/**/*.{js,ts,jsx,tsx}']                      │
  │                                                              │
  │  BƯỚC 5: Kiểm tra imports! ★                                   │
  │  → Relative imports (../../) có thể cần update!              │
  │  → @ alias imports → tự động đúng nếu step 3 OK! ★          │
  │                                                              │
  │  BƯỚC 6: XÓA root/app! ★★★                                     │
  │  → ĐỪNG để cả root/app + src/app! ★                          │
  │  → root/app ĐÈ src/app → src/app bị ignore! ★               │
  │                                                              │
  │  BƯỚC 7: KHÔNG di chuyển các file sau! ★                       │
  │  ❌ /public → giữ ở root!                                    │
  │  ❌ package.json → giữ ở root!                                │
  │  ❌ next.config.js → giữ ở root!                              │
  │  ❌ tsconfig.json → giữ ở root!                               │
  │  ❌ .env.* → giữ ở root!                                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — SrcFolderEngine!

```javascript
var SrcFolderEngine = (function () {
  // ═══════════════════════════════════
  // 1. FILE PLACEMENT VALIDATOR
  // ═══════════════════════════════════
  var ROOT_ONLY = [
    "public",
    "package.json",
    "next.config.js",
    "next.config.mjs",
    "next.config.ts",
    "tsconfig.json",
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    ".gitignore",
    "tailwind.config.js",
    "postcss.config.js",
  ];

  var SRC_ALLOWED = [
    "app",
    "pages",
    "components",
    "lib",
    "hooks",
    "utils",
    "styles",
    "middleware.ts",
    "middleware.js",
  ];

  function validatePlacement(fileName, location) {
    var isRootOnly = false;
    for (var i = 0; i < ROOT_ONLY.length; i++) {
      if (fileName === ROOT_ONLY[i] || fileName.startsWith(".env")) {
        isRootOnly = true;
        break;
      }
    }

    if (isRootOnly && location === "src") {
      return {
        valid: false,
        reason: fileName + " PHẢI ở ROOT! Không vào src/! ★",
      };
    }

    if (!isRootOnly && location === "root") {
      return {
        valid: true,
        warning: fileName + " nên vào src/ nếu dùng src folder! ★",
      };
    }

    return { valid: true };
  }

  // ═══════════════════════════════════
  // 2. CONFLICT DETECTOR
  // ═══════════════════════════════════
  function detectConflict(rootDirs, srcDirs) {
    var conflicts = [];
    for (var i = 0; i < rootDirs.length; i++) {
      for (var j = 0; j < srcDirs.length; j++) {
        if (rootDirs[i] === srcDirs[j]) {
          conflicts.push({
            dir: rootDirs[i],
            winner: "root/" + rootDirs[i],
            loser: "src/" + srcDirs[j],
            note: "root THẮNG! src bị IGNORE! ★★★",
          });
        }
      }
    }
    return {
      hasConflict: conflicts.length > 0,
      conflicts: conflicts,
    };
  }

  // ═══════════════════════════════════
  // 3. TAILWIND CONFIG CHECKER
  // ═══════════════════════════════════
  function checkTailwindConfig(contentPaths, useSrc) {
    if (!useSrc) return { ok: true };

    var hasSrcPrefix = false;
    for (var i = 0; i < contentPaths.length; i++) {
      if (contentPaths[i].indexOf("./src/") === 0) {
        hasSrcPrefix = true;
        break;
      }
    }

    if (!hasSrcPrefix) {
      return {
        ok: false,
        reason: "Dùng src/ nhưng Tailwind content KHÔNG có ./src/ prefix! ❌",
        fix: "content: ['./src/**/*.{js,ts,jsx,tsx}']",
      };
    }
    return { ok: true };
  }

  // ═══════════════════════════════════
  // 4. TSCONFIG PATHS CHECKER
  // ═══════════════════════════════════
  function checkTsConfigPaths(paths, useSrc) {
    if (!useSrc) return { ok: true };

    var alias = paths["@/*"];
    if (!alias) return { ok: true, note: "Không dùng @ alias!" };

    var pointsToSrc = false;
    for (var i = 0; i < alias.length; i++) {
      if (alias[i].indexOf("./src/") === 0) {
        pointsToSrc = true;
        break;
      }
    }

    if (!pointsToSrc) {
      return {
        ok: false,
        reason: "@/* KHÔNG trỏ đến ./src/*! ❌",
        current: alias,
        fix: { "@/*": ["./src/*"] },
      };
    }
    return { ok: true };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ src Folder Engine ═══");

    console.log("\n── File Placement ──");
    console.log("public → src:", validatePlacement("public", "src"));
    console.log(".env → src:", validatePlacement(".env.local", "src"));
    console.log("app → root:", validatePlacement("app", "root"));
    console.log(
      "next.config → src:",
      validatePlacement("next.config.js", "src"),
    );

    console.log("\n── Conflict Detection ──");
    console.log("root=[app] + src=[app]:", detectConflict(["app"], ["app"]));
    console.log("root=[] + src=[app]:", detectConflict([], ["app"]));

    console.log("\n── Tailwind Check ──");
    console.log(
      "Missing src prefix:",
      checkTailwindConfig(["./app/**/*.{js,ts,jsx,tsx}"], true),
    );
    console.log(
      "Has src prefix:",
      checkTailwindConfig(["./src/**/*.{js,ts,jsx,tsx}"], true),
    );

    console.log("\n── TSConfig Paths ──");
    console.log("Wrong paths:", checkTsConfigPaths({ "@/*": ["./*"] }, true));
    console.log(
      "Correct paths:",
      checkTsConfigPaths({ "@/*": ["./src/*"] }, true),
    );
  }

  return { demo: demo };
})();
// Chạy: SrcFolderEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: src/ folder có BẮT BUỘC không?                          │
  │  → KHÔNG! Tùy team preference! ★                              │
  │  → Lợi ích: TÁCH app code khỏi config files! ★              │
  │  → Nhiều team/cá nhân thích pattern này! ★                   │
  │                                                              │
  │  ❓ 2: Nếu có CẢ root/app VÀ src/app thì sao?                 │
  │  → root/app THẮNG! ★★★                                       │
  │  → src/app bị IGNORE hoàn toàn! ★                            │
  │  → Tương tự cho pages: root/pages ĐÈ src/pages! ★           │
  │  → CHỈ dùng MỘT CHỖ! Đừng có cả hai! ★                     │
  │                                                              │
  │  ❓ 3: files nào KHÔNG được vào src/?                           │
  │  → /public ★ (static serving!)                                │
  │  → package.json, next.config.js ★ (build tools!)             │
  │  → tsconfig.json ★ (TypeScript!)                              │
  │  → .env.* files ★ (Next.js env loading!)                     │
  │  → Tất cả config nằm ở ROOT!                                 │
  │                                                              │
  │  ❓ 4: Chuyển sang src/ cần update gì?                         │
  │  → tsconfig.json: "@/*" → ["./src/*"] ★                     │
  │  → tailwind.config: content → ['./src/**/*'] ★               │
  │  → Relative imports có thể cần fix ★                         │
  │  → Proxy phải vào trong src/ ★                                │
  │                                                              │
  │  ❓ 5: Tại sao /public PHẢI ở root?                            │
  │  → Next.js serve static files từ root/public/! ★             │
  │  → URL: /favicon.ico → đọc từ root/public/favicon.ico!      │
  │  → src/public ❌ KHÔNG được nhận diện! ★                     │
  │  → Build process hardcode path root/public! ★                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
