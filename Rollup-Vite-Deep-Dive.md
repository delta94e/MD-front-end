# Build Tools: Rollup → Vite — Deep Dive!

> **Từ Rollup đến Vite: kiến trúc build hiện đại!**
> ESM, Tree Shaking, Plugin, Vue3 Build System, Vite Dual-Engine!

---

## §1. Rollup Là Gì?

```
  ROLLUP vs WEBPACK:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────┬──────────────────┬──────────────────┐     │
  │  │              │ Rollup ★         │ Webpack          │     │
  │  ├──────────────┼──────────────────┼──────────────────┤     │
  │  │ Focus        │ ES Module! ★     │ Mọi asset       │     │
  │  │ Tree Shaking │ Cực mạnh! ★     │ Tốt (webpack5)  │     │
  │  │ Output       │ Nhỏ, sạch! ★   │ Nhiều boilerplate│     │
  │  │ Config       │ Đơn giản!       │ Phức tạp        │     │
  │  │ Use case     │ Library! ★       │ Application     │     │
  │  │ Dev server   │ Không built-in  │ webpack-dev-srv  │     │
  │  │ Code split   │ Có              │ Mạnh hơn ★     │     │
  │  └──────────────┴──────────────────┴──────────────────┘     │
  │                                                              │
  │  ★ Rollup = lý tưởng cho LIBRARY (Vue3, React...)!         │
  │  ★ Webpack = lý tưởng cho APPLICATION!                       │
  │  ★ Vite = Rollup (prod) + esbuild (dev)! ★                 │
  │                                                              │
  │  ROLLUP — ƯU ĐIỂM CỐT LÕI:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Tree Shaking cực mạnh — ESM static analysis! ★   │    │
  │  │ ② Multi-format output — ESM, CJS, UMD, IIFE! ★      │    │
  │  │ ③ Config đơn giản — learning curve thấp!            │    │
  │  │ ④ Plugin system hoàn chỉnh! ★                        │    │
  │  │ ⑤ Output code sạch — dễ đọc!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Rollup Config — Input/Output!

```
  OUTPUT FORMAT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────┬──────────────────────┬───────────────────────┐    │
  │  │Format│ Tên đầy đủ         │ Dùng khi             │    │
  │  ├──────┼──────────────────────┼───────────────────────┤    │
  │  │ es   │ ES Module            │ Bundler, browser mới │    │
  │  │      │ import/export ★      │ Tree Shaking tốt!   │    │
  │  │ cjs  │ CommonJS             │ Node.js!              │    │
  │  │      │ require/module.exports│                       │    │
  │  │ umd  │ Universal Module     │ Browser + Node! ★     │    │
  │  │      │ AMD + CJS + global   │ Thư viện phổ biến!  │    │
  │  │ iife │ Immediately Invoked  │ Browser <script>! ★   │    │
  │  │      │ Function Expression  │ Tự gói, ko ô nhiễm! │    │
  │  │ amd  │ Asynchronous Module  │ RequireJS (hiếm!)    │    │
  │  └──────┴──────────────────────┴───────────────────────┘    │
  │                                                              │
  │  FLOW:                                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  src/index.js ──→ ROLLUP ──→ dist/lib.esm.js (ESM!)│    │
  │  │     (input)       │          dist/lib.cjs.js (CJS!) │    │
  │  │                   │          dist/lib.umd.js (UMD!) │    │
  │  │                   │          dist/lib.iife.js (IIFE)│    │
  │  │                   │                                  │    │
  │  │                   ├─ Tree Shaking! ★                 │    │
  │  │                   ├─ Plugins! (resolve, babel...)    │    │
  │  │                   └─ External! (react, vue...)       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Mini Rollup Config Generator!
// ★ Hiểu cấu trúc config Rollup!
// ═══════════════════════════════════════════════════════════

function createRollupConfig(options) {
  var name = options.name;
  var input = options.input || "src/index.js";
  var outputDir = options.outputDir || "dist";

  return {
    // ★ Entry point!
    input: input,

    // ★ Multi-format output!
    output: [
      {
        file: outputDir + "/" + name + ".cjs.js",
        format: "cjs", // ★ Node.js!
        sourcemap: true,
      },
      {
        file: outputDir + "/" + name + ".esm.js",
        format: "es", // ★ Modern bundler!
        sourcemap: true,
      },
      {
        file: outputDir + "/" + name + ".umd.js",
        format: "umd", // ★ Universal!
        name: options.globalName,
        sourcemap: true,
      },
      {
        file: outputDir + "/" + name + ".iife.js",
        format: "iife", // ★ Browser <script>!
        name: options.globalName,
      },
    ],

    // ★ External: KHÔNG bundle những thư viện này!
    external: options.external || [],

    // ★ UMD globals mapping!
    // → External deps cần global variable name!
    globals: options.globals || {},
  };
}

// SỬ DỤNG:
// createRollupConfig({
//   name: 'my-lib',
//   input: 'src/index.js',
//   globalName: 'MyLibrary',
//   external: ['react', 'lodash'],
//   globals: { react: 'React', lodash: '_' },
// });
```

---

## §3. Plugin System!

```
  ROLLUP PLUGINS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PLUGIN PIPELINE:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Source code                                          │    │
  │  │       │                                                │    │
  │  │       ├─① node-resolve   → import từ node_modules!   │    │
  │  │       ├─② commonjs       → CJS → ESM! ★              │    │
  │  │       ├─③ json           → import JSON file!          │    │
  │  │       ├─④ replace        → __DEV__ → true/false! ★   │    │
  │  │       ├─⑤ typescript     → TS → JS!                   │    │
  │  │       ├─⑥ babel          → Modern → ES5!              │    │
  │  │       └─⑦ terser         → Minify! (prod only!) ★    │    │
  │  │       │                                                │    │
  │  │       ▼                                                │    │
  │  │  Output bundle!                                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Plugin            │ Chức năng                       │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ node-resolve      │ Resolve node_modules imports! ★ │    │
  │  │ commonjs          │ CJS → ESM conversion! ★         │    │
  │  │ json              │ Import .json files!              │    │
  │  │ replace           │ String replacement (__DEV__!) ★  │    │
  │  │ typescript        │ TS compilation + .d.ts! ★        │    │
  │  │ babel             │ Syntax transform!                │    │
  │  │ terser            │ Code minification! ★             │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Mini Plugin System (giống Rollup!)
// ★ Hiểu cách plugin hoạt động bên trong!
// ═══════════════════════════════════════════════════════════

function PluginRunner(plugins) {
  this.plugins = plugins || [];
}

// ★ Hook: resolveId → tìm file path!
PluginRunner.prototype.resolveId = function (source) {
  for (var i = 0; i < this.plugins.length; i++) {
    if (this.plugins[i].resolveId) {
      var result = this.plugins[i].resolveId(source);
      if (result) return result; // ★ Plugin đầu tiên resolve thắng!
    }
  }
  return source; // Fallback: giữ nguyên!
};

// ★ Hook: transform → biến đổi code!
PluginRunner.prototype.transform = function (code, id) {
  var result = code;
  for (var i = 0; i < this.plugins.length; i++) {
    if (this.plugins[i].transform) {
      var transformed = this.plugins[i].transform(result, id);
      if (transformed) result = transformed; // ★ Pipe qua từng plugin!
    }
  }
  return result;
};

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Plugin ví dụ — Replace (__DEV__, __VERSION__)!
// ═══════════════════════════════════════════════════════════

function replacePlugin(replacements) {
  return {
    name: "replace",
    transform: function (code) {
      var result = code;
      for (var key in replacements) {
        // ★ Thay thế string trong code!
        result = result.split(key).join(String(replacements[key]));
      }
      return result;
    },
  };
}

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Plugin ví dụ — JSON import!
// ═══════════════════════════════════════════════════════════

function jsonPlugin() {
  return {
    name: "json",
    transform: function (code, id) {
      if (id && id.match(/\.json$/)) {
        // ★ JSON → ES Module export!
        return "export default " + code + ";";
      }
      return null; // Không xử lý file khác!
    },
  };
}

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Plugin ví dụ — Minifier (đơn giản!)
// ═══════════════════════════════════════════════════════════

function miniMinifier() {
  return {
    name: "mini-minifier",
    transform: function (code) {
      // ★ Xóa comments!
      var result = code.replace(/\/\/.*$/gm, "");
      result = result.replace(/\/\*[\s\S]*?\*\//g, "");
      // ★ Xóa whitespace thừa!
      result = result.replace(/\n\s*\n/g, "\n");
      return result;
    },
  };
}
```

---

## §4. Tree Shaking!

```
  TREE SHAKING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ "Rung cây" = loại bỏ code KHÔNG DÙNG! ★                 │
  │                                                              │
  │  TRƯỚC (không tree shaking!):                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // utils.js                                           │    │
  │  │ export function add(a, b) { return a + b; }            │    │
  │  │ export function subtract(a, b) { return a - b; }      │    │
  │  │ export function multiply(a, b) { return a * b; } ← ❌│    │
  │  │ export function divide(a, b) { return a / b; }   ← ❌│    │
  │  │                                                      │    │
  │  │ // main.js                                             │    │
  │  │ import { add, subtract } from './utils';               │    │
  │  │ // → BUNDLE chứa CẢ 4 functions! ❌                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SAU (tree shaking!):                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Bundle output:                                      │    │
  │  │ function add(a, b) { return a + b; }     ← ✅ GIỮ!   │    │
  │  │ function subtract(a, b) { return a - b; } ← ✅ GIỮ! │    │
  │  │ // multiply, divide → ĐÃ XÓA! ★                     │    │
  │  │ // → Bundle NHỎ hơn rất nhiều! ★                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO CẦN ESM?                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ESM: import/export = STATIC! ★                        │    │
  │  │ → Phân tích được lúc BUILD TIME!                      │    │
  │  │ → Biết chính xác function nào DÙNG/KHÔNG DÙNG!       │    │
  │  │                                                      │    │
  │  │ CJS: require() = DYNAMIC! ❌                           │    │
  │  │ → Chỉ biết lúc RUNTIME!                               │    │
  │  │ → KHÔNG THỂ tree shake! ❌                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Mini Tree Shaker!
// ★ Hiểu nguyên lý tree shaking!
// ═══════════════════════════════════════════════════════════

function MiniTreeShaker() {
  this.exports = {}; // Tất cả exports!
  this.usedExports = {}; // Exports ĐƯỢC DÙNG!
}

// ★ Bước 1: Scan exports!
MiniTreeShaker.prototype.scanExports = function (code) {
  var exportRegex = /export\s+function\s+(\w+)/g;
  var match;
  while ((match = exportRegex.exec(code)) !== null) {
    this.exports[match[1]] = true;
  }
  return Object.keys(this.exports);
};

// ★ Bước 2: Scan imports (used exports!)
MiniTreeShaker.prototype.scanImports = function (code) {
  var importRegex = /import\s*\{([^}]+)\}/g;
  var match;
  while ((match = importRegex.exec(code)) !== null) {
    var names = match[1].split(",");
    for (var i = 0; i < names.length; i++) {
      var name = names[i].trim();
      if (name) this.usedExports[name] = true;
    }
  }
  return Object.keys(this.usedExports);
};

// ★ Bước 3: Tìm dead code!
MiniTreeShaker.prototype.getDeadExports = function () {
  var dead = [];
  for (var name in this.exports) {
    if (!this.usedExports[name]) {
      dead.push(name); // ★ Export KHÔNG ai dùng → DEAD!
    }
  }
  return dead;
};

// SỬ DỤNG:
// var shaker = new MiniTreeShaker();
// shaker.scanExports(utilsCode);    // ['add','subtract','multiply','divide']
// shaker.scanImports(mainCode);      // ['add','subtract']
// shaker.getDeadExports();           // ['multiply','divide'] ← XÓA!
```

---

## §5. Vue3 Build System!

```
  VUE3 MONOREPO BUILD:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CẤU TRÚC:                                                      │
  │  vue-next/                                                   │
  │  ├── packages/           ← Tất cả sub-packages!             │
  │  │   ├── reactivity/     ← Hệ thống reactive! ★            │
  │  │   ├── runtime-core/   ← Runtime core!                    │
  │  │   ├── runtime-dom/    ← Browser runtime!                 │
  │  │   ├── compiler-core/  ← Compiler core!                   │
  │  │   ├── compiler-dom/   ← Browser compiler!                │
  │  │   ├── shared/         ← Shared utilities!                │
  │  │   └── vue/            ← Full build! ★                    │
  │  ├── scripts/                                                │
  │  │   ├── build.js        ← Build script! ★                  │
  │  │   └── dev.js          ← Dev mode!                         │
  │  ├── rollup.config.js    ← Rollup config! ★                 │
  │  └── pnpm-workspace.yaml ← Monorepo config!                 │
  │                                                              │
  │  LỆNH: pnpm run build reactivity                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① pnpm run build reactivity                          │    │
  │  │ ② → package.json: "build": "node scripts/build.js"  │    │
  │  │ ③ → node scripts/build.js reactivity                 │    │
  │  │ ④ → build.js parse args → target = "reactivity"     │    │
  │  │ ⑤ → rollup -c --environment TARGET:reactivity        │    │
  │  │ ⑥ → rollup.config.js đọc TARGET env var!            │    │
  │  │ ⑦ → Build packages/reactivity/src/index.ts!         │    │
  │  │ ⑧ → Output:                                          │    │
  │  │     reactivity.cjs.js  (CommonJS!)                   │    │
  │  │     reactivity.esm.js  (ES Module!) ★                │    │
  │  │     reactivity.global.js (UMD/IIFE!)                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FEATURE FLAGS (__DEV__, __VERSION__...):                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Source code:                                        │    │
  │  │ if (__DEV__) { warn('Something wrong!'); }             │    │
  │  │                                                      │    │
  │  │ // Production build (replace plugin!):                 │    │
  │  │ if (false) { warn('Something wrong!'); }               │    │
  │  │ → Tree shaking XÓA toàn bộ block này! ★             │    │
  │  │ → Production bundle NHỎ hơn! ★                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Mini Build Script (kiểu Vue3!)
// ★ Hiểu scripts/build.js hoạt động thế nào!
// ═══════════════════════════════════════════════════════════

function MiniBuildSystem(packagesDir) {
  this.packagesDir = packagesDir;
  this.packages = {}; // name → config
}

// ★ Scan packages!
MiniBuildSystem.prototype.scanPackages = function (packageNames) {
  for (var i = 0; i < packageNames.length; i++) {
    var name = packageNames[i];
    this.packages[name] = {
      name: name,
      input: this.packagesDir + "/" + name + "/src/index.js",
      pkgJson: {
        main: "dist/" + name + ".cjs.js",
        module: "dist/" + name + ".esm.js",
      },
    };
  }
};

// ★ Tạo Rollup config cho 1 package!
MiniBuildSystem.prototype.createConfig = function (packageName) {
  var pkg = this.packages[packageName];
  if (!pkg) throw new Error("Package not found: " + packageName);

  return {
    input: pkg.input,
    output: [
      {
        file: this.packagesDir + "/" + packageName + "/" + pkg.pkgJson.main,
        format: "cjs",
      },
      {
        file: this.packagesDir + "/" + packageName + "/" + pkg.pkgJson.module,
        format: "es",
      },
    ],
    plugins: [
      replacePlugin({
        __DEV__: 'process.env.NODE_ENV !== "production"',
        __VERSION__: '"1.0.0"',
      }),
    ],
  };
};

// ★ Build 1 package hoặc tất cả!
MiniBuildSystem.prototype.build = function (targets) {
  var self = this;
  if (!targets || targets.length === 0) {
    targets = Object.keys(this.packages); // Build ALL!
  }
  var configs = targets.map(function (t) {
    return self.createConfig(t);
  });
  return configs;
};
```

---

## §6. Vite — Dual-Engine Architecture!

```
  VITE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ VỚI BUNDLER TRUYỀN THỐNG:                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Webpack/Rollup dev:                                    │    │
  │  │ ┌──────┐ ┌──────┐ ┌──────┐      ┌──────────┐         │    │
  │  │ │file1 │ │file2 │ │file3 │ ───→ │ BUNDLE   │ → Serve │    │
  │  │ │.vue  │ │.ts   │ │.css  │ ↑    │ (tất cả!)│         │    │
  │  │ └──────┘ └──────┘ └──────┘ │    └──────────┘         │    │
  │  │                             │                         │    │
  │  │ ★ Bundle TẤT CẢ trước khi serve! ❌                  │    │
  │  │ ★ Project lớn = khởi động 30s-60s! ❌                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VITE DEV (Native ESM!):                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Browser ──→ import App from '/App.vue' ──→ Vite srv │    │
  │  │         ←── App.vue (compiled on-demand!) ←──        │    │
  │  │                                                      │    │
  │  │  ★ KHÔNG bundle! Browser request → Vite compile! ★  │    │
  │  │  ★ Chỉ compile file ĐANG CẦN! ★                     │    │
  │  │  ★ Khởi động: < 1 GIÂY! ★★★                          │    │
  │  │  ★ HMR: < 50ms! ★ (chỉ update 1 module!)            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DUAL-ENGINE:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌───────────────────────────────────────────┐        │    │
  │  │  │ DEVELOPMENT:                                │        │    │
  │  │  │ ★ Native ESM (browser!) ★                  │        │    │
  │  │  │ ★ esbuild pre-bundle (deps!) ★              │        │    │
  │  │  │   → esbuild = Go → 10-100x nhanh hơn JS! │        │    │
  │  │  │   → Pre-bundle node_modules 1 lần!         │        │    │
  │  │  └───────────────────────────────────────────┘        │    │
  │  │                                                      │    │
  │  │  ┌───────────────────────────────────────────┐        │    │
  │  │  │ PRODUCTION:                                  │        │    │
  │  │  │ ★ ROLLUP! ★ (đã tối ưu, mature!)          │        │    │
  │  │  │ → Tree shaking!                              │        │    │
  │  │  │ → Code splitting!                            │        │    │
  │  │  │ → Minification!                              │        │    │
  │  │  │ → Plugin tương thích Rollup! ★              │        │    │
  │  │  └───────────────────────────────────────────┘        │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CHỌN ROLLUP HAY VITE?                                          │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Rollup            │ Vite                            │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ Build LIBRARY ★   │ Build APPLICATION ★              │    │
  │  │ Cần kiểm soát    │ Cần dev server nhanh! ★          │    │
  │  │  chi tiết output │ Cần HMR! ★                       │    │
  │  │ Vue3 source code! │ Vue3/React app!                   │    │
  │  │                  │ Vite production = dùng Rollup! ★ │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Rollup vs Webpack khác gì?                                │
  │  → Rollup: focus ESM, output nhỏ/sạch, tree shake mạnh! ★ │
  │  → Webpack: focus application, nhiều asset types, code split│
  │  → Rollup = library! Webpack = application! ★               │
  │                                                              │
  │  ❓ 2: Tree Shaking cần điều kiện gì?                           │
  │  → ESM (import/export) bắt buộc! ★ (static analysis!)      │
  │  → CJS (require) KHÔNG tree shake được! ❌ (dynamic!)       │
  │  → sideEffects: false trong package.json!                    │
  │  → Rollup phân tích STATIC → biết code nào DEAD! ★         │
  │                                                              │
  │  ❓ 3: Vite tại sao nhanh?                                      │
  │  → Dev: KHÔNG bundle! Native ESM + on-demand compile! ★     │
  │  → esbuild (Go): pre-bundle deps 10-100x nhanh! ★           │
  │  → HMR: chỉ update 1 module, không re-bundle! ★             │
  │                                                              │
  │  ❓ 4: Vite production dùng gì?                                  │
  │  → ROLLUP! ★ (không phải esbuild!)                           │
  │  → Rollup mature hơn, tree shaking tốt hơn!                 │
  │  → Plugin Vite tương thích plugin Rollup! ★                  │
  │                                                              │
  │  ❓ 5: Vue3 tại sao chọn Rollup?                                 │
  │  → Vue3 là LIBRARY → Rollup output sạch, nhỏ! ★             │
  │  → Multi-format: ESM + CJS + UMD + IIFE cùng lúc! ★        │
  │  → __DEV__ feature flags → tree shake prod code! ★           │
  │  → Monorepo: mỗi package build riêng!                        │
  │                                                              │
  │  ❓ 6: Output format: ESM vs CJS vs UMD vs IIFE?                │
  │  → ESM: import/export! Modern bundler + browser! ★           │
  │  → CJS: require()! Node.js!                                  │
  │  → UMD: AMD + CJS + global! Universal! ★                     │
  │  → IIFE: Self-executing! Browser <script> tag!               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
