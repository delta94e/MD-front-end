# pnpm Source Code Architecture — Deep Dive!

> **Chủ đề**: pnpm Source Code — Kiến Trúc & Quy Trình Thực Thi!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: "Interviewer: pnpm is so popular, do you know its source code architecture?" — Juejin

---

## Mục Lục

1. [§1. Tổng Quan — Tại Sao pnpm?](#1)
2. [§2. Quy Trình Tổng Thể — main.ts!](#2)
3. [§3. Custom Script — pnpm run dev!](#3)
4. [§4. pnpm Update — Tự Cập Nhật!](#4)
5. [§5. Filter — Lọc Project Trong Workspace!](#5)
6. [§6. pnpmCmds — Hệ Thống Lệnh!](#6)
7. [§7. Phân Loại Commands!](#7)
8. [§8. Command Definition — Cấu Trúc Lệnh!](#8)
9. [§9. installDeps — Logic Cài Đặt!](#9)
10. [§10. mutateModules — Core Execution!](#10)
11. [§11. Sơ Đồ Tổng Hợp!](#11)
12. [§12. Tự Viết — PnpmSimulator!](#12)
13. [§13. Câu Hỏi Luyện Tập!](#13)

---

## §1. Tổng Quan — Tại Sao pnpm?

```
  TẠI SAO pnpm:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  pnpm = Performant npm!                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Công cụ quản lý package XUẤT SẮC!               │    │
  │  │ → Thay đổi TRIỆT ĐỂ tầng底层 so với npm/yarn!   │    │
  │  │ → Nhanh hơn + Tiết kiệm dung lượng hơn! ★        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ƯU ĐIỂM SO VỚI npm/yarn:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ Soft Link + Hard Link!                            │    │
  │  │   → KHÔNG copy packages → chỉ TẠO LINK!          │    │
  │  │   → 10 projects dùng lodash = 1 bản duy nhất!     │    │
  │  │   → Tiết kiệm HÀNG GB dung lượng! ★               │    │
  │  │                                                      │    │
  │  │ ★ Xử lý dependency SONG SONG!                      │    │
  │  │   → npm: tuần tự → CHẬM!                          │    │
  │  │   → pnpm: song song → NHANH! ★                    │    │
  │  │                                                      │    │
  │  │ ★ Giải quyết Ghost Dependencies!                    │    │
  │  │   → npm hoisting: package A dùng được package B    │    │
  │  │     dù KHÔNG khai báo dependency! ← BUG ẨN!      │    │
  │  │   → pnpm: strict isolation! Chỉ dùng được         │    │
  │  │     packages ĐÃ KHAI BÁO! ✅                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO SÁNH:                                                      │
  │  ┌──────────────┬──────────┬──────────┬──────────┐           │
  │  │              │ npm      │ yarn     │ pnpm ★  │           │
  │  ├──────────────┼──────────┼──────────┼──────────┤           │
  │  │ Tốc độ      │ Chậm    │ Nhanh   │ Nhanh ★ │           │
  │  │ Dung lượng  │ Lớn     │ Lớn     │ Nhỏ ★   │           │
  │  │ Ghost deps  │ CÓ ❌   │ CÓ ❌   │ KHÔNG ✅│           │
  │  │ Monorepo    │ Kém     │ Tốt     │ Tốt ★   │           │
  │  │ Link        │ Copy    │ Copy    │ Symlink★ │           │
  │  └──────────────┴──────────┴──────────┴──────────┘           │
  │                                                              │
  │  .pnpm-store:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → NƠI LƯU TRỮ tất cả packages!                   │    │
  │  │ → Content-addressable storage!                      │    │
  │  │ → Mỗi file CHỈ LƯU 1 LẦN trên toàn hệ thống!  │    │
  │  │                                                      │    │
  │  │ node_modules/                                        │    │
  │  │ └─ .pnpm/                                            │    │
  │  │    ├─ lodash@4.17.21/                                │    │
  │  │    │  └─ node_modules/                               │    │
  │  │    │     └─ lodash/ → HARD LINK → .pnpm-store!    │    │
  │  │    └─ react@18.2.0/                                  │    │
  │  │       └─ node_modules/                               │    │
  │  │          └─ react/ → HARD LINK → .pnpm-store!     │    │
  │  │                                                      │    │
  │  │ node_modules/                                        │    │
  │  │ ├─ lodash → SYMLINK → .pnpm/lodash@4.17.21/      │    │
  │  │ └─ react  → SYMLINK → .pnpm/react@18.2.0/        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Quy Trình Tổng Thể — main.ts!

```
  pnpm EXECUTION FLOW:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  QUÁ TRÌNH THỰC THI TỔNG THỂ:                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ┌─────────────────┐                                 │    │
  │  │  │ User gõ command │                                 │    │
  │  │  │ pnpm install    │                                 │    │
  │  │  └───────┬─────────┘                                 │    │
  │  │          ↓                                            │    │
  │  │  ┌─────────────────┐                                 │    │
  │  │  │ parseCliArgs()  │ ← Parse CLI arguments!        │    │
  │  │  │ cmd, options..  │                                 │    │
  │  │  └───────┬─────────┘                                 │    │
  │  │          ↓                                            │    │
  │  │  ┌─────────────────┐                                 │    │
  │  │  │ getConfig()     │ ← Lấy cấu hình!              │    │
  │  │  │ .npmrc, args..  │                                 │    │
  │  │  └───────┬─────────┘                                 │    │
  │  │          ↓                                            │    │
  │  │  ┌─────────────────┐                                 │    │
  │  │  │ Custom Script?  │ ← npm_command xử lý!         │    │
  │  │  │ run → run-script│                                 │    │
  │  │  └───────┬─────────┘                                 │    │
  │  │          ↓                                            │    │
  │  │  ┌─────────────────┐                                 │    │
  │  │  │ Self Update?    │ ← pnpm update pnpm!          │    │
  │  │  │ Check updates?  │                                 │    │
  │  │  └───────┬─────────┘                                 │    │
  │  │          ↓                                            │    │
  │  │  ┌─────────────────┐                                 │    │
  │  │  │ Filter?         │ ← --filter "{.}"!            │    │
  │  │  │ Workspace scope │                                 │    │
  │  │  └───────┬─────────┘                                 │    │
  │  │          ↓                                            │    │
  │  │  ┌─────────────────┐                                 │    │
  │  │  │ pnpmCmds[cmd]() │ ← THỰC THI lệnh! ★         │    │
  │  │  └───────┬─────────┘                                 │    │
  │  │          ↓                                            │    │
  │  │  ┌─────────────────┐                                 │    │
  │  │  │ Output result   │ ← Kết quả!                   │    │
  │  │  │ Set exit code   │                                 │    │
  │  │  └─────────────────┘                                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SOURCE CODE — main.ts:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ async function main(inputArgv: string[]) {           │    │
  │  │   // ① Parse CLI arguments                          │    │
  │  │   let parsedCliArgs = await parseCliArgs(inputArgv); │    │
  │  │   const { cmd, unknownOptions, workspaceDir }        │    │
  │  │     = parsedCliArgs;                                 │    │
  │  │                                                      │    │
  │  │   // ② Lấy cấu hình                                │    │
  │  │   config = await getConfig(cliOptions, {             │    │
  │  │     excludeReporter: false,                          │    │
  │  │     globalDirShouldAllowWrite,                       │    │
  │  │   });                                                │    │
  │  │                                                      │    │
  │  │   // ③ Custom script check                          │    │
  │  │   if (cmd) {                                         │    │
  │  │     config.extraEnv = {                              │    │
  │  │       npm_command: cmd === 'run'                     │    │
  │  │         ? 'run-script' : cmd,                        │    │
  │  │     };                                               │    │
  │  │   }                                                  │    │
  │  │                                                      │    │
  │  │   // ④ pnpm update check                            │    │
  │  │   // ⑤ Filter operations                            │    │
  │  │                                                      │    │
  │  │   // ⑥ THỰC THI LỆNH! ★                           │    │
  │  │   let { output, exitCode } = await (async () => {   │    │
  │  │     let result = pnpmCmds[cmd ?? 'help'](           │    │
  │  │       config, cliParams                              │    │
  │  │     );                                               │    │
  │  │     if (result instanceof Promise)                   │    │
  │  │       result = await result;                         │    │
  │  │     return result;                                   │    │
  │  │   })();                                              │    │
  │  │                                                      │    │
  │  │   // ⑦ Output kết quả                              │    │
  │  │   if (output) console.log(output);                   │    │
  │  │   if (exitCode) process.exitCode = exitCode;        │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  → main.ts = ENTRY POINT của pnpm!                          │
  │  → Từ nhận lệnh → xử lý config → update check            │
  │  → filter → thực thi → output! ★                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Custom Script — pnpm run dev!

```
  CUSTOM SCRIPT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  KHI USER GÕ: pnpm run dev                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → pnpm phát hiện "dev" là special command!         │    │
  │  │ → Tìm trong package.json → scripts → "dev"!       │    │
  │  │ → Thực thi command tương ứng!                      │    │
  │  │                                                      │    │
  │  │ // Source code:                                      │    │
  │  │ if (cmd) {                                           │    │
  │  │   config.extraEnv = {                                │    │
  │  │     ...config.extraEnv,                              │    │
  │  │     // "run" → "run-script"                         │    │
  │  │     // Các cmd khác → giữ nguyên tên!              │    │
  │  │     npm_command: cmd === 'run'                       │    │
  │  │       ? 'run-script' : cmd,                          │    │
  │  │   };                                                 │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ TRÙNG TÊN VỚI LỆNH MẶC ĐỊNH?                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Ví dụ: Đăng ký script "add" trong package.json:    │    │
  │  │                                                      │    │
  │  │ {                                                    │    │
  │  │   "scripts": {                                       │    │
  │  │     "add": "echo '11111'"                            │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → pnpm run add → chạy script "add" ✅            │    │
  │  │   Output: "11111"                                    │    │
  │  │                                                      │    │
  │  │ → pnpm add → chạy LỆNH MẶC ĐỊNH "add" ❌        │    │
  │  │   ERR_PNPM_MISSING_PACKAGE_NAME!                    │    │
  │  │                                                      │    │
  │  │ KẾT LUẬN:                                            │    │
  │  │ ① Nếu script KHÔNG trùng lệnh mặc định:          │    │
  │  │   → pnpm <command> = chạy script đó!              │    │
  │  │                                                      │    │
  │  │ ② Nếu script TRÙNG tên lệnh mặc định:            │    │
  │  │   → pnpm <command> = chạy LỆNH MẶC ĐỊNH!         │    │
  │  │   → pnpm run <command> = chạy SCRIPT!             │    │
  │  │   → Lệnh mặc định ƯU TIÊN hơn! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. pnpm Update — Tự Cập Nhật!

```
  pnpm UPDATE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① SELF-UPDATE (Tự cập nhật!):                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Khi nào trigger?                                     │    │
  │  │ → config.global = true (cài global!)               │    │
  │  │ → cmd === 'add' HOẶC 'update'                      │    │
  │  │ → cliParams CHỨA "pnpm"                            │    │
  │  │                                                      │    │
  │  │ Ví dụ: pnpm add pnpm -g                             │    │
  │  │                                                      │    │
  │  │ // Source code:                                      │    │
  │  │ const selfUpdate =                                   │    │
  │  │   config.global &&                                   │    │
  │  │   (cmd === 'add' || cmd === 'update') &&            │    │
  │  │   cliParams.includes(packageManager.name);           │    │
  │  │                                                      │    │
  │  │ if (selfUpdate) {                                    │    │
  │  │   // DỪNG server pnpm đang chạy!                   │    │
  │  │   await pnpmCmds.server(config, ['stop']);           │    │
  │  │   // Kiểm tra đường dẫn cài đặt!                 │    │
  │  │   const currentPnpmDir =                             │    │
  │  │     path.dirname(which.sync('pnpm'));                │    │
  │  │   // Cảnh báo nếu đường dẫn KHÁC NHAU!           │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → DỪNG server trước! Tránh conflict!               │    │
  │  │ → Kiểm tra path cài đặt mới vs hiện tại!        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② CHECK FOR UPDATES (Kiểm tra cập nhật!):                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Điều kiện trigger:                                   │    │
  │  │ → updateNotifier !== false                          │    │
  │  │ → KHÔNG phải CI environment!                        │    │
  │  │ → KHÔNG phải selfUpdate (tránh conflict!)          │    │
  │  │ → KHÔNG offline!                                    │    │
  │  │ → cmd === 'install' HOẶC 'add'                     │    │
  │  │                                                      │    │
  │  │ checkForUpdates() flow:                               │    │
  │  │ ┌──────────────────────────────────────────┐        │    │
  │  │ │ ① Load state file (pnpm-state.json)     │        │    │
  │  │ │ ② Đã check trong 1 DAY? → SKIP!        │        │    │
  │  │ │ ③ Resolve latest version từ registry!   │        │    │
  │  │ │ ④ So sánh current vs latest!             │        │    │
  │  │ │ ⑤ Log thông báo nếu có version mới!    │        │    │
  │  │ │ ⑥ Update state file timestamp!           │        │    │
  │  │ └──────────────────────────────────────────┘        │    │
  │  │                                                      │    │
  │  │ ⚠️ CHỈ kiểm tra + thông báo!                      │    │
  │  │ → KHÔNG tự động update!                             │    │
  │  │ → Tần suất: 1 lần / ngày!                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Filter — Lọc Project Trong Workspace!

```
  FILTER OPERATIONS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WORKSPACE LÀ GÌ?                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Container chứa NHIỀU packages!                   │    │
  │  │ → Share dependencies, configs, tasks!               │    │
  │  │ → Quản lý qua pnpm-workspace.yaml!                 │    │
  │  │                                                      │    │
  │  │ monorepo/                                             │    │
  │  │ ├─ pnpm-workspace.yaml                               │    │
  │  │ ├─ packages/                                          │    │
  │  │ │  ├─ app/          ← Package A!                   │    │
  │  │ │  ├─ lib/          ← Package B!                   │    │
  │  │ │  └─ shared/       ← Package C!                   │    │
  │  │ └─ package.json     ← Root!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FILTER SYNTAX:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ pnpm --filter "{.}" add eslint -D                    │    │
  │  │ → Chỉ add vào project HIỆN TẠI!                   │    │
  │  │                                                      │    │
  │  │ pnpm --filter "app" build                            │    │
  │  │ → Chỉ build package "app"!                         │    │
  │  │                                                      │    │
  │  │ pnpm --filter "app..." build                         │    │
  │  │ → Build "app" + TẤT CẢ dependencies!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SOURCE CODE LOGIC:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Auto-set recursive cho workspace commands:        │    │
  │  │   install/import/dedupe/patch → recursive = true!   │    │
  │  │   Default filter: ['{.}...']                         │    │
  │  │   = current project + TẤT CẢ dependencies!         │    │
  │  │                                                      │    │
  │  │ ② Build filter array:                                │    │
  │  │   config.filter → followProdDepsOnly: false         │    │
  │  │   config.filterProd → followProdDepsOnly: true      │    │
  │  │                                                      │    │
  │  │ ③ Workspace root handling:                           │    │
  │  │   workspaceRoot=true → INCLUDE root!                │    │
  │  │   run/exec/add/test → EXCLUDE root (default)!      │    │
  │  │                                                      │    │
  │  │ ④ Filter packages:                                   │    │
  │  │   filterPackagesFromDir(wsDir, filters, {...})       │    │
  │  │   → allProjectsGraph                                │    │
  │  │   → selectedProjectsGraph                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. pnpmCmds — Hệ Thống Lệnh!

```
  pnpmCmds:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  pnpmCmds = OBJECT chứa tất cả handler functions!           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ // Định nghĩa interface:                             │    │
  │  │ interface CommandDefinition {                         │    │
  │  │   handler: Command;       // Logic xử lý chính!    │    │
  │  │   help: () => string;     // Text hướng dẫn!       │    │
  │  │   commandNames: string[]; // Tên lệnh trigger!     │    │
  │  │   completion?: CompFunc;  // Auto-complete Tab!      │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ // Tất cả commands:                                  │    │
  │  │ const commands: CommandDefinition[] = [               │    │
  │  │   add, audit, bin, ci, config, dedupe,               │    │
  │  │   create, deploy, dlx, doctor, env, exec,            │    │
  │  │   fetch, importCommand, init, install,               │    │
  │  │   link, list, licenses, outdated, pack,              │    │
  │  │   patch, patchCommit, prune, publish,                │    │
  │  │   rebuild, recursive, remove, restart,               │    │
  │  │   root, run, server, setup, store,                   │    │
  │  │   test, unlink, update, why,                         │    │
  │  │ ];                                                   │    │
  │  │                                                      │    │
  │  │ // Đăng ký handler theo tên:                         │    │
  │  │ const handlerByCommandName = {};                     │    │
  │  │ for (const cmdDef of commands) {                     │    │
  │  │   for (const name of cmdDef.commandNames) {          │    │
  │  │     handlerByCommandName[name] = cmdDef.handler;     │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ // Thêm help + completion                            │    │
  │  │ handlerByCommandName.help = createHelp(xxx);         │    │
  │  │ handlerByCommandName.completion = createCompl(xxx);  │    │
  │  │                                                      │    │
  │  │ // Export!                                            │    │
  │  │ export const pnpmCmds = handlerByCommandName;        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GỌI TRONG main.ts:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ let result = pnpmCmds[cmd ?? 'help'](               │    │
  │  │   config, cliParams                                  │    │
  │  │ );                                                   │    │
  │  │                                                      │    │
  │  │ → cmd = 'install' → gọi install handler!           │    │
  │  │ → cmd = 'add'     → gọi add handler!               │    │
  │  │ → cmd = null      → gọi help handler!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Phân Loại Commands!

```
  COMMAND CATEGORIES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① PACKAGE INSTALL & MANAGEMENT:                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ add      → Thêm dependency mới! ★                  │    │
  │  │ install  → (alias: i) Cài tất cả deps! ★          │    │
  │  │ ci       → Giống npm ci! (CI environment!)          │    │
  │  │ update   → (alias: up) Cập nhật deps!              │    │
  │  │ remove   → (alias: rm, uninstall) Xóa dep!         │    │
  │  │ unlink   → Gỡ link package!                        │    │
  │  │ link     → Link package local!                      │    │
  │  │ prune    → Xóa packages không dùng!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② WORKSPACE & MULTI-PACKAGE:                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ recursive → Chạy recursive trong workspace!        │    │
  │  │ exec      → Chạy lệnh bất kỳ trong mỗi package! │    │
  │  │ run       → Chạy scripts từ package.json!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ PACKAGE INFO & ANALYSIS:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ list     → (alias: ls) Liệt kê packages!           │    │
  │  │ outdated → Kiểm tra packages cũ!                   │    │
  │  │ why      → Giải thích tại sao cài package!        │    │
  │  │ licenses → Liệt kê license!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ CONFIG & ENVIRONMENT:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ config → Quản lý cấu hình pnpm!                   │    │
  │  │ get    → Lấy giá trị config!                       │    │
  │  │ set    → Đặt giá trị config!                       │    │
  │  │ env    → Quản lý biến môi trường!                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑤ PUBLISH & VERSION:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ publish → Publish lên registry!                     │    │
  │  │ pack    → Đóng gói tarball!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑥ SPECIAL PURPOSE:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ audit   → Kiểm tra bảo mật deps!                  │    │
  │  │ doctor  → Check sức khỏe config + deps!            │    │
  │  │ fetch   → Pre-download deps (không cài!)           │    │
  │  │ import  → Import từ npm/yarn lockfile!              │    │
  │  │ init    → Tạo package.json mới!                    │    │
  │  │ rebuild → Rebuild dependencies!                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑦ DEV TOOLS:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ create → Quick-start project mới!                   │    │
  │  │ dlx    → Chạy tạm không cần global install!       │    │
  │  │ patch  → Tạo + apply patches!                      │    │
  │  │ store  → Quản lý .pnpm-store! ★                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Command Definition — Cấu Trúc Lệnh!

```
  COMMAND DEFINITION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  INTERFACE:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ interface CommandDefinition {                         │    │
  │  │   handler: Command;                                  │    │
  │  │   help: () => string;                                │    │
  │  │   commandNames: string[];                            │    │
  │  │   cliOptionsTypes: () => Record<string, unknown>;   │    │
  │  │   rcOptionsTypes: () => Record<string, unknown>;    │    │
  │  │   completion?: CompletionFunc;                       │    │
  │  │   shorthands?: Record<string, string | string[]>;   │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CHI TIẾT TỪNG THUỘC TÍNH:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① handler: Command                                  │    │
  │  │   → Hàm xử lý CHÍNH khi lệnh được gọi! ★         │    │
  │  │   → Chứa TOÀN BỘ logic thực thi!                  │    │
  │  │                                                      │    │
  │  │ ② help: () => string                                │    │
  │  │   → Trả text hướng dẫn sử dụng!                   │    │
  │  │   → Gọi khi: pnpm help <command>                   │    │
  │  │                                                      │    │
  │  │ ③ commandNames: string[]                             │    │
  │  │   → Mảng TÊN lệnh + aliases!                      │    │
  │  │   → Tên đầu tiên = tên CHÍNH!                     │    │
  │  │   → VD: ['install', 'i'] → cả 2 đều gọi install!│    │
  │  │                                                      │    │
  │  │ ④ cliOptionsTypes: () => Record<string, unknown>    │    │
  │  │   → Kiểu DỮ LIỆU cho CLI options!                │    │
  │  │   → Validate input từ command line!                 │    │
  │  │   → VD:                                              │    │
  │  │     {                                                │    │
  │  │       'save-dev': Boolean,     // --save-dev        │    │
  │  │       'fetch-retries': Number, // --fetch-retries 3 │    │
  │  │       'custom-opt': String,    // --custom-opt "x"  │    │
  │  │     }                                                │    │
  │  │                                                      │    │
  │  │ ⑤ rcOptionsTypes: () => Record<string, unknown>     │    │
  │  │   → Tương tự cliOptionsTypes!                      │    │
  │  │   → NHƯNG cho .npmrc / .pnpmrc config files!       │    │
  │  │   → Ảnh hưởng TẤT CẢ commands!                   │    │
  │  │                                                      │    │
  │  │   ⚠️ KHÁC BIỆT:                                    │    │
  │  │   cliOptionsTypes → 1 session duy nhất!            │    │
  │  │   rcOptionsTypes  → MÔI TRƯỜNG toàn cục!         │    │
  │  │                                                      │    │
  │  │ ⑥ completion?: CompletionFunc                        │    │
  │  │   → Lắng nghe phím TAB!                            │    │
  │  │   → Auto-complete khi user gõ command!              │    │
  │  │                                                      │    │
  │  │ ⑦ shorthands?: Record<string, string | string[]>    │    │
  │  │   → Viết tắt cho options!                           │    │
  │  │   → VD: -D = --save-dev!                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  → Xem help → hiểu CÁCH DÙNG!                              │
  │  → Xem handler → hiểu LOGIC THỰC THI! ★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. installDeps — Logic Cài Đặt!

```
  installDeps FLOW:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  add/install/update CHIA SẺ LOGIC CHUNG = installDeps!       │
  │                                                              │
  │  SƠ ĐỒ QUYẾT ĐỊNH 4 PHẦN:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌─────────┐                                        │    │
  │  │  │ Bắt đầu │                                       │    │
  │  │  └────┬────┘                                        │    │
  │  │       ↓                                              │    │
  │  │  ◇ Workspace +  ──CÓ──→ ┌──────────────┐          │    │
  │  │  ◇ Internal deps?       │ PHẦN 1:      │          │    │
  │  │       │                  │ recursive()  │          │    │
  │  │       │ KHÔNG            │ add/update/  │          │    │
  │  │       ↓                  │ install      │          │    │
  │  │  ┌────────────────┐     └──────────────┘          │    │
  │  │  │ Set current dir│                                 │    │
  │  │  │ as working dir │                                 │    │
  │  │  └───────┬────────┘                                 │    │
  │  │          ↓                                           │    │
  │  │  ┌────────────────┐                                 │    │
  │  │  │ Read/init      │                                 │    │
  │  │  │ package.json   │                                 │    │
  │  │  └───────┬────────┘                                 │    │
  │  │          ↓                                           │    │
  │  │  ┌────────────────┐                                 │    │
  │  │  │ Connect to     │                                 │    │
  │  │  │ .pnpm-store    │                                 │    │
  │  │  └───────┬────────┘                                 │    │
  │  │          ↓                                           │    │
  │  │  ◇ Có params   ──CÓ──→ ┌──────────────┐           │    │
  │  │  ◇ (deps chỉ định)?   │ PHẦN 2:      │           │    │
  │  │       │                 │ mutateModules│           │    │
  │  │       │ KHÔNG           │ InSingleProj │           │    │
  │  │       ↓                 │ add/update   │           │    │
  │  │  ┌──────────────┐      └──────────────┘           │    │
  │  │  │ PHẦN 3:      │                                  │    │
  │  │  │ install()    │                                  │    │
  │  │  │ default full │                                  │    │
  │  │  │ install!     │                                  │    │
  │  │  └──────┬───────┘                                  │    │
  │  │         ↓                                           │    │
  │  │  ◇ linkWorkspace ──CÓ──→ ┌──────────────┐        │    │
  │  │  ◇ Packages?             │ PHẦN 4:      │        │    │
  │  │       │ KHÔNG             │ recursive()  │        │    │
  │  │       ↓                   │ install only │        │    │
  │  │  ┌────────┐              └──────────────┘        │    │
  │  │  │  KẾT   │                                       │    │
  │  │  │  THÚC  │                                       │    │
  │  │  └────────┘                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHẦN 1: Workspace + Internal Dependencies                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Trong workspace + projects CÓ deps với nhau!     │    │
  │  │ → selectProjectByDir() → tìm project hiện tại!    │    │
  │  │ → Kiểm tra circular dependencies!                  │    │
  │  │ → recursive() → install/update/add ĐỆ QUY!       │    │
  │  │ → return NGAY! Không qua các phần sau!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHẦN 2: Có chỉ định dependency (params)                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → VD: pnpm install lodash@latest                    │    │
  │  │ → params = ['lodash@latest']                         │    │
  │  │ → mutateModulesInSingleProject()!                   │    │
  │  │ → Cập nhật CHỈ dependency chỉ định!                │    │
  │  │ → Update package.json → return!                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHẦN 3: Không có params → Full install!                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → VD: pnpm install (không tham số!)                │    │
  │  │ → install(manifest, installOpts)                     │    │
  │  │ → Cài TẤT CẢ deps trong package.json!             │    │
  │  │ → Nếu update → ghi lại package.json!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHẦN 4: linkWorkspacePackages + workspace                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Điều kiện:                                           │    │
  │  │ → linkWorkspacePackages = true/deep!                │    │
  │  │ → Có chỉ định workspaceDir!                        │    │
  │  │ → KHÔNG có internal deps (đã qua Phần 1!)         │    │
  │  │                                                      │    │
  │  │ linkWorkspacePackages config:                         │    │
  │  │ ┌──────────────────────────────────────┐             │    │
  │  │ │ true:  Symlink deps giữa packages! │             │    │
  │  │ │ deep:  Symlink CẢ deep deps!       │             │    │
  │  │ │ false: Tắt! Download từ registry!  │             │    │
  │  │ └──────────────────────────────────────┘             │    │
  │  │                                                      │    │
  │  │ → recursive() → CHỈ install!                       │    │
  │  │ → Cài từng sub-project!                            │    │
  │  │ → rebuildProjects() nếu cần!                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. mutateModules — Core Execution!

```
  mutateModules:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  = HÀM LÕI của pnpm install/add/update!                      │
  │  → recursive, mutateModulesInSingleProject, install         │
  │    đều gọi mutateModules bên trong! ★                       │
  │                                                              │
  │  FLOW:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ┌──────────────────┐                                │    │
  │  │  │ extendOptions()  │ ← Mở rộng + validate opts!  │    │
  │  │  └────────┬─────────┘                                │    │
  │  │           ↓                                          │    │
  │  │  ┌──────────────────┐                                │    │
  │  │  │ getContext()     │ ← Lấy context hiện tại!     │    │
  │  │  └────────┬─────────┘                                │    │
  │  │           ↓                                          │    │
  │  │  ┌──────────────────┐                                │    │
  │  │  │ preResolution    │ ← Hook trước khi resolve!   │    │
  │  │  │ hook (if any!)   │                                │    │
  │  │  └────────┬─────────┘                                │    │
  │  │           ↓                                          │    │
  │  │  ┌──────────────────┐                                │    │
  │  │  │ _install()       │ ← Logic cài đặt chính!     │    │
  │  │  └────────┬─────────┘                                │    │
  │  │           ↓                                          │    │
  │  │  ┌──────────────────┐                                │    │
  │  │  │ return results!  │                                │    │
  │  │  └──────────────────┘                                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  _install() — SWITCH theo mutation type:                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ for (const project of projects) {                    │    │
  │  │   switch (project.mutation) {                        │    │
  │  │                                                      │    │
  │  │     case 'uninstallSome':                            │    │
  │  │       → Xóa dependency CHỈ ĐỊNH!                  │    │
  │  │       → removeDeps() từ manifest!                  │    │
  │  │                                                      │    │
  │  │     case 'install':                                  │    │
  │  │       → installCase() — cài TẤT CẢ deps!         │    │
  │  │       → Full installation!                          │    │
  │  │                                                      │    │
  │  │     case 'installSome':                              │    │
  │  │       → installSome() — cài deps CHỈ ĐỊNH!       │    │
  │  │       → Thêm mới hoặc update cụ thể!              │    │
  │  │                                                      │    │
  │  │     case 'unlink':                                   │    │
  │  │       → Gỡ link TẤT CẢ external packages!        │    │
  │  │       → Kiểm tra nào là external link!             │    │
  │  │       → Xóa → thêm vào reinstall list!            │    │
  │  │                                                      │    │
  │  │     case 'unlinkSome':                               │    │
  │  │       → Gỡ link dependency CHỈ ĐỊNH!              │    │
  │  │       → Kiểm tra + xóa → reinstall!               │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  installInContext() — SAU khi switch:                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Xử lý uninstallSome → removeDeps()!             │    │
  │  │ ② resolveDependencies() → cây dependency! ★       │    │
  │  │ ③ linkPackages() → liên kết file vật lý!          │    │
  │  │ ④ finishLockfileUpdates() → cập nhật lockfile!    │    │
  │  │ ⑤ Link binary files + hooks!                       │    │
  │  │ ⑥ Update lockfile + modules manifest!               │    │
  │  │ ⑦ storeController.close() → đóng store!           │    │
  │  │ ⑧ reportPeerDependencyIssues() → cảnh báo!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ: pnpm add jest -w                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  pnpm add jest -w                                    │    │
  │  │       ↓                                              │    │
  │  │  main.ts → parseCliArgs()                           │    │
  │  │       ↓                                              │    │
  │  │  cmd = 'add', params = ['jest']                      │    │
  │  │       ↓                                              │    │
  │  │  pnpmCmds['add'](config, ['jest'])                   │    │
  │  │       ↓                                              │    │
  │  │  add.handler() → installDeps()                      │    │
  │  │       ↓                                              │    │
  │  │  Phần 2: có params! → mutateModulesInSingleProject  │    │
  │  │       ↓                                              │    │
  │  │  mutateModules() → mutation = 'installSome'         │    │
  │  │       ↓                                              │    │
  │  │  installSome() → resolveDependencies()              │    │
  │  │       ↓                                              │    │
  │  │  linkPackages() → finishLockfile()                   │    │
  │  │       ↓                                              │    │
  │  │  ✅ jest đã được cài đặt!                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. Sơ Đồ Tổng Hợp!

```
  TỔNG QUAN pnpm ARCHITECTURE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────────────────────────────┐        │
  │  │              pnpm CLI ENTRY                      │        │
  │  │          (pnpm/src/main.ts)                      │        │
  │  └──────────────────┬───────────────────────────────┘        │
  │                     ↓                                        │
  │  ┌──────────────────────────────────────────────────┐        │
  │  │  ① parseCliArgs(inputArgv)                      │        │
  │  │     → cmd, unknownOptions, workspaceDir         │        │
  │  └──────────────────┬───────────────────────────────┘        │
  │                     ↓                                        │
  │  ┌──────────────────────────────────────────────────┐        │
  │  │  ② getConfig(cliOptions, {...})                 │        │
  │  │     → .npmrc + CLI args + defaults!             │        │
  │  └──────────────────┬───────────────────────────────┘        │
  │                     ↓                                        │
  │  ┌──────────────────────────────────────────────────┐        │
  │  │  ③ npm_command check                            │        │
  │  │     → 'run' → 'run-script'                     │        │
  │  │     → Custom script vs built-in!                │        │
  │  └──────────────────┬───────────────────────────────┘        │
  │                     ↓                                        │
  │  ┌──────────────────────────────────────────────────┐        │
  │  │  ④ selfUpdate + checkForUpdates                 │        │
  │  │     → pnpm add pnpm -g?                         │        │
  │  │     → 1 day frequency check!                    │        │
  │  └──────────────────┬───────────────────────────────┘        │
  │                     ↓                                        │
  │  ┌──────────────────────────────────────────────────┐        │
  │  │  ⑤ Filter operations (workspace)               │        │
  │  │     → --filter "{.}"                            │        │
  │  │     → filterPackagesFromDir()                   │        │
  │  │     → allProjectsGraph, selectedProjectsGraph   │        │
  │  └──────────────────┬───────────────────────────────┘        │
  │                     ↓                                        │
  │  ┌──────────────────────────────────────────────────┐        │
  │  │  ⑥ pnpmCmds[cmd](config, cliParams)            │        │
  │  │     → handlerByCommandName[cmd]()!              │        │
  │  └──────────────────┬───────────────────────────────┘        │
  │                     ↓                                        │
  │  ┌──────────────────────────────────────────────────┐        │
  │  │  COMMAND HANDLERS:                              │        │
  │  │  ┌────────────────────────────────────┐         │        │
  │  │  │ add.handler()                      │         │        │
  │  │  │ install.handler()  → installDeps() │         │        │
  │  │  │ update.handler()                   │         │        │
  │  │  └───────────────┬────────────────────┘         │        │
  │  │                  ↓                               │        │
  │  │  ┌────────────────────────────────────┐         │        │
  │  │  │ installDeps() — 4 PHẦN:          │         │        │
  │  │  │ ┌────────────────────────────────┐│         │        │
  │  │  │ │ P1: workspace + internal deps ││         │        │
  │  │  │ │     → recursive()             ││         │        │
  │  │  │ │ P2: có params                 ││         │        │
  │  │  │ │     → mutateModulesInSingle() ││         │        │
  │  │  │ │ P3: không params              ││         │        │
  │  │  │ │     → install()               ││         │        │
  │  │  │ │ P4: linkWorkspacePackages     ││         │        │
  │  │  │ │     → recursive() install     ││         │        │
  │  │  │ └────────────────────────────────┘│         │        │
  │  │  └───────────────┬────────────────────┘         │        │
  │  │                  ↓                               │        │
  │  │  ┌────────────────────────────────────┐         │        │
  │  │  │ mutateModules() ★ CORE!          │         │        │
  │  │  │ → extendOptions()                │         │        │
  │  │  │ → getContext()                   │         │        │
  │  │  │ → _install() switch mutation     │         │        │
  │  │  │ → installInContext()             │         │        │
  │  │  └───────────────┬────────────────────┘         │        │
  │  │                  ↓                               │        │
  │  │  ┌────────────────────────────────────┐         │        │
  │  │  │ installInContext():               │         │        │
  │  │  │ → resolveDependencies()          │         │        │
  │  │  │ → linkPackages()                 │         │        │
  │  │  │ → finishLockfileUpdates()        │         │        │
  │  │  │ → storeController.close()        │         │        │
  │  │  └────────────────────────────────────┘         │        │
  │  └──────────────────────────────────────────────────┘        │
  │                     ↓                                        │
  │  ┌──────────────────────────────────────────────────┐        │
  │  │  ⑦ Output + Exit Code                          │        │
  │  └──────────────────────────────────────────────────┘        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §12. Tự Viết — PnpmSimulator!

```javascript
// ═══════════════════════════════════════════════════
// PNPM SIMULATOR — Tự viết bằng tay!
// Mô phỏng kiến trúc source code pnpm!
// ═══════════════════════════════════════════════════

class PnpmSimulator {
  constructor() {
    // .pnpm-store = Content-addressable storage!
    this.store = new Map();
    // Workspace projects
    this.workspaceDir = null;
    this.projects = [];
    // Config từ .npmrc
    this.config = {
      recursive: false,
      filter: [],
      linkWorkspacePackages: true,
      updateNotifier: true,
    };
    // Registered commands
    this.pnpmCmds = {};
    this.logs = [];
    // Đăng ký commands!
    this._registerCommands();
  }

  // ═══════════ LOG ═══════════
  log(step, msg) {
    const entry = "[" + step + "] " + msg;
    this.logs.push(entry);
    console.log(entry);
  }

  // ═══════════ REGISTER COMMANDS ═══════════
  _registerCommands() {
    // Mỗi command = { handler, commandNames, help }
    var commands = [
      {
        commandNames: ["install", "i"],
        help: function () {
          return "pnpm install — Cài tất cả deps!";
        },
        handler: this._installHandler.bind(this),
      },
      {
        commandNames: ["add"],
        help: function () {
          return "pnpm add <pkg> — Thêm dep mới!";
        },
        handler: this._addHandler.bind(this),
      },
      {
        commandNames: ["remove", "rm", "uninstall"],
        help: function () {
          return "pnpm remove <pkg> — Xóa dep!";
        },
        handler: this._removeHandler.bind(this),
      },
      {
        commandNames: ["update", "up"],
        help: function () {
          return "pnpm update — Cập nhật deps!";
        },
        handler: this._updateHandler.bind(this),
      },
      {
        commandNames: ["list", "ls"],
        help: function () {
          return "pnpm list — Liệt kê packages!";
        },
        handler: this._listHandler.bind(this),
      },
      {
        commandNames: ["run"],
        help: function () {
          return "pnpm run <script> — Chạy script!";
        },
        handler: this._runHandler.bind(this),
      },
      {
        commandNames: ["help"],
        help: function () {
          return "pnpm help — Hiển thị trợ giúp!";
        },
        handler: this._helpHandler.bind(this),
      },
    ];

    // Đăng ký handler theo tên!
    // Giống source code: handlerByCommandName
    for (var i = 0; i < commands.length; i++) {
      var cmdDef = commands[i];
      for (var j = 0; j < cmdDef.commandNames.length; j++) {
        this.pnpmCmds[cmdDef.commandNames[j]] = cmdDef.handler;
      }
    }

    this._commandDefs = commands;
  }

  // ═══════════ PARSE CLI ARGS ═══════════
  parseCliArgs(inputArgv) {
    // inputArgv = "pnpm add lodash --save-dev"
    var parts = inputArgv.split(" ").filter(function (p) {
      return p;
    });

    // Bỏ "pnpm" ở đầu
    if (parts[0] === "pnpm") parts.shift();

    var cmd = parts[0] || "help";
    var params = [];
    var options = {};

    for (var i = 1; i < parts.length; i++) {
      if (parts[i].indexOf("--") === 0) {
        var key = parts[i].replace("--", "");
        options[key] = true;
      } else if (parts[i].indexOf("-") === 0) {
        // Shorthand: -D = --save-dev
        var shortMap = { D: "save-dev", w: "workspace-root", g: "global" };
        var short = parts[i].replace("-", "");
        if (shortMap[short]) options[shortMap[short]] = true;
      } else {
        params.push(parts[i]);
      }
    }

    return { cmd: cmd, params: params, options: options };
  }

  // ═══════════ GET CONFIG ═══════════
  getConfig(cliOptions) {
    return Object.assign({}, this.config, cliOptions);
  }

  // ═══════════ MAIN — ENTRY POINT ═══════════
  main(inputArgv) {
    this.logs = [];
    console.log("\n" + "═".repeat(50));
    console.log("pnpm> " + inputArgv);
    console.log("═".repeat(50));

    // ① Parse CLI arguments
    var parsed = this.parseCliArgs(inputArgv);
    this.log(
      "main",
      'parseCliArgs() → cmd="' +
        parsed.cmd +
        '", params=' +
        JSON.stringify(parsed.params),
    );

    // ② Get config
    var config = this.getConfig(parsed.options);
    this.log("main", "getConfig() → merged config!");

    // ③ Custom script check
    if (parsed.cmd === "run") {
      config.npm_command = "run-script";
      this.log("main", 'npm_command = "run-script"');
    }

    // ④ Self-update check (giả lập)
    if (
      config.global &&
      (parsed.cmd === "add" || parsed.cmd === "update") &&
      parsed.params.indexOf("pnpm") !== -1
    ) {
      this.log("main", "⚠️ SELF-UPDATE detected! Dừng server...");
    }

    // ⑤ Filter (giả lập workspace)
    if (this.workspaceDir && config.recursive) {
      this.log("main", "Filter: workspace recursive mode!");
    }

    // ⑥ THỰC THI LỆNH!
    var handler = this.pnpmCmds[parsed.cmd];
    if (!handler) {
      handler = this.pnpmCmds["help"];
      this.log("main", "Unknown command! → help");
    }

    var result = handler(config, parsed.params);

    // ⑦ Output
    if (result && result.output) {
      console.log("\n" + result.output);
    }

    console.log("─".repeat(50));
    return result;
  }

  // ═══════════ .pnpm-store OPERATIONS ═══════════
  _addToStore(name, version) {
    var key = name + "@" + version;
    if (!this.store.has(key)) {
      this.store.set(key, {
        name: name,
        version: version,
        integrity: "sha512-" + Math.random().toString(36).substring(7),
        files: [name + "/index.js", name + "/package.json"],
      });
      this.log("store", "Thêm vào .pnpm-store: " + key);
      return false; // Đã download mới
    }
    this.log("store", "Đã có trong .pnpm-store: " + key + " (SKIP!)");
    return true; // Đã có sẵn
  }

  // ═══════════ SYMLINK + HARDLINK ═══════════
  _createLinks(project, name, version) {
    var key = name + "@" + version;
    // Hard link: .pnpm/pkg@ver/node_modules/pkg → .pnpm-store
    this.log(
      "link",
      "HARD LINK: .pnpm/" +
        key +
        "/node_modules/" +
        name +
        " → .pnpm-store/" +
        key,
    );
    // Symlink: node_modules/pkg → .pnpm/pkg@ver/node_modules/pkg
    this.log(
      "link",
      "SYMLINK: node_modules/" +
        name +
        " → .pnpm/" +
        key +
        "/node_modules/" +
        name,
    );
  }

  // ═══════════ RESOLVE DEPENDENCIES ═══════════
  _resolveDependencies(deps) {
    this.log(
      "resolve",
      "resolveDependencies() — " + Object.keys(deps).length + " packages!",
    );
    var resolved = {};
    for (var name in deps) {
      var version = deps[name].replace("^", "").replace("~", "");
      resolved[name] = version;
      this.log("resolve", "  " + name + ": " + deps[name] + " → " + version);
    }
    return resolved;
  }

  // ═══════════ INSTALL HANDLER ═══════════
  _installHandler(config, params) {
    this.log("install", "────── pnpm install ──────");
    // Giả lập installDeps logic!
    var manifest = this._currentProject().manifest;

    if (params && params.length > 0) {
      // Phần 2: có params → mutateModulesInSingleProject
      this.log("install", "Phần 2: có params → mutateModulesInSingle!");
      return this._mutateModules("installSome", params);
    }

    // Phần 3: không params → full install
    this.log("install", "Phần 3: full install!");
    var allDeps = Object.assign(
      {},
      manifest.dependencies || {},
      manifest.devDependencies || {},
    );
    var resolved = this._resolveDependencies(allDeps);

    for (var name in resolved) {
      var cached = this._addToStore(name, resolved[name]);
      this._createLinks(this._currentProject(), name, resolved[name]);
    }

    return {
      output: "✅ Tất cả dependencies đã được cài đặt!",
      exitCode: 0,
    };
  }

  // ═══════════ ADD HANDLER ═══════════
  _addHandler(config, params) {
    this.log("add", "────── pnpm add ──────");
    if (!params || params.length === 0) {
      return {
        output: "❌ ERR_PNPM_MISSING_PACKAGE_NAME!",
        exitCode: 1,
      };
    }

    // installDeps → Phần 2 → mutateModulesInSingleProject
    this.log("add", "installDeps() → Phần 2!");
    return this._mutateModules("installSome", params);
  }

  // ═══════════ REMOVE HANDLER ═══════════
  _removeHandler(config, params) {
    this.log("remove", "────── pnpm remove ──────");
    if (!params || params.length === 0) {
      return { output: "❌ Specify package to remove!", exitCode: 1 };
    }
    return this._mutateModules("uninstallSome", params);
  }

  // ═══════════ UPDATE HANDLER ═══════════
  _updateHandler(config, params) {
    this.log("update", "────── pnpm update ──────");
    var manifest = this._currentProject().manifest;
    var allDeps = Object.assign(
      {},
      manifest.dependencies || {},
      manifest.devDependencies || {},
    );

    for (var name in allDeps) {
      var newVer = this._bumpVersion(allDeps[name]);
      this.log("update", name + ": " + allDeps[name] + " → ^" + newVer);
    }

    return { output: "✅ Dependencies updated!", exitCode: 0 };
  }

  // ═══════════ LIST HANDLER ═══════════
  _listHandler(config, params) {
    this.log("list", "────── pnpm list ──────");
    var manifest = this._currentProject().manifest;
    var output = "Dependencies:\n";
    var deps = manifest.dependencies || {};
    for (var name in deps) {
      output += "  " + name + ": " + deps[name] + "\n";
    }
    var devDeps = manifest.devDependencies || {};
    output += "DevDependencies:\n";
    for (var name in devDeps) {
      output += "  " + name + ": " + devDeps[name] + "\n";
    }
    return { output: output, exitCode: 0 };
  }

  // ═══════════ RUN HANDLER ═══════════
  _runHandler(config, params) {
    this.log("run", "────── pnpm run ──────");
    var scriptName = params[0];
    var manifest = this._currentProject().manifest;
    var scripts = manifest.scripts || {};

    if (!scriptName) {
      var output = "Available scripts:\n";
      for (var name in scripts) {
        output += "  " + name + ": " + scripts[name] + "\n";
      }
      return { output: output, exitCode: 0 };
    }

    if (scripts[scriptName]) {
      this.log("run", "Executing: " + scripts[scriptName]);
      return {
        output: "> " + scripts[scriptName] + "\n✅ Script completed!",
        exitCode: 0,
      };
    }

    return {
      output: '❌ Script "' + scriptName + '" not found!',
      exitCode: 1,
    };
  }

  // ═══════════ HELP HANDLER ═══════════
  _helpHandler(config, params) {
    var output = "pnpm — Performant npm!\n\nCommands:\n";
    for (var i = 0; i < this._commandDefs.length; i++) {
      output +=
        "  " +
        this._commandDefs[i].commandNames.join(", ") +
        "\n    " +
        this._commandDefs[i].help() +
        "\n";
    }
    return { output: output, exitCode: 0 };
  }

  // ═══════════ mutateModules — CORE! ═══════════
  _mutateModules(mutation, params) {
    this.log("mutate", "═══ mutateModules() ═══");
    this.log("mutate", 'mutation = "' + mutation + '"');

    // ① extendOptions
    this.log("mutate", "① extendOptions()");
    // ② getContext
    this.log("mutate", "② getContext()");

    // ③ _install() — switch!
    this.log("mutate", "③ _install() — switch (mutation):");

    var manifest = this._currentProject().manifest;

    switch (mutation) {
      case "uninstallSome":
        this.log("mutate", '  case "uninstallSome":');
        for (var i = 0; i < params.length; i++) {
          var pkg = params[i];
          if (manifest.dependencies && manifest.dependencies[pkg]) {
            delete manifest.dependencies[pkg];
            this.log("mutate", "  removeDeps: " + pkg + " ← ĐÃ XÓA!");
          } else if (
            manifest.devDependencies &&
            manifest.devDependencies[pkg]
          ) {
            delete manifest.devDependencies[pkg];
            this.log("mutate", "  removeDeps: " + pkg + " (dev) ← ĐÃ XÓA!");
          } else {
            this.log("mutate", "  ⚠️ " + pkg + " không tìm thấy!");
          }
        }
        break;

      case "install":
        this.log("mutate", '  case "install": installCase()');
        break;

      case "installSome":
        this.log("mutate", '  case "installSome":');
        for (var i = 0; i < params.length; i++) {
          var parsed = this._parsePackageSpec(params[i]);
          if (!manifest.dependencies) manifest.dependencies = {};
          manifest.dependencies[parsed.name] = "^" + parsed.version;
          this._addToStore(parsed.name, parsed.version);
          this._createLinks(
            this._currentProject(),
            parsed.name,
            parsed.version,
          );
          this.log("mutate", "  + " + parsed.name + "@" + parsed.version);
        }
        break;
    }

    // ④ installInContext
    this.log("mutate", "④ installInContext():");
    this.log("mutate", "  → resolveDependencies()");
    this.log("mutate", "  → linkPackages()");
    this.log("mutate", "  → finishLockfileUpdates()");
    this.log("mutate", "  → storeController.close()");

    return {
      output: '✅ mutateModules completed! mutation="' + mutation + '"',
      exitCode: 0,
    };
  }

  // ═══════════ HELPERS ═══════════
  _currentProject() {
    if (!this._project) {
      this._project = {
        dir: "/project",
        manifest: {
          name: "my-app",
          version: "1.0.0",
          scripts: {
            dev: "vite",
            build: "vite build",
            test: "jest",
          },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
          },
          devDependencies: {
            vite: "^5.0.0",
            jest: "^29.0.0",
          },
        },
      };
    }
    return this._project;
  }

  _parsePackageSpec(spec) {
    var parts = spec.split("@");
    if (parts.length >= 2 && parts[0]) {
      return { name: parts[0], version: parts[1] || "1.0.0" };
    }
    return { name: spec, version: "1.0.0" };
  }

  _bumpVersion(range) {
    var ver = range.replace("^", "").replace("~", "");
    var parts = ver.split(".");
    parts[2] = parseInt(parts[2] || "0") + 1;
    return parts.join(".");
  }

  // ═══════════ DEMO ═══════════
  demo() {
    console.log("╔══════════════════════════════════════╗");
    console.log("║  PNPM SIMULATOR — DEMO!              ║");
    console.log("╚══════════════════════════════════════╝\n");

    // 1. Help
    this.main("pnpm help");

    // 2. Install
    this.main("pnpm install");

    // 3. Add package
    this.main("pnpm add lodash@4.17.21");

    // 4. List
    this.main("pnpm list");

    // 5. Run script
    this.main("pnpm run dev");

    // 6. Remove
    this.main("pnpm remove jest");

    // 7. Add missing package name
    this.main("pnpm add");

    // 8. List after changes
    this.main("pnpm ls");
  }
}

// ═══════════ CHẠY DEMO ═══════════
var simulator = new PnpmSimulator();
simulator.demo();
```

---

## §13. Câu Hỏi Luyện Tập!

```
  CÂU HỎI PHỎNG VẤN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ Câu 1: main.ts của pnpm xử lý gì?                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ main.ts là ENTRY POINT, xử lý 7 bước:              │    │
  │  │ ① parseCliArgs() — parse CLI arguments             │    │
  │  │ ② getConfig() — lấy cấu hình (.npmrc + args)     │    │
  │  │ ③ Custom script check — run → run-script           │    │
  │  │ ④ Self-update + checkForUpdates                     │    │
  │  │ ⑤ Filter operations — workspace filtering          │    │
  │  │ ⑥ pnpmCmds[cmd]() — THỰC THI lệnh!               │    │
  │  │ ⑦ Output result + set exit code                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ Câu 2: pnpm <command> vs pnpm run <command>?            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ → Nếu tên script KHÔNG trùng lệnh mặc định:      │    │
  │  │   pnpm <cmd> = chạy script!                        │    │
  │  │ → Nếu TRÙNG (ví dụ "add"):                        │    │
  │  │   pnpm add = LỆNH MẶC ĐỊNH pnpm!                  │    │
  │  │   pnpm run add = chạy SCRIPT "add"!                │    │
  │  │ → Lệnh mặc định pnpm ƯU TIÊN hơn scripts!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ Câu 3: installDeps() có mấy phần xử lý?                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ 4 phần theo 3 điều kiện phán đoán:                │    │
  │  │                                                      │    │
  │  │ P1: Workspace + internal deps → recursive()        │    │
  │  │     → add/update/install đệ quy → return!         │    │
  │  │                                                      │    │
  │  │ P2: Có params (deps chỉ định!)                     │    │
  │  │     → mutateModulesInSingleProject()                │    │
  │  │     → Chỉ xử lý deps được chỉ định → return!    │    │
  │  │                                                      │    │
  │  │ P3: Không params → install() full!                  │    │
  │  │     → Cài TẤT CẢ deps trong package.json!         │    │
  │  │                                                      │    │
  │  │ P4: linkWorkspacePackages = true/deep               │    │
  │  │     → recursive() CHỈ install!                     │    │
  │  │     → Symlink giữa workspace packages!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ Câu 4: mutateModules() xử lý những mutation nào?        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ 5 loại mutation:                                     │    │
  │  │ ① uninstallSome → xóa deps CHỈ ĐỊNH!             │    │
  │  │ ② install → cài TẤT CẢ deps! (full!)             │    │
  │  │ ③ installSome → cài/update deps CHỈ ĐỊNH!        │    │
  │  │ ④ unlink → gỡ link TẤT CẢ external packages!    │    │
  │  │ ⑤ unlinkSome → gỡ link deps CHỈ ĐỊNH!           │    │
  │  │                                                      │    │
  │  │ Sau switch → installInContext():                    │    │
  │  │ → resolveDependencies() → dependency tree!         │    │
  │  │ → linkPackages() → hard link + symlink!            │    │
  │  │ → finishLockfileUpdates() → cập nhật lockfile!    │    │
  │  │ → storeController.close() → đóng store!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ Câu 5: pnpm dùng Soft Link + Hard Link như thế nào?     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ → Hard Link: Liên kết file THẬT trong .pnpm-store!│    │
  │  │   .pnpm/lodash@4.17.21/node_modules/lodash/        │    │
  │  │   → HARD LINK → .pnpm-store/lodash@4.17.21       │    │
  │  │   → KHÔNG copy! Chỉ 1 bản trên disk!              │    │
  │  │                                                      │    │
  │  │ → Soft Link (Symlink): node_modules/ TOP-LEVEL!   │    │
  │  │   node_modules/lodash                                │    │
  │  │   → SYMLINK → .pnpm/lodash@4.17.21/               │    │
  │  │   → Chỉ là "shortcut"!                            │    │
  │  │                                                      │    │
  │  │ → Kết hợp: Tiết kiệm disk + strict isolation! ★  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ Câu 6: checkForUpdates() hoạt động thế nào?              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ → CHỈ chạy khi: install/add + online + !CI!       │    │
  │  │ → Load pnpm-state.json → check timestamp!         │    │
  │  │ → Nếu < 1 DAY → SKIP! (UPDATE_CHECK_FREQUENCY!)  │    │
  │  │ → Resolve latest version từ registry!              │    │
  │  │ → So sánh current vs latest → LOG thông báo!      │    │
  │  │ → CHỈ THÔNG BÁO! Không tự động update!           │    │
  │  │ → !selfUpdate check → tránh conflict!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ Câu 7: CommandDefinition interface có gì?                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ 7 thuộc tính:                                        │    │
  │  │ ① handler → hàm xử lý CHÍNH!                     │    │
  │  │ ② help → text hướng dẫn sử dụng!                 │    │
  │  │ ③ commandNames → tên lệnh + aliases!              │    │
  │  │ ④ cliOptionsTypes → kiểu cho CLI options!         │    │
  │  │ ⑤ rcOptionsTypes → kiểu cho .npmrc options!       │    │
  │  │ ⑥ completion → auto-complete Tab!                  │    │
  │  │ ⑦ shorthands → viết tắt (-D = --save-dev!)       │    │
  │  │                                                      │    │
  │  │ Khác biệt cli vs rc:                                 │    │
  │  │ → cliOptionsTypes: 1 session!                       │    │
  │  │ → rcOptionsTypes: toàn cục, mọi commands!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ Câu 8: Filter trong workspace hoạt động thế nào?         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ → Khi install/import/dedupe/patch trong workspace:  │    │
  │  │   recursive = true! (tự động!)                      │    │
  │  │ → Default filter: ['{.}...']                         │    │
  │  │   = project hiện tại + TẤT CẢ dependencies!       │    │
  │  │ → Build filter array từ --filter + --filter-prod!  │    │
  │  │ → filterPackagesFromDir() → lọc packages!         │    │
  │  │ → Kết quả: allProjectsGraph +                     │    │
  │  │   selectedProjectsGraph!                             │    │
  │  │                                                      │    │
  │  │ Workspace root handling:                              │    │
  │  │ → --workspace-root → INCLUDE root!                 │    │
  │  │ → run/exec/add/test → EXCLUDE root (mặc định!)   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

> **TÓM TẮT**: pnpm source code kiến trúc: main.ts (entry) → parseCliArgs → getConfig → script check → update → filter → pnpmCmds[cmd]() → installDeps (4 phần) → mutateModules (5 mutations) → resolveDependencies → linkPackages → done! ★
