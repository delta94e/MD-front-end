# Bundle Splitting — Performance Pattern Deep Dive

> 📅 2026-02-15 · ⏱ 25 phút đọc
>
> Bundle Splitting, Code Splitting, Webpack Chunks,
> Tự viết Mini Bundler từ đầu, Dependency Graph,
> Vendor Splitting, Route-based Splitting,
> Tree Shaking, CommonChunkPlugin → SplitChunksPlugin,
> Granular Chunking Strategy, Caching Optimization
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Performance Pattern
>
> _Dựa trên patterns.dev — Addy Osmani & Lydia Hallie_

---

## Mục Lục

| #   | Phần                                  |
| --- | ------------------------------------- |
| 1   | Vấn đề — Bundle khổng lồ              |
| 2   | Bundle Splitting là gì?               |
| 3   | Tự viết Mini Bundler — Hiểu bản chất  |
| 4   | Webpack SplitChunksPlugin — Chi tiết  |
| 5   | Các chiến lược Bundle Splitting       |
| 6   | Vendor Splitting — Tách thư viện      |
| 7   | Route-based Splitting                 |
| 8   | Granular Chunking — Chiến lược Google |
| 9   | Tree Shaking — Loại bỏ code thừa      |
| 10  | Caching & Long-term Caching           |
| 11  | Tự viết Bundle Analyzer               |
| 12  | Tóm tắt phỏng vấn                     |

---

## §1. Vấn đề — Bundle khổng lồ

```
VẤN ĐỀ: 1 BUNDLE KHỔNG LỒ!
═══════════════════════════════════════════════════════════════

  Bundler (Webpack/Rollup) gom TẤT CẢ source code
  thành 1 file DUY NHẤT:

  Source Code                    Bundle
  ┌──────────┐                   ┌─────────────────────┐
  │ App.js   │                   │                     │
  │ Home.js  │                   │  main.bundle.js     │
  │ About.js │  ═══ Bundler ═══→ │  2.5 MB! 😱         │
  │ utils.js │                   │                     │
  │ vendor/  │                   │  TẤT CẢ trong 1 file│
  └──────────┘                   └─────────────────────┘

  VÒNG ĐỜI CỦA BUNDLE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① FETCH (Tải từ server)                               │
  │  │  → Bundle to → thời gian tải LÂU!                  │
  │  │  → Mạng chậm → user CHỜØ!                          │
  │  │  → Low-end device → tải càng chậm!                 │
  │  ▼                                                     │
  │  ② PARSE (Phân tích cú pháp)                           │
  │  │  → V8 parse code TRƯỚC KHI chạy!                   │
  │  │  → Code nhiều → parse lâu!                          │
  │  ▼                                                     │
  │  ③ COMPILE (Biên dịch)                                 │
  │  │  → V8 compile bytecode → machine code!             │
  │  │  → Hiện đại: stream compile KHI tải!               │
  │  ▼                                                     │
  │  ④ EXECUTE (Thực thi)                                  │
  │  │  → CHẶN main thread!                                │
  │  │  → Code không cần → VẪN PHẢI execute!              │
  │  │  → → FCP, LCP, TTI đều bị CHẬM!                   │
  │  ▼                                                     │
  │  ⑤ PAINT (Hiển thị pixel đầu tiên!)                   │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  VẤN ĐỀ CỤ THỂ:
  ┌────────────────────────────────────────────────────────┐
  │ User vào trang HOME nhưng bundle chứa:                │
  │ → Code cho trang About (CHƯA CẦN!)                    │
  │ → Code cho trang Settings (CHƯA CẦN!)                 │
  │ → Code cho EmojiPicker (CHƯA CẦN!)                    │
  │ → Code cho AdminPanel (CÓ THỂ KHÔNG BAO GIỜ CẦN!)    │
  │                                                        │
  │ → Engine VẪN phải tải + parse + compile TẤT CẢ!       │
  │ → Trước khi user thấy BẤT CỨ GÌ!                     │
  │ → → BLANK SCREEN kéo dài! → User BỰC MÌNH!           │
  └────────────────────────────────────────────────────────┘
```

```
ẢNH HƯỞNG ĐẾN WEB VITALS:
═══════════════════════════════════════════════════════════════

  Bundle lớn → ẢNH HƯỞNG TRỰC TIẾP:

  ┌──────────┬────────────────────────────────────────────┐
  │ FCP      │ First Contentful Paint                     │
  │          │ → Bundle to → tải lâu → FCP CHẬM!         │
  │          │ → Pixel đầu tiên XUẤT HIỆN muộn!           │
  ├──────────┼────────────────────────────────────────────┤
  │ LCP      │ Largest Contentful Paint                   │
  │          │ → Component lớn nhất render MUỘN!          │
  │          │ → Engine chưa đến dòng render call!       │
  ├──────────┼────────────────────────────────────────────┤
  │ TTI      │ Time To Interactive                        │
  │          │ → Bundle phải LOAD + EXECUTE xong!         │
  │          │ → Mới tương tác được!                       │
  │          │ → Code KHÔNG DÙNG vẫn phải execute!        │
  ├──────────┼────────────────────────────────────────────┤
  │ TBT      │ Total Blocking Time                        │
  │          │ → Main thread bị CHẶN khi execute JS!     │
  │          │ → Bundle to = TBT cao!                     │
  └──────────┴────────────────────────────────────────────┘

  BUNDLE TO ≠ EXECUTION TIME DÀI!
  ┌────────────────────────────────────────────────────────┐
  │ → Có thể tải 2MB code nhưng chỉ EXECUTE 200KB!       │
  │ → NHƯNG vẫn phải FETCH toàn bộ 2MB!                  │
  │ → Parse + compile TOÀN BỘ trước khi execute!         │
  │ → Mạng chậm / thiết bị yếu → ảnh hưởng NẶNG!        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Bundle Splitting là gì?

```
BUNDLE SPLITTING — GIẢI PHÁP:
═══════════════════════════════════════════════════════════════

  THAY VÌ 1 bundle KHỔNG LỒ:
  ┌──────────────────────────────────┐
  │ main.bundle.js        2.5 MB    │
  │ ┌────┬────┬────┬────┬────┬────┐ │
  │ │Home│About│Set │Emoji│Admin│Lib││
  │ └────┴────┴────┴────┴────┴────┘ │
  └──────────────────────────────────┘

  TÁCH THÀNH NHIỀU bundle NHỎ:
  ┌──────────────────┐  ┌──────────────────┐
  │ main.bundle.js   │  │ vendors.bundle.js│
  │ 800 KB           │  │ 500 KB           │
  │ ┌────┬────┐      │  │ ┌────┬────┐      │
  │ │Home│utils│      │  │ │React│lodash│    │
  │ └────┴────┘      │  │ └────┴────┘      │
  └──────────────────┘  └──────────────────┘

  ┌──────────────────┐  ┌──────────────────┐
  │ about.chunk.js   │  │ emoji.chunk.js   │
  │ 150 KB           │  │ 172 KB           │
  │ (lazy loaded!)   │  │ (lazy loaded!)   │
  └──────────────────┘  └──────────────────┘

  KẾT QUẢ:
  → Initial load: 800KB + 500KB = 1.3MB (thay vì 2.5MB!)
  → Giảm 48% initial bundle!
  → about + emoji chỉ tải KHI CẦN!

  HAI KHÁI NIỆM KHÁC NHAU:
  ┌────────────────────────────────────────────────────────┐
  │ ① BUNDLE SPLITTING (tách bundle):                      │
  │ → Tách 1 bundle → NHIỀU bundles NHỎ hơn!              │
  │ → VD: main.js + vendors.js + chunk1.js + chunk2.js    │
  │ → MỤC ĐÍCH: giảm initial load + cache tốt hơn!        │
  │                                                        │
  │ ② CODE SPLITTING (tách code):                          │
  │ → Dynamic import() → tách code THEO LOGIC!            │
  │ → VD: import('./About') → tải KHI CẦN!               │
  │ → MỤC ĐÍCH: lazy loading + giảm code không cần!       │
  │                                                        │
  │ → Bundle Splitting BAO GỒM Code Splitting!             │
  │ → Code Splitting là 1 CÁCH để Bundle Split!            │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Tự viết Mini Bundler — Hiểu bản chất

```
BUNDLER HOẠT ĐỘNG NHƯ THẾ NÀO?
═══════════════════════════════════════════════════════════════

  ① ĐỌC entry file (VD: index.js)
  ② TÌM tất cả import/require
  ③ XÂY DỰNG dependency graph
  ④ GOM code thành bundle(s)

  DEPENDENCY GRAPH:
  ┌──────────┐
  │ index.js │
  │ (entry)  │
  └────┬─────┘
       │ import
       ├───────────────┬────────────────┐
       ▼               ▼                ▼
  ┌──────────┐   ┌──────────┐    ┌──────────┐
  │ App.js   │   │ utils.js │    │ config.js│
  └────┬─────┘   └──────────┘    └──────────┘
       │ import
       ├──────────────┐
       ▼              ▼
  ┌──────────┐  ┌──────────┐
  │ Home.js  │  │ About.js │
  └────┬─────┘  └──────────┘
       │ import
       ▼
  ┌──────────┐
  │ Hero.js  │
  └──────────┘
```

```javascript
// ═══ MINI BUNDLER — TỰ VIẾT TỪ ĐẦU ═══
// Hiểu bản chất bundler hoạt động như thế nào!

const fs = require("fs");
const path = require("path");

/**
 * BƯỚC 1: Parse 1 file → tìm tất cả dependencies
 * (Phiên bản đơn giản — regex thay cho AST parser!)
 */
function parseDependencies(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");

  // Tìm tất cả import statements
  const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
  const requireRegex = /require\s*\(\s*['"](.+?)['"]\s*\)/g;

  const deps = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    deps.push(match[1]); // match[1] = đường dẫn module
  }
  while ((match = requireRegex.exec(content)) !== null) {
    deps.push(match[1]);
  }

  return { content, deps };
}

/**
 * BƯỚC 2: Xây dựng Dependency Graph — đệ quy!
 *
 * Graph = { filePath: { content, deps: [filePath, ...] } }
 */
function buildDependencyGraph(entryPath) {
  const graph = {};
  const visited = new Set();

  function traverse(filePath) {
    // Resolve đường dẫn tuyệt đối
    const absolutePath = path.resolve(filePath);

    // Đã visit → skip (tránh circular dependency!)
    if (visited.has(absolutePath)) return;
    visited.add(absolutePath);

    // Parse file → tìm dependencies
    const { content, deps } = parseDependencies(absolutePath);

    // Resolve dependency paths
    const resolvedDeps = deps.map((dep) => {
      // Relative path → resolve từ thư mục chứa file hiện tại
      if (dep.startsWith(".")) {
        let resolved = path.resolve(path.dirname(absolutePath), dep);
        // Thêm .js nếu chưa có extension
        if (!path.extname(resolved)) resolved += ".js";
        return resolved;
      }
      // Node module (VD: "react") → trả về tên
      return dep;
    });

    // Thêm vào graph
    graph[absolutePath] = {
      content,
      deps: resolvedDeps,
    };

    // Đệ quy traverse dependencies
    resolvedDeps
      .filter((dep) => !dep.includes("node_modules") && dep.startsWith("/"))
      .forEach(traverse);
  }

  traverse(entryPath);
  return graph;
}

/**
 * BƯỚC 3: Tách modules thành chunks!
 *
 * Chiến lược đơn giản:
 * → Entry + dependencies trực tiếp = main chunk
 * → Dynamic imports = separate chunks
 * → node_modules = vendor chunk
 */
function splitIntoChunks(graph, entryPath) {
  const chunks = {
    main: [], // Entry point code
    vendor: [], // node_modules
    // dynamic chunks thêm sau...
  };

  const absoluteEntry = path.resolve(entryPath);

  Object.entries(graph).forEach(([filePath, { content, deps }]) => {
    // Phân loại file vào chunk phù hợp
    if (filePath.includes("node_modules")) {
      chunks.vendor.push({ filePath, content });
    } else {
      chunks.main.push({ filePath, content });
    }
  });

  return chunks;
}

/**
 * BƯỚC 4: Gom mỗi chunk thành 1 bundle file!
 *
 * Mỗi module được bọc trong 1 function (module scope!)
 * → Tránh biến toàn cục xung đột!
 */
function generateBundle(chunk, chunkName) {
  const moduleWrappers = chunk.map(({ filePath, content }) => {
    return `
// ────── ${path.basename(filePath)} ──────
"${filePath}": function(module, exports, require) {
  ${content}
}`;
  });

  // IIFE bọc toàn bộ bundle!
  return `
(function(modules) {
  // Module cache — tránh execute lại!
  var installedModules = {};

  // Custom require function
  function __require(moduleId) {
    // Đã cache → trả về exports!
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }

    // Tạo module mới + cache
    var module = installedModules[moduleId] = {
      exports: {}
    };

    // Execute module function!
    modules[moduleId](module, module.exports, __require);

    return module.exports;
  }

  // Chạy entry module!
  return __require("${chunk[0]?.filePath || "entry"}");
})({
  ${moduleWrappers.join(",\n")}
});
`.trim();
}

// ═══ SỬ DỤNG MINI BUNDLER ═══
// const graph = buildDependencyGraph("./src/index.js");
// const chunks = splitIntoChunks(graph, "./src/index.js");
// const mainBundle = generateBundle(chunks.main, "main");
// const vendorBundle = generateBundle(chunks.vendor, "vendor");
// fs.writeFileSync("dist/main.bundle.js", mainBundle);
// fs.writeFileSync("dist/vendor.bundle.js", vendorBundle);
```

```
GIẢI THÍCH MINI BUNDLER:
═══════════════════════════════════════════════════════════════

  ① parseDependencies(filePath):
  ┌────────────────────────────────────────────────────┐
  │ → Đọc file → tìm import/require bằng regex!      │
  │ → Trả về: { content, deps: ['./Home', 'react'] }  │
  │ → Bundler thật dùng AST parser (babel/acorn)!      │
  │ → Ở đây dùng regex cho ĐƠN GIẢN!                  │
  └────────────────────────────────────────────────────┘

  ② buildDependencyGraph(entryPath):
  ┌────────────────────────────────────────────────────┐
  │ → Bắt đầu từ ENTRY (index.js)!                    │
  │ → Tìm deps → đệ quy traverse từng dep!            │
  │ → visited Set → tránh circular dependency!         │
  │ → Kết quả: Graph { filePath → { content, deps } } │
  └────────────────────────────────────────────────────┘

  ③ splitIntoChunks(graph):
  ┌────────────────────────────────────────────────────┐
  │ → Phân loại files thành CHUNKS:                    │
  │ → node_modules → vendor chunk!                     │
  │ → Source code → main chunk!                        │
  │ → Dynamic imports → separate chunks!               │
  └────────────────────────────────────────────────────┘

  ④ generateBundle(chunk):
  ┌────────────────────────────────────────────────────┐
  │ → Bọc mỗi module trong FUNCTION (module scope!)   │
  │ → IIFE bọc toàn bộ bundle!                        │
  │ → Custom __require() function!                     │
  │ → Module cache → không execute lại!                │
  │ → Entry module chạy ĐẦU TIÊN!                     │
  │                                                    │
  │ → ĐÂY CHÍNH XÁC là cách Webpack hoạt động!        │
  │ → Build output của Webpack = IIFE + module map!    │
  └────────────────────────────────────────────────────┘
```

---

## §4. Webpack SplitChunksPlugin — Chi tiết

```
EVOLUTION: CommonsChunkPlugin → SplitChunksPlugin
═══════════════════════════════════════════════════════════════

  Webpack 3: CommonsChunkPlugin (đã deprecated!)
  ┌────────────────────────────────────────────────────┐
  │ → Cấu hình THỦ CÔNG, phức tạp!                    │
  │ → Phải chỉ định CHÍNH XÁC tách gì!                │
  │ → Dễ tạo chunks quá lớn hoặc quá nhỏ!             │
  └────────────────────────────────────────────────────┘

  Webpack 4+: SplitChunksPlugin (mặc định!)
  ┌────────────────────────────────────────────────────┐
  │ → TỰ ĐỘNG tách chunks thông minh!                  │
  │ → Dựa trên HEURISTICS (quy tắc tối ưu!)           │
  │ → Cấu hình DỄ DÀNG hơn nhiều!                     │
  └────────────────────────────────────────────────────┘
```

```javascript
// ═══ WEBPACK SPLITCHUNKSPLUGIN — CẤU HÌNH CHI TIẾT ═══

// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      // ① chunks: tách loại chunks nào?
      chunks: "all",
      // "all"     = cả sync + async (KHUYẾN NGHỊ!)
      // "async"   = chỉ async (dynamic import) — MẶC ĐỊNH
      // "initial" = chỉ sync (static import)

      // ② minSize: chunk TỐI THIỂU bao nhiêu bytes?
      minSize: 20000, // 20KB — mặc định!
      // → Chunk < 20KB → KHÔNG tách (không đáng!)
      // → Tránh tạo quá nhiều chunks nhỏ!

      // ③ maxSize: chunk TỐI ĐA bao nhiêu bytes?
      maxSize: 244000, // ~244KB — gợi ý tách thêm!
      // → Chunk > 244KB → Webpack CỐ tách nhỏ hơn!
      // → Không đảm bảo (nếu module > maxSize thì giữ nguyên!)

      // ④ minChunks: module phải DÙNG bởi bao nhiêu chunks?
      minChunks: 1,
      // → 1 = chỉ cần DÙNG 1 LẦN là tách!
      // → 2 = phải dùng bởi ÍT NHẤT 2 chunks mới tách!

      // ⑤ maxAsyncRequests: tối đa async chunks song song?
      maxAsyncRequests: 30,

      // ⑥ maxInitialRequests: tối đa initial chunks?
      maxInitialRequests: 30,

      // ⑦ cacheGroups: QUY TẮC TÁCH CỤ THỂ!
      cacheGroups: {
        // Tách TẤT CẢ node_modules → vendors chunk!
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
          priority: -10, // Ưu tiên thấp hơn default!
        },

        // Tách React riêng (ít thay đổi → cache LÂU!)
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: "react",
          chunks: "all",
          priority: 20, // Ưu tiên CAO → tách TRƯỚC vendors!
        },

        // Tách modules DÙNG CHUNG bởi nhiều chunks!
        common: {
          minChunks: 2, // Dùng bởi ít nhất 2 chunks!
          name: "common",
          chunks: "all",
          priority: -20,
          reuseExistingChunk: true, // Tái sử dụng chunk đã có!
        },
      },
    },
  },
};
```

```
GIẢI THÍCH CACHE GROUPS:
═══════════════════════════════════════════════════════════════

  CacheGroups = QUY TẮC PHÂN LOẠI modules vào chunks!

  Module lodash (node_modules/lodash):
  → Match "vendors" (test: /node_modules/)? ✅
  → Match "react" (test: /react|react-dom/)? ❌
  → → Vào "vendors" chunk!

  Module react-dom (node_modules/react-dom):
  → Match "vendors"? ✅ (priority: -10)
  → Match "react"? ✅ (priority: 20) ← CAO HƠN!
  → → Vào "react" chunk! (priority wins!)

  Module utils.js (dùng bởi Home.js VÀ About.js):
  → Match "vendors"? ❌ (không phải node_modules!)
  → Match "common" (minChunks: 2)? ✅ (dùng 2 lần!)
  → → Vào "common" chunk!

  KẾT QUẢ:
  ┌──────────────────────────────────────────────────┐
  │ dist/                                            │
  │ ├── main.js          (1P code — route chính!)    │
  │ ├── react.chunk.js   (react + react-dom!)        │
  │ ├── vendors.chunk.js (lodash, axios, etc!)       │
  │ ├── common.chunk.js  (shared 1P code!)           │
  │ ├── about.chunk.js   (lazy loaded!)              │
  │ └── emoji.chunk.js   (lazy loaded!)              │
  └──────────────────────────────────────────────────┘

  PRIORITY QUAN TRỌNG:
  → Module match NHIỀU groups → group có priority CAO thắng!
  → react (20) > vendors (-10) > common (-20)!
```

---

## §5. Các chiến lược Bundle Splitting

```
4 CHIẾN LƯỢC BUNDLE SPLITTING:
═══════════════════════════════════════════════════════════════

  ① ENTRY POINT SPLITTING:
  ┌────────────────────────────────────────────────────┐
  │ → Nhiều entry points → nhiều bundles!              │
  │ → VD: app.js + admin.js = 2 bundles!              │
  │ → Đơn giản nhưng có THỂ TRÙNG code!               │
  │                                                    │
  │ entry: {                                           │
  │   app: './src/app.js',                             │
  │   admin: './src/admin.js',                         │
  │ }                                                  │
  │                                                    │
  │ → app.bundle.js   (chứa React + lodash + app code)│
  │ → admin.bundle.js (chứa React + lodash + admin!)  │
  │ → ⚠️ React + lodash bị TRÙNG!                     │
  │ → → Cần kết hợp với vendor splitting!              │
  └────────────────────────────────────────────────────┘

  ② VENDOR SPLITTING:
  ┌────────────────────────────────────────────────────┐
  │ → Tách node_modules → vendors chunk!               │
  │ → Vendors ÍT thay đổi → cache THOẢI MÁI!          │
  │ → Cập nhật app code → vendors KHÔNG tải lại!       │
  │ → → Section §6 giải thích chi tiết!                │
  └────────────────────────────────────────────────────┘

  ③ ROUTE-BASED SPLITTING:
  ┌────────────────────────────────────────────────────┐
  │ → Mỗi route = 1 chunk riêng!                      │
  │ → Chuyển route → tải chunk mới!                    │
  │ → → Section §7 giải thích chi tiết!                │
  └────────────────────────────────────────────────────┘

  ④ DYNAMIC IMPORT SPLITTING:
  ┌────────────────────────────────────────────────────┐
  │ → import() → Webpack tạo chunk TỰ ĐỘNG!           │
  │ → Component-level splitting!                       │
  │ → VD: import('./EmojiPicker') → emoji.chunk.js!   │
  └────────────────────────────────────────────────────┘
```

---

## §6. Vendor Splitting — Tách thư viện

```
VENDOR SPLITTING — TẠI SAO QUAN TRỌNG?
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: ĐỘ THAY ĐỔI KHÁC NHAU!
  ┌────────────────────────────────────────────────────┐
  │ App code (1P):     Thay đổi THƯỜNG XUYÊN!         │
  │ → Fix bug, thêm feature, cập nhật UI...           │
  │ → Mỗi deploy = code MỚI!                          │
  │                                                    │
  │ Vendor code (3P):  Thay đổi RẤT ÍT!               │
  │ → React, lodash, axios... ít khi update!           │
  │ → Giữ nguyên qua nhiều deploys!                    │
  └────────────────────────────────────────────────────┘

  NẾU CHUNG 1 BUNDLE:
  ┌────────────────────────────────────────────────────┐
  │ main.bundle.js [hash: abc123]                      │
  │ ┌──────────┬──────────┐                            │
  │ │ App code │ Vendors  │                            │
  │ │ (thay đổi│ (KHÔNG   │                            │
  │ │  thường  │  thay    │                            │
  │ │  xuyên!) │  đổi!)   │                            │
  │ └──────────┴──────────┘                            │
  │                                                    │
  │ App code thay đổi → hash MỚI → TẢI LẠI TẤT CẢ!  │
  │ → Vendors (500KB) tải lại DÙ KHÔNG THAY ĐỔI!     │
  │ → → LÃNG PHÍ bandwidth!                           │
  └────────────────────────────────────────────────────┘

  NẾU TÁCH VENDOR:
  ┌──────────────────┐  ┌──────────────────┐
  │ main.js          │  │ vendors.js       │
  │ [hash: abc123]   │  │ [hash: xyz789]   │
  │ ┌──────────┐     │  │ ┌──────────┐     │
  │ │ App code │     │  │ │ Vendors  │     │
  │ └──────────┘     │  │ └──────────┘     │
  └──────────────────┘  └──────────────────┘

  App thay đổi → main [hash: def456] → TẢI LẠI!
  Vendors KHÔNG đổi → vendors [hash: xyz789]
  → CACHE → KHÔNG TẢI LẠI! ✅
  → → Tiết kiệm 500KB mỗi lần deploy!
```

---

## §7. Route-based Splitting

```javascript
// ═══ ROUTE-BASED SPLITTING — React Router ═══

import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ① Mỗi page = 1 lazy chunk!
const Home = lazy(() => import(/* webpackChunkName: "home" */ "./pages/Home"));
const About = lazy(
  () => import(/* webpackChunkName: "about" */ "./pages/About"),
);
const Dashboard = lazy(
  () => import(/* webpackChunkName: "dashboard" */ "./pages/Dashboard"),
);
const Settings = lazy(
  () => import(/* webpackChunkName: "settings" */ "./pages/Settings"),
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// KẾT QUẢ BUNDLE:
// dist/
// ├── main.js          ← App shell + router
// ├── home.chunk.js    ← chỉ tải ở /
// ├── about.chunk.js   ← chỉ tải ở /about
// ├── dashboard.chunk.js ← chỉ tải ở /dashboard
// └── settings.chunk.js  ← chỉ tải ở /settings
```

```
ROUTE SPLITTING — SƠ ĐỒ:
═══════════════════════════════════════════════════════════════

  User vào /home:
  ┌──────────┐  ┌──────────────┐
  │ main.js  │  │ home.chunk.js│ ← TẢI!
  │ (router) │  │ (Home page)  │
  └──────────┘  └──────────────┘
  → about.chunk.js    → KHÔNG TẢI! ✅
  → dashboard.chunk.js → KHÔNG TẢI! ✅
  → settings.chunk.js  → KHÔNG TẢI! ✅

  User navigate → /about:
  ┌──────────────┐
  │about.chunk.js│ ← TẢI LÚC NÀY!
  └──────────────┘

  → User chỉ tải code cho PAGE HIỆN TẠI!
  → Chuyển page → tải chunk page MỚI!
  → → Mỗi page load NHẸ NHÀNG!
```

---

## §8. Granular Chunking — Chiến lược Google

```
GRANULAR CHUNKING — CHIẾN LƯỢC NÂNG CAO:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ VỚI VENDOR SPLITTING ĐƠN GIẢN:
  ┌────────────────────────────────────────────────────┐
  │ vendors.bundle.js = TẤT CẢ node_modules           │
  │ → 500KB+ (React, lodash, axios, moment, d3...)     │
  │                                                    │
  │ Cập nhật 1 thư viện NHỎ (VD: axios 5KB)           │
  │ → vendors hash THAY ĐỔI!                          │
  │ → Tải lại TOÀN BỘ 500KB! (chỉ vì 5KB thay đổi!) │
  │ → → Cache KHÔNG hiệu quả!                         │
  └────────────────────────────────────────────────────┘

  GIẢI PHÁP: GRANULAR CHUNKING!
  ┌────────────────────────────────────────────────────┐
  │ Thay vì 1 vendors bundle → NHIỀU vendor chunks!   │
  │                                                    │
  │ → react.chunk.js     (react + react-dom)           │
  │ → lodash.chunk.js    (lodash)                      │
  │ → axios.chunk.js     (axios)                       │
  │ → moment.chunk.js    (moment)                      │
  │                                                    │
  │ Cập nhật axios → CHỈ tải lại axios.chunk.js 5KB!  │
  │ → react, lodash, moment → CACHE! ✅                │
  └────────────────────────────────────────────────────┘
```

```javascript
// ═══ GRANULAR CHUNKING — CẤU HÌNH ═══

// webpack.config.js
module.exports = {
  output: {
    // ① Content Hash — file name = hash của NỘI DUNG!
    filename: "[name].[contenthash:8].js",
    chunkFilename: "[name].[contenthash:8].chunk.js",
    // → Nội dung KHÔNG đổi → hash KHÔNG đổi → CACHE!
    // → Nội dung thay đổi → hash MỚI → tải lại!
  },

  optimization: {
    // ② Module IDs ổn định — tránh hash thay đổi vô cớ!
    moduleIds: "deterministic",

    // ③ Runtime chunk riêng — Webpack bootstrap code!
    runtimeChunk: "single",
    // → Runtime = code quản lý module loading!
    // → Tách riêng → app/vendor hash KHÔNG bị ảnh hưởng!

    splitChunks: {
      chunks: "all",
      maxInitialRequests: Infinity, // Không giới hạn!
      minSize: 0, // Tách DÙ rất nhỏ!

      cacheGroups: {
        // ④ Mỗi npm package = 1 chunk RIÊNG!
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          // Đặt tên chunk = tên package!
          name(module) {
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/,
            )[1];
            // npm scoped packages: @scope/name → scope-name
            return `vendor.${packageName.replace("@", "")}`;
          },
        },
      },
    },
  },
};

// KẾT QUẢ:
// dist/
// ├── main.abc12345.js
// ├── runtime.def67890.js
// ├── vendor.react.111aaaa.chunk.js
// ├── vendor.react-dom.222bbbb.chunk.js
// ├── vendor.lodash.333cccc.chunk.js
// ├── vendor.axios.444dddd.chunk.js
// └── home.555eeee.chunk.js
```

```
CONTENTHASH — TẠI SAO QUAN TRỌNG?
═══════════════════════════════════════════════════════════════

  3 LOẠI HASH TRONG WEBPACK:

  ┌──────────────┬─────────────────────────────────────┐
  │ [hash]       │ Hash của TOÀN BỘ build!             │
  │              │ → BẤT KỲ file nào thay đổi          │
  │              │ → TẤT CẢ hash thay đổi!             │
  │              │ → ❌ Cache kém!                       │
  ├──────────────┼─────────────────────────────────────┤
  │ [chunkhash]  │ Hash CỦA chunk!                      │
  │              │ → Chunk thay đổi → hash đổi!        │
  │              │ → Chunk khác → hash GIỮA!           │
  │              │ → ⚠️ Tốt hơn nhưng chưa tối ưu!     │
  ├──────────────┼─────────────────────────────────────┤
  │ [contenthash]│ Hash CỦA NỘI DUNG file!             │
  │              │ → Nội dung KHÔNG đổi → hash GIỮA!  │
  │              │ → ✅ Cache TỐT NHẤT!                 │
  │              │ → Dùng cho production!               │
  └──────────────┴─────────────────────────────────────┘

  VÍ DỤ:
  Deploy lần 1:  main.abc123.js + vendor.xyz789.js
  Deploy lần 2:  main.def456.js + vendor.xyz789.js ← CACHE!
                 (chỉ main đổi!)
```

---

## §9. Tree Shaking — Loại bỏ code thừa

```
TREE SHAKING — LOẠI BỎ CODE KHÔNG DÙNG:
═══════════════════════════════════════════════════════════════

  VÍ DỤ: import 1 function từ lodash (300KB!)
  ┌────────────────────────────────────────────────────┐
  │ import { debounce } from 'lodash';                 │
  │                                                    │
  │ → KHÔNG CÓ tree shaking:                          │
  │   → Bundle chứa TOÀN BỘ lodash 300KB!             │
  │   → Chỉ dùng debounce (~1KB!) → lãng phí 299KB!  │
  │                                                    │
  │ → CÓ tree shaking:                                │
  │   → Bundler phân tích: chỉ debounce được DÙNG!   │
  │   → Loại bỏ 99% code lodash không dùng!           │
  │   → Bundle chỉ chứa debounce!                     │
  └────────────────────────────────────────────────────┘

  ĐIỀU KIỆN ĐỂ TREE SHAKING HOẠT ĐỘNG:
  ┌────────────────────────────────────────────────────┐
  │ ✅ Phải dùng ES MODULES (import/export)!           │
  │ → Static analysis → bundler BIẾT cái gì dùng!     │
  │                                                    │
  │ ❌ CommonJS (require/module.exports) KHÔNG ĐƯỢC!   │
  │ → Dynamic → bundler KHÔNG BIẾT cái gì dùng!       │
  │ → → Phải giữ TẤT CẢ!                              │
  │                                                    │
  │ ✅ package.json: "sideEffects": false              │
  │ → Báo bundler: module KHÔNG có side effects!       │
  │ → → AN TOÀN để loại bỏ code không dùng!           │
  └────────────────────────────────────────────────────┘
```

```javascript
// ═══ TỰ VIẾT MINI TREE-SHAKER ═══
// (Minh họa nguyên lý — đơn giản hóa!)

/**
 * Phân tích file → tìm exports ĐƯỢC DÙNG!
 */
function analyzeUsedExports(graph, entryPath) {
  const usedExports = {}; // { filePath: Set<exportName> }

  function analyzeFile(filePath) {
    const { content, deps } = graph[filePath];

    // Tìm named imports
    const importRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"](.+?)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const names = match[1].split(",").map((s) => s.trim());
      const source = match[2];

      // Resolve source → absolute path
      const resolvedSource = resolvePath(filePath, source);

      if (!usedExports[resolvedSource]) {
        usedExports[resolvedSource] = new Set();
      }

      // Thêm từng export name vào Set!
      names.forEach((name) => {
        // Xử lý alias: { debounce as db }
        const actualName = name.split(" as ")[0].trim();
        usedExports[resolvedSource].add(actualName);
      });
    }

    // Đệ quy analyze dependencies
    deps.forEach((dep) => {
      if (!usedExports[dep]) {
        analyzeFile(dep);
      }
    });
  }

  analyzeFile(entryPath);
  return usedExports;
}

// KẾT QUẢ:
// usedExports = {
//   "/node_modules/lodash/index.js": Set { "debounce" },
//   "/src/utils.js": Set { "formatDate", "capitalize" },
// }
// → Chỉ GIỮ debounce, formatDate, capitalize!
// → Loại bỏ TẤT CẢ exports KHÁC!
```

---

## §10. Caching & Long-term Caching

```
LONG-TERM CACHING — CHIẾN LƯỢC:
═══════════════════════════════════════════════════════════════

  MỤC TIÊU: User TẢI LẠI ÍT NHẤT CÓ THỂ!
  → File KHÔNG đổi → dùng CACHE!
  → File thay đổi → chỉ tải file ĐÓ!

  CHIẾN LƯỢC:
  ┌────────────────────────────────────────────────────┐
  │ ① contenthash trong filename                       │
  │ → main.[contenthash].js                            │
  │ → Nội dung đổi → hash đổi → browser tải mới!     │
  │ → Nội dung giữ → hash giữ → browser dùng cache!  │
  │                                                    │
  │ ② Tách runtime chunk                               │
  │ → runtimeChunk: "single"                           │
  │ → Runtime (Webpack bootstrap) = chunk riêng!       │
  │ → App/vendor hash KHÔNG bị ảnh hưởng!             │
  │                                                    │
  │ ③ moduleIds: "deterministic"                       │
  │ → Module ID cố định dựa trên đường dẫn!           │
  │ → Thêm/xóa module KHÁC → hash KHÔNG bị ảnh hưởng│
  │                                                    │
  │ ④ Granular vendor chunks                           │
  │ → Mỗi package = 1 chunk riêng!                    │
  │ → Update 1 package → chỉ 1 chunk đổi!             │
  └────────────────────────────────────────────────────┘

  SƠ ĐỒ CACHE:
  ─────────────────────────────────────────────────────

  Deploy 1:
  ┌────────────────────────────────────────────────────┐
  │ runtime.aaa111.js        (3KB)  ← TẢI             │
  │ vendor.react.bbb222.js  (130KB) ← TẢI             │
  │ vendor.lodash.ccc333.js (70KB)  ← TẢI             │
  │ main.ddd444.js          (200KB) ← TẢI             │
  │ TỔNG: 403KB                                        │
  └────────────────────────────────────────────────────┘

  Deploy 2 (chỉ sửa App code):
  ┌────────────────────────────────────────────────────┐
  │ runtime.aaa111.js        (3KB)  ← CACHE ✅        │
  │ vendor.react.bbb222.js  (130KB) ← CACHE ✅        │
  │ vendor.lodash.ccc333.js (70KB)  ← CACHE ✅        │
  │ main.eee555.js          (200KB) ← TẢI MỚI!       │
  │ TỔNG TẢI: 200KB (thay vì 403KB!)                  │
  │ TIẾT KIỆM: 203KB (50%!)                           │
  └────────────────────────────────────────────────────┘

  Deploy 3 (update lodash):
  ┌────────────────────────────────────────────────────┐
  │ runtime.aaa111.js        (3KB)  ← CACHE ✅        │
  │ vendor.react.bbb222.js  (130KB) ← CACHE ✅        │
  │ vendor.lodash.fff666.js (70KB)  ← TẢI MỚI!       │
  │ main.eee555.js          (200KB) ← CACHE ✅        │
  │ TỔNG TẢI: 70KB (thay vì 403KB!)                   │
  │ TIẾT KIỆM: 333KB (83%!)                           │
  └────────────────────────────────────────────────────┘
```

---

## §11. Tự viết Bundle Analyzer

```javascript
// ═══ TỰ VIẾT MINI BUNDLE ANALYZER ═══

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

/**
 * Phân tích thư mục dist/ → báo cáo kích thước chunks!
 * Không dùng webpack-bundle-analyzer!
 */
function analyzeBundle(distDir) {
  const files = fs
    .readdirSync(distDir)
    .filter((f) => f.endsWith(".js") || f.endsWith(".css"));

  const report = files.map((file) => {
    const filePath = path.join(distDir, file);
    const content = fs.readFileSync(filePath);
    const gzipped = zlib.gzipSync(content);

    return {
      name: file,
      raw: content.length, // Kích thước thô
      gzip: gzipped.length, // Sau gzip
      ratio: ((gzipped.length / content.length) * 100).toFixed(1),
    };
  });

  // Sắp xếp theo kích thước giảm dần
  report.sort((a, b) => b.raw - a.raw);

  // In báo cáo dạng bảng
  console.log("\n📦 BUNDLE ANALYSIS");
  console.log("═".repeat(65));
  console.log(
    "File".padEnd(35),
    "Raw".padStart(10),
    "Gzip".padStart(10),
    "Ratio".padStart(8),
  );
  console.log("─".repeat(65));

  let totalRaw = 0,
    totalGzip = 0;

  report.forEach(({ name, raw, gzip, ratio }) => {
    totalRaw += raw;
    totalGzip += gzip;
    console.log(
      name.padEnd(35),
      formatSize(raw).padStart(10),
      formatSize(gzip).padStart(10),
      `${ratio}%`.padStart(8),
    );
  });

  console.log("─".repeat(65));
  console.log(
    "TOTAL".padEnd(35),
    formatSize(totalRaw).padStart(10),
    formatSize(totalGzip).padStart(10),
  );

  // ⚠️ Cảnh báo nếu chunk quá lớn!
  report.forEach(({ name, gzip }) => {
    if (gzip > 244 * 1024) {
      console.warn(
        `\n⚠️  ${name} (${formatSize(gzip)} gzip)` +
          " vượt ngưỡng 244KB! Cần tách thêm!",
      );
    }
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// SỬ DỤNG: analyzeBundle("./dist");

// OUTPUT:
// 📦 BUNDLE ANALYSIS
// ═════════════════════════════════════════════════════════════════
// File                                 Raw       Gzip    Ratio
// ─────────────────────────────────────────────────────────────────
// main.abc123.js                    200.0 KB    65.2 KB   32.6%
// vendor.react.bbb222.js           130.0 KB    42.1 KB   32.4%
// vendor.lodash.ccc333.js           70.0 KB    24.3 KB   34.7%
// runtime.aaa111.js                   3.0 KB     1.2 KB   40.0%
// ─────────────────────────────────────────────────────────────────
// TOTAL                             403.0 KB   132.8 KB
```

---

## §12. Tóm tắt phỏng vấn

```
Q&A PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Bundle Splitting là gì? Khác Code Splitting thế nào?"
  A: Bundle Splitting: tách 1 bundle → NHIỀU bundles nhỏ!
  Code Splitting: tách code THEO LOGIC (dynamic import)!
  Code Splitting là MỘT CÁCH để Bundle Split!
  Bundle Split còn gồm vendor split, route split!

  Q: "Tại sao cần tách vendor riêng?"
  A: → Vendor (React, lodash) ÍT thay đổi!
  → App code thay đổi THƯỜNG XUYÊN!
  → Chung 1 bundle → update app = tải lại CẢ vendor!
  → Tách riêng → vendor CACHE lâu dài!

  Q: "contenthash vs chunkhash vs hash?"
  A: hash: toàn bộ build → 1 file đổi = TẤT CẢ đổi!
  chunkhash: mỗi chunk → chunk đổi = hash đổi!
  contenthash: nội dung file → NỘI DUNG đổi = hash đổi!
  → contenthash TỐT NHẤT cho caching!

  Q: "Granular Chunking là gì?"
  A: Mỗi npm package = 1 chunk RIÊNG!
  Update 1 package → chỉ TẢI LẠI chunk đó!
  Packages khác → CACHE! → Tiết kiệm bandwidth!

  Q: "Tree Shaking hoạt động thế nào?"
  A: → Phân tích STATIC imports (ES Modules!)
  → Tìm exports ĐƯỢC DÙNG!
  → Loại bỏ exports KHÔNG DÙNG!
  → Cần: ESM + sideEffects: false + production mode!

  Q: "runtimeChunk: 'single' là gì?"
  A: → Webpack bootstrap code tách RIÊNG!
  → Thêm module mới → runtime chunk đổi!
  → Nhưng app + vendor hash KHÔNG bị ảnh hưởng!
  → → Cải thiện caching!
```

```
SƠ ĐỒ TỔNG QUAN:
═══════════════════════════════════════════════════════════════

  Source Code
      │
      ▼
  ┌─────────────── BUNDLER ──────────────────┐
  │                                           │
  │  ① Dependency Graph                       │
  │  ② Tree Shaking (loại code thừa!)        │
  │  ③ Split Chunks (tách bundles!)           │
  │  ④ Content Hashing (cache!)               │
  │  ⑤ Minification (nén code!)               │
  │                                           │
  └─────────────┬──┬──┬──┬──┬─────────────────┘
                │  │  │  │  │
                ▼  ▼  ▼  ▼  ▼
  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
  │ run- │ │ main │ │react │ │lodash│ │route │
  │ time │ │ .js  │ │.js   │ │.js   │ │chunk │
  │ 3KB  │ │200KB │ │130KB │ │70KB  │ │lazy! │
  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
  ← TẢI NGAY (initial) →     ← CACHE →  lazy!
```

---

### Checklist

- [ ] **Vấn đề**: 1 bundle khổng lồ → FCP/LCP/TTI chậm, blank screen dài!
- [ ] **Bundle vs Code Splitting**: Bundle = tách files; Code = tách theo logic (import())!
- [ ] **Dependency Graph**: Entry → tìm deps → đệ quy → graph → phân loại chunks!
- [ ] **SplitChunksPlugin**: chunks:"all", cacheGroups, priority, minSize/maxSize!
- [ ] **Vendor Splitting**: node_modules riêng → ít thay đổi → cache lâu dài!
- [ ] **Route Splitting**: Mỗi page = 1 lazy chunk → tải khi navigate!
- [ ] **Granular Chunking**: Mỗi npm package = 1 chunk → update 1 = tải lại 1!
- [ ] **contenthash**: Nội dung đổi → hash đổi; không đổi → cache!
- [ ] **runtimeChunk: "single"**: Tách Webpack bootstrap → app/vendor hash ổn định!
- [ ] **moduleIds: "deterministic"**: Module ID cố định → hash không đổi vô cớ!
- [ ] **Tree Shaking**: ESM + sideEffects:false + production → loại code thừa!
- [ ] **Bundle Analyzer**: Kiểm tra kích thước chunks → cảnh báo vượt ngưỡng!

---

_Nguồn: patterns.dev — Addy Osmani & Lydia Hallie — "Bundle Splitting"_
_Webpack Documentation — SplitChunksPlugin_
_Cập nhật lần cuối: Tháng 2, 2026_
