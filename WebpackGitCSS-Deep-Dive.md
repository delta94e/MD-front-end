# Webpack, Git & CSS — Q77–Q90 — Deep Dive

> 📅 2026-02-12 · ⏱ 18 phút đọc
>
> Tổng hợp Q77–Q90: Webpack HMR, common loaders/plugins,
> Git commands, CSS box model, selectors, position, CSS3,
> responsive design, CSS triangle, margin collapse.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: Build Tools / Git / CSS

---

## Mục Lục

0. [Webpack HMR (Q77)](#q77)
1. [Common Loaders (Q78)](#q78)
2. [Common Plugins (Q79)](#q79)
3. [Git Commands (Q80)](#q80)
4. [CSS Box Model (Q81)](#q81)
5. [CSS Selectors & Inheritance (Q83)](#q83)
6. [CSS position (Q84)](#q84)
7. [CSS3 New Features (Q85)](#q85)
8. [CSS Triangle (Q86)](#q86)
9. [Responsive Design (Q87)](#q87)
10. [CSS Performance (Q88)](#q88)
11. [inline-block Gap (Q89)](#q89)
12. [Margin Collapse (Q90)](#q90)
13. [Tóm Tắt & Checklist](#tóm-tắt)

---

## Q77. Webpack HMR — Hot Module Replacement

```
HMR — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  webpack-dev-server tạo 2 SERVERS:

  ┌───────────────────────────────────────────────────────────┐
  │ ① Express Server (HTTP)                                 │
  │    → Serve static assets (bundled files)                │
  │    → Browser request + parse trực tiếp                  │
  │                                                         │
  │ ② Socket Server (WebSocket)                             │
  │    → Long-lived connection (bidirectional)              │
  │    → Push changes REAL-TIME to browser                  │
  └───────────────────────────────────────────────────────────┘

  HMR FLOW:
  ┌──────────┐    watch     ┌──────────┐
  │ Source    │ ──────────→ │ Webpack   │
  │ file edit │             │ compiler  │
  └──────────┘              └────┬─────┘
                                 │ generate:
                          ┌──────┴──────┐
                          │ .json       │ .js (update chunk)
                          │ (manifest)  │ (changed modules)
                          └──────┬──────┘
                                 │ WebSocket push
                          ┌──────▼──────┐
                          │ Browser     │
                          │ HMR Runtime │
                          └──────┬──────┘
                                 │ patch
                          ┌──────▼──────┐
                          │ Update ONLY │
                          │ changed     │
                          │ modules!    │
                          └─────────────┘

  6 BƯỚC CHI TIẾT:
  ① webpack-dev-server tạo Express + WebSocket servers
  ② Express serve bundled files cho browser
  ③ File thay đổi → webpack re-compile module đó
  ④ Generate: .json (manifest) + .js (update chunk)
  ⑤ WebSocket PUSH 2 files đến browser
  ⑥ HMR Runtime load files → patch CHỈ module thay đổi
     → State GIỮA NGUYÊN → page KHÔNG reload!
```

---

## Q78. Common Loaders

```
WEBPACK LOADERS — THƯỜNG DÙNG:
═══════════════════════════════════════════════════════════════

  CSS:
  ┌──────────────────┬────────────────────────────────────────┐
  │ style-loader     │ Inject CSS vào <style> tag trong DOM  │
  │ css-loader       │ Cho phép require/import CSS files     │
  │ less-loader      │ Less → CSS                            │
  │ sass-loader      │ Sass/SCSS → CSS                       │
  │ postcss-loader   │ PostCSS transform (autoprefixer, etc) │
  └──────────────────┴────────────────────────────────────────┘
  Chain: sass-loader → postcss-loader → css-loader → style-loader
                                     (RIGHT → LEFT!)

  Files:
  ┌──────────────────┬────────────────────────────────────────┐
  │ file-loader      │ Copy file → output dir, return URL    │
  │ url-loader       │ file-loader + inline < limit (base64) │
  └──────────────────┴────────────────────────────────────────┘

  JS:
  ┌──────────────────┬────────────────────────────────────────┐
  │ babel-loader     │ ES6+ / JSX / TS → ES5                 │
  │ ts-loader        │ TypeScript → JavaScript               │
  │ eslint-loader    │ Lint check khi build (deprecated)      │
  └──────────────────┴────────────────────────────────────────┘

  HTML:
  ┌──────────────────┬────────────────────────────────────────┐
  │ html-minify-loader│ Minify HTML                          │
  └──────────────────┴────────────────────────────────────────┘
```

---

## Q79. Common Plugins

```
WEBPACK PLUGINS — THƯỜNG DÙNG:
═══════════════════════════════════════════════════════════════

  ┌───────────────────────────┬──────────────────────────────┐
  │ HtmlWebpackPlugin         │ Auto generate HTML + inject  │
  │                           │ bundled JS/CSS               │
  ├───────────────────────────┼──────────────────────────────┤
  │ MiniCssExtractPlugin      │ Extract CSS → separate .css  │
  │                           │ file (thay style-loader)     │
  ├───────────────────────────┼──────────────────────────────┤
  │ CleanWebpackPlugin        │ Clean output dir trước build │
  ├───────────────────────────┼──────────────────────────────┤
  │ DefinePlugin              │ Define global constants      │
  │                           │ (process.env.NODE_ENV)       │
  ├───────────────────────────┼──────────────────────────────┤
  │ CopyWebpackPlugin         │ Copy static files → output   │
  ├───────────────────────────┼──────────────────────────────┤
  │ TerserPlugin              │ Minify JS (tree-shake, mangle)│
  ├───────────────────────────┼──────────────────────────────┤
  │ CssMinimizerPlugin        │ Minify CSS                   │
  ├───────────────────────────┼──────────────────────────────┤
  │ BundleAnalyzerPlugin      │ Visualize bundle size        │
  ├───────────────────────────┼──────────────────────────────┤
  │ CompressionPlugin         │ Gzip/Brotli compress output  │
  ├───────────────────────────┼──────────────────────────────┤
  │ HotModuleReplacementPlugin│ Enable HMR                   │
  ├───────────────────────────┼──────────────────────────────┤
  │ DllPlugin / DllReference  │ Pre-build vendor DLL         │
  └───────────────────────────┴──────────────────────────────┘

  LOADER vs PLUGIN nhớ lại:
  → Loader: TRANSFORM files (before bundle)
  → Plugin: EXTEND webpack (entire lifecycle)
```

---

## Q80. Git Commands

### Basic Operations

```bash
# INIT
git init                              # Init repo (default: master)

# ADD & COMMIT
git add .                              # Stage all changes
git add <file>                         # Stage specific file
git commit -m "feat: add login"       # Commit with message
git commit -v                          # Commit showing diff
git commit --amend                     # Amend last commit

# STATUS & DIFF
git status                             # Branch status
git diff                               # Unstaged changes
git diff --staged                      # Staged changes (pre-commit)
```

### Commit Convention

```
COMMIT MESSAGE CONVENTION:
═══════════════════════════════════════════════════════════════

  feat:     Tính năng mới
  fix:      Sửa bug
  refactor: Refactor code (không thêm feature, không fix bug)
  docs:     Thay đổi documentation
  style:    Format code (KHÔNG phải CSS!)
  test:     Thêm/sửa tests
  chore:    Build tools, dependencies, configs
  perf:     Performance improvement
  ci:       CI/CD changes
```

### Branch Operations

```bash
# VIEW
git branch                             # Local branches
git branch -r                          # Remote branches
git branch -a                          # All branches

# CREATE & SWITCH
git branch <name>                      # Create branch
git checkout <name>                    # Switch branch
git checkout -b <name>                 # Create + switch
git checkout --orphan <name>           # Empty branch (keep files)

# MERGE
git merge <branch>                     # Merge branch
git merge --abort                      # Cancel merge (conflict)

# DELETE & RENAME
git branch -D <name>                   # Delete local branch
git push origin :<name>                # Delete remote branch
git branch -m <old> <new>             # Rename branch

# RESTORE DELETED BRANCH
git branch <name> <commit-id>         # From commit history
```

### Remote Operations

```bash
git remote -v                          # Show all remotes
git fetch [remote]                     # Download remote changes
git pull [remote] [branch]            # Fetch + merge
git push [remote] [branch]            # Push to remote
git push [remote] --force             # Force push (⚠️ dangerous!)
git push [remote] --all               # Push all branches
```

### Undo Operations

```bash
# CHECKOUT (restore file)
git checkout [file]                    # Restore from staging
git checkout [commit] [file]          # Restore from commit
git checkout .                         # Restore ALL files

# RESET vs REVERT
git reset [commit]                     # Move HEAD, keep working dir
git reset --hard                       # HARD reset (⚠️ lose changes!)
git reset [file]                       # Unstage file
git revert [commit]                    # Create new "undo" commit
```

```
RESET vs REVERT:
═══════════════════════════════════════════════════════════════

  reset --hard:
  → XÓAN lịch sử sau commit target → MẤT history!
  → Dùng khi: local branch, chưa push

  revert:
  → Tạo commit MỚI để undo → GIỮA history!
  → Dùng khi: shared branch, đã push

  Ví dụ: A → B → C → D (muốn undo C)
  → reset C: A → B → C (D MẤT!)
  → revert C: A → B → C → D → C' (giữ full history)
```

### Stash Operations

```bash
git stash                              # Save uncommitted changes
git stash pop                          # Restore + DELETE stash
git stash apply <name>                 # Restore (KEEP stash)
git stash list                         # List all stashes
git stash drop <name>                  # Delete specific stash
git stash clear                        # Delete ALL stashes
```

---

## Q81. CSS Box Model

```
2 BOX MODELS:
═══════════════════════════════════════════════════════════════

  ① Standard (W3C) — box-sizing: content-box (DEFAULT)

  ┌─── margin ────────────────────────────────────────┐
  │ ┌─── border ────────────────────────────────────┐ │
  │ │ ┌─── padding ──────────────────────────────┐  │ │
  │ │ │ ┌─── content (width × height) ─────────┐ │  │ │
  │ │ │ │                                       │ │  │ │
  │ │ │ │   width = CONTENT ONLY               │ │  │ │
  │ │ │ │                                       │ │  │ │
  │ │ │ └───────────────────────────────────────┘ │  │ │
  │ │ └───────────────────────────────────────────┘  │ │
  │ └────────────────────────────────────────────────┘ │
  └────────────────────────────────────────────────────┘

  Total = width + padding + border + margin


  ② IE (Border-box) — box-sizing: border-box

  ┌─── margin ────────────────────────────────────────┐
  │ ┌───────── width ─────────────────────────────┐   │
  │ │  border ┌─── padding ──────────────────┐    │   │
  │ │         │ ┌─── content ──────────────┐ │    │   │
  │ │         │ │                           │ │    │   │
  │ │         │ │ width INCLUDES           │ │    │   │
  │ │         │ │ content+padding+border   │ │    │   │
  │ │         │ └───────────────────────────┘ │    │   │
  │ │         └───────────────────────────────┘    │   │
  │ └─────────────────────────────────────────────┘   │
  └────────────────────────────────────────────────────┘

  Total = width (đã bao gồm padding+border) + margin


  KHÁC BIỆT:
  ┌───────────┬────────────────────────┬──────────────────────┐
  │           │ content-box (W3C)      │ border-box (IE)      │
  ├───────────┼────────────────────────┼──────────────────────┤
  │ width =   │ content ONLY           │ content+pad+border   │
  │ div 200px │ 200+pad+border = lớn   │ 200 = 200 (cố định) │
  │ Predict   │ Khó (phải cộng)        │ Dễ (width = total)   │
  └───────────┴────────────────────────┴──────────────────────┘

  → MODERN: dùng border-box → dễ layout hơn!
  → * { box-sizing: border-box; }
```

---

## Q83. CSS Selectors & Inheritance

```
CSS SELECTORS:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬─────────────────┬────────────────────┐
  │ Selector           │ Example         │ Specificity        │
  ├────────────────────┼─────────────────┼────────────────────┤
  │ ID                 │ #header         │ 0-1-0-0 (cao)      │
  │ Class              │ .nav            │ 0-0-1-0            │
  │ Tag                │ div, p, span    │ 0-0-0-1 (thấp)     │
  │ Adjacent sibling   │ h1 + p          │ 0-0-0-2            │
  │ Child              │ ul > li         │ 0-0-0-2            │
  │ Descendant         │ li a            │ 0-0-0-2            │
  │ Universal          │ *               │ 0-0-0-0            │
  │ Attribute          │ a[href]         │ 0-0-1-0            │
  │ Pseudo-class       │ a:hover         │ 0-0-1-0            │
  │ Pseudo-element     │ p::first-line   │ 0-0-0-1            │
  └────────────────────┴─────────────────┴────────────────────┘

  SPECIFICITY PRIORITY:
  !important > inline > #id > .class > tag > * > inherited

  INHERITABLE PROPERTIES:
  ✅ Kế thừa: font-size, font-family, color, line-height,
              visibility, cursor, letter-spacing, word-spacing
  ❌ KHÔNG kế thừa: border, padding, margin, width, height,
                     background, display, position, overflow
```

---

## Q84. CSS position

```
POSITION VALUES:
═══════════════════════════════════════════════════════════════

  ┌──────────┬──────────────────────────────────────────────────┐
  │ static   │ DEFAULT — normal flow                           │
  │          │ Ignore top/bottom/left/right/z-index            │
  ├──────────┼──────────────────────────────────────────────────┤
  │ relative │ Relative to ITSELF (original position)          │
  │          │ Vẫn chiếm space trong flow                      │
  │          │ top: 10px → dịch xuống 10px so với vị trí gốc   │
  ├──────────┼──────────────────────────────────────────────────┤
  │ absolute │ Relative to NEAREST positioned ancestor         │
  │          │ (ancestor có position ≠ static)                 │
  │          │ KHÔNG chiếm space → thoát khỏi flow             │
  │          │ Nếu không có ancestor → relative to <html>      │
  ├──────────┼──────────────────────────────────────────────────┤
  │ fixed    │ Relative to VIEWPORT (browser window)           │
  │          │ Không scroll theo page                           │
  │          │ Navbar, back-to-top button                       │
  ├──────────┼──────────────────────────────────────────────────┤
  │ sticky   │ relative + fixed HYBRID ⭐                       │
  │          │ Normal flow → scroll past threshold → STICK!    │
  │          │ position: sticky; top: 0;                       │
  │          │ ⚠️ Phải set top/bottom/left/right               │
  │          │ ⚠️ Parent không overflow:hidden/auto             │
  ├──────────┼──────────────────────────────────────────────────┤
  │ inherit  │ Kế thừa position từ parent                      │
  └──────────┴──────────────────────────────────────────────────┘

  RULE: "子绝父相" (Con absolute, Cha relative)
  → Child absolute → positioned relative to parent
  → Parent relative → vẫn giữ vị trí trong flow
```

---

## Q85. CSS3 New Features

```
CSS3 — NEW FEATURES:
═══════════════════════════════════════════════════════════════

  LAYOUT:
  ✅ Flexbox (display: flex)
  ✅ Grid (display: grid)
  ✅ Multi-column layout (columns)

  VISUAL:
  ✅ border-radius (rounded corners)
  ✅ box-shadow / text-shadow
  ✅ linear-gradient / radial-gradient
  ✅ RGBA / HSLA colors + opacity
  ✅ Multiple backgrounds

  TRANSFORM:
  ✅ rotate() / scale() / skew() / translate()
  ✅ transform-origin
  ✅ 3D transforms (perspective, rotateX/Y/Z)

  ANIMATION:
  ✅ transition (property duration easing delay)
  ✅ @keyframes animation
  ✅ will-change (GPU optimization hint)

  TYPOGRAPHY:
  ✅ @font-face (custom fonts)
  ✅ text-overflow: ellipsis
  ✅ word-wrap / word-break

  SELECTORS:
  ✅ :nth-child, :nth-of-type, :not()
  ✅ ::before, ::after (pseudo-elements)
  ✅ [attr^=], [attr$=], [attr*=] (attribute selectors)

  RESPONSIVE:
  ✅ @media queries
  ✅ calc() function
  ✅ vw, vh, vmin, vmax units
  ✅ box-sizing: border-box
```

---

## Q86. CSS Triangle

```
CSS TRIANGLE — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  Khi width & height = 0, mỗi border tạo 1 HÌNH TAM GIÁC:

  border-top    = ▼ (tam giác chỉ xuống)
  border-right  = ◀ (tam giác chỉ trái)
  border-bottom = ▲ (tam giác chỉ lên)
  border-left   = ▶ (tam giác chỉ phải)

  → Set border MUỐN thấy = color
  → Set border KHÔNG muốn = transparent
```

```css
/* TRIANGLE pointing DOWN (▼) */
.triangle-down {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-top: 50px solid pink; /* CHỈ border này có màu */
}

/* TRIANGLE pointing RIGHT (▶) */
.triangle-right {
  width: 0;
  height: 0;
  border-top: 50px solid transparent;
  border-bottom: 50px solid transparent;
  border-left: 50px solid pink;
}

/* TRIANGLE pointing UP (▲) */
.triangle-up {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 50px solid pink;
}
```

---

## Q87. Responsive Design

```
RESPONSIVE DESIGN:
═══════════════════════════════════════════════════════════════

  "1 website tương thích NHIỀU devices"
  → KHÔNG tạo version riêng cho mỗi device!

  NGUYÊN LÝ: @media queries detect screen size → apply styles

  VIEWPORT META (BẮT BUỘC):
  <meta name="viewport"
        content="width=device-width,
                 initial-scale=1.0,
                 maximum-scale=1.0,
                 user-scalable=no">

  BREAKPOINTS THƯỜNG DÙNG:
  ┌─────────────┬─────────────────┐
  │ Mobile      │ < 768px         │
  │ Tablet      │ 768px – 1024px  │
  │ Desktop     │ > 1024px        │
  │ Large       │ > 1440px        │
  └─────────────┴─────────────────┘

  @media (max-width: 768px) {
      .sidebar { display: none; }
  }

  TECHNIQUES:
  → Fluid layouts (%, vw, vh)
  → Flexible images (max-width: 100%)
  → CSS Grid / Flexbox
  → Mobile-first approach (min-width queries)
  → Relative units (rem, em, vw)
```

---

## Q88. CSS Performance

```
CSS OPTIMIZATION — 10 KỸ THUẬT:
═══════════════════════════════════════════════════════════════

  ① Merge CSS files → giảm HTTP requests
  ② Attribute = 0 → bỏ unit: margin: 0 (không cần 0px)
  ③ CSS file đặt ĐẦU page (<head>) → tránh FOUC
  ④ Tránh descendant selectors sâu: div ul li a → a.link
  ⑤ Compact syntax: margin: 10px 20px thay 4 dòng riêng
  ⑥ Tránh duplicate rules → merge
  ⑦ Semantic class names → dễ maintain
  ⑧ Hạn chế !important → dùng specificity correctly
  ⑨ Merge identical rules cho different classes
  ⑩ Follow box model → predictable sizing

  SELECTOR HIỆU SUẤT (nhanh → chậm):
  #id > .class > tag > descendant > * > attribute > pseudo
  → Browser match selector RIGHT → LEFT!
  → .list li a → tìm TẤT CẢ <a>, filter ngược → chậm!
  → .list-link → tìm trực tiếp → nhanh!
```

---

## Q89. inline-block Gap

```
INLINE-BLOCK GAP — TẠI SAO?
═══════════════════════════════════════════════════════════════

  HTML whitespace (space, newline) giữa inline-block elements
  → Browser render thành KHOẢNG TRẮNG ~4px!

  <!-- Có gap! -->
  <span>A</span>
  <span>B</span>        ← newline = space = gap!

  3 GIẢI PHÁP:

  ① Xóa whitespace trong HTML:
  <span>A</span><span>B</span>

  ② Parent font-size: 0 → child font-size: reset
  .parent { font-size: 0; }
  .child  { font-size: 16px; }

  ③ Negative margin:
  .child { margin-right: -4px; }
```

---

## Q90. Margin Collapse

```
MARGIN COLLAPSE — QUY TẮC:
═══════════════════════════════════════════════════════════════

  Hai box LIỀN KỀ (sibling hoặc parent-child)
  → margin KHÔNG cộng dồn, mà MERGE ("折叠")!

  3 QUY TẮC:
  ┌──────────────────────────┬──────────────────────────────┐
  │ Cả 2 dương               │ Lấy giá trị LỚN hơn        │
  │ 20px + 30px → 30px      │ (không phải 50px!)          │
  ├──────────────────────────┼──────────────────────────────┤
  │ Cả 2 âm                  │ Lấy absolute value LỚN hơn  │
  │ -20px + -30px → -30px   │                              │
  ├──────────────────────────┼──────────────────────────────┤
  │ 1 dương + 1 âm           │ CỘNG 2 giá trị              │
  │ 20px + -10px → 10px     │                              │
  └──────────────────────────┴──────────────────────────────┘

  XẢY RA KHI NÀO?
  → Vertical margins ONLY (top/bottom) — KHÔNG collapse ngang
  → Adjacent siblings (cùng cấp)
  → Parent-child (child margin-top tràn ra parent)
  → Empty blocks (top + bottom merge)

  TRÁNH COLLAPSE:
  → overflow: hidden trên parent (tạo BFC)
  → padding hoặc border trên parent
  → display: flex / grid trên parent
  → display: inline-block trên element
```

---

## Tóm Tắt

### Quick Reference

```
Q77-Q90 — QUICK REF:
═══════════════════════════════════════════════════════════════

  WEBPACK HMR:
  → 2 servers: Express (HTTP) + WebSocket (push)
  → File change → .json manifest + .js chunk → push → patch module
  → State giữ nguyên, page KHÔNG reload

  LOADERS: style/css/less/sass/postcss (CSS chain R→L)
           babel/ts (JS), file/url (assets)
  PLUGINS: HtmlWebpack, MiniCssExtract, Terser, Clean, Define, Copy

  GIT:
  → Commit: feat/fix/refactor/docs/style/test/chore
  → reset --hard (XÓA history) vs revert (TẠO undo commit)
  → stash (tạm cất) → pop (lấy + xóa) / apply (lấy + giữ)

  CSS BOX MODEL:
  → content-box: width = content ONLY (default)
  → border-box: width = content + padding + border ⭐
  → * { box-sizing: border-box } → modern standard

  SELECTORS: !important > inline > #id > .class > tag > *
  → Inherit: font, color, line-height
  → NOT inherit: margin, padding, border, width, height

  POSITION: static(default) / relative(self) / absolute(ancestor)
            fixed(viewport) / sticky(hybrid) — "子绝父相"

  CSS3: flexbox, grid, border-radius, shadow, gradient,
        transform, transition, @keyframes, @media, @font-face

  TRIANGLE: width:0 height:0, color 1 border, transparent rest

  RESPONSIVE: viewport meta + @media queries + fluid units

  INLINE-BLOCK GAP: HTML whitespace → font-size:0 / no space
  MARGIN COLLAPSE: vertical only, max(+,+) / sum(+,-) / max(abs -,-)
```

### Checklist

- [ ] HMR: Express (static) + WebSocket (push), .json + .js → patch module
- [ ] Loaders: CSS chain (sass→postcss→css→style) RIGHT→LEFT
- [ ] Plugins: HtmlWebpack, MiniCssExtract, Terser, Define, Clean
- [ ] Git commit convention: feat/fix/refactor/docs/style/test/chore
- [ ] Git reset --hard (erase history) vs revert (new undo commit)
- [ ] Git stash pop (restore+delete) vs apply (restore+keep)
- [ ] Box model: content-box (default) vs border-box (modern ⭐)
- [ ] Selector specificity: !important > inline > #id > .class > tag
- [ ] Inheritable: font, color, line-height; NOT: margin, padding, border
- [ ] Position: static/relative/absolute/fixed/sticky, 子绝父相
- [ ] sticky: PHẢI set threshold (top/bottom), parent ≠ overflow:hidden
- [ ] CSS3: flex, grid, radius, shadow, gradient, transform, animation
- [ ] Triangle: width:0 height:0 + 1 colored border + transparent rest
- [ ] Responsive: viewport meta + @media + fluid layouts (%, vw, rem)
- [ ] CSS perf: merge files, head placement, avoid deep selectors
- [ ] inline-block gap: font-size:0 on parent / remove whitespace
- [ ] Margin collapse: vertical only, both +→max, both −→max(abs), mix→sum

---

_Cập nhật lần cuối: Tháng 2, 2026_
