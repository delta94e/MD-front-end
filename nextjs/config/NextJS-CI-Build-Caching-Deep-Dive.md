# Next.js CI Build Caching — Deep Dive!

> **Chủ đề**: CI Build Caching — Cấu hình cache cho CI/CD!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/ci-build-caching
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams dưới đây là TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — CI Build Cache Là Gì?](#1)
2. [§2. .next/cache — Cái Gì? Tại Sao?](#2)
3. [§3. Cấu Hình Cho 11 CI Providers](#3)
4. [§4. Tự Viết — CIBuildCacheEngine](#4)
5. [§5. Câu Hỏi Luyện Tập](#5)

---

## §1. Tổng Quan — CI Build Cache Là Gì?

```
  CI BUILD CACHING — TỔNG QUAN:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VẤN ĐỀ:                                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  CI build KHÔNG có cache:                            │  │
  │  │  ┌─────────┐    ┌─────────┐    ┌─────────┐          │  │
  │  │  │ Build 1 │    │ Build 2 │    │ Build 3 │          │  │
  │  │  │ 5 phút  │    │ 5 phút  │    │ 5 phút  │          │  │
  │  │  │ FULL!   │    │ FULL!   │    │ FULL!   │          │  │
  │  │  └─────────┘    └─────────┘    └─────────┘          │  │
  │  │  → Mỗi build đều LÀM LẠI TỪ ĐẦU!                 │  │
  │  │  → Chậm! Tốn tài nguyên! Tốn tiền!                │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  GIẢI PHÁP = .next/cache:                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  CI build CÓ cache:                                  │  │
  │  │  ┌─────────┐    ┌─────────┐    ┌─────────┐          │  │
  │  │  │ Build 1 │    │ Build 2 │    │ Build 3 │          │  │
  │  │  │ 5 phút  │    │ 1 phút  │    │ 1 phút  │          │  │
  │  │  │ FULL    │    │ INCREM! │    │ INCREM! │          │  │
  │  │  │ → SAVE  │    │ RESTORE │    │ RESTORE │          │  │
  │  │  │  cache  │    │ → build │    │ → build │          │  │
  │  │  └─────────┘    └─────────┘    └─────────┘          │  │
  │  │  → Build 1 tạo cache → Build 2,3 RESTORE + build!  │  │
  │  │  → Chỉ rebuild PHẦN THAY ĐỔI!                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  NGUYÊN TẮC:                                               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  ① Next.js tự tạo cache → .next/cache               │  │
  │  │  ② CI MẶC ĐỊNH xóa sạch working dir mỗi build!     │  │
  │  │  ③ Bạn phải CẤU HÌNH CI để GIỮ LẠI .next/cache!   │  │
  │  │  ④ Không cấu hình → "No Cache Detected" error!     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. .next/cache — Cái Gì? Tại Sao?

```
  .NEXT/CACHE — HIỂU SÂU:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  .next/ (build output directory):                          │
  │  ├── cache/                ← CACHE DIRECTORY!             │
  │  │   ├── webpack/          ← Webpack compilation cache    │
  │  │   │   ├── client-*.pack │   Module bundling results    │
  │  │   │   └── server-*.pack │   Compiled server code       │
  │  │   ├── fetch-cache/      ← Data Cache (fetch results)  │
  │  │   ├── images/           ← Optimized images cache      │
  │  │   └── swc/              ← SWC transpilation cache      │
  │  ├── server/               ← Server output               │
  │  ├── static/               ← Static assets               │
  │  └── BUILD_ID              ← Build identifier            │
  │                                                            │
  │  TẠI SAO CACHE QUAN TRỌNG?                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  KHÔNG có cache:                                     │  │
  │  │  ┌────────────────────────────────────┐              │  │
  │  │  │ SWC parse TẤT CẢ files           │ ~ 30s        │  │
  │  │  │ Webpack bundle TẤT CẢ modules    │ ~ 2 phút     │  │
  │  │  │ Optimize TẤT CẢ images           │ ~ 1 phút     │  │
  │  │  │ Pre-render TẤT CẢ static pages   │ ~ 1 phút     │  │
  │  │  │ TỔNG                              │ ~ 5 phút!    │  │
  │  │  └────────────────────────────────────┘              │  │
  │  │                                                      │  │
  │  │  CÓ cache:                                           │  │
  │  │  ┌────────────────────────────────────┐              │  │
  │  │  │ SWC: chỉ parse files THAY ĐỔI    │ ~ 3s         │  │
  │  │  │ Webpack: incremental build        │ ~ 15s        │  │
  │  │  │ Images: chỉ optimize MỚI         │ ~ 5s         │  │
  │  │  │ Pages: chỉ re-render CHANGED     │ ~ 10s        │  │
  │  │  │ TỔNG                              │ ~ 33s!       │  │
  │  │  └────────────────────────────────────┘              │  │
  │  │                                                      │  │
  │  │  → Giảm 90% thời gian build!                       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CI WORKFLOW:                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  ① CI start → checkout code                         │  │
  │  │  ② RESTORE .next/cache từ CI cache storage          │  │
  │  │  ③ npm install                                       │  │
  │  │  ④ next build (incremental nhờ cache!)              │  │
  │  │  ⑤ SAVE .next/cache vào CI cache storage            │  │
  │  │  ⑥ Deploy                                            │  │
  │  │                                                      │  │
  │  │  Cache Key thường dựa trên:                          │  │
  │  │  → Lock file hash (yarn.lock / package-lock.json)   │  │
  │  │  → Source file hash (*.js, *.ts, *.tsx)              │  │
  │  │  → OS + branch                                      │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. Cấu Hình Cho 11 CI Providers!

```
  11 CI PROVIDERS — TỔNG QUAN:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌─────────────────┬──────────────────┬─────────────────┐  │
  │  │ Provider        │ Config file      │ Complexity      │  │
  │  ├─────────────────┼──────────────────┼─────────────────┤  │
  │  │ ① Vercel        │ (automatic!)     │ ⭐ Không cần!  │  │
  │  │ ② GitHub Actions│ workflow YAML    │ ⭐⭐ Trung bình │  │
  │  │ ③ GitLab CI     │ .gitlab-ci.yml   │ ⭐⭐ Trung bình │  │
  │  │ ④ CircleCI      │ config.yml       │ ⭐⭐ Trung bình │  │
  │  │ ⑤ Travis CI     │ .travis.yml      │ ⭐ Đơn giản    │  │
  │  │ ⑥ Netlify       │ plugin           │ ⭐ Đơn giản    │  │
  │  │ ⑦ AWS CodeBuild │ buildspec.yml    │ ⭐⭐ Trung bình │  │
  │  │ ⑧ Bitbucket     │ pipelines.yml    │ ⭐⭐ Trung bình │  │
  │  │ ⑨ Heroku        │ package.json     │ ⭐ Đơn giản    │  │
  │  │ ⑩ Azure         │ pipeline YAML    │ ⭐⭐ Trung bình │  │
  │  │ ⑪ Jenkins       │ Jenkinsfile      │ ⭐⭐⭐ Phức tạp │  │
  │  └─────────────────┴──────────────────┴─────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

### ① Vercel — Tự Động!

```
  VERCEL — ZERO CONFIG:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  → Next.js caching tự động cấu hình!                     │
  │  → KHÔNG cần làm gì!                                     │
  │  → Nếu dùng Turborepo → cũng tự xử lý!                 │
  │                                                            │
  │  TẠI SAO? Vercel = nhà tạo Next.js!                      │
  │  → Build system tích hợp sẵn cache strategy!             │
  │  → .next/cache tự persist giữa deployments!               │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

### ② CircleCI

```yaml
# .circleci/config.yml
steps:
  - save_cache:
      key: dependency-cache-{{ checksum "yarn.lock" }}
      paths:
        - ./node_modules
        - ./.next/cache # ← THÊM DÒNG NÀY!
```

```
  GIẢI THÍCH:
  ┌──────────────────────────────────────────────────────────┐
  │ save_cache: lưu directories vào cache storage            │
  │ key: cache key dựa trên yarn.lock checksum               │
  │   → yarn.lock thay đổi = cache MỚI!                    │
  │   → yarn.lock giữ nguyên = RESTORE cache cũ!           │
  │ paths:                                                    │
  │   → node_modules: skip npm install!                      │
  │   → .next/cache: skip full rebuild!                      │
  └──────────────────────────────────────────────────────────┘
```

### ③ Travis CI

```yaml
# .travis.yml
cache:
  directories:
    - $HOME/.cache/yarn # Yarn global cache
    - node_modules # Dependencies
    - .next/cache # ← Next.js build cache!
```

```
  GIẢI THÍCH:
  ┌──────────────────────────────────────────────────────────┐
  │ Travis CI dùng keyword "cache: directories"              │
  │ → Liệt kê TẤT CẢ directories cần cache!               │
  │ → Travis tự lưu/restore giữa builds!                   │
  │ → Cache key = tự động (branch-based)!                   │
  └──────────────────────────────────────────────────────────┘
```

### ④ GitLab CI

```yaml
# .gitlab-ci.yml
cache:
  key: ${CI_COMMIT_REF_SLUG} # Branch name!
  paths:
    - node_modules/
    - .next/cache/ # ← Next.js build cache!
```

```
  GIẢI THÍCH:
  ┌──────────────────────────────────────────────────────────┐
  │ key: ${CI_COMMIT_REF_SLUG}                               │
  │   → Mỗi BRANCH có cache riêng!                         │
  │   → main, develop, feature/* = caches khác nhau!        │
  │ paths: list directories cần cache!                       │
  └──────────────────────────────────────────────────────────┘
```

### ⑤ Netlify CI

```
  NETLIFY — PLUGIN-BASED:
  ┌──────────────────────────────────────────────────────────┐
  │ → Dùng plugin: @netlify/plugin-nextjs                    │
  │ → Plugin tự xử lý cache .next/cache!                    │
  │ → Chỉ cần install plugin, KHÔNG cần config thêm!       │
  └──────────────────────────────────────────────────────────┘
```

### ⑥ AWS CodeBuild

```yaml
# buildspec.yml
cache:
  paths:
    - "node_modules/**/*" # Dependencies
    - ".next/cache/**/*" # ← Next.js build cache!
```

### ⑦ GitHub Actions

```yaml
# .github/workflows/build.yml
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ${{ github.workspace }}/.next/cache
    # Cache key = OS + packages + source files!
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx') }}
    # Fallback: packages match nhưng source thay đổi
    restore-keys: |
      ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-
```

```
  GIẢI THÍCH CACHE KEY STRATEGY:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  PRIMARY KEY gồm 3 phần:                                │
  │  ┌────────┬──────────────────┬───────────────────────┐   │
  │  │ OS     │ package-lock     │ source files          │   │
  │  │ Linux  │ hash(*.json)     │ hash(*.js,*.ts,*.tsx) │   │
  │  └────────┴──────────────────┴───────────────────────┘   │
  │                                                          │
  │  → Packages + source GIỐNG = exact cache HIT!           │
  │  → Packages GIỐNG nhưng source KHÁC?                    │
  │    → restore-keys match = partial cache!               │
  │    → Build chỉ re-compile files thay đổi!             │
  │  → Packages KHÁC = cache MISS = full build!            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

### ⑧ Bitbucket Pipelines

```yaml
# bitbucket-pipelines.yml (TOP LEVEL)
definitions:
  caches:
    nextcache: .next/cache    # Define custom cache!

# Trong pipeline step:
- step:
    name: your_step_name
    caches:
      - node                  # Built-in node_modules cache
      - nextcache             # ← Custom Next.js cache!
```

```
  GIẢI THÍCH:
  ┌──────────────────────────────────────────────────────────┐
  │ Bitbucket cần 2 bước:                                    │
  │ ① DEFINE custom cache (definitions.caches.nextcache)    │
  │ ② REFERENCE trong step (caches: - nextcache)            │
  │ → "node" là built-in, "nextcache" là custom!           │
  └──────────────────────────────────────────────────────────┘
```

### ⑨ Heroku

```json
// package.json (top-level)
{
  "cacheDirectories": [".next/cache"]
}
```

```
  GIẢI THÍCH:
  ┌──────────────────────────────────────────────────────────┐
  │ Heroku dùng cacheDirectories trong package.json!         │
  │ → Đơn giản nhất trong tất cả providers!                │
  │ → Chỉ thêm 1 dòng!                                    │
  └──────────────────────────────────────────────────────────┘
```

### ⑩ Azure Pipelines

```yaml
# azure-pipelines.yml (TRƯỚC next build!)
- task: Cache@2
  displayName: "Cache .next/cache"
  inputs:
    key: next | $(Agent.OS) | yarn.lock
    path: "$(System.DefaultWorkingDirectory)/.next/cache"
```

```
  GIẢI THÍCH:
  ┌──────────────────────────────────────────────────────────┐
  │ Cache@2 task: action chuyên dụng cho caching!            │
  │ key: next | OS | yarn.lock                               │
  │   → "next" = prefix!                                    │
  │   → OS = match theo hệ điều hành!                      │
  │   → yarn.lock = invalidate khi deps thay đổi!          │
  │ path: đường dẫn tuyệt đối đến .next/cache!             │
  │ ⚠️ Phải đặt TRƯỚC bước next build!                     │
  └──────────────────────────────────────────────────────────┘
```

### ⑪ Jenkins (Pipeline) — Phức Tạp Nhất!

```groovy
// Jenkinsfile
stage("Restore npm packages") {
    steps {
        writeFile file: "next-lock.cache",
                  text: "$GIT_COMMIT"
        cache(caches: [
            arbitraryFileCache(
                path: "node_modules",
                includes: "**/*",
                cacheValidityDecidingFile: "package-lock.json"
            )
        ]) {
            sh "npm install"
        }
    }
}

stage("Build") {
    steps {
        writeFile file: "next-lock.cache",
                  text: "$GIT_COMMIT"
        cache(caches: [
            arbitraryFileCache(
                path: ".next/cache",
                includes: "**/*",
                cacheValidityDecidingFile: "next-lock.cache"
            )
        ]) {
            sh "npm run build"   // = next build
        }
    }
}
```

```
  GIẢI THÍCH JENKINS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Jenkins dùng Job Cacher plugin!                         │
  │  2 stages = 2 caches riêng biệt!                        │
  │                                                          │
  │  Stage 1: "Restore npm packages"                         │
  │  → cacheValidityDecidingFile: "package-lock.json"       │
  │  → Nếu package-lock.json KHÔNG đổi → dùng cache!      │
  │  → Nếu ĐỔI → invalidate → npm install lại!           │
  │                                                          │
  │  Stage 2: "Build"                                        │
  │  → writeFile: tạo "next-lock.cache" = GIT_COMMIT       │
  │  → cacheValidityDecidingFile: "next-lock.cache"         │
  │  → Mỗi commit MỚI = build mới NHƯNG vẫn incremental! │
  │                                                          │
  │  TẠI SAO PHỨC TẠP?                                      │
  │  → Jenkins KHÔNG có built-in cache như GitHub Actions!  │
  │  → Cần plugin (Job Cacher) + manual cache key!         │
  │  → 2 separate caches cho node_modules vs .next/cache!  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — CIBuildCacheEngine!

```javascript
var CIBuildCacheEngine = (function () {
  // ═══════════════════════════════════
  // 1. CACHE STORAGE (simulated)
  // ═══════════════════════════════════
  var cacheStorage = {};

  function saveCache(key, paths) {
    cacheStorage[key] = {
      paths: paths.slice(),
      savedAt: Date.now(),
    };
    console.log('  💾 SAVE cache: key="' + key + '"');
    console.log("     paths: " + paths.join(", "));
  }

  function restoreCache(key, restoreKeys) {
    // Exact match
    if (cacheStorage[key]) {
      console.log('  ✅ RESTORE exact: key="' + key + '"');
      return cacheStorage[key];
    }
    // Fallback: restore-keys (prefix match)
    if (restoreKeys) {
      for (var i = 0; i < restoreKeys.length; i++) {
        var keys = Object.keys(cacheStorage);
        for (var j = 0; j < keys.length; j++) {
          if (keys[j].indexOf(restoreKeys[i]) === 0) {
            console.log(
              '  ⚡ RESTORE partial: "' +
                keys[j] +
                '" via "' +
                restoreKeys[i] +
                '"',
            );
            return cacheStorage[keys[j]];
          }
        }
      }
    }
    console.log('  ❌ Cache MISS: key="' + key + '"');
    return null;
  }

  // ═══════════════════════════════════
  // 2. HASH FUNCTIONS (simulated)
  // ═══════════════════════════════════
  function hashFile(filename) {
    // Simulate file hash
    return filename.replace(/[^a-z0-9]/gi, "").slice(0, 8);
  }

  function buildCacheKey(os, lockfile, sourceFiles) {
    return (
      os +
      "-nextjs-" +
      hashFile(lockfile) +
      "-" +
      hashFile(sourceFiles.join(""))
    );
  }

  // ═══════════════════════════════════
  // 3. BUILD SIMULATION
  // ═══════════════════════════════════
  function simulateBuild(hasCache) {
    var start = Date.now();
    if (hasCache) {
      console.log("  🔨 Incremental build (cached!)");
      console.log("     SWC: 2 files changed → 3s");
      console.log("     Webpack: incremental → 15s");
      console.log("     Total: ~18s");
    } else {
      console.log("  🔨 Full build (no cache!)");
      console.log("     SWC: all files → 30s");
      console.log("     Webpack: full bundle → 120s");
      console.log("     Total: ~150s");
    }
    return { duration: hasCache ? 18 : 150 };
  }

  // ═══════════════════════════════════
  // 4. CI PIPELINE SIMULATION
  // ═══════════════════════════════════
  function runPipeline(config) {
    console.log("\n╔══════════════════════════════════╗");
    console.log("║  CI Pipeline: " + config.provider.padEnd(17) + "║");
    console.log("╚══════════════════════════════════╝");

    var key = buildCacheKey(
      config.os || "Linux",
      config.lockfile || "package-lock.json",
      config.sourceFiles || ["app.tsx"],
    );
    var restoreKeys = [
      (config.os || "Linux") +
        "-nextjs-" +
        hashFile(config.lockfile || "package-lock.json") +
        "-",
    ];

    // Step 1: Checkout
    console.log("\n  ① Checkout code");

    // Step 2: Restore cache
    console.log("  ② Restore cache");
    var cached = restoreCache(key, restoreKeys);

    // Step 3: Install
    console.log("  ③ npm install" + (cached ? " (from cache!)" : " (fresh!)"));

    // Step 4: Build
    console.log("  ④ next build");
    var result = simulateBuild(!!cached);

    // Step 5: Save cache
    console.log("  ⑤ Save cache");
    saveCache(key, ["node_modules", ".next/cache"]);

    // Step 6: Deploy
    console.log("  ⑥ Deploy ✅");
    console.log("  → Build time: ~" + result.duration + "s");

    return result;
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  CI BUILD CACHE ENGINE DEMO         ║");
    console.log("╚════════════════════════════════════╝");

    // Build 1: No cache (first time)
    var r1 = runPipeline({
      provider: "GitHub Actions",
      lockfile: "package-lock.json",
      sourceFiles: ["app.tsx", "page.tsx"],
    });

    // Build 2: Same code (exact cache hit!)
    var r2 = runPipeline({
      provider: "GitHub Actions",
      lockfile: "package-lock.json",
      sourceFiles: ["app.tsx", "page.tsx"],
    });

    // Build 3: Source changed (partial cache!)
    var r3 = runPipeline({
      provider: "GitHub Actions",
      lockfile: "package-lock.json",
      sourceFiles: ["app.tsx", "page.tsx", "new.tsx"],
    });

    console.log("\n── Summary ──");
    console.log("  Build 1: " + r1.duration + "s (no cache)");
    console.log("  Build 2: " + r2.duration + "s (exact hit)");
    console.log("  Build 3: " + r3.duration + "s (partial hit)");
    console.log(
      "  Savings: " +
        Math.round((1 - r2.duration / r1.duration) * 100) +
        "% faster!",
    );
  }

  return { demo: demo };
})();
// Chạy: CIBuildCacheEngine.demo();
```

---

## §5. Câu Hỏi Luyện Tập!

**Câu 1**: .next/cache chứa gì? Tại sao cần persist giữa CI builds?

<details><summary>Đáp án</summary>

`.next/cache` chứa:

- **webpack/**: Compiled module bundles (client + server packs)
- **fetch-cache/**: Data Cache results từ fetch requests
- **images/**: Optimized images cache
- **swc/**: SWC transpilation cache

Cần persist vì: CI mặc định **xóa sạch** working directory mỗi build. Nếu không lưu `.next/cache`, mỗi build phải compile lại **TẤT CẢ** — full SWC parse, full Webpack bundle, full image optimization. Với cache, chỉ rebuild **files thay đổi** → giảm ~90% build time.

</details>

---

**Câu 2**: Cache key strategy của GitHub Actions hoạt động thế nào? Giải thích restore-keys.

<details><summary>Đáp án</summary>

**Primary key** gồm 3 phần:

```
${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.js', '**/*.tsx') }}
```

- `runner.os`: Linux/macOS/Windows (cache theo OS)
- `hashFiles('package-lock.json')`: hash dependencies
- `hashFiles('*.js', '*.tsx')`: hash source code

**Matching:**

- Packages + source **GIỐNG** → exact HIT → dùng nguyên cache
- Packages **GIỐNG** nhưng source **KHÁC** → `restore-keys` prefix match → partial cache → incremental build chỉ re-compile files thay đổi
- Packages **KHÁC** → full MISS → build from scratch

**restore-keys** = fallback — match prefix để tìm cache gần nhất, dù không exact match.

</details>

---

**Câu 3**: Tại sao Jenkins phức tạp nhất? Giải thích 2 stages caching.

<details><summary>Đáp án</summary>

Jenkins **KHÔNG** có built-in cache mechanism như GitHub Actions hay GitLab CI. Cần:

1. **Plugin**: Job Cacher (phải install riêng)
2. **Manual cache key**: Tự tạo file `next-lock.cache` chứa `$GIT_COMMIT`

**2 separate caches:**

| Stage       | Cache path     | Validity file                    | Mục đích                            |
| ----------- | -------------- | -------------------------------- | ----------------------------------- |
| Restore npm | `node_modules` | `package-lock.json`              | Skip npm install khi deps không đổi |
| Build       | `.next/cache`  | `next-lock.cache` (= GIT_COMMIT) | Incremental build                   |

`cacheValidityDecidingFile` = file quyết định cache có hợp lệ không. Nếu file thay đổi → cache invalid → rebuild.

</details>

---

**Câu 4**: Provider nào KHÔNG cần cấu hình gì? Provider nào dùng plugin?

<details><summary>Đáp án</summary>

| Approach          | Provider                                                              |
| ----------------- | --------------------------------------------------------------------- |
| **Zero config**   | **Vercel** — tự động hoàn toàn (nhà tạo Next.js!)                     |
| **Plugin-based**  | **Netlify** — `@netlify/plugin-nextjs` tự xử lý cache                 |
| **1 dòng**        | **Heroku** — `"cacheDirectories": [".next/cache"]` trong package.json |
| **YAML config**   | CircleCI, Travis, GitLab, AWS, GitHub Actions, Azure, Bitbucket       |
| **Groovy script** | **Jenkins** — Jenkinsfile + Job Cacher plugin                         |

</details>
