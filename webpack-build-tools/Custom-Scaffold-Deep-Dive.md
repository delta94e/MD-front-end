# Custom Scaffold (CLI) — Deep Dive!

> **Tự viết lại bằng tay — KHÔNG dùng thư viện!**
> Hiểu CHÍNH XÁC cách vue-cli, create-react-app hoạt động bên trong!

---

## §1. Scaffold là gì? Tại sao cần?

```
  SCAFFOLD LÀ GÌ:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Scaffold = GIÀN GIÁO trong xây dựng!            │    │
  │  │ → Trong lập trình: CÔNG CỤ TẠO DỰ ÁN TỰ ĐỘNG!  │    │
  │  │ → Ví dụ: vue-cli, create-react-app, yeoman...      │    │
  │  │ → Chạy 1 lệnh → tạo TOÀN BỘ project structure!  │    │
  │  │ → Bao gồm: config, dependencies, boilerplate code! │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VẤN ĐỀ KHI KHÔNG CÓ SCAFFOLD:                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ Tạo project thủ công:                             │    │
  │  │   1. mkdir project && cd project                      │    │
  │  │   2. npm init                                         │    │
  │  │   3. Cài từng dependency                              │    │
  │  │   4. Tạo cấu trúc thư mục                          │    │
  │  │   5. Copy config files                                │    │
  │  │   6. Setup webpack/babel/eslint                       │    │
  │  │   7. Viết boilerplate code                           │    │
  │  │   → MẤT 30-60 PHÚT mỗi lần! ❌                   │    │
  │  │                                                      │    │
  │  │ ❌ Dùng vue-cli rồi chỉnh:                          │    │
  │  │   → Phải cài thêm nhiều thứ thủ công              │    │
  │  │   → Xóa code không cần                              │    │
  │  │   → Setup API, auth, routing riêng                  │    │
  │  │   → KHÔNG LINH HOẠT! ❌                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP — CUSTOM SCAFFOLD:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ✅ Tự viết scaffold riêng:                           │    │
  │  │   → Template CHUẨN theo team/công ty!               │    │
  │  │   → 1 lệnh = tạo XONG project!                    │    │
  │  │   → Có sẵn: config, API, auth, routing!            │    │
  │  │   → Tùy chỉnh theo user input!                     │    │
  │  │   → Publish lên npm → ai cũng dùng được!          │    │
  │  │   → MẤT 5 GIÂY! ✅                                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Ý Tưởng Triển Khai!

```
  Ý TƯỞNG TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  3 BƯỚC CHÍNH:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  BƯỚC 1: KÉO TEMPLATE TỪ GIT REMOTE                 │    │
  │  │  ┌────────────────────────────────────────┐          │    │
  │  │  │  Git Repository (remote)                │          │    │
  │  │  │    │                                    │          │    │
  │  │  │    │  download-git-repo                 │          │    │
  │  │  │    ↓                                    │          │    │
  │  │  │  Local folder (./project-name/)         │          │    │
  │  │  │    ├── package.json                     │          │    │
  │  │  │    ├── src/                             │          │    │
  │  │  │    ├── public/                          │          │    │
  │  │  │    └── ...template files                │          │    │
  │  │  └────────────────────────────────────────┘          │    │
  │  │    │                                                  │    │
  │  │    ↓                                                  │    │
  │  │  BƯỚC 2: HỎI USER → CẬP NHẬT CONFIG                 │    │
  │  │  ┌────────────────────────────────────────┐          │    │
  │  │  │  Scaffold hỏi:                         │          │    │
  │  │  │    ? Tên dự án: ___                    │          │    │
  │  │  │    ? Mô tả: ___                        │          │    │
  │  │  │    ? Tác giả: ___                       │          │    │
  │  │  │    ? Keywords: ___                      │          │    │
  │  │  │    ? Xác nhận tạo? (Y/n)               │          │    │
  │  │  │                                         │          │    │
  │  │  │  → Cập nhật package.json theo câu trả lời!│       │    │
  │  │  │  → git init (xóa git cũ từ remote!)    │          │    │
  │  │  │  → npm install (cài dependencies!)      │          │    │
  │  │  └────────────────────────────────────────┘          │    │
  │  │    │                                                  │    │
  │  │    ↓                                                  │    │
  │  │  BƯỚC 3: PUBLISH LÊN NPM                              │    │
  │  │  ┌────────────────────────────────────────┐          │    │
  │  │  │  npm login                              │          │    │
  │  │  │  npm publish                            │          │    │
  │  │  │    │                                    │          │    │
  │  │  │    ↓                                    │          │    │
  │  │  │  npm install my-cli -g                  │          │    │
  │  │  │  my-cli create project-name ★           │          │    │
  │  │  └────────────────────────────────────────┘          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ TỔNG QUAN PIPELINE:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  User gõ lệnh: my-cli create my-app                  │    │
  │  │       │                                               │    │
  │  │       ↓                                               │    │
  │  │  cli.js (entry point — commander parse)               │    │
  │  │       │                                               │    │
  │  │       ↓                                               │    │
  │  │  init.js (initAction function)                        │    │
  │  │       │                                               │    │
  │  │       ├── 1. Kiểm tra git có sẵn?                   │    │
  │  │       ├── 2. Validate tên project                     │    │
  │  │       ├── 3. Kiểm tra folder trùng tên              │    │
  │  │       ├── 4. clone.js → tải template từ git         │    │
  │  │       ├── 5. inquirer → hỏi user thông tin          │    │
  │  │       ├── 6. Cập nhật package.json                    │    │
  │  │       ├── 7. git init                                 │    │
  │  │       └── 8. npm install                              │    │
  │  │       │                                               │    │
  │  │       ↓                                               │    │
  │  │  ✅ Project sẵn sàng!                                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Các Thư Viện Cần Dùng!

```
  THƯ VIỆN BÊN THỨ 3:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────┬──────────────────────────────────────┐    │
  │  │ Thư viện      │ Chức năng                            │    │
  │  ├──────────────┼──────────────────────────────────────┤    │
  │  │ chalk         │ Tô MÀU chữ trong terminal!          │    │
  │  │               │ chalk.red('Lỗi!') → chữ đỏ!       │    │
  │  ├──────────────┼──────────────────────────────────────┤    │
  │  │ log-symbols   │ Hiển thị ICON: ✅ ❌ ⚠️ ℹ️          │    │
  │  │               │ symbol.success → ✅                  │    │
  │  │               │ symbol.error → ❌                    │    │
  │  ├──────────────┼──────────────────────────────────────┤    │
  │  │ ora           │ LOADING SPINNER trong terminal!      │    │
  │  │               │ ⠋ Đang tải... (xoay animation!)   │    │
  │  ├──────────────┼──────────────────────────────────────┤    │
  │  │ download-git- │ TẢI repository từ Git về local!     │    │
  │  │ repo          │ Hỗ trợ GitHub, GitLab, Bitbucket!  │    │
  │  ├──────────────┼──────────────────────────────────────┤    │
  │  │ fs-extra      │ Mở rộng fs của Node.js!             │    │
  │  │               │ Xóa thư mục KHÔNG RỖNG! ★         │    │
  │  ├──────────────┼──────────────────────────────────────┤    │
  │  │ inquirer      │ Giao diện TƯƠNG TÁC trong terminal! │    │
  │  │               │ input, confirm, list, checkbox...    │    │
  │  ├──────────────┼──────────────────────────────────────┤    │
  │  │ commander     │ PARSE lệnh + tham số từ terminal!  │    │
  │  │               │ my-cli create <name> -f              │    │
  │  ├──────────────┼──────────────────────────────────────┤    │
  │  │ shelljs       │ Chạy LỆNH SHELL trong Node.js!      │    │
  │  │               │ shell.exec('npm install')            │    │
  │  └──────────────┴──────────────────────────────────────┘    │
  │                                                              │
  │  CÀI ĐẶT:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ mkdir my-cli && cd my-cli && npm init -y             │    │
  │  │                                                      │    │
  │  │ npm i chalk log-symbols ora download-git-repo \      │    │
  │  │       fs-extra inquirer commander shelljs             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Cấu Trúc Project!

```
  CẤU TRÚC DỰ ÁN SCAFFOLD:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  my-cli/                                                      │
  │  ├── cli.js          ← ENTRY POINT (file thực thi!)       │
  │  ├── init.js         ← Logic khởi tạo project!            │
  │  ├── clone.js        ← Tải template từ Git!               │
  │  ├── package.json    ← Cấu hình npm!                      │
  │  └── node_modules/   ← Dependencies!                       │
  │                                                              │
  │  GIẢI THÍCH TỪNG FILE:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  cli.js (Entry Point):                                │    │
  │  │  → File CHÍNH được gọi khi user gõ lệnh!          │    │
  │  │  → Import commander để parse lệnh!                  │    │
  │  │  → Định nghĩa command: create <name>                │    │
  │  │  → Gọi initAction khi user chạy create!            │    │
  │  │                                                      │    │
  │  │  init.js (Core Logic):                                │    │
  │  │  → Xử lý TOÀN BỘ logic tạo project!               │    │
  │  │  → Validate input, download template!                │    │
  │  │  → Hỏi user, cập nhật config!                      │    │
  │  │  → Init git, install dependencies!                   │    │
  │  │                                                      │    │
  │  │  clone.js (Git Download):                             │    │
  │  │  → Wrapper cho download-git-repo!                   │    │
  │  │  → Promise-based (async/await!)                      │    │
  │  │  → Hiển thị loading spinner!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẤU HÌNH PACKAGE.JSON QUAN TRỌNG:                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ {                                                     │    │
  │  │   "name": "my-cli",                                   │    │
  │  │   "version": "1.0.0",                                 │    │
  │  │   "type": "module",  ← ★ BẮT BUỘC!               │    │
  │  │   "bin": {                                            │    │
  │  │     "my-cli": "./cli.js"  ← ★ LỆNH THỰC THI!     │    │
  │  │   }                                                   │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → "type": "module"                                  │    │
  │  │   = Dùng ES Module (import/export)!                  │    │
  │  │   = KHÔNG dùng CommonJS (require)!                   │    │
  │  │                                                      │    │
  │  │ → "bin": { "my-cli": "./cli.js" }                   │    │
  │  │   = Khi install globally → tạo lệnh "my-cli"!     │    │
  │  │   = "my-cli" maps đến file ./cli.js!                │    │
  │  │   = User gõ: my-cli create app → chạy cli.js! ★   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SHEBANG LINE (#!):                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ #! /usr/bin/env node                                  │    │
  │  │                                                      │    │
  │  │ → PHẢI đặt ở DÒNG ĐẦU TIÊN của cli.js!           │    │
  │  │ → Nói cho OS biết: chạy file này bằng Node.js!    │    │
  │  │ → /usr/bin/env node = tìm node trong PATH!         │    │
  │  │ → Không có dòng này → lỗi! ★                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NPM LINK — Debug trong Development:                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ # Trong thư mục project scaffold:                    │    │
  │  │ npm link                                              │    │
  │  │                                                      │    │
  │  │ → Tạo SYMLINK global đến project hiện tại!        │    │
  │  │ → Không cần publish lên npm mỗi lần sửa code!     │    │
  │  │ → Gõ "my-cli" ở BẤT KỲ ĐÂU đều chạy được!     │    │
  │  │ → Link nằm ở: AppData/Roaming/npm/node_modules/    │    │
  │  │                                                      │    │
  │  │ # Gỡ link:                                           │    │
  │  │ npm unlink                                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Code Triển Khai — cli.js!

```
  CLI.JS — ENTRY POINT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CODE:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ #! /usr/bin/env node                                  │    │
  │  │ // ☝️ SHEBANG — chỉ định chạy bằng Node.js!       │    │
  │  │                                                      │    │
  │  │ import initAction from './init.js'                    │    │
  │  │ import commander from 'commander'                     │    │
  │  │                                                      │    │
  │  │ // Định nghĩa command "create"!                     │    │
  │  │ commander                                             │    │
  │  │   .command('create <name>')                           │    │
  │  │   .option('-f, --force', 'Ghi đè project cùng tên') │    │
  │  │   .description('Tạo project mới bằng scaffold')     │    │
  │  │   .action(initAction)                                 │    │
  │  │                                                      │    │
  │  │ // Parse command line — PHẢI ở cuối cùng!           │    │
  │  │ commander.parse(process.argv)                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI THÍCH CHI TIẾT:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  .command('create <name>'):                           │    │
  │  │  → Định nghĩa SUB-COMMAND "create"!                │    │
  │  │  → <name> = THAM SỐ BẮT BUỘC!                     │    │
  │  │  → [name] = tham số TÙY CHỌN (không bắt buộc!)    │    │
  │  │  → name sẽ được truyền vào action function!        │    │
  │  │                                                      │    │
  │  │  .option('-f, --force', 'mô tả'):                    │    │
  │  │  → Thêm CỜ (flag) cho command!                     │    │
  │  │  → -f = viết tắt (short flag)!                      │    │
  │  │  → --force = viết đầy đủ (long flag)!              │    │
  │  │  → User gõ: my-cli create app -f                     │    │
  │  │  → Trong code: option.force = true! ★               │    │
  │  │                                                      │    │
  │  │  .description('...'):                                 │    │
  │  │  → Mô tả hiện khi user gõ --help!                  │    │
  │  │                                                      │    │
  │  │  .action(initAction):                                 │    │
  │  │  → HÀM THỰC THI khi user chạy command!             │    │
  │  │  → initAction nhận 2 tham số:                       │    │
  │  │    (name, options) = (tên project, { force: bool })  │    │
  │  │                                                      │    │
  │  │  commander.parse(process.argv):                       │    │
  │  │  → Parse TOÀN BỘ arguments từ terminal!            │    │
  │  │  → process.argv = mảng arguments!                   │    │
  │  │  → ['node', 'cli.js', 'create', 'my-app', '-f']     │    │
  │  │  → PHẢI đặt ở CUỐI CÙNG! ★                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ LUỒNG COMMANDER:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  User gõ: my-cli create my-app -f                     │    │
  │  │       │                                               │    │
  │  │       ↓                                               │    │
  │  │  process.argv =                                       │    │
  │  │  ['node', 'my-cli', 'create', 'my-app', '-f']        │    │
  │  │       │                                               │    │
  │  │       ↓                                               │    │
  │  │  commander.parse(process.argv)                        │    │
  │  │       │                                               │    │
  │  │       ├── command = 'create'                          │    │
  │  │       ├── name = 'my-app'                             │    │
  │  │       └── options = { force: true }                   │    │
  │  │       │                                               │    │
  │  │       ↓                                               │    │
  │  │  initAction('my-app', { force: true })                │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Code Triển Khai — clone.js!

```
  CLONE.JS — TẢI TEMPLATE TỪ GIT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CODE:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import download from "download-git-repo";             │    │
  │  │ import ora from "ora";                                │    │
  │  │ import chalk from "chalk";                            │    │
  │  │ import logSymbols from "log-symbols";                 │    │
  │  │                                                      │    │
  │  │ export default function (remote, name, option) {      │    │
  │  │   const spinner = ora('Đang tải template...').start()│    │
  │  │   return new Promise((resolve, reject) => {           │    │
  │  │     download(remote, name, option, err => {           │    │
  │  │       if (err) {                                      │    │
  │  │         spinner.fail();                               │    │
  │  │         console.log(logSymbols.error, chalk.red(err))│    │
  │  │         reject(err);                                  │    │
  │  │         return;                                       │    │
  │  │       }                                               │    │
  │  │       spinner.succeed(chalk.green('Tải thành công'))│    │
  │  │       resolve();                                      │    │
  │  │     })                                                │    │
  │  │   })                                                  │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI THÍCH:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → download-git-repo dùng CALLBACK pattern!         │    │
  │  │ → Wrap bằng Promise → dùng async/await!           │    │
  │  │ → remote: 'direct:http://url.git#branch'            │    │
  │  │ → name: tên thư mục đích!                        │    │
  │  │ → option: { clone: true } = dùng git clone!        │    │
  │  │                                                      │    │
  │  │ ORA SPINNER:                                          │    │
  │  │ → .start() = bắt đầu xoay ⠋                     │    │
  │  │ → .succeed() = ✅ thay animation!                  │    │
  │  │ → .fail() = ❌ thay animation!                     │    │
  │  │                                                      │    │
  │  │ FLOW:                                                 │    │
  │  │ clone() → spinner.start() → download()              │    │
  │  │   ├── OK → spinner.succeed() → resolve()           │    │
  │  │   └── ERR → spinner.fail() → reject(err)           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Code Triển Khai — init.js!

```
  INIT.JS — LOGIC CHÍNH (9 BƯỚC):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  IMPORTS + CONSTANTS:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ #! /usr/bin/env node                                  │    │
  │  │ import fs from 'fs'                                   │    │
  │  │ import fsExtra from 'fs-extra'                        │    │
  │  │ import ora from 'ora'                                 │    │
  │  │ import shell from 'shelljs'                           │    │
  │  │ import chalk from 'chalk'                             │    │
  │  │ import symbol from 'log-symbols'                      │    │
  │  │ import inquirer from 'inquirer'                       │    │
  │  │ import clone from './clone.js'                        │    │
  │  │                                                      │    │
  │  │ const remote = 'http://xxxxx.git'                     │    │
  │  │ let branch = 'master'                                 │    │
  │  │ const registry = 'https://xxxx'                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ① KIỂM TRA GIT:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const initAction = async (name, option) => {          │    │
  │  │   if (!shell.which('git')) {                          │    │
  │  │     console.log(symbol.error, 'git không khả dụng!')│    │
  │  │     shell.exit(1);                                    │    │
  │  │   }                                                   │    │
  │  │ // shell.which() → tìm lệnh trong PATH!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② VALIDATE TÊN:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │   if (name.match(/[^A-Za-z0-9\u4e00-\u9fa5_-]/g)) { │    │
  │  │     console.log(symbol.error, 'Tên có ký tự lạ!') │    │
  │  │     return;                                           │    │
  │  │   }                                                   │    │
  │  │ // [^...] = CHỈ cho phép: chữ, số, _, -!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ KIỂM TRA FOLDER TRÙNG + FORCE XÓA:                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │   if (fs.existsSync(name) && !option.force) {         │    │
  │  │     console.log(symbol.error, `Đã tồn tại: ${name}`)│   │
  │  │     return;                                           │    │
  │  │   } else if (option.force) {                          │    │
  │  │     const spinner = ora(`Đang xóa ${name}...`)       │    │
  │  │       .start();                                       │    │
  │  │     try {                                             │    │
  │  │       fsExtra.removeSync(`./${name}`)                 │    │
  │  │       spinner.succeed(chalk.green('Xóa thành công'))│    │
  │  │     } catch(err) {                                    │    │
  │  │       spinner.fail(chalk.red('Xóa thất bại'))       │    │
  │  │       return;                                         │    │
  │  │     }                                                 │    │
  │  │   }                                                   │    │
  │  │ // fsExtra.removeSync = xóa folder KHÔNG RỖNG! ★   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ CLONE TEMPLATE:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │   await clone(                                        │    │
  │  │     `direct:${remote}#${branch}`, name, {clone: true} │   │
  │  │   );                                                  │    │
  │  │ // 'direct:' = URL trực tiếp!                       │    │
  │  │ // #branch = chỉ định branch!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑤ HỎI USER THÔNG TIN (inquirer):                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │   let questions = [                                   │    │
  │  │     { type:'input', message:`Tên (${name}):`,        │    │
  │  │       name:'name',                                    │    │
  │  │       validate(val) {                                 │    │
  │  │         if (val.match(/[^A-Za-z0-9_-]/g))             │    │
  │  │           return 'Tên chứa ký tự lạ!'             │    │
  │  │         return true;                                  │    │
  │  │       }                                               │    │
  │  │     },                                                │    │
  │  │     { type:'input', message:'Keywords:', name:'keywords' },│  │
  │  │     { type:'input', message:'Mô tả:', name:'description'},│  │
  │  │     { type:'input', message:'Tác giả:', name:'author' },│   │
  │  │   ];                                                  │    │
  │  │   let answers = await inquirer.prompt(questions);      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑥ XÁC NHẬN:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │   console.log(answers);                               │    │
  │  │   let confirm = await inquirer.prompt([{              │    │
  │  │     type:'confirm', message:'Xác nhận tạo?',        │    │
  │  │     default:'Y', name:'isConfirm'                     │    │
  │  │   }]);                                                │    │
  │  │   if (!confirm.isConfirm) return false;               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑦ CẬP NHẬT PACKAGE.JSON:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │   let jsonData = fs.readFileSync(                     │    │
  │  │     `./${name}/package.json`);                        │    │
  │  │   jsonData = JSON.parse(jsonData);                    │    │
  │  │                                                      │    │
  │  │   Object.keys(answers).forEach(item => {              │    │
  │  │     if (item === 'name') {                            │    │
  │  │       jsonData[item] = answers[item]?.trim()          │    │
  │  │         ? answers[item] : name;                       │    │
  │  │     } else if (answers[item]?.trim()) {               │    │
  │  │       jsonData[item] = answers[item];                 │    │
  │  │     }                                                 │    │
  │  │   });                                                 │    │
  │  │                                                      │    │
  │  │   let obj = JSON.stringify(jsonData, null, '\t');      │    │
  │  │   fs.writeFileSync(`./${name}/package.json`, obj);    │    │
  │  │ // Đọc → Parse → Sửa → Stringify → Ghi lại! ★  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑧⑨ GIT INIT + NPM INSTALL:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │   // Git init (xóa git cũ từ remote!)               │    │
  │  │   if (shell.exec(                                     │    │
  │  │     `cd ${shell.pwd()}/${name} && git init`           │    │
  │  │   ).code !== 0) {                                     │    │
  │  │     console.log(symbol.error, chalk.red('git lỗi')) │    │
  │  │     shell.exit(1);                                    │    │
  │  │   }                                                   │    │
  │  │                                                      │    │
  │  │   // Cài dependencies!                                │    │
  │  │   const spinner = ora('Đang cài deps...').start();   │    │
  │  │   if (shell.exec(                                     │    │
  │  │     `cd ${shell.pwd()}/${name} && ` +                 │    │
  │  │     `npm config set registry ${registry} && ` +       │    │
  │  │     `npm install -d`                                  │    │
  │  │   ).code !== 0) {                                     │    │
  │  │     console.log(symbol.error,                         │    │
  │  │       chalk.yellow('Cài thất bại!'))                │    │
  │  │     shell.exit(1);                                    │    │
  │  │   }                                                   │    │
  │  │   spinner.succeed(chalk.green('Hoàn tất! ✅'))      │    │
  │  │   shell.exit(1);                                      │    │
  │  │ }                                                     │    │
  │  │ export default initAction;                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Tự Viết — Scaffold Simulator Engine!

> **Mục tiêu**: Viết LẠI bằng tay TOÀN BỘ core engine!
> KHÔNG dùng commander, inquirer, ora, chalk — TỰ VIẾT!

```javascript
// ============================================================
// SCAFFOLD SIMULATOR — Tự viết bằng tay!
// Mô phỏng CHÍNH XÁC cách scaffold CLI hoạt động bên trong!
// ============================================================

// ──────────────────────────────────────────────────────────────
// 1. ARGUMENT PARSER — Thay thế Commander!
// Parse process.argv thành command + args + flags!
// ──────────────────────────────────────────────────────────────

class ArgumentParser {
  constructor() {
    this.commands = new Map(); // Lưu command definitions
    this.name = ""; // Tên CLI tool
  }

  // Đặt tên CLI
  setName(name) {
    this.name = name;
    return this;
  }

  // Đăng ký command mới
  // VD: parser.command('create <name>', 'Tạo project', handler)
  command(pattern, description, handler) {
    // Parse pattern: 'create <name>' → { cmd: 'create', args: ['name'], required: [true] }
    const parts = pattern.split(/\s+/);
    const cmd = parts[0]; // Tên command
    const args = [];
    const required = [];

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith("<") && part.endsWith(">")) {
        // <name> = BẮT BUỘC!
        args.push(part.slice(1, -1));
        required.push(true);
      } else if (part.startsWith("[") && part.endsWith("]")) {
        // [name] = TÙY CHỌN!
        args.push(part.slice(1, -1));
        required.push(false);
      }
    }

    this.commands.set(cmd, {
      pattern,
      description,
      handler,
      args,
      required,
      options: new Map(), // flags: -f, --force
    });
    return this; // chain!
  }

  // Thêm option cho command VỪA đăng ký
  option(cmd, shortFlag, longFlag, description) {
    const command = this.commands.get(cmd);
    if (!command) throw new Error(`Command '${cmd}' chưa đăng ký!`);
    // Lưu cả short (-f) và long (--force) flag
    const flagName = longFlag.replace(/^--/, ""); // --force → force
    command.options.set(shortFlag, flagName);
    command.options.set(longFlag, flagName);
    return this;
  }

  // Parse process.argv!
  // process.argv = ['node', 'cli.js', 'create', 'my-app', '-f']
  parse(argv) {
    // Bỏ 2 phần tử đầu (node path + script path)
    const args = argv.slice(2);
    if (args.length === 0) {
      this.showHelp();
      return;
    }

    const cmdName = args[0]; // 'create'
    const command = this.commands.get(cmdName);

    if (!command) {
      console.log(`Lệnh không tồn tại: ${cmdName}`);
      this.showHelp();
      return;
    }

    // Parse arguments + options
    const parsedArgs = [];
    const parsedOptions = {};
    let argIndex = 0;

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith("-")) {
        // Đây là flag! (-f hoặc --force)
        const flagName = command.options.get(arg);
        if (flagName) {
          parsedOptions[flagName] = true;
        }
      } else {
        // Đây là argument!
        parsedArgs.push(arg);
        argIndex++;
      }
    }

    // Kiểm tra required arguments
    for (let i = 0; i < command.required.length; i++) {
      if (command.required[i] && !parsedArgs[i]) {
        console.log(`Thiếu tham số: <${command.args[i]}>`);
        return;
      }
    }

    // Gọi handler với (firstArg, options)
    command.handler(parsedArgs[0], parsedOptions);
  }

  // Hiển thị help
  showHelp() {
    console.log(`\nSử dụng: ${this.name} <command> [options]\n`);
    console.log("Commands:");
    this.commands.forEach((cmd, name) => {
      console.log(`  ${cmd.pattern}  ${cmd.description}`);
    });
  }
}

// ──────────────────────────────────────────────────────────────
// 2. SPINNER — Thay thế Ora!
// Loading animation trong terminal!
// ──────────────────────────────────────────────────────────────

class Spinner {
  constructor(text) {
    this.text = text;
    this.frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    this.currentFrame = 0;
    this.interval = null;
    this.isSpinning = false;
  }

  start() {
    this.isSpinning = true;
    this.interval = setInterval(() => {
      // Xóa dòng hiện tại + viết frame mới!
      process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.text}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80); // 80ms mỗi frame!
    return this;
  }

  succeed(text) {
    this.stop();
    console.log(`\r✅ ${text || this.text}`);
    return this;
  }

  fail(text) {
    this.stop();
    console.log(`\r❌ ${text || this.text}`);
    return this;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isSpinning = false;
    // Xóa spinner line
    process.stdout.write("\r" + " ".repeat(this.text.length + 5) + "\r");
    return this;
  }
}

// ──────────────────────────────────────────────────────────────
// 3. COLOR — Thay thế Chalk!
// Tô màu text trong terminal bằng ANSI escape codes!
// ──────────────────────────────────────────────────────────────

const Color = {
  // ANSI Escape Code format: \x1b[<code>m<text>\x1b[0m
  // \x1b[ = bắt đầu escape sequence
  // <code> = mã màu
  // m = kết thúc escape sequence
  // \x1b[0m = reset về mặc định

  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`,
};

// ──────────────────────────────────────────────────────────────
// 4. SYMBOLS — Thay thế log-symbols!
// ──────────────────────────────────────────────────────────────

const Symbols = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
};

// ──────────────────────────────────────────────────────────────
// 5. PROMPTER — Thay thế Inquirer!
// Hỏi user trong terminal bằng readline!
// ──────────────────────────────────────────────────────────────

import readline from "readline";

class Prompter {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  // Hỏi 1 câu → trả Promise!
  ask(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  // Hỏi confirm (Y/n) → trả boolean!
  async confirm(question) {
    const answer = await this.ask(`${question} (Y/n): `);
    return answer.toLowerCase() !== "n";
  }

  // Hỏi với validate → lặp lại nếu sai!
  async askWithValidation(question, validateFn) {
    while (true) {
      const answer = await this.ask(question);
      const result = validateFn(answer);
      if (result === true) return answer;
      console.log(Color.red(result)); // In lỗi validate!
    }
  }

  // Hỏi MỘT LOẠT câu hỏi → trả object kết quả!
  async prompt(questions) {
    const answers = {};
    for (const q of questions) {
      if (q.type === "input") {
        if (q.validate) {
          answers[q.name] = await this.askWithValidation(
            `${q.message} `,
            q.validate,
          );
        } else {
          answers[q.name] = await this.ask(`${q.message} `);
        }
      } else if (q.type === "confirm") {
        answers[q.name] = await this.confirm(q.message);
      }
    }
    return answers;
  }

  close() {
    this.rl.close();
  }
}

// ──────────────────────────────────────────────────────────────
// 6. GIT CLONER — Thay thế download-git-repo!
// Dùng child_process.exec chạy git clone!
// ──────────────────────────────────────────────────────────────

import { exec } from "child_process";

class GitCloner {
  static clone(repoUrl, destination, branch = "master") {
    const spinner = new Spinner("Đang clone template...");
    spinner.start();

    return new Promise((resolve, reject) => {
      const cmd = `git clone -b ${branch} ${repoUrl} ${destination}`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          spinner.fail(Color.red("Clone thất bại!"));
          reject(error);
          return;
        }
        spinner.succeed(Color.green("Clone thành công!"));
        resolve();
      });
    });
  }
}

// ──────────────────────────────────────────────────────────────
// 7. FILE UTILS — Thay thế fs-extra!
// ──────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";

class FileUtils {
  // Xóa RECURSIVE (thay fs-extra.removeSync!)
  static removeSync(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        FileUtils.removeSync(fullPath); // Đệ quy!
      } else {
        fs.unlinkSync(fullPath); // Xóa file!
      }
    }
    fs.rmdirSync(dirPath); // Xóa folder rỗng!
  }

  // Đọc JSON file
  static readJSON(filePath) {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  }

  // Ghi JSON file (có format!)
  static writeJSON(filePath, data) {
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, json, "utf-8");
  }
}

// ──────────────────────────────────────────────────────────────
// 8. SHELL EXECUTOR — Thay thế shelljs!
// ──────────────────────────────────────────────────────────────

import { execSync } from "child_process";

class Shell {
  static which(cmd) {
    try {
      execSync(`which ${cmd}`, { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }

  static exec(command, options = {}) {
    try {
      const result = execSync(command, {
        stdio: options.silent ? "pipe" : "inherit",
        cwd: options.cwd || process.cwd(),
      });
      return { code: 0, output: result?.toString() || "" };
    } catch (error) {
      return { code: 1, output: error.message };
    }
  }

  static pwd() {
    return process.cwd();
  }

  static exit(code = 0) {
    process.exit(code);
  }
}

// ══════════════════════════════════════════════════════════════
// 9. GỘP LẠI — Scaffold CLI hoàn chỉnh!
// ══════════════════════════════════════════════════════════════

const REMOTE = "https://github.com/user/template.git";
const BRANCH = "main";
const REGISTRY = "https://registry.npmmirror.com";

async function initAction(name, options) {
  // ① Kiểm tra git
  if (!Shell.which("git")) {
    console.log(Symbols.error, "git không khả dụng!");
    Shell.exit(1);
  }

  // ② Validate tên
  if (name.match(/[^A-Za-z0-9_-]/g)) {
    console.log(Symbols.error, Color.red("Tên có ký tự lạ!"));
    return;
  }

  // ③ Kiểm tra folder trùng
  if (fs.existsSync(name) && !options.force) {
    console.log(Symbols.error, `Đã tồn tại: ${name}`);
    return;
  } else if (options.force && fs.existsSync(name)) {
    const spinner = new Spinner(`Đang xóa ${name}...`);
    spinner.start();
    try {
      FileUtils.removeSync(`./${name}`);
      spinner.succeed(Color.green("Xóa thành công!"));
    } catch (err) {
      spinner.fail(Color.red("Xóa thất bại!"));
      return;
    }
  }

  // ④ Clone template
  await GitCloner.clone(REMOTE, name, BRANCH);

  // ⑤ Hỏi user
  const prompter = new Prompter();
  const answers = await prompter.prompt([
    {
      type: "input",
      name: "name",
      message: `Tên dự án (${name}):`,
      validate: (val) =>
        val.match(/[^A-Za-z0-9_-]/g) ? "Tên không hợp lệ!" : true,
    },
    { type: "input", name: "description", message: "Mô tả:" },
    { type: "input", name: "author", message: "Tác giả:" },
  ]);

  // ⑥ Xác nhận
  console.log("\n" + Color.cyan("Thông tin project:"));
  console.log(answers);
  const isConfirm = await prompter.confirm("Xác nhận tạo?");
  prompter.close();

  if (!isConfirm) {
    console.log(Color.yellow("Đã hủy!"));
    return;
  }

  // ⑦ Cập nhật package.json
  const pkgPath = `./${name}/package.json`;
  const pkg = FileUtils.readJSON(pkgPath);
  pkg.name = answers.name?.trim() || name;
  if (answers.description?.trim()) pkg.description = answers.description;
  if (answers.author?.trim()) pkg.author = answers.author;
  FileUtils.writeJSON(pkgPath, pkg);

  // ⑧ Git init
  FileUtils.removeSync(`./${name}/.git`); // Xóa git cũ!
  if (Shell.exec(`cd ${name} && git init`).code !== 0) {
    console.log(Symbols.error, Color.red("git init thất bại!"));
    Shell.exit(1);
  }

  // ⑨ npm install
  const installSpinner = new Spinner("Đang cài dependencies...");
  installSpinner.start();
  const installResult = Shell.exec(
    `cd ${name} && npm config set registry ${REGISTRY} && npm install`,
    { silent: true },
  );
  if (installResult.code !== 0) {
    installSpinner.fail(Color.yellow("Cài tự động thất bại!"));
  } else {
    installSpinner.succeed(Color.green("Cài thành công!"));
  }

  console.log("\n" + Symbols.success + Color.green(" Project tạo xong!"));
  console.log(Color.dim(`  cd ${name} && npm run dev`));
}

// Entry point!
const parser = new ArgumentParser();
parser.setName("my-cli");
parser.command("create <name>", "Tạo project mới", initAction);
parser.option("create", "-f", "--force", "Ghi đè project cùng tên");
parser.parse(process.argv);
```

```
  SƠ ĐỒ QUAN HỆ CÁC CLASS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ArgumentParser (Thay Commander)                              │
  │    → parse process.argv → tìm command → gọi handler!     │
  │                                                              │
  │  Spinner (Thay Ora)                                           │
  │    → animation ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏ trong terminal!              │
  │    → .start() / .succeed() / .fail()                         │
  │                                                              │
  │  Color (Thay Chalk)                                           │
  │    → ANSI Escape Codes: \x1b[31m = đỏ!                     │
  │    → Color.red('text') = text màu đỏ!                     │
  │                                                              │
  │  Symbols (Thay log-symbols)                                   │
  │    → ✅ ❌ ⚠️ ℹ️                                              │
  │                                                              │
  │  Prompter (Thay Inquirer)                                     │
  │    → readline interface!                                     │
  │    → ask() / confirm() / prompt()                            │
  │                                                              │
  │  GitCloner (Thay download-git-repo)                           │
  │    → child_process.exec('git clone ...')                     │
  │                                                              │
  │  FileUtils (Thay fs-extra)                                    │
  │    → removeSync() đệ quy! readJSON() / writeJSON()         │
  │                                                              │
  │  Shell (Thay shelljs)                                         │
  │    → which() / exec() / pwd() / exit()                       │
  │    → child_process.execSync()                                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Publish + Cập Nhật!

```
  PUBLISH LÊN NPM:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CÁCH 1 — npm publish:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ # Đăng nhập npm (cần quyền)!                       │    │
  │  │ npm login                                             │    │
  │  │                                                      │    │
  │  │ # Publish lên npm registry!                          │    │
  │  │ npm publish                                           │    │
  │  │                                                      │    │
  │  │ # Sau khi publish → mọi người có thể:              │    │
  │  │ npm install my-cli -g                                 │    │
  │  │ my-cli create my-project ★                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH 2 — npm pack:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ # Đóng gói thành file .tgz!                        │    │
  │  │ npm pack                                              │    │
  │  │ → Tạo file: my-cli-1.0.0.tgz                       │    │
  │  │ → Upload file .tgz lên npm repository!              │    │
  │  │                                                      │    │
  │  │ # Cài từ tgz file:                                  │    │
  │  │ npm install my-cli-1.0.0.tgz -g                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẬP NHẬT VERSION:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ # Mỗi lần update code → PHẢI tăng version!        │    │
  │  │                                                      │    │
  │  │ npm version major  → 1.0.0 → 2.0.0 (breaking!)     │    │
  │  │ npm version minor  → 1.0.0 → 1.1.0 (feature!)      │    │
  │  │ npm version patch  → 1.0.0 → 1.0.1 (bugfix!)       │    │
  │  │                                                      │    │
  │  │ SƠ ĐỒ SEMANTIC VERSIONING:                           │    │
  │  │   MAJOR . MINOR . PATCH                               │    │
  │  │     ↑       ↑       ↑                                │    │
  │  │     │       │       └── Sửa bug nhỏ!              │    │
  │  │     │       └────────── Thêm tính năng mới!       │    │
  │  │     └────────────────── Thay đổi LỚN, breaking!   │    │
  │  │                                                      │    │
  │  │ # Sau khi tăng version:                               │    │
  │  │ npm publish  ← publish lại!                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH SỬ DỤNG:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1. Tạo scaffold theo bài viết này!                  │    │
  │  │ 2. Sửa remote URL → repo template của bạn!        │    │
  │  │ 3. Sửa branch (main/master)!                         │    │
  │  │ 4. Sửa npm registry URL!                             │    │
  │  │ 5. npm publish hoặc npm pack!                        │    │
  │  │ 6. npm install my-cli -g                              │    │
  │  │ 7. my-cli create project-name ★                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. Câu Hỏi Luyện Tập!

```
  CÂU HỎI PHỎNG VẤN SCAFFOLD:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ CÂU 1: Scaffold CLI là gì? Tại sao cần tự viết?           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Công cụ TẠO DỰ ÁN TỰ ĐỘNG từ template!        │    │
  │  │ → vue-cli, create-react-app = scaffold có sẵn!     │    │
  │  │ → Tự viết vì: template RIÊNG theo team/công ty!    │    │
  │  │ → 1 lệnh = tạo project ĐẦY ĐỦ cấu hình!        │    │
  │  │ → Publish npm → cả team dùng được! ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 2: Shebang line (#!) là gì? Tại sao cần?              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → #! /usr/bin/env node                               │    │
  │  │ → PHẢI ở DÒNG ĐẦU TIÊN của file entry!           │    │
  │  │ → Nói cho OS biết chạy file bằng Node.js!         │    │
  │  │ → /usr/bin/env = tìm node trong PATH environment!  │    │
  │  │ → Không có → OS không biết chạy bằng gì! ❌      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 3: "bin" trong package.json dùng để làm gì?           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → "bin": { "my-cli": "./cli.js" }                   │    │
  │  │ → Khi npm install -g → tạo LỆNH "my-cli"!        │    │
  │  │ → "my-cli" map đến file ./cli.js!                  │    │
  │  │ → npm tạo SYMLINK trong global bin directory!       │    │
  │  │ → User gõ my-cli → thực thi ./cli.js! ★           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 4: npm link dùng khi nào?                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Dùng trong DEVELOPMENT để test!                   │    │
  │  │ → Tạo symlink global → không cần npm publish!     │    │
  │  │ → Sửa code → test ngay lập tức!                   │    │
  │  │ → npm link = link project hiện tại ra global!       │    │
  │  │ → npm unlink = gỡ link!                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 5: "type": "module" trong package.json là gì?          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Khai báo dùng ES Module syntax!                   │    │
  │  │ → import/export THAY VÌ require/module.exports!     │    │
  │  │ → Mặc định Node.js dùng CommonJS!                  │    │
  │  │ → "type": "module" → chuyển sang ESM!              │    │
  │  │ → KHÔNG dùng require() được nữa! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 6: process.argv chứa gì?                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Mảng chứa arguments từ command line!             │    │
  │  │ → VD: node cli.js create my-app -f                   │    │
  │  │ → process.argv = [                                   │    │
  │  │     '/usr/bin/node',    // [0] = node path!          │    │
  │  │     '/path/to/cli.js',  // [1] = script path!        │    │
  │  │     'create',           // [2] = command!             │    │
  │  │     'my-app',           // [3] = argument!            │    │
  │  │     '-f'                // [4] = flag!                │    │
  │  │   ]                                                   │    │
  │  │ → argv.slice(2) để lấy phần CẦN thiết! ★         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 7: ANSI Escape Code hoạt động thế nào?                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Chuỗi ĐẶC BIỆT terminal hiểu được!            │    │
  │  │ → \x1b[31m = BẮT ĐẦU màu đỏ!                     │    │
  │  │ → \x1b[0m = RESET về mặc định!                     │    │
  │  │ → Format: \x1b[<code>m<text>\x1b[0m                 │    │
  │  │ → 31=đỏ, 32=xanh, 33=vàng, 34=xanh dương...     │    │
  │  │ → Chalk/Color dùng ANSI bên trong! ★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 8: Tại sao clone.js phải wrap Promise?                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → download-git-repo dùng CALLBACK pattern!         │    │
  │  │ → download(url, dest, opts, (err) => {...})          │    │
  │  │ → Muốn dùng async/await → PHẢI wrap Promise!     │    │
  │  │ → return new Promise((resolve, reject) => {          │    │
  │  │     download(url, dest, opts, err => {                │    │
  │  │       if (err) reject(err);                           │    │
  │  │       else resolve();                                 │    │
  │  │     });                                               │    │
  │  │   });                                                 │    │
  │  │ → init.js: await clone() → code tuần tự! ★       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 9: fs-extra.removeSync khác gì fs.rmdirSync?           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → fs.rmdirSync: CHỈ xóa được folder RỖNG!        │    │
  │  │   → Folder có file/subfolder → LỖI! ❌             │    │
  │  │                                                      │    │
  │  │ → fs-extra.removeSync: Xóa RECURSIVE!               │    │
  │  │   → Duyệt từng file bên trong → xóa!             │    │
  │  │   → Duyệt subfolder → đệ quy xóa!               │    │
  │  │   → Cuối cùng xóa folder rỗng!                   │    │
  │  │   → Giống rm -rf trong Linux! ★                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 10: Viết hand-written Spinner bằng process.stdout?     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', ...]    │    │
  │  │ → setInterval(80ms) → chuyển frame!                 │    │
  │  │ → process.stdout.write('\r' + frame + text)          │    │
  │  │   → '\r' = quay về ĐẦU DÒNG (không xuống dòng!) │    │
  │  │   → Viết đè dòng cũ → tạo animation! ★           │    │
  │  │ → .succeed() → clearInterval + in ✅               │    │
  │  │ → .fail() → clearInterval + in ❌                   │    │
  │  │ → KHÁC console.log: log LUÔN xuống dòng!           │    │
  │  │ → stdout.write: viết ĐÈ lên cùng dòng! ★        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
