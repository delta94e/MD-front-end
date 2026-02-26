# Webpack-Chain — Deep Dive!

> **Chủ đề**: Webpack-Chain — Từ Cơ Bản Đến Nâng Cao!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: "Webpack-chain from Beginner to Advanced" — Juejin

---

## Mục Lục

1. [§1. Webpack-Chain Là Gì? Tại Sao Cần Nó?](#1)
2. [§2. ChainedMap — Core API!](#2)
3. [§3. ChainedSet — Core API!](#3)
4. [§4. Shorthand Methods + Merge + toString!](#4)
5. [§5. Entry + Output Configuration!](#5)
6. [§6. Alias + Extensions + DevServer!](#6)
7. [§7. Loader — Thêm / Sửa / Xóa!](#7)
8. [§8. Plugin — Thêm / Sửa / Xóa!](#8)
9. [§9. When / Condition + DevTool + Optimization!](#9)
10. [§10. Vue CLI 3 — Thực Tế!](#10)
11. [§11. Sơ Đồ Tổng Hợp!](#11)
12. [§12. Tự Viết — WebpackChainSimulator!](#12)
13. [§13. Câu Hỏi Luyện Tập!](#13)

---

## §1. Webpack-Chain Là Gì? Tại Sao Cần Nó?

```
  WEBPACK-CHAIN LÀ GÌ:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ VỚI WEBPACK THƯỜNG:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Webpack config = 1 OBJECT JavaScript KHỔNG LỒ!  │    │
  │  │ → 1 project → OK, không vấn đề gì!               │    │
  │  │ → NHIỀU projects → CHIA SẺ config? KHÓ! ★        │    │
  │  │ → Sub-project cần config RIÊNG? → CÒN KHÓ HƠN!  │    │
  │  │ → Merge objects? Deep clone? Override? NIGHTMARE!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ VẤN ĐỀ:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // webpack.config.js — Object thường!                │    │
  │  │ module.exports = {                                    │    │
  │  │   entry: './src/main.js',                             │    │
  │  │   module: {                                           │    │
  │  │     rules: [                                          │    │
  │  │       { test: /\.js$/, use: 'babel-loader' },        │    │
  │  │       { test: /\.css$/, use: 'css-loader' },         │    │
  │  │     ]                                                 │    │
  │  │   },                                                  │    │
  │  │   plugins: [new HtmlPlugin()]                         │    │
  │  │ };                                                    │    │
  │  │                                                      │    │
  │  │ ❌ Muốn SỬA loader "babel-loader"?                  │    │
  │  │   → Phải tìm INDEX trong array rules!              │    │
  │  │   → rules[0]? rules[1]? KHÔNG CHẮC!               │    │
  │  │                                                      │    │
  │  │ ❌ Muốn XÓA 1 plugin?                               │    │
  │  │   → Phải filter array, tìm instance!               │    │
  │  │   → plugins.filter(p => !(p instanceof X))         │    │
  │  │   → RẤT xấu! RẤT dễ lỗi!                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP — WEBPACK-CHAIN:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → API dạng CHAIN (chuỗi hành động!)               │    │
  │  │ → Mọi thứ có TÊN (key-based!)                     │    │
  │  │ → Dễ THÊM, SỬA, XÓA bất kỳ phần nào!            │    │
  │  │ → Dễ CHIA SẺ config giữa nhiều projects!          │    │
  │  │ → Dễ MỞ RỘNG (scalability!) ★                     │    │
  │  │ → Được vue-cli3 sử dụng! ★                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO SÁNH:                                                      │
  │  ┌────────────────────┬────────────────────────────────┐    │
  │  │ Webpack thường    │ Webpack-chain                  │    │
  │  ├────────────────────┼────────────────────────────────┤    │
  │  │ Object JS lớn     │ Chain API!                     │    │
  │  │ Index-based (array)│ Name-based (key!) ★           │    │
  │  │ Khó tìm loader     │ rule('tên').use('tên')       │    │
  │  │ Khó xóa plugin    │ plugins.delete('tên')         │    │
  │  │ Khó merge          │ config.merge(obj)              │    │
  │  │ Khó chia sẻ       │ Dễ chia sẻ + mở rộng!       │    │
  │  └────────────────────┴────────────────────────────────┘    │
  │                                                              │
  │  CÀI ĐẶT:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ npm i --save-dev webpack-chain                        │    │
  │  │ # hoặc                                                │    │
  │  │ yarn add --dev webpack-chain                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SỬ DỤNG CƠ BẢN:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Import webpack-chain!                              │    │
  │  │ const Config = require('webpack-chain');               │    │
  │  │                                                      │    │
  │  │ // Tạo instance MỚI!                                │    │
  │  │ const config = new Config();                           │    │
  │  │                                                      │    │
  │  │ // ... cấu hình ở giữa ...                         │    │
  │  │                                                      │    │
  │  │ // Export config cho webpack!                         │    │
  │  │ module.exports = config.toConfig(); ★                 │    │
  │  │                                                      │    │
  │  │ → toConfig() = chuyển chain → webpack object!      │    │
  │  │ → Webpack nhận object BÌNH THƯỜNG!                 │    │
  │  │ → Webpack-chain chỉ là CÁCH VIẾT config!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  new Config()                                         │    │
  │  │      │                                                │    │
  │  │      ↓                                                │    │
  │  │  config.entry('main').add('./src/main.js')           │    │
  │  │      │                                                │    │
  │  │      ↓                                                │    │
  │  │  config.module.rule('babel')...                       │    │
  │  │      │                                                │    │
  │  │      ↓                                                │    │
  │  │  config.plugin('html')...                             │    │
  │  │      │                                                │    │
  │  │      ↓                                                │    │
  │  │  config.toConfig()  ← CHUYỂN thành webpack object! │    │
  │  │      │                                                │    │
  │  │      ↓                                                │    │
  │  │  module.exports = { entry, module, plugins, ... }    │    │
  │  │      │                                                │    │
  │  │      ↓                                                │    │
  │  │  WEBPACK CHẠY BÌNH THƯỜNG! ★                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. ChainedMap — Core API!

```
  CHAINED MAP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ChainedMap LÀ GÌ:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Core API #1 của webpack-chain!                    │    │
  │  │ → Hoạt động GIỐNG JavaScript Map!                  │    │
  │  │ → Lưu trữ KEY → VALUE pairs!                      │    │
  │  │ → HỖ TRỢ chaining (nối chuỗi!)                   │    │
  │  │ → Mọi method TRẢ VỀ ChainedMap (trừ get!)        │    │
  │  │ → Dùng cho: resolve, module, output, devServer...  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẤU TRÚC BÊN TRONG:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ChainedMap {                                         │    │
  │  │    store: Map {                                       │    │
  │  │      'key1' → value1,                                │    │
  │  │      'key2' → value2,                                │    │
  │  │      'key3' → value3,                                │    │
  │  │    },                                                 │    │
  │  │    parent: <parent instance>                          │    │
  │  │  }                                                    │    │
  │  │                                                      │    │
  │  │  → store = Map chứa dữ liệu!                      │    │
  │  │  → parent = reference tới cha (cho .end()!)        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẤT CẢ METHODS:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ① clear()                                            │    │
  │  │   → Xóa TẤT CẢ config trong Map!                  │    │
  │  │   → Trả về: ChainedMap (chain tiếp!)              │    │
  │  │   → config.resolve.alias.clear()                     │    │
  │  │                                                      │    │
  │  │ ② delete(key)                                        │    │
  │  │   → Xóa 1 config theo key!                         │    │
  │  │   → Trả về: ChainedMap                             │    │
  │  │   → config.resolve.alias.delete('@')                 │    │
  │  │                                                      │    │
  │  │ ③ get(key)                                            │    │
  │  │   → Lấy VALUE của key!                             │    │
  │  │   → Trả về: VALUE (KHÔNG phải ChainedMap!) ★      │    │
  │  │   → config.resolve.alias.get('@')                    │    │
  │  │   → returns: '/path/to/src'                          │    │
  │  │                                                      │    │
  │  │ ④ getOrCompute(key, fn)                              │    │
  │  │   → Lấy value HOẶC tính toán nếu CHƯA CÓ!       │    │
  │  │   → Key tồn tại → trả value!                      │    │
  │  │   → Key KHÔNG tồn tại → gọi fn() + set!           │    │
  │  │   → Trả về: VALUE                                  │    │
  │  │   → Giống Map.get() + default value! ★              │    │
  │  │                                                      │    │
  │  │ ⑤ set(key, value)                                    │    │
  │  │   → ĐẶT giá trị cho key!                          │    │
  │  │   → Trả về: ChainedMap                             │    │
  │  │   → config.resolve.alias.set('@', '/src')            │    │
  │  │                                                      │    │
  │  │ ⑥ has(key)                                            │    │
  │  │   → Kiểm tra key CÓ TỒN TẠI không!              │    │
  │  │   → Trả về: BOOLEAN ★                              │    │
  │  │   → config.resolve.alias.has('@') → true/false     │    │
  │  │                                                      │    │
  │  │ ⑦ values()                                           │    │
  │  │   → Trả về MẢNG tất cả values!                    │    │
  │  │   → Trả về: Array                                  │    │
  │  │                                                      │    │
  │  │ ⑧ entries()                                           │    │
  │  │   → Trả về OBJECT {key: value, ...}!               │    │
  │  │   → Trả về: Object                                 │    │
  │  │   → config.resolve.alias.entries()                    │    │
  │  │   → { '@': '/src', 'assets': '/src/assets' }        │    │
  │  │                                                      │    │
  │  │ ⑨ merge(obj, omit)                                   │    │
  │  │   → MERGE object vào Map!                           │    │
  │  │   → omit = keys KHÔNG muốn merge!                  │    │
  │  │   → Trả về: ChainedMap                             │    │
  │  │   → config.merge({ devtool: 'source-map' })          │    │
  │  │                                                      │    │
  │  │ ⑩ batch(handler)                                     │    │
  │  │   → Thực thi function trên context HIỆN TẠI!      │    │
  │  │   → handler nhận ChainedMap instance!               │    │
  │  │   → Trả về: ChainedMap                             │    │
  │  │   → config.batch(c => { c.set('x', 1) })            │    │
  │  │                                                      │    │
  │  │ ⑪ when(condition, whenTruthy, whenFalsy)             │    │
  │  │   → Thực thi ĐIỀU KIỆN! ★ (RẤT QUAN TRỌNG!)     │    │
  │  │   → condition = Boolean!                             │    │
  │  │   → whenTruthy(instance): gọi khi TRUE!            │    │
  │  │   → whenFalsy(instance): gọi khi FALSE!            │    │
  │  │   → Trả về: ChainedMap                             │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ CHAINING:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ config.resolve.alias                                  │    │
  │  │   .set('@', '/src')          // ← set trả ChainedMap│   │
  │  │   .set('assets', '/assets')  // ← chain tiếp!      │    │
  │  │   .set('utils', '/utils')    // ← chain tiếp!      │    │
  │  │   .delete('utils')           // ← xóa 'utils'!     │    │
  │  │   .end();                    // ← quay về parent!   │    │
  │  │                                                      │    │
  │  │ → .end() quay về PARENT (resolve)!                 │    │
  │  │ → Mọi thứ CHAINING liên tục!                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ .end():                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  config (Config)                                      │    │
  │  │    │                                                  │    │
  │  │    ├── resolve (ChainedMap)                           │    │
  │  │    │     │                                            │    │
  │  │    │     ├── alias (ChainedMap)                       │    │
  │  │    │     │     .end() → quay về resolve              │    │
  │  │    │     │                                            │    │
  │  │    │     └── extensions (ChainedSet)                  │    │
  │  │    │           .end() → quay về resolve              │    │
  │  │    │                                                  │    │
  │  │    ├── module (ChainedMap)                             │    │
  │  │    │     │                                            │    │
  │  │    │     └── rules (ChainedMap)                       │    │
  │  │    │           .end() → quay về module               │    │
  │  │    │                                                  │    │
  │  │    └── plugins (ChainedMap)                           │    │
  │  │          .end() → quay về config                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. ChainedSet — Core API!

```
  CHAINED SET:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ChainedSet LÀ GÌ:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Core API #2 của webpack-chain!                    │    │
  │  │ → Hoạt động GIỐNG JavaScript Set!                  │    │
  │  │ → Lưu trữ DANH SÁCH values (KHÔNG có key!)        │    │
  │  │ → HỖ TRỢ chaining!                                │    │
  │  │ → Dùng cho: entry points, extensions, include...   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO SÁNH ChainedMap vs ChainedSet:                             │
  │  ┌────────────────────┬────────────────────────────────┐    │
  │  │ ChainedMap          │ ChainedSet                     │    │
  │  ├────────────────────┼────────────────────────────────┤    │
  │  │ key → value         │ Chỉ có values!               │    │
  │  │ set(key, value)     │ add(value)                     │    │
  │  │ get(key)            │ has(value)                     │    │
  │  │ delete(key)         │ delete(value)                  │    │
  │  │ entries() → Object │ values() → Array              │    │
  │  │ Dùng cho: alias,   │ Dùng cho: entry,              │    │
  │  │   output, resolve  │   extensions, include          │    │
  │  └────────────────────┴────────────────────────────────┘    │
  │                                                              │
  │  TẤT CẢ METHODS:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ① add(value)                                         │    │
  │  │   → Thêm value vào CUỐI Set!                       │    │
  │  │   → Trả về: ChainedSet (chain tiếp!)              │    │
  │  │   → config.entry('main').add('./src/main.js')        │    │
  │  │                                                      │    │
  │  │ ② prepend(value)                                     │    │
  │  │   → Thêm value vào ĐẦU Set!                       │    │
  │  │   → Trả về: ChainedSet                             │    │
  │  │   → config.entry('main').prepend('./src/polyfill.js')│    │
  │  │                                                      │    │
  │  │ ③ clear()                                             │    │
  │  │   → Xóa TẤT CẢ values trong Set!                  │    │
  │  │   → Trả về: ChainedSet                             │    │
  │  │                                                      │    │
  │  │ ④ delete(value)                                      │    │
  │  │   → Xóa 1 value cụ thể!                           │    │
  │  │   → Trả về: ChainedSet                             │    │
  │  │                                                      │    │
  │  │ ⑤ has(value)                                         │    │
  │  │   → Kiểm tra value CÓ TỒN TẠI không!            │    │
  │  │   → Trả về: BOOLEAN ★                              │    │
  │  │                                                      │    │
  │  │ ⑥ values()                                           │    │
  │  │   → Trả về MẢNG tất cả values!                    │    │
  │  │   → Trả về: Array                                  │    │
  │  │                                                      │    │
  │  │ ⑦ merge(arr)                                         │    │
  │  │   → NỐI array vào CUỐI Set!                        │    │
  │  │   → Trả về: ChainedSet                             │    │
  │  │                                                      │    │
  │  │ ⑧ batch(handler)                                     │    │
  │  │   → Thực thi function trên context hiện tại!       │    │
  │  │   → Trả về: ChainedSet                             │    │
  │  │                                                      │    │
  │  │ ⑨ when(condition, whenTruthy, whenFalsy)             │    │
  │  │   → Thực thi ĐIỀU KIỆN! (giống ChainedMap!)       │    │
  │  │   → Trả về: ChainedSet                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ CHAINING:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Entry point = ChainedSet!                          │    │
  │  │ config.entry('main')                                  │    │
  │  │   .add('./src/polyfill.js')     // thêm cuối!       │    │
  │  │   .add('./src/main.js')         // thêm cuối!       │    │
  │  │   .prepend('./src/vendor.js')   // thêm ĐẦU!       │    │
  │  │   .end();                       // quay về config!   │    │
  │  │                                                      │    │
  │  │ // Kết quả:                                          │    │
  │  │ entry: {                                              │    │
  │  │   main: [                                             │    │
  │  │     './src/vendor.js',   // prepend → ĐẦU!        │    │
  │  │     './src/polyfill.js', // add → theo thứ tự!     │    │
  │  │     './src/main.js'      // add → theo thứ tự!     │    │
  │  │   ]                                                   │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Shorthand Methods + Merge + toString!

```
  SHORTHAND + MERGE + toString:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① SHORTHAND METHODS (Viết tắt!):                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Nhiều config có method VIẾT TẮT!                 │    │
  │  │ → Thay vì .set(key, value) → dùng .key(value)!    │    │
  │  │ → Shorthand TRẢ VỀ instance → chain được!        │    │
  │  │                                                      │    │
  │  │ VÍ DỤ:                                               │    │
  │  │ // Cách DÀI (dùng set):                             │    │
  │  │ config.devServer.set('hot', true);                    │    │
  │  │                                                      │    │
  │  │ // Cách NGẮN (shorthand!):                           │    │
  │  │ config.devServer.hot(true); ★                        │    │
  │  │                                                      │    │
  │  │ // Cả 2 cách ĐỀU GIỐNG NHAU!                      │    │
  │  │ // Shorthand dễ ĐỌC và DỄ VIẾT hơn!              │    │
  │  │                                                      │    │
  │  │ MỘT SỐ SHORTHAND KHÁC:                               │    │
  │  │ config.devtool('source-map')                          │    │
  │  │   = config.set('devtool', 'source-map')               │    │
  │  │                                                      │    │
  │  │ config.mode('production')                             │    │
  │  │   = config.set('mode', 'production')                  │    │
  │  │                                                      │    │
  │  │ config.target('web')                                  │    │
  │  │   = config.set('target', 'web')                       │    │
  │  │                                                      │    │
  │  │ config.output.path('/dist')                           │    │
  │  │   = config.output.set('path', '/dist')                │    │
  │  │                                                      │    │
  │  │ config.output.filename('[name].js')                   │    │
  │  │   = config.output.set('filename', '[name].js')        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② MERGE — Gộp Config:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Merge OBJECT vào config instance!                 │    │
  │  │ → ⚠️ KHÔNG phải webpack config object!              │    │
  │  │ → Là webpack-CHAIN config object!                   │    │
  │  │ → Nếu merge webpack-chain objects → chuyển trước! │    │
  │  │                                                      │    │
  │  │ VÍ DỤ:                                               │    │
  │  │ config.merge({ devtool: 'source-map' });              │    │
  │  │ config.get('devtool'); // → 'source-map'             │    │
  │  │                                                      │    │
  │  │ // Merge NHIỀU config!                               │    │
  │  │ config.merge({                                        │    │
  │  │   devtool: 'source-map',                              │    │
  │  │   target: 'web',                                      │    │
  │  │   node: { __dirname: false }                          │    │
  │  │ });                                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ toString() — Debug Config:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Chuyển config thành STRING để đọc!               │    │
  │  │ → BAO GỒM comments + naming rules!                 │    │
  │  │ → Rất hữu ích để DEBUG! ★                         │    │
  │  │                                                      │    │
  │  │ VÍ DỤ:                                               │    │
  │  │ config.module                                         │    │
  │  │   .rule('compile')                                    │    │
  │  │     .test(/\.js$/)                                    │    │
  │  │     .use('babel')                                     │    │
  │  │       .loader('babel-loader');                        │    │
  │  │                                                      │    │
  │  │ console.log(config.toString());                       │    │
  │  │                                                      │    │
  │  │ // OUTPUT:                                            │    │
  │  │ {                                                     │    │
  │  │   module: {                                           │    │
  │  │     rules: [                                          │    │
  │  │       /* config.module.rule('compile') */             │    │
  │  │       {                                               │    │
  │  │         test: /\.js$/,                                │    │
  │  │         use: [                                        │    │
  │  │           /* config.module.rule('compile')            │    │
  │  │              .use('babel') */                         │    │
  │  │           {                                           │    │
  │  │             loader: 'babel-loader'                    │    │
  │  │           }                                           │    │
  │  │         ]                                             │    │
  │  │       }                                               │    │
  │  │     ]                                                 │    │
  │  │   }                                                   │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ → Comment CHO BIẾT tên rule + use! ★                │    │
  │  │ → Dễ debug: biết config NÀO từ ĐÂU!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ toConfig() vs toString():                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ┌──────────────┬────────────────────────────────┐    │    │
  │  │ │ toConfig()   │ Chuyển → webpack Object thật!  │    │    │
  │  │ │              │ Dùng cho: module.exports!       │    │    │
  │  │ │              │ Webpack DÙNG object này!        │    │    │
  │  │ ├──────────────┼────────────────────────────────┤    │    │
  │  │ │ toString()   │ Chuyển → String để ĐỌC!       │    │    │
  │  │ │              │ Dùng cho: DEBUG/LOG!            │    │    │
  │  │ │              │ Có comments + naming!            │    │    │
  │  │ └──────────────┴────────────────────────────────┘    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Entry + Output Configuration!

```
  ENTRY + OUTPUT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① ENTRY — Điểm vào:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ WEBPACK-CHAIN:                                        │    │
  │  │ config.entry('main').add('./src/main.js');             │    │
  │  │                                                      │    │
  │  │ TƯƠNG ĐƯƠNG WEBPACK:                                  │    │
  │  │ entry: {                                              │    │
  │  │   main: ['./src/main.js']                             │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → config.entry('main') = tạo entry TÊN 'main'!    │    │
  │  │ → .add() = thêm file vào entry! (ChainedSet!)      │    │
  │  │ → Có thể thêm NHIỀU file!                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ENTRY NÂNG CAO — Nhiều entry points:                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ WEBPACK-CHAIN:                                        │    │
  │  │ config                                                │    │
  │  │   .entry('main')                                      │    │
  │  │     .add('./src/main.js')                             │    │
  │  │     .add('./src/polyfill.js')                         │    │
  │  │     .end()           // quay về config!              │    │
  │  │   .entry('vendor')                                    │    │
  │  │     .add('./src/vendor.js')                           │    │
  │  │     .end();                                           │    │
  │  │                                                      │    │
  │  │ TƯƠNG ĐƯƠNG WEBPACK:                                  │    │
  │  │ entry: {                                              │    │
  │  │   main: ['./src/main.js', './src/polyfill.js'],       │    │
  │  │   vendor: ['./src/vendor.js']                         │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② OUTPUT — Đầu ra:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ WEBPACK-CHAIN:                                        │    │
  │  │ config.output                                         │    │
  │  │   .path(path.resolve(__dirname, './dist'))            │    │
  │  │   .filename('[name].[chunkhash].js')                  │    │
  │  │   .chunkFilename('chunks/[name].[chunkhash].js')     │    │
  │  │   .libraryTarget('umd');                              │    │
  │  │                                                      │    │
  │  │ TƯƠNG ĐƯƠNG WEBPACK:                                  │    │
  │  │ output: {                                             │    │
  │  │   path: path.resolve(__dirname, './dist'),            │    │
  │  │   filename: '[name].[chunkhash].js',                  │    │
  │  │   chunkFilename: 'chunks/[name].[chunkhash].js',     │    │
  │  │   libraryTarget: 'umd'                                │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → .path() = THƯ MỤC output!                       │    │
  │  │ → .filename() = TÊN file output!                   │    │
  │  │ → [name] = tên entry point!                         │    │
  │  │ → [chunkhash] = hash cho cache busting!             │    │
  │  │ → .chunkFilename() = tên file cho chunk splitting!  │    │
  │  │ → .libraryTarget('umd') = format UMD (universal!)   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ ENTRY → OUTPUT:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Entry (ChainedSet)         Output (ChainedMap)      │    │
  │  │  ┌───────────────┐          ┌────────────────────┐  │    │
  │  │  │ entry('main') │ ──────→ │ main.[hash].js     │  │    │
  │  │  │ ['main.js',   │          └────────────────────┘  │    │
  │  │  │  'polyfill.js']│                                  │    │
  │  │  └───────────────┘          ┌────────────────────┐  │    │
  │  │  ┌───────────────┐ ──────→ │ vendor.[hash].js   │  │    │
  │  │  │entry('vendor')│          └────────────────────┘  │    │
  │  │  │ ['vendor.js'] │                                   │    │
  │  │  └───────────────┘          Output dir: ./dist/     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Alias + Extensions + DevServer!

```
  ALIAS + EXTENSIONS + DEVSERVER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① ALIAS — Đường dẫn tắt:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ WEBPACK-CHAIN:                                        │    │
  │  │ config.resolve.alias                                  │    │
  │  │   .set('@', path.resolve(__dirname, 'src'))           │    │
  │  │   .set('assets', path.resolve(__dirname, 'src/assets'))│   │
  │  │                                                      │    │
  │  │ TƯƠNG ĐƯƠNG WEBPACK:                                  │    │
  │  │ resolve: {                                            │    │
  │  │   alias: {                                            │    │
  │  │     '@': path.resolve(__dirname, 'src'),              │    │
  │  │     'assets': path.resolve(__dirname, 'src/assets')   │    │
  │  │   }                                                   │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → resolve.alias = ChainedMap!                        │    │
  │  │ → .set(key, value) = thêm alias!                    │    │
  │  │ → import '@/components/App'                          │    │
  │  │   = import 'src/components/App' ★                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② EXTENSIONS — Phần mở rộng tự resolve:                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ WEBPACK-CHAIN:                                        │    │
  │  │ config.resolve.extensions                             │    │
  │  │   .add('.js')                                         │    │
  │  │   .add('.jsx')                                        │    │
  │  │   .add('.ts')                                         │    │
  │  │   .add('.tsx')                                        │    │
  │  │   .add('.vue');                                       │    │
  │  │                                                      │    │
  │  │ TƯƠNG ĐƯƠNG WEBPACK:                                  │    │
  │  │ resolve: {                                            │    │
  │  │   extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'] │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → resolve.extensions = ChainedSet!                   │    │
  │  │ → .add() = thêm phần mở rộng!                      │    │
  │  │ → import './App' → tự tìm App.js, App.tsx... ★     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ DEVSERVER — Cấu hình Dev Server:                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ WEBPACK-CHAIN:                                        │    │
  │  │ config.devServer                                      │    │
  │  │   .hot(true)                // HMR!                  │    │
  │  │   .port(8080)               // port!                  │    │
  │  │   .open(true)               // tự mở browser!       │    │
  │  │   .historyApiFallback(true) // SPA routing!           │    │
  │  │   .compress(true);          // gzip!                  │    │
  │  │                                                      │    │
  │  │ TƯƠNG ĐƯƠNG WEBPACK:                                  │    │
  │  │ devServer: {                                          │    │
  │  │   hot: true,                                          │    │
  │  │   port: 8080,                                         │    │
  │  │   open: true,                                         │    │
  │  │   historyApiFallback: true,                           │    │
  │  │   compress: true                                      │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → devServer = ChainedMap!                             │    │
  │  │ → .hot(true) = shorthand cho .set('hot', true)!     │    │
  │  │ → Tất cả đều shorthand methods! ★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ RESOLVE:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  config.resolve (ChainedMap)                          │    │
  │  │    │                                                  │    │
  │  │    ├── alias (ChainedMap)                             │    │
  │  │    │     '@'     → '/src'                            │    │
  │  │    │     'assets' → '/src/assets'                    │    │
  │  │    │                                                  │    │
  │  │    ├── extensions (ChainedSet)                        │    │
  │  │    │     ['.js', '.jsx', '.ts', '.tsx', '.vue']      │    │
  │  │    │                                                  │    │
  │  │    ├── modules (ChainedSet)                           │    │
  │  │    │     ['node_modules']                             │    │
  │  │    │                                                  │    │
  │  │    └── plugins (ChainedMap)                           │    │
  │  │          'tsconfig' → TsconfigPathsPlugin            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Loader — Thêm / Sửa / Xóa!

```
  LOADER — CRUD:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① THÊM LOADER MỚI:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ WEBPACK-CHAIN:                                        │    │
  │  │ config.module                                         │    │
  │  │   .rule('babel')                  // TÊN rule! ★     │    │
  │  │   .test(/\.(js|jsx|mjs|ts|tsx)$/) // file pattern!   │    │
  │  │   .include                                            │    │
  │  │     .add(path.resolve(__dirname, 'src'))              │    │
  │  │     .end()                        // quay về rule!   │    │
  │  │   .use('babel-loader')            // TÊN use! ★     │    │
  │  │     .loader('babel-loader')       // tên loader!     │    │
  │  │     .options({                                        │    │
  │  │       presets: ['@babel/preset-env']                  │    │
  │  │     });                                               │    │
  │  │                                                      │    │
  │  │ TƯƠNG ĐƯƠNG WEBPACK:                                  │    │
  │  │ module: {                                             │    │
  │  │   rules: [{                                           │    │
  │  │     test: /\.(js|jsx|mjs|ts|tsx)$/,                   │    │
  │  │     include: [path.resolve(__dirname, 'src')],        │    │
  │  │     use: [{                                           │    │
  │  │       loader: 'babel-loader',                         │    │
  │  │       options: { presets: ['@babel/preset-env'] }      │    │
  │  │     }]                                                │    │
  │  │   }]                                                  │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ CẤU TRÚC RULE:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  config.module (ChainedMap)                           │    │
  │  │    │                                                  │    │
  │  │    └── rules (ChainedMap)                             │    │
  │  │          │                                            │    │
  │  │          ├── rule('babel') (Rule)                     │    │
  │  │          │     │                                      │    │
  │  │          │     ├── test: /\.(js|jsx)$/                │    │
  │  │          │     ├── include (ChainedSet)               │    │
  │  │          │     │     ['./src']                        │    │
  │  │          │     ├── exclude (ChainedSet)               │    │
  │  │          │     │     ['node_modules']                 │    │
  │  │          │     └── uses (ChainedMap)                  │    │
  │  │          │           │                                │    │
  │  │          │           └── use('babel-loader')          │    │
  │  │          │                 ├── loader: 'babel-loader' │    │
  │  │          │                 └── options: { presets }    │    │
  │  │          │                                            │    │
  │  │          └── rule('css') (Rule)                       │    │
  │  │                └── ...                                │    │
  │  │                                                      │    │
  │  │  ★ MỌI THỨ CÓ TÊN! Dễ tìm + sửa + xóa!         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  THÊM LOADER CSS (nhiều loaders chuỗi):                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ config.module                                         │    │
  │  │   .rule('css')                                        │    │
  │  │   .test(/\.css$/)                                     │    │
  │  │   .use('style-loader')                                │    │
  │  │     .loader('style-loader')                           │    │
  │  │     .end()                    // quay về rule!       │    │
  │  │   .use('css-loader')                                  │    │
  │  │     .loader('css-loader')                             │    │
  │  │     .options({ modules: true });                      │    │
  │  │                                                      │    │
  │  │ → Nhiều .use() = CHUỖI loaders!                    │    │
  │  │ → Thứ tự: style-loader ← css-loader ★              │    │
  │  │ → Webpack xử lý NGƯỢC: css trước, style sau!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② SỬA LOADER (tap method!) ★:                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // THAY ĐỔI options của loader đã tồn tại!        │    │
  │  │ config.module                                         │    │
  │  │   .rule('babel')                                      │    │
  │  │   .use('babel-loader')                                │    │
  │  │     .tap(options => {                                 │    │
  │  │       // options = object cấu hình HIỆN TẠI!       │    │
  │  │       options.include = path.resolve(__dirname, 'test')│   │
  │  │       return options;  // PHẢI return! ★             │    │
  │  │     });                                               │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → .tap(callback) = chỉnh sửa options!              │    │
  │  │ → callback nhận options HIỆN TẠI!                   │    │
  │  │ → PHẢI return options (đã sửa!)                    │    │
  │  │ → KHÔNG tạo mới, chỉ SỬA options! ★               │    │
  │  │                                                      │    │
  │  │ FLOW:                                                 │    │
  │  │ options hiện tại                                      │    │
  │  │   │                                                   │    │
  │  │   ↓                                                   │    │
  │  │ tap(callback)                                         │    │
  │  │   │                                                   │    │
  │  │   ↓                                                   │    │
  │  │ callback(options) → sửa → return options            │    │
  │  │   │                                                   │    │
  │  │   ↓                                                   │    │
  │  │ options MỚI được lưu! ★                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ XÓA LOADER:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Xóa TẤT CẢ rules!                                │    │
  │  │ config.module.rules.clear();                          │    │
  │  │                                                      │    │
  │  │ // Xóa TẤT CẢ uses trong 1 rule!                   │    │
  │  │ config.module.rule('babel').uses.clear();              │    │
  │  │                                                      │    │
  │  │ // Xóa 1 use cụ thể!                               │    │
  │  │ config.module.rule('babel').uses.delete('babel-loader')│   │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → .rules = ChainedMap chứa tất cả rules!           │    │
  │  │ → .uses = ChainedMap chứa tất cả uses trong rule!  │    │
  │  │ → .clear() = xóa TẤT CẢ!                          │    │
  │  │ → .delete(name) = xóa 1 CÁI cụ thể! ★            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ CRUD LOADER:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  THÊM:   rule('name').use('name').loader().options()  │    │
  │  │    │                                                  │    │
  │  │    ↓                                                  │    │
  │  │  SỬA:   rule('name').use('name').tap(opts => ...)    │    │
  │  │    │                                                  │    │
  │  │    ↓                                                  │    │
  │  │  XÓA:   rule('name').uses.delete('name')             │    │
  │  │         module.rules.clear()                          │    │
  │  │                                                      │    │
  │  │  ★ TÊN là KEY → dễ tìm + sửa + xóa!              │    │
  │  │  ★ Không cần biết INDEX trong array!                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Plugin — Thêm / Sửa / Xóa!

```
  PLUGIN — CRUD:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① THÊM PLUGIN MỚI:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ WEBPACK-CHAIN:                                        │    │
  │  │ config                                                │    │
  │  │   .plugin('HtmlWebpackPlugin')  // TÊN plugin! ★    │    │
  │  │   .use(HtmlWebpackPlugin, [     // Constructor + args!│    │
  │  │     {                                                 │    │
  │  │       template: path.resolve(__dirname, './src/index.html'),│
  │  │       minify: {                                       │    │
  │  │         collapseWhitespace: true,                     │    │
  │  │         minifyJS: true,                               │    │
  │  │         minifyCSS: true,                              │    │
  │  │         removeComments: true,                         │    │
  │  │         removeEmptyAttributes: true,                  │    │
  │  │         removeRedundantAttributes: true,              │    │
  │  │         useShortDoctype: true,                        │    │
  │  │       }                                               │    │
  │  │     }                                                 │    │
  │  │   ]);                                                 │    │
  │  │                                                      │    │
  │  │ TƯƠNG ĐƯƠNG WEBPACK:                                  │    │
  │  │ plugins: [                                            │    │
  │  │   new HtmlWebpackPlugin({                             │    │
  │  │     template: './src/index.html',                     │    │
  │  │     minify: { ... }                                   │    │
  │  │   })                                                  │    │
  │  │ ]                                                     │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → .plugin('tên') = đặt TÊN cho plugin!            │    │
  │  │ → .use(Constructor, [args]) = cấu hình!            │    │
  │  │ → Constructor = Class của plugin!                    │    │
  │  │ → [args] = MẢNG arguments cho constructor!          │    │
  │  │ → Webpack sẽ: new Constructor(...args)! ★           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② SỬA PLUGIN (tap method!) ★:                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Sửa plugin đã tồn tại!                          │    │
  │  │ config                                                │    │
  │  │   .plugin('HtmlWebpackPlugin')                        │    │
  │  │   .tap(args => [                                      │    │
  │  │     {                                                 │    │
  │  │       ...(args[0] || {}),         // GIỮ config cũ!  │    │
  │  │       template: './main.html',   // GHI ĐÈ template! │    │
  │  │     }                                                 │    │
  │  │   ]);                                                 │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → .tap(callback) = chỉnh sửa args!                │    │
  │  │ → callback nhận args = MẢNG arguments!              │    │
  │  │ → args[0] = argument ĐẦU TIÊN (options object!)    │    │
  │  │ → Spread ...args[0] = GIỮ config cũ!               │    │
  │  │ → Override template = CHỈ đổi template!             │    │
  │  │ → PHẢI return MẢNG mới! ★                          │    │
  │  │                                                      │    │
  │  │ ⚠️ CHÚ Ý SỰ KHÁC BIỆT:                              │    │
  │  │ ┌─────────────────┬─────────────────────────────┐    │    │
  │  │ │ Loader .tap()    │ callback nhận OPTIONS!      │    │    │
  │  │ │                  │ return OPTIONS object!       │    │    │
  │  │ ├─────────────────┼─────────────────────────────┤    │    │
  │  │ │ Plugin .tap()    │ callback nhận ARGS array!   │    │    │
  │  │ │                  │ return ARGS array! ★         │    │    │
  │  │ └─────────────────┴─────────────────────────────┘    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ XÓA PLUGIN:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Xóa 1 plugin theo TÊN!                           │    │
  │  │ config.plugins.delete('HtmlWebpackPlugin');           │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → .plugins = ChainedMap chứa tất cả plugins!       │    │
  │  │ → .delete('tên') = xóa plugin theo TÊN!            │    │
  │  │ → KHÔNG cần tìm instance!                           │    │
  │  │ → KHÔNG cần filter array!                           │    │
  │  │ → Chỉ cần BIẾT TÊN! ★                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ CRUD PLUGIN:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  THÊM:  plugin('name').use(Constructor, [args])      │    │
  │  │    │                                                  │    │
  │  │    ↓                                                  │    │
  │  │  SỬA:   plugin('name').tap(args => [...newArgs])     │    │
  │  │    │                                                  │    │
  │  │    ↓                                                  │    │
  │  │  XÓA:   plugins.delete('name')                       │    │
  │  │                                                      │    │
  │  │  SO SÁNH THÊM LOADER vs PLUGIN:                       │    │
  │  │  ┌─────────────┬───────────────────────────────┐     │    │
  │  │  │ Loader       │ rule().use().loader().options() │    │    │
  │  │  │ Plugin       │ plugin().use(Class, [args])    │     │    │
  │  │  ├─────────────┼───────────────────────────────┤     │    │
  │  │  │ Sửa Loader  │ .tap(options => ...)            │    │    │
  │  │  │ Sửa Plugin  │ .tap(args => [...])             │    │    │
  │  │  ├─────────────┼───────────────────────────────┤     │    │
  │  │  │ Xóa Loader  │ uses.delete('name')             │    │    │
  │  │  │ Xóa Plugin  │ plugins.delete('name')          │    │    │
  │  │  └─────────────┴───────────────────────────────┘     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. When / Condition + DevTool + Optimization!

```
  WHEN + DEVTOOL + OPTIMIZATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① WHEN — Cấu hình ĐIỀU KIỆN! ★★★                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Method QUAN TRỌNG NHẤT!                           │    │
  │  │ → Cấu hình khác nhau theo ENVIRONMENT!              │    │
  │  │ → production vs development!                         │    │
  │  │ → Syntax: .when(condition, whenTrue, whenFalse)      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ 1 — Chỉ thêm plugin khi PRODUCTION:                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ config                                                │    │
  │  │   .when(                                              │    │
  │  │     process.env.NODE_ENV === 'production',            │    │
  │  │     config => {                                       │    │
  │  │       config                                          │    │
  │  │         .plugin('minify')                             │    │
  │  │         .use(BabiliWebpackPlugin);                    │    │
  │  │     }                                                 │    │
  │  │   );                                                  │    │
  │  │                                                      │    │
  │  │ → production → THÊM minify plugin!                 │    │
  │  │ → development → KHÔNG thêm gì!                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ 2 — Production minify, Development source-map:         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ config                                                │    │
  │  │   .when(                                              │    │
  │  │     process.env.NODE_ENV === 'production',            │    │
  │  │     // TRUE → production!                            │    │
  │  │     config => config                                  │    │
  │  │       .plugin('minify')                               │    │
  │  │       .use(BabiliWebpackPlugin),                      │    │
  │  │     // FALSE → development!                          │    │
  │  │     config => config                                  │    │
  │  │       .devtool('source-map')                          │    │
  │  │   );                                                  │    │
  │  │                                                      │    │
  │  │ SƠ ĐỒ:                                               │    │
  │  │ NODE_ENV === 'production'?                            │    │
  │  │   ├── TRUE  → plugin('minify')!                     │    │
  │  │   └── FALSE → devtool('source-map')!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② DEVTOOL — Source Map:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Cấu hình source map!                              │    │
  │  │ config.devtool('source-map');                         │    │
  │  │                                                      │    │
  │  │ // Chỉ dev mới cần source-map!                     │    │
  │  │ config.when(                                          │    │
  │  │   process.env.NODE_ENV !== 'production',              │    │
  │  │   config => config.devtool('cheap-module-source-map') │    │
  │  │ );                                                    │    │
  │  │                                                      │    │
  │  │ CÁC LOẠI DEVTOOL:                                    │    │
  │  │ ┌─────────────────────────┬───────────────────┐      │    │
  │  │ │ eval                     │ Nhanh nhất, sơ sài│     │    │
  │  │ │ cheap-module-source-map  │ Tốt cho dev! ★   │      │    │
  │  │ │ source-map               │ Chậm, chi tiết!  │      │    │
  │  │ │ hidden-source-map        │ Production safe!  │      │    │
  │  │ └─────────────────────────┴───────────────────┘      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ OPTIMIZATION — Tối ưu hóa:                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ config.optimization                                   │    │
  │  │   .minimize(true)                                     │    │
  │  │   .splitChunks({                                      │    │
  │  │     chunks: 'all',                                    │    │
  │  │     cacheGroups: {                                    │    │
  │  │       vendor: {                                       │    │
  │  │         test: /node_modules/,                         │    │
  │  │         name: 'vendors',                              │    │
  │  │         chunks: 'all',                                │    │
  │  │       }                                               │    │
  │  │     }                                                 │    │
  │  │   });                                                 │    │
  │  │                                                      │    │
  │  │ → .minimize(true) = bật minification!               │    │
  │  │ → .splitChunks() = code splitting! ★                │    │
  │  │ → vendor bundle TÁCH RIÊNG node_modules!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. Vue CLI 3 — Thực Tế!

```
  VUE CLI 3 + WEBPACK-CHAIN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TẠI SAO VUE CLI 3 DÙNG WEBPACK-CHAIN:                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Vue CLI 3+ ẨN webpack config bên trong!          │    │
  │  │ → User KHÔNG thấy webpack.config.js!                │    │
  │  │ → Thay vào đó dùng vue.config.js!                  │    │
  │  │ → chainWebpack(config) = nhận webpack-chain config! │    │
  │  │ → Dễ customize MÀ KHÔNG cần eject! ★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẤU TRÚC vue.config.js:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // vue.config.js                                      │    │
  │  │ module.exports = {                                    │    │
  │  │                                                      │    │
  │  │   // ① chainWebpack = webpack-chain config!          │    │
  │  │   chainWebpack: config => {                           │    │
  │  │                                                      │    │
  │  │     // Thêm alias!                                   │    │
  │  │     config.resolve.alias                              │    │
  │  │       .set('@', path.resolve(__dirname, 'src'))       │    │
  │  │       .set('assets', path.resolve('src/assets'));     │    │
  │  │                                                      │    │
  │  │     // Sửa loader babel!                             │    │
  │  │     config.module                                     │    │
  │  │       .rule('js')                                     │    │
  │  │       .use('babel-loader')                            │    │
  │  │         .tap(options => ({                            │    │
  │  │           ...options,                                 │    │
  │  │           plugins: ['@babel/plugin-proposal-optional-chaining']│
  │  │         }));                                          │    │
  │  │                                                      │    │
  │  │     // Thêm plugin!                                  │    │
  │  │     config.plugin('analyzer')                         │    │
  │  │       .use(BundleAnalyzerPlugin);                     │    │
  │  │                                                      │    │
  │  │     // Điều kiện!                                    │    │
  │  │     config.when(                                      │    │
  │  │       process.env.NODE_ENV === 'production',          │    │
  │  │       config => {                                     │    │
  │  │         config.plugin('compress')                     │    │
  │  │           .use(CompressionPlugin);                    │    │
  │  │       }                                               │    │
  │  │     );                                                │    │
  │  │   },                                                  │    │
  │  │                                                      │    │
  │  │   // ② configureWebpack = webpack object thường!     │    │
  │  │   configureWebpack: {                                 │    │
  │  │     // Merge trực tiếp vào webpack config!          │    │
  │  │     externals: { jquery: 'jQuery' }                   │    │
  │  │   }                                                   │    │
  │  │ };                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO SÁNH chainWebpack vs configureWebpack:                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ┌───────────────┬───────────────────────────────┐    │    │
  │  │ │chainWebpack    │ Dùng webpack-chain API!       │    │    │
  │  │ │                │ Nhận config instance!         │    │    │
  │  │ │                │ Có thể SỬA + XÓA! ★         │    │    │
  │  │ │                │ LINH HOẠT hơn!               │    │    │
  │  │ ├───────────────┼───────────────────────────────┤    │    │
  │  │ │configureWebpack│ Dùng webpack object thường!   │    │    │
  │  │ │                │ Chỉ MERGE thêm!               │    │    │
  │  │ │                │ KHÔNG thể xóa/sửa! ❌        │    │    │
  │  │ │                │ ĐƠN GIẢN hơn!                │    │    │
  │  │ └───────────────┴───────────────────────────────┘    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KIỂM TRA CONFIG VUE CLI:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ # Xem config CUỐI CÙNG!                              │    │
  │  │ vue inspect                                           │    │
  │  │                                                      │    │
  │  │ # Xem 1 rule cụ thể!                               │    │
  │  │ vue inspect --rule vue                                │    │
  │  │                                                      │    │
  │  │ # Xem 1 plugin cụ thể!                             │    │
  │  │ vue inspect --plugin html                             │    │
  │  │                                                      │    │
  │  │ # Xuất ra file!                                       │    │
  │  │ vue inspect > output.js                               │    │
  │  │                                                      │    │
  │  │ → vue inspect = toString() của webpack-chain! ★     │    │
  │  │ → Có comments cho biết TÊN rule/plugin!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ VUE CLI + WEBPACK-CHAIN:                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  vue.config.js                                        │    │
  │  │    │                                                  │    │
  │  │    ├── chainWebpack(config)                           │    │
  │  │    │     │                                            │    │
  │  │    │     ↓                                            │    │
  │  │    │   webpack-chain Config instance                   │    │
  │  │    │     │                                            │    │
  │  │    │     ↓                                            │    │
  │  │    │   config.toConfig()                               │    │
  │  │    │     │                                            │    │
  │  │    ├── configureWebpack (object)                       │    │
  │  │    │     │                                            │    │
  │  │    │     ↓                                            │    │
  │  │    │   webpack-merge!                                  │    │
  │  │    │     │                                            │    │
  │  │    ↓     ↓                                            │    │
  │  │  FINAL webpack.config.js                               │    │
  │  │    │                                                  │    │
  │  │    ↓                                                  │    │
  │  │  WEBPACK chạy! ★                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. Sơ Đồ Tổng Hợp!

```
  SƠ ĐỒ KIẾN TRÚC TỔNG QUÁT WEBPACK-CHAIN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Config (Root — ChainedMap)                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌──── entry (ChainedMap of ChainedSets) ────┐      │    │
  │  │  │ 'main'    → ChainedSet ['./src/main.js']  │      │    │
  │  │  │ 'vendor'  → ChainedSet ['./src/vendor.js']│      │    │
  │  │  └────────────────────────────────────────────┘      │    │
  │  │                                                      │    │
  │  │  ┌──── output (ChainedMap) ──────────────────┐      │    │
  │  │  │ 'path'           → '/dist'                 │      │    │
  │  │  │ 'filename'       → '[name].[hash].js'      │      │    │
  │  │  │ 'chunkFilename'  → 'chunks/[name].js'      │      │    │
  │  │  │ 'libraryTarget'  → 'umd'                   │      │    │
  │  │  └────────────────────────────────────────────┘      │    │
  │  │                                                      │    │
  │  │  ┌──── resolve (ChainedMap) ─────────────────┐      │    │
  │  │  │ alias (ChainedMap)                          │      │    │
  │  │  │   '@' → '/src'                             │      │    │
  │  │  │   'assets' → '/src/assets'                 │      │    │
  │  │  │                                             │      │    │
  │  │  │ extensions (ChainedSet)                     │      │    │
  │  │  │   ['.js', '.jsx', '.ts', '.tsx', '.vue']   │      │    │
  │  │  │                                             │      │    │
  │  │  │ modules (ChainedSet)                        │      │    │
  │  │  │   ['node_modules', 'src']                   │      │    │
  │  │  └────────────────────────────────────────────┘      │    │
  │  │                                                      │    │
  │  │  ┌──── module (ChainedMap) ──────────────────┐      │    │
  │  │  │ rules (ChainedMap)                          │      │    │
  │  │  │  │                                          │      │    │
  │  │  │  ├── rule('babel') ──────────────┐         │      │    │
  │  │  │  │   test: /\.(js|tsx?)$/         │         │      │    │
  │  │  │  │   include: ChainedSet          │         │      │    │
  │  │  │  │   exclude: ChainedSet          │         │      │    │
  │  │  │  │   uses (ChainedMap):           │         │      │    │
  │  │  │  │     use('babel-loader')        │         │      │    │
  │  │  │  │       loader + options          │         │      │    │
  │  │  │  └────────────────────────────────┘         │      │    │
  │  │  │  │                                          │      │    │
  │  │  │  ├── rule('css') ────────────────┐         │      │    │
  │  │  │  │   test: /\.css$/               │         │      │    │
  │  │  │  │   uses:                        │         │      │    │
  │  │  │  │     use('style-loader')        │         │      │    │
  │  │  │  │     use('css-loader')          │         │      │    │
  │  │  │  └────────────────────────────────┘         │      │    │
  │  │  │  │                                          │      │    │
  │  │  │  └── rule('images') ─────────────┐         │      │    │
  │  │  │      test: /\.(png|jpg|gif)$/     │         │      │    │
  │  │  │      uses:                        │         │      │    │
  │  │  │        use('file-loader')         │         │      │    │
  │  │  │  └────────────────────────────────┘         │      │    │
  │  │  └────────────────────────────────────────────┘      │    │
  │  │                                                      │    │
  │  │  ┌──── plugins (ChainedMap) ─────────────────┐      │    │
  │  │  │ 'HtmlWebpackPlugin'                         │      │    │
  │  │  │    → Constructor + [args]                   │      │    │
  │  │  │ 'DefinePlugin'                              │      │    │
  │  │  │    → Constructor + [args]                   │      │    │
  │  │  │ 'MiniCssExtractPlugin'                      │      │    │
  │  │  │    → Constructor + [args]                   │      │    │
  │  │  └────────────────────────────────────────────┘      │    │
  │  │                                                      │    │
  │  │  ┌── devServer (ChainedMap) ─────────────────┐      │    │
  │  │  │ 'hot'                → true                 │      │    │
  │  │  │ 'port'               → 8080                 │      │    │
  │  │  │ 'open'               → true                 │      │    │
  │  │  │ 'historyApiFallback' → true                 │      │    │
  │  │  └────────────────────────────────────────────┘      │    │
  │  │                                                      │    │
  │  │  ┌── optimization (ChainedMap) ──────────────┐      │    │
  │  │  │ 'minimize'     → true                      │      │    │
  │  │  │ 'splitChunks'  → { chunks: 'all' }         │      │    │
  │  │  │ 'minimizer'    → [TerserPlugin]             │      │    │
  │  │  └────────────────────────────────────────────┘      │    │
  │  │                                                      │    │
  │  │  ┌── Các config đơn giản ────────────────────┐      │    │
  │  │  │ 'mode'     → 'production' | 'development'  │      │    │
  │  │  │ 'devtool'  → 'source-map' | 'eval'         │      │    │
  │  │  │ 'target'   → 'web' | 'node'                │      │    │
  │  │  │ 'context'  → __dirname                      │      │    │
  │  │  └────────────────────────────────────────────┘      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CHUYỂN ĐỔI PIPELINE:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  config (webpack-chain instance)                      │    │
  │  │       │                                               │    │
  │  │       │  .toConfig()                                  │    │
  │  │       ↓                                               │    │
  │  │  { entry, output, module, plugins, ... }              │    │
  │  │  (webpack config object thuần!)                       │    │
  │  │       │                                               │    │
  │  │       │  module.exports =                             │    │
  │  │       ↓                                               │    │
  │  │  WEBPACK compiler đọc + chạy!                        │    │
  │  │       │                                               │    │
  │  │       ↓                                               │    │
  │  │  Bundle output! ./dist/                               │    │
  │  │                                                      │    │
  │  │       .toString()                                     │    │
  │  │       ↓                                               │    │
  │  │  String DEBUG (có comments!)                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO SÁNH API TYPES:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ┌────────────┬────────────────┬─────────────────┐    │    │
  │  │ │ Thành phần  │ Loại API       │ Đặc điểm        │   │    │
  │  │ ├────────────┼────────────────┼─────────────────┤    │    │
  │  │ │ config      │ Config (root)  │ extends Map     │    │    │
  │  │ │ entry       │ Map of Sets    │ key → Set      │    │    │
  │  │ │ output      │ ChainedMap     │ key → value    │    │    │
  │  │ │ resolve     │ ChainedMap     │ nested Maps/Sets│   │    │
  │  │ │ alias       │ ChainedMap     │ key → path     │    │    │
  │  │ │ extensions  │ ChainedSet     │ [values]        │    │    │
  │  │ │ module      │ ChainedMap     │ nested rules    │    │    │
  │  │ │ rules       │ ChainedMap     │ name → Rule    │    │    │
  │  │ │ rule.include │ ChainedSet    │ [paths]         │    │    │
  │  │ │ rule.uses   │ ChainedMap     │ name → Use     │    │    │
  │  │ │ plugins     │ ChainedMap     │ name → Plugin  │    │    │
  │  │ │ devServer   │ ChainedMap     │ shorthand methods│   │    │
  │  │ │ optimization│ ChainedMap     │ shorthand methods│   │    │
  │  │ └────────────┴────────────────┴─────────────────┘    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §12. Tự Viết — WebpackChainSimulator!

> **Mục tiêu**: Viết LẠI bằng tay toàn bộ core engine của webpack-chain!
> KHÔNG dùng thư viện, KHÔNG copy — tự hiểu + tự viết!

```javascript
// ============================================================
// WEBPACK-CHAIN SIMULATOR — Tự viết bằng tay!
// Mô phỏng CHÍNH XÁC cách webpack-chain hoạt động bên trong!
// ============================================================

// ──────────────────────────────────────────────────────────────
// 1. CHAINED MAP — Core data structure!
// ──────────────────────────────────────────────────────────────

class ChainedMap {
  constructor(parent) {
    // parent = reference đến cha → dùng cho .end()!
    this.parent = parent;
    // store = Map thật để lưu key → value!
    this.store = new Map();
  }

  // ① set(key, value) — Đặt giá trị!
  // → Trả về THIS → chain tiếp!
  set(key, value) {
    this.store.set(key, value);
    return this; // ★ QUAN TRỌNG: trả this để chain!
  }

  // ② get(key) — Lấy giá trị!
  // → Trả về VALUE (không phải this!)
  get(key) {
    return this.store.get(key);
  }

  // ③ has(key) — Kiểm tra tồn tại!
  // → Trả về BOOLEAN!
  has(key) {
    return this.store.has(key);
  }

  // ④ delete(key) — Xóa 1 key!
  // → Trả về THIS → chain tiếp!
  delete(key) {
    this.store.delete(key);
    return this;
  }

  // ⑤ clear() — Xóa TẤT CẢ!
  // → Trả về THIS → chain tiếp!
  clear() {
    this.store.clear();
    return this;
  }

  // ⑥ values() — Lấy tất cả values!
  // → Trả về ARRAY!
  values() {
    return [...this.store.values()];
  }

  // ⑦ entries() — Lấy object {key: value}!
  // → Trả về OBJECT!
  entries() {
    const result = {};
    this.store.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // ⑧ getOrCompute(key, fn) — Lấy hoặc tính toán!
  // → Key có → trả giá trị!
  // → Key chưa có → gọi fn() + set + trả!
  getOrCompute(key, fn) {
    if (!this.store.has(key)) {
      this.store.set(key, fn());
    }
    return this.store.get(key);
  }

  // ⑨ merge(obj, omit = []) — Merge object!
  // → Gộp properties vào Map!
  // → omit = keys bỏ qua!
  merge(obj, omit = []) {
    Object.keys(obj).forEach((key) => {
      if (omit.includes(key)) return; // bỏ qua!
      const value = obj[key];
      // Nếu value trong store là ChainedMap → merge sâu!
      const existing = this.store.get(key);
      if (existing && existing instanceof ChainedMap) {
        existing.merge(value);
      } else if (existing && existing instanceof ChainedSet) {
        existing.merge(value);
      } else {
        this.store.set(key, value);
      }
    });
    return this;
  }

  // ⑩ batch(handler) — Thực thi function!
  batch(handler) {
    handler(this);
    return this;
  }

  // ⑪ when(condition, whenTruthy, whenFalsy) — Điều kiện!
  // → condition = true → gọi whenTruthy(this)!
  // → condition = false → gọi whenFalsy(this)!
  when(condition, whenTruthy, whenFalsy) {
    if (condition) {
      if (whenTruthy) whenTruthy(this);
    } else {
      if (whenFalsy) whenFalsy(this);
    }
    return this;
  }

  // ⑫ end() — Quay về parent!
  // → Đây là CHÌA KHÓA của chaining!
  // → .set().set().end() → quay về cha!
  end() {
    return this.parent;
  }
}

// ──────────────────────────────────────────────────────────────
// 2. CHAINED SET — Lưu danh sách values!
// ──────────────────────────────────────────────────────────────

class ChainedSet {
  constructor(parent) {
    this.parent = parent;
    this.store = []; // Dùng array thay vì Set (giữ thứ tự!)
  }

  // ① add(value) — Thêm vào CUỐI!
  add(value) {
    this.store.push(value);
    return this;
  }

  // ② prepend(value) — Thêm vào ĐẦU!
  prepend(value) {
    this.store.unshift(value);
    return this;
  }

  // ③ has(value) — Kiểm tra!
  has(value) {
    return this.store.includes(value);
  }

  // ④ delete(value) — Xóa 1 cái!
  delete(value) {
    const idx = this.store.indexOf(value);
    if (idx > -1) this.store.splice(idx, 1);
    return this;
  }

  // ⑤ clear() — Xóa TẤT CẢ!
  clear() {
    this.store = [];
    return this;
  }

  // ⑥ values() — Lấy array!
  values() {
    return [...this.store];
  }

  // ⑦ merge(arr) — Nối array!
  merge(arr) {
    this.store = this.store.concat(arr);
    return this;
  }

  // ⑧ batch + when — giống ChainedMap!
  batch(handler) {
    handler(this);
    return this;
  }

  when(condition, whenTruthy, whenFalsy) {
    if (condition) {
      if (whenTruthy) whenTruthy(this);
    } else {
      if (whenFalsy) whenFalsy(this);
    }
    return this;
  }

  // ⑨ end() — Quay về parent!
  end() {
    return this.parent;
  }
}

// ──────────────────────────────────────────────────────────────
// 3. USE — Đại diện cho 1 loader use!
// ──────────────────────────────────────────────────────────────

class Use extends ChainedMap {
  constructor(parent) {
    super(parent);
    // Shorthand methods!
  }

  // loader('babel-loader') = set('loader', 'babel-loader')!
  loader(value) {
    return this.set("loader", value);
  }

  // options({ presets: [...] }) = set('options', {...})!
  options(value) {
    return this.set("options", value);
  }

  // tap(callback) — Chỉnh sửa options!
  // → callback nhận options HIỆN TẠI!
  // → PHẢI return options mới!
  tap(callback) {
    const currentOptions = this.get("options") || {};
    const newOptions = callback(currentOptions);
    this.set("options", newOptions);
    return this;
  }

  // Chuyển thành webpack config!
  toConfig() {
    const result = {};
    const loader = this.get("loader");
    if (loader) result.loader = loader;
    const options = this.get("options");
    if (options) result.options = options;
    return result;
  }
}

// ──────────────────────────────────────────────────────────────
// 4. RULE — Đại diện cho 1 module rule!
// ──────────────────────────────────────────────────────────────

class Rule extends ChainedMap {
  constructor(parent) {
    super(parent);
    // include, exclude = ChainedSet!
    this._include = new ChainedSet(this);
    this._exclude = new ChainedSet(this);
    // uses = ChainedMap of Use instances!
    this.uses = new ChainedMap(this);
  }

  // test(/\.js$/) = set regex pattern!
  test(value) {
    return this.set("test", value);
  }

  // include = accessor trả ChainedSet!
  get include() {
    return this._include;
  }

  // exclude = accessor trả ChainedSet!
  get exclude() {
    return this._exclude;
  }

  // use('babel-loader') = tạo/lấy Use instance!
  use(name) {
    // getOrCompute: có rồi → lấy, chưa có → tạo mới!
    if (!this.uses.has(name)) {
      this.uses.set(name, new Use(this));
    }
    return this.uses.get(name);
  }

  // Chuyển thành webpack config!
  toConfig() {
    const result = {};

    // test
    const test = this.get("test");
    if (test) result.test = test;

    // include
    const includeValues = this._include.values();
    if (includeValues.length > 0) result.include = includeValues;

    // exclude
    const excludeValues = this._exclude.values();
    if (excludeValues.length > 0) result.exclude = excludeValues;

    // uses → mảng use configs!
    const useConfigs = this.uses
      .values()
      .map((use) => use.toConfig())
      .filter((c) => Object.keys(c).length > 0);
    if (useConfigs.length > 0) result.use = useConfigs;

    return result;
  }
}

// ──────────────────────────────────────────────────────────────
// 5. PLUGIN — Đại diện cho 1 webpack plugin!
// ──────────────────────────────────────────────────────────────

class Plugin extends ChainedMap {
  constructor(parent) {
    super(parent);
    // Constructor + args (mảng!)
    this._pluginConstructor = null;
    this._pluginArgs = [];
  }

  // use(Constructor, args) = cấu hình plugin!
  use(PluginConstructor, args = []) {
    this._pluginConstructor = PluginConstructor;
    this._pluginArgs = args;
    return this;
  }

  // tap(callback) — Chỉnh sửa ARGS!
  // ★ KHÁC với Loader.tap()!
  // → Loader.tap() nhận OPTIONS object!
  // → Plugin.tap() nhận ARGS array!
  tap(callback) {
    this._pluginArgs = callback(this._pluginArgs);
    return this;
  }

  // Chuyển thành webpack plugin instance!
  toConfig() {
    if (!this._pluginConstructor) return null;
    return new this._pluginConstructor(...this._pluginArgs);
  }
}

// ──────────────────────────────────────────────────────────────
// 6. CONFIG — Root instance! (class chính!)
// ──────────────────────────────────────────────────────────────

class WebpackChainConfig extends ChainedMap {
  constructor() {
    super(null); // root → không có parent!

    // Sub-structures!
    this._entries = new ChainedMap(this);
    this._output = new ChainedMap(this);
    this._resolve = new ResolveConfig(this);
    this._module = new ModuleConfig(this);
    this._plugins = new ChainedMap(this);
    this._devServer = new ChainedMap(this);
    this._optimization = new ChainedMap(this);
  }

  // ── Entry ──
  // config.entry('main') → trả ChainedSet!
  entry(name) {
    if (!this._entries.has(name)) {
      this._entries.set(name, new ChainedSet(this));
    }
    return this._entries.get(name);
  }

  // ── Output ──
  // config.output → trả ChainedMap với shorthand methods!
  get output() {
    // Thêm shorthand methods!
    const output = this._output;
    // path(), filename(), etc. = shorthand!
    if (!output.path) {
      output.path = function (val) {
        return this.set("path", val);
      };
      output.filename = function (val) {
        return this.set("filename", val);
      };
      output.chunkFilename = function (val) {
        return this.set("chunkFilename", val);
      };
      output.libraryTarget = function (val) {
        return this.set("libraryTarget", val);
      };
      output.publicPath = function (val) {
        return this.set("publicPath", val);
      };
    }
    return output;
  }

  // ── Resolve ──
  get resolve() {
    return this._resolve;
  }

  // ── Module ──
  get module() {
    return this._module;
  }

  // ── Plugins ──
  // config.plugin('name') → trả Plugin instance!
  plugin(name) {
    if (!this._plugins.has(name)) {
      this._plugins.set(name, new Plugin(this));
    }
    return this._plugins.get(name);
  }

  // config.plugins → trả ChainedMap (cho .delete!)
  get plugins() {
    return this._plugins;
  }

  // ── DevServer ──
  get devServer() {
    const ds = this._devServer;
    // Shorthand methods!
    if (!ds.hot) {
      ds.hot = function (val) {
        return this.set("hot", val);
      };
      ds.port = function (val) {
        return this.set("port", val);
      };
      ds.open = function (val) {
        return this.set("open", val);
      };
      ds.compress = function (val) {
        return this.set("compress", val);
      };
      ds.historyApiFallback = function (val) {
        return this.set("historyApiFallback", val);
      };
    }
    return ds;
  }

  // ── Optimization ──
  get optimization() {
    const opt = this._optimization;
    if (!opt.minimize) {
      opt.minimize = function (val) {
        return this.set("minimize", val);
      };
      opt.splitChunks = function (val) {
        return this.set("splitChunks", val);
      };
    }
    return opt;
  }

  // ── Shorthand top-level ──
  devtool(value) {
    return this.set("devtool", value);
  }
  mode(value) {
    return this.set("mode", value);
  }
  target(value) {
    return this.set("target", value);
  }
  context(value) {
    return this.set("context", value);
  }

  // ══════════════════════════════════════════════════════════
  // ★ toConfig() — CHUYỂN THÀNH WEBPACK CONFIG OBJECT!
  // Đây là method QUAN TRỌNG NHẤT!
  // ══════════════════════════════════════════════════════════
  toConfig() {
    const config = {};

    // Top-level configs
    const mode = this.get("mode");
    if (mode) config.mode = mode;

    const devtool = this.get("devtool");
    if (devtool) config.devtool = devtool;

    const target = this.get("target");
    if (target) config.target = target;

    const context = this.get("context");
    if (context) config.context = context;

    // Entry
    const entries = {};
    this._entries.store.forEach((chainedSet, name) => {
      entries[name] = chainedSet.values();
    });
    if (Object.keys(entries).length > 0) config.entry = entries;

    // Output
    const outputEntries = this._output.entries();
    if (Object.keys(outputEntries).length > 0) config.output = outputEntries;

    // Resolve
    const resolveConfig = this._resolve.toConfig();
    if (Object.keys(resolveConfig).length > 0) config.resolve = resolveConfig;

    // Module
    const moduleConfig = this._module.toConfig();
    if (Object.keys(moduleConfig).length > 0) config.module = moduleConfig;

    // Plugins
    const pluginInstances = [];
    this._plugins.store.forEach((plugin) => {
      const instance = plugin.toConfig();
      if (instance) pluginInstances.push(instance);
    });
    if (pluginInstances.length > 0) config.plugins = pluginInstances;

    // DevServer
    const dsEntries = this._devServer.entries();
    if (Object.keys(dsEntries).length > 0) config.devServer = dsEntries;

    // Optimization
    const optEntries = this._optimization.entries();
    if (Object.keys(optEntries).length > 0) config.optimization = optEntries;

    return config;
  }

  // ══════════════════════════════════════════════════════════
  // ★ toString() — DEBUG STRING!
  // Thêm comments cho biết TÊN rule/plugin!
  // ══════════════════════════════════════════════════════════
  toString() {
    const config = this.toConfig();
    return JSON.stringify(
      config,
      (key, value) => {
        // Xử lý RegExp → string!
        if (value instanceof RegExp) return value.toString();
        // Xử lý function (constructor)!
        if (typeof value === "function") return `[Function: ${value.name}]`;
        return value;
      },
      2,
    );
  }
}

// ──────────────────────────────────────────────────────────────
// 7. RESOLVE CONFIG — Quản lý resolve!
// ──────────────────────────────────────────────────────────────

class ResolveConfig extends ChainedMap {
  constructor(parent) {
    super(parent);
    this._alias = new ChainedMap(this);
    this._extensions = new ChainedSet(this);
    this._modules = new ChainedSet(this);
  }

  get alias() {
    return this._alias;
  }
  get extensions() {
    return this._extensions;
  }
  get modules() {
    return this._modules;
  }

  toConfig() {
    const result = {};
    const aliasEntries = this._alias.entries();
    if (Object.keys(aliasEntries).length > 0) result.alias = aliasEntries;
    const extValues = this._extensions.values();
    if (extValues.length > 0) result.extensions = extValues;
    const modValues = this._modules.values();
    if (modValues.length > 0) result.modules = modValues;
    return result;
  }
}

// ──────────────────────────────────────────────────────────────
// 8. MODULE CONFIG — Quản lý module.rules!
// ──────────────────────────────────────────────────────────────

class ModuleConfig extends ChainedMap {
  constructor(parent) {
    super(parent);
    this._rules = new ChainedMap(this);
  }

  // config.module.rule('babel') → trả Rule instance!
  rule(name) {
    if (!this._rules.has(name)) {
      this._rules.set(name, new Rule(this));
    }
    return this._rules.get(name);
  }

  get rules() {
    return this._rules;
  }

  toConfig() {
    const result = {};
    const ruleConfigs = [];
    this._rules.store.forEach((rule) => {
      const ruleConfig = rule.toConfig();
      if (Object.keys(ruleConfig).length > 0) {
        ruleConfigs.push(ruleConfig);
      }
    });
    if (ruleConfigs.length > 0) result.rules = ruleConfigs;
    return result;
  }
}

// ══════════════════════════════════════════════════════════════
// 9. DEMO — Sử dụng WebpackChainSimulator!
// ══════════════════════════════════════════════════════════════

function demoWebpackChain() {
  console.log("=== WEBPACK-CHAIN SIMULATOR DEMO ===\n");

  // Tạo config mới! (giống new Config() trong thật!)
  const config = new WebpackChainConfig();

  // ── 1. Mode + DevTool ──
  config.mode("production").devtool("source-map").target("web");

  // ── 2. Entry ──
  config.entry("main").add("./src/main.js").add("./src/polyfill.js");

  config.entry("vendor").add("./src/vendor.js");

  // ── 3. Output ──
  config.output
    .path("/dist")
    .filename("[name].[chunkhash].js")
    .chunkFilename("chunks/[name].[chunkhash].js")
    .libraryTarget("umd");

  // ── 4. Resolve ──
  config.resolve.alias.set("@", "/src").set("assets", "/src/assets");

  config.resolve.extensions.add(".js").add(".jsx").add(".ts").add(".tsx");

  // ── 5. Loader ──
  config.module
    .rule("babel")
    .test(/\.(js|jsx|ts|tsx)$/)
    .include.add("/src")
    .end()
    .exclude.add("/node_modules")
    .end()
    .use("babel-loader")
    .loader("babel-loader")
    .options({ presets: ["@babel/preset-env"] });

  config.module
    .rule("css")
    .test(/\.css$/)
    .use("style-loader")
    .loader("style-loader")
    .end()
    .use("css-loader")
    .loader("css-loader")
    .options({ modules: true });

  // ── 6. Sửa loader (tap!) ──
  config.module
    .rule("babel")
    .use("babel-loader")
    .tap((options) => ({
      ...options,
      plugins: ["@babel/plugin-transform-runtime"],
    }));

  // ── 7. DevServer ──
  config.devServer.hot(true).port(8080).open(true);

  // ── 8. When (điều kiện!) ──
  const isProd = true;
  config.when(
    isProd,
    (c) => c.optimization.minimize(true),
    (c) => c.devtool("cheap-module-source-map"),
  );

  // ── 9. Xuất config! ──
  const webpackConfig = config.toConfig();
  console.log("Webpack Config:");
  console.log(config.toString());

  // ── 10. Kiểm tra! ──
  console.log("\n=== KIỂM TRA ===");
  console.log("Mode:", webpackConfig.mode);
  console.log("Entry main:", webpackConfig.entry.main);
  console.log("Alias @:", webpackConfig.resolve.alias["@"]);
  console.log("Babel loader:", webpackConfig.module.rules[0].use[0].loader);
  console.log("DevServer port:", webpackConfig.devServer.port);
  console.log("Minimize:", webpackConfig.optimization.minimize);

  return webpackConfig;
}

// Chạy demo!
demoWebpackChain();
```

```
  SƠ ĐỒ QUAN HỆ CÁC CLASS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WebpackChainConfig (extends ChainedMap)                      │
  │    │                                                         │
  │    ├── _entries (ChainedMap)                                  │
  │    │     └── each entry → ChainedSet                        │
  │    │                                                         │
  │    ├── _output (ChainedMap) + shorthand methods              │
  │    │                                                         │
  │    ├── _resolve (ResolveConfig extends ChainedMap)            │
  │    │     ├── _alias (ChainedMap)                              │
  │    │     ├── _extensions (ChainedSet)                         │
  │    │     └── _modules (ChainedSet)                            │
  │    │                                                         │
  │    ├── _module (ModuleConfig extends ChainedMap)              │
  │    │     └── _rules (ChainedMap)                              │
  │    │           └── each rule → Rule (extends ChainedMap)     │
  │    │                 ├── _include (ChainedSet)                │
  │    │                 ├── _exclude (ChainedSet)                │
  │    │                 └── uses (ChainedMap)                    │
  │    │                       └── each use → Use (extends Map)  │
  │    │                                                         │
  │    ├── _plugins (ChainedMap)                                  │
  │    │     └── each plugin → Plugin (extends ChainedMap)       │
  │    │           ├── _pluginConstructor                         │
  │    │           └── _pluginArgs []                              │
  │    │                                                         │
  │    ├── _devServer (ChainedMap) + shorthand methods            │
  │    │                                                         │
  │    └── _optimization (ChainedMap) + shorthand methods         │
  │                                                              │
  │  METHODS:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ChainedMap: set, get, has, delete, clear, values,    │    │
  │  │             entries, merge, batch, when, end          │    │
  │  │                                                      │    │
  │  │ ChainedSet: add, prepend, has, delete, clear,        │    │
  │  │             values, merge, batch, when, end           │    │
  │  │                                                      │    │
  │  │ Use:  loader(), options(), tap()                      │    │
  │  │ Rule: test(), include, exclude, use()                 │    │
  │  │ Plugin: use(), tap()                                  │    │
  │  │ Config: entry(), output, resolve, module, plugin(),   │    │
  │  │         devServer, optimization, toConfig(), toString()│   │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §13. Câu Hỏi Luyện Tập!

```
  CÂU HỎI PHỎNG VẤN WEBPACK-CHAIN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ CÂU 1: Webpack-chain là gì? Tại sao cần nó?              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Thư viện tạo/sửa webpack config bằng chain API! │    │
  │  │ → Giải quyết vấn đề: chia sẻ config giữa projects!│    │
  │  │ → Webpack config = Object JS KHỔNG LỒ, khó quản lý!│   │
  │  │ → Webpack-chain = Name-based (key), dễ tìm/sửa/xóa!│   │
  │  │ → Được vue-cli3 sử dụng!                           │    │
  │  │ → KHÔNG thay đổi webpack, chỉ thay CÁCH VIẾT config!│   │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 2: ChainedMap vs ChainedSet khác nhau thế nào?        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → ChainedMap = KEY → VALUE, giống JS Map!          │    │
  │  │   Dùng cho: alias, output, resolve, devServer...     │    │
  │  │   Methods: set(k,v), get(k), delete(k), entries()    │    │
  │  │                                                      │    │
  │  │ → ChainedSet = DANH SÁCH VALUES, giống JS Set!     │    │
  │  │   Dùng cho: entry, extensions, include, exclude...   │    │
  │  │   Methods: add(v), prepend(v), delete(v), values()   │    │
  │  │                                                      │    │
  │  │ → Cả 2 đều hỗ trợ: clear, merge, batch, when, end!│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 3: .end() dùng để làm gì?                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → .end() QUAY VỀ parent instance!                  │    │
  │  │ → Mỗi ChainedMap/Set có reference tới parent!      │    │
  │  │ → Ví dụ:                                            │    │
  │  │   config.resolve.alias          // → ở trong alias  │    │
  │  │     .set('@', '/src')                                │    │
  │  │     .end()                      // → quay về resolve│    │
  │  │     .extensions                 // → nhảy vào ext   │    │
  │  │     .add('.js')                                      │    │
  │  │     .end()                      // → quay về resolve│    │
  │  │     .end()                      // → quay về config!│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 4: Loader .tap() vs Plugin .tap() khác gì?            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Loader .tap():                                    │    │
  │  │   callback nhận OPTIONS object!                      │    │
  │  │   return OPTIONS object!                              │    │
  │  │   rule('x').use('y').tap(options => ({ ...opts }))    │    │
  │  │                                                      │    │
  │  │ → Plugin .tap():                                    │    │
  │  │   callback nhận ARGS array!                          │    │
  │  │   return ARGS array!                                  │    │
  │  │   plugin('x').tap(args => [{ ...args[0] }])          │    │
  │  │                                                      │    │
  │  │ → Khác biệt vì:                                    │    │
  │  │   Loader chỉ có 1 options object!                    │    │
  │  │   Plugin constructor nhận NHIỀU arguments! ★         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 5: toConfig() vs toString() khác gì?                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → toConfig():                                       │    │
  │  │   Chuyển thành webpack config OBJECT thật!           │    │
  │  │   Dùng cho: module.exports!                          │    │
  │  │   Webpack DÙNG object này để chạy!                  │    │
  │  │                                                      │    │
  │  │ → toString():                                       │    │
  │  │   Chuyển thành STRING để ĐỌC!                      │    │
  │  │   Có comments cho biết tên rule/plugin!              │    │
  │  │   Dùng cho: DEBUG, LOGGING!                          │    │
  │  │   vue inspect dùng toString()!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 6: Webpack-chain xử lý merge như thế nào?             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → config.merge(obj) gộp object vào config!         │    │
  │  │ → ⚠️ KHÔNG phải webpack config object!              │    │
  │  │ → Là webpack-chain config format!                   │    │
  │  │ → Nếu value trong store là ChainedMap → merge sâu! │    │
  │  │ → Nếu value là ChainedSet → concat array!          │    │
  │  │ → Nếu value là primitive → override!                │    │
  │  │ → Hỗ trợ omit parameter để bỏ qua keys!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 7: Trong Vue CLI 3, chainWebpack vs configureWebpack? │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → chainWebpack:                                     │    │
  │  │   Nhận webpack-chain config instance!                │    │
  │  │   Có thể THÊM, SỬA, XÓA config!                   │    │
  │  │   LINH HOẠT hơn! ★                                 │    │
  │  │                                                      │    │
  │  │ → configureWebpack:                                 │    │
  │  │   Nhận/trả webpack config OBJECT thường!             │    │
  │  │   Chỉ MERGE thêm, KHÔNG thể xóa!                  │    │
  │  │   ĐƠN GIẢN hơn!                                    │    │
  │  │                                                      │    │
  │  │ → Khi cần SỬA/XÓA → dùng chainWebpack!            │    │
  │  │ → Khi chỉ THÊM → dùng configureWebpack!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 8: Viết code thêm babel-loader bằng webpack-chain?    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ config.module                                         │    │
  │  │   .rule('babel')                  // đặt TÊN!       │    │
  │  │   .test(/\.(js|jsx|ts|tsx)$/)     // regex match!    │    │
  │  │   .include                                            │    │
  │  │     .add(path.resolve(__dirname, 'src'))              │    │
  │  │     .end()                        // quay về rule!   │    │
  │  │   .use('babel-loader')            // đặt TÊN use!   │    │
  │  │     .loader('babel-loader')       // tên npm package!│    │
  │  │     .options({                    // options object!  │    │
  │  │       presets: ['@babel/preset-env']                  │    │
  │  │     });                                               │    │
  │  │                                                      │    │
  │  │ ★ Key points:                                        │    │
  │  │   .rule(NAME) = tên rule để sau tìm lại!           │    │
  │  │   .use(NAME) = tên use để sau tap/delete!           │    │
  │  │   .end() = quay về parent level!                    │    │
  │  │   .include/.exclude = ChainedSet, dùng .add()!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 9: Viết code cấu hình điều kiện dev/prod?             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ config.when(                                          │    │
  │  │   process.env.NODE_ENV === 'production',              │    │
  │  │   // TRUE → production!                              │    │
  │  │   config => {                                         │    │
  │  │     config.plugin('compress')                         │    │
  │  │       .use(CompressionPlugin);                        │    │
  │  │     config.optimization.minimize(true);               │    │
  │  │     config.devtool('hidden-source-map');              │    │
  │  │   },                                                  │    │
  │  │   // FALSE → development!                            │    │
  │  │   config => {                                         │    │
  │  │     config.devtool('cheap-module-source-map');        │    │
  │  │     config.devServer.hot(true)                        │    │
  │  │       .port(3000);                                    │    │
  │  │   }                                                   │    │
  │  │ );                                                    │    │
  │  │                                                      │    │
  │  │ ★ when() = ternary cho webpack config!               │    │
  │  │ ★ Cả 2 branch nhận config instance!                 │    │
  │  │ ★ KHÔNG cần if/else bên ngoài!                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 10: Shorthand method là gì? Cho ví dụ?                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Cách VIẾT TẮT thay vì dùng .set()!              │    │
  │  │                                                      │    │
  │  │ VÍ DỤ:                                               │    │
  │  │ config.devServer.hot(true)                            │    │
  │  │   = config.devServer.set('hot', true)                 │    │
  │  │                                                      │    │
  │  │ config.devtool('source-map')                          │    │
  │  │   = config.set('devtool', 'source-map')               │    │
  │  │                                                      │    │
  │  │ config.output.filename('[name].js')                   │    │
  │  │   = config.output.set('filename', '[name].js')        │    │
  │  │                                                      │    │
  │  │ → Shorthand trả về THIS → chain tiếp được!        │    │
  │  │ → Dễ đọc hơn, ít code hơn!                        │    │
  │  │ → GIỐNG NHAU về kết quả!                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
