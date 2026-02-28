# Xây Dựng Quy Chuẩn Front-end Từ Con Số 0

> Hướng dẫn toàn diện về thiết lập và duy trì quy chuẩn phát triển front-end cho team.
> Độ khó: ⭐️⭐️ | Thời gian đọc: ~18 phút

---

## Table of Contents

1. [Lời Mở Đầu](#1-lời-mở-đầu)
2. [Tại Sao Cần Quy Chuẩn?](#2-tại-sao-cần-quy-chuẩn)
3. [Tại Sao Nhiều Team Vẫn Thiếu Quy Chuẩn?](#3-tại-sao-nhiều-team-vẫn-thiếu-quy-chuẩn)
4. [Cách Duy Trì Quy Chuẩn Hiệu Quả](#4-cách-duy-trì-quy-chuẩn-hiệu-quả)
5. [Quy Trình Phát Triển](#5-quy-trình-phát-triển)
6. [Code Style — Formatting (Prettier)](#6-code-style--formatting-prettier)
7. [Code Style — JS/TS (ESLint)](#7-code-style--jsts-eslint)
8. [Code Style — CSS (Stylelint)](#8-code-style--css-stylelint)
9. [Code Style — Quy Tắc Tùy Chỉnh Khác](#9-code-style--quy-tắc-tùy-chỉnh-khác)
10. [Cấu Trúc Thư Mục Dự Án](#10-cấu-trúc-thư-mục-dự-án)
11. [Git Commit Guidelines](#11-git-commit-guidelines)
12. [UI Design Guidelines](#12-ui-design-guidelines)
13. [Tổng Kết](#13-tổng-kết)

---

## 1. Lời Mở Đầu

> _Không có quy tắc, không thể thành sự._

Bài viết ghi lại quá trình từ **thiếu quy chuẩn đến dần dần chuẩn hóa** của team, bắt đầu từ **tại sao cần quy chuẩn**, **tầm quan trọng của việc thiết lập quy chuẩn**, mở rộng đến cách xây dựng quy chuẩn phù hợp cho team. Bao gồm chi tiết từng loại quy chuẩn trong phát triển front-end, kèm cấu hình cụ thể.

```
CÁC HƯỚNG QUY CHUẨN CẦN THIẾT LẬP:
══════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  ❶ Quy trình phát triển (Development Process)       │
  │  ❷ Code style (Formatting + Linting)                │
  │  ❸ Git commit guidelines                            │
  │  ❹ Cấu trúc thư mục dự án                          │
  │  ❺ UI Design Guidelines                             │
  │                                                      │
  └──────────────────────────────────────────────────────┘
```

---

## 2. Tại Sao Cần Quy Chuẩn?

### Lợi Ích Của Code Style Thống Nhất

```
LỢI ÍCH — QUY CHUẨN CODE THỐNG NHẤT:
══════════════════════════════════════════════════════════

  ❶ NÂNG CAO CHẤT LƯỢNG CODE
  ┌──────────────────────────────────────────────────────┐
  │  Cải thiện đồng thời:                               │
  │  • Khả năng đọc (Readability)                       │
  │  • Khả năng bảo trì (Maintainability)               │
  │  • Khả năng tái sử dụng (Reusability)               │
  │  • Khả năng di chuyển (Portability)                  │
  │  • Độ tin cậy (Reliability)                          │
  │                                                      │
  │  → Nền tảng để GIẢM CHI PHÍ phát triển             │
  └──────────────────────────────────────────────────────┘

  ❷ ĐẢM BẢO TÍNH NHẤT QUÁN
  ┌──────────────────────────────────────────────────────┐
  │  Code style nhất quán → dễ bảo trì hơn             │
  │  → Bất kỳ ai trong team đều có thể nhanh chóng     │
  │    hiểu và sửa đổi code                            │
  └──────────────────────────────────────────────────────┘

  ❸ NÂNG CAO HIỆU SUẤT TEAM
  ┌──────────────────────────────────────────────────────┐
  │  Viết code theo chuẩn → phát hiện vấn đề sớm       │
  │  → thậm chí PHÒNG NGỪA hoàn toàn                   │
  │  → Cải thiện hiệu suất toàn bộ delivery pipeline   │
  └──────────────────────────────────────────────────────┘

  ❹ GIẢM TRANH CÃI TRONG CODE REVIEW
  ┌──────────────────────────────────────────────────────┐
  │  Có chuẩn rõ ràng → không cần tranh luận            │
  │  → Tiết kiệm thời gian review                      │
  │  → Giảm ma sát giữa các thành viên                 │
  └──────────────────────────────────────────────────────┘
```

### Hậu Quả Khi Không Có Quy Chuẩn

```
HẬU QUẢ — KHÔNG CÓ QUY CHUẨN:
══════════════════════════════════════════════════════════

  ⚠️ Code style lộn xộn → tăng gánh nặng tâm lý
     cho team → trường hợp xấu nhất: chỉ MỘT NGƯỜI
     sửa được đoạn code đó (núi rác code)

  ⚠️ Hợp tác khó khăn → phải thích nghi với
     nhiều style khác nhau → hiệu suất thấp
     (đọc code là nơi tốn NHIỀU thời gian nhất)

  ⚠️ Code review thường xuyên tranh luận
     về những thứ tương tự

  ⚠️ Ảnh hưởng năng suất, chất lượng
     → nghiêm trọng: ảnh hưởng hòa khí team
```

---

## 3. Tại Sao Nhiều Team Vẫn Thiếu Quy Chuẩn?

```
NGUYÊN NHÂN — TẠI SAO KHÓ THỰC THI:
══════════════════════════════════════════════════════════

  ❶ KHÓ ĐẠT ĐỒNG THUẬN
  ┌──────────────────────────────────────────────────────┐
  │  Lý do QUAN TRỌNG NHẤT                              │
  │  → Chỉ có quy định thôi chưa đủ                    │
  └──────────────────────────────────────────────────────┘

  ❷ ÁP LỰC THỜI GIAN
  ┌──────────────────────────────────────────────────────┐
  │  Khi bị yêu cầu hoàn thành task nhanh               │
  │  → Dev thường bỏ qua quy chuẩn chất lượng          │
  └──────────────────────────────────────────────────────┘

  ❸ CHỦ NGHĨA CÁ NHÂN
  ┌──────────────────────────────────────────────────────┐
  │  Trong team luôn có người không muốn thay đổi       │
  │  thói quen cá nhân vì lợi ích chung                 │
  └──────────────────────────────────────────────────────┘

  ❹ ĐỒNG Ý TRÊN LÝ THUYẾT, LÀM THEO Ý MÌNH
  ┌──────────────────────────────────────────────────────┐
  │  Trong meeting thì đồng ý                           │
  │  Ra ngoài vẫn làm theo cách cũ                      │
  └──────────────────────────────────────────────────────┘
```

---

## 4. Cách Duy Trì Quy Chuẩn Hiệu Quả

### Phương Pháp SAI — Họp Thảo Luận

```
❌ PHƯƠNG PHÁP THẤT BẠI — HỌP & THẢO LUẬN:
══════════════════════════════════════════════════════════

  ⚠️ Trong meeting tư duy dễ lan man → thảo luận
     nhiều nhưng khó đạt kết quả thực tế
     → Trong quá trình dev vẫn có người chọn
       phớt lờ quy tắc

  ⚠️ Khó tổ chức meeting — mọi người khó cùng
     rảnh, thậm chí 1-2 tuần mới họp được 1 lần

  ⚠️ Phân tích case thực tế trong meeting →
     đưa ra vài gợi ý tối ưu nhưng không phân
     loại ưu tiên → kết quả thực tế kém

  ⚠️ Kỹ năng tổ chức meeting cần cải thiện
```

### Phương Pháp ĐÚNG — 8 Nguyên Tắc

```
✅ PHƯƠNG PHÁP HIỆU QUẢ — 8 NGUYÊN TẮC:
══════════════════════════════════════════════════════════

  ❶ GHI CHÉP QUA TÀI LIỆU (Wiki)
  ┌──────────────────────────────────────────────────────┐
  │  Tổng hợp và phân tích các vấn đề quy chuẩn        │
  │  → Ghi lại qua tài liệu (Wiki, etc.)               │
  │  → Tìm giải pháp tốt nhất trong ngành              │
  │  → Thống nhất trong team                            │
  └──────────────────────────────────────────────────────┘

  ❷ BƯỚC NHỎ, PHẢN HỒI NHANH
  ┌──────────────────────────────────────────────────────┐
  │  Gặp vấn đề → giải quyết ngay                      │
  │  → Sắp xếp theo ưu tiên và mức quan trọng          │
  │  → Đưa vào từng iteration                          │
  │  → Mỗi iteration chỉ tập trung vài vấn đề         │
  └──────────────────────────────────────────────────────┘

  ❸ KHÔNG MANG NỢ SANG ITERATION SAU
  ┌──────────────────────────────────────────────────────┐
  │  Vấn đề quy chuẩn iteration này                    │
  │  → TUYỆT ĐỐI không kéo sang iteration sau          │
  │  → Tránh tồn đọng                                  │
  └──────────────────────────────────────────────────────┘

  ❹ NGHIÊM KHẮC TRONG CODE REVIEW
  ┌──────────────────────────────────────────────────────┐
  │  Từ chối làm ngơ bất kỳ điều gì                     │
  └──────────────────────────────────────────────────────┘

  ❺ BẤT ĐỒNG → THẢO LUẬN NGAY → KẾT LUẬN
  ┌──────────────────────────────────────────────────────┐
  │  Không để vấn đề treo lơ lửng                       │
  └──────────────────────────────────────────────────────┘

  ❻ QUY TẮC KHÔNG PHẢI CHỈ ĐỂ LÀM QUY TẮC
  ┌──────────────────────────────────────────────────────┐
  │  Mục đích không phải bắt buộc theo chuẩn X,Y       │
  │  → Mà là TEAM ĐẠT ĐỒNG THUẬN                      │
  └──────────────────────────────────────────────────────┘

  ❼ KHUYẾN KHÍCH CHẤT VẤN QUY TẮC
  ┌──────────────────────────────────────────────────────┐
  │  Quy tắc không cải thiện:                           │
  │  readability, maintainability, reusability,          │
  │  portability, reliability                            │
  │  → NÊN ĐƯỢC CHẤT VẤN                               │
  └──────────────────────────────────────────────────────┘

  ❽ LEAD BY EXAMPLE
  ┌──────────────────────────────────────────────────────┐
  │  Hướng mũi tàu không được chệch                    │
  │  → Leader phải làm gương trước                      │
  └──────────────────────────────────────────────────────┘
```

```
KẾT QUẢ SAU 2 THÁNG ITERATION:
══════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │  ✅ Ý thức quy chuẩn tăng rõ rệt                  │
  │  ✅ Gặp vấn đề quy chuẩn → mạnh dạn nêu ra       │
  │  ✅ Thảo luận nhóm chủ động, không do dự           │
  │                                                     │
  └─────────────────────────────────────────────────────┘
```

---

## 5. Quy Trình Phát Triển

> Quy trình phát triển phần nào nên do chính developer kiểm soát — dù là mô hình truyền thống hay agile, **cốt lõi vẫn là hoàn thành nhu cầu người dùng với CHẤT LƯỢNG CAO và HIỆU SUẤT CAO**.

### Sai Lầm Phổ Biến

```
❌ SAI LẦM — VIẾT CODE NGAY KHI NHẬN YÊU CẦU:
══════════════════════════════════════════════════════════

  Nhận requirement ──┐
                     │ Bỏ qua tìm hiểu
                     │ Bỏ qua thiết kế
                     ▼
               Viết code ngay     ← "Hiệu suất cao"?
                     │
                     ▼
          ┌──────────────────────┐
          │  • Bug rate cao      │
          │  • Rework nhiều      │
          │  • Thiếu hiểu biết  │
          │    về requirement     │
          │  • Thiết kế code kém │
          └──────────────────────┘
```

### Quy Trình Đúng

```
✅ QUY TRÌNH PHÁT TRIỂN CHUẨN:
══════════════════════════════════════════════════════════════

  ❶ HIỂU YÊU CẦU
  ┌──────────────────────────────────────────────────────────┐
  │  • Background của yêu cầu là gì?                       │
  │  • Giải pháp có giải quyết được pain point không?       │
  │  • Nhu cầu sâu hơn của user là gì?                     │
  │                                                          │
  │  💡 Nếu PM kinh nghiệm chưa nhiều → giai đoạn này     │
  │     có thể CẮT BỎ nhiều yêu cầu bất hợp lý            │
  │     (ĐIỀU NÀY RẤT QUAN TRỌNG!)                         │
  └──────────┬───────────────────────────────────────────────┘
             │
             ▼
  ❷ THIẾT KẾ KỸ THUẬT
  ┌──────────────────────────────────────────────────────────┐
  │  Với chức năng phức tạp, quy mô lớn:                    │
  │  • Nghiên cứu giải pháp kỹ thuật                       │
  │  • Thiết kế giải pháp kỹ thuật                          │
  │  • Output tài liệu thiết kế chi tiết                    │
  │  • Chi tiết: data flow, component design                │
  │    → dùng mind map                                      │
  └──────────┬───────────────────────────────────────────────┘
             │
             ▼
  ❸ PHÁT TRIỂN
  ┌──────────────────────────────────────────────────────────┐
  │  Viết code theo thiết kế                                │
  │  → Tuân thủ code style đã thống nhất                    │
  └──────────┬───────────────────────────────────────────────┘
             │
             ▼
  ❹ CODE REVIEW
  ┌──────────────────────────────────────────────────────────┐
  │  Review nghiêm khắc theo quy chuẩn                      │
  └──────────┬───────────────────────────────────────────────┘
             │
             ▼
  ❺ TESTING & DELIVERY
  ┌──────────────────────────────────────────────────────────┐
  │  Test → Deploy → Bàn giao                               │
  └──────────────────────────────────────────────────────────┘
```

---

## 6. Code Style — Formatting (Prettier)

### Vấn Đề

Mỗi dev dùng IDE khác nhau, thậm chí cùng IDE nhưng config khác nhau → formatting khác nhau. Cần đảm bảo team dùng **cùng formatting config**.

### Giải Pháp: Prettier

```
PRETTIER — ĐẢM BẢO FORMAT THỐNG NHẤT:
══════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────┐
  │  Prettier có SẴN bộ quy tắc formatting              │
  │  → Toàn team dùng chung → code format giống nhau    │
  └──────────────────────────────────────────────────────┘
```

### Cấu Hình Từng Bước

**Bước 1: Cài đặt dependencies**

```bash
npm install --save-dev --save-exact prettier
# hoặc
yarn add --dev --exact prettier
```

**Bước 2: Tạo file config**

```bash
echo {}> .prettierrc.json
```

**Bước 3: Tạo file `.prettierignore`**

```
# Bỏ qua các thư mục build:
dist
build
coverage
```

**Bước 4: Config VS Code**

```
CẤU HÌNH VS CODE:
══════════════════════════════════

  ❶ Cài plugin "Prettier - Code Formatter"
  ❷ Settings → tìm "Format On Save" → ✅ Check
  ❸ Giờ Ctrl+S → tự động format code
```

### Đảm Bảo Code Đã Format Trước Commit

> Nếu ai đó commit code chưa format thì sao?

Dùng **husky** + **lint-staged** — tự động format code trong giai đoạn `git commit`:

```bash
# Cài đặt
npm install --save-dev husky lint-staged
npx husky install
npm set-script prepare "husky install"
npx husky add .husky/pre-commit "npx lint-staged"
```

Thêm vào `package.json`:

```json
{
  "lint-staged": {
    "**/*": "prettier --write --ignore-unknown"
  }
}
```

```
FLOW — PRETTIER + HUSKY + LINT-STAGED:
══════════════════════════════════════════════════════════

  Developer viết code
       │
       ▼
  git add .
       │
       ▼
  git commit -m "..."
       │
       ▼
  ┌──────────────────────────────────────┐
  │  husky: pre-commit hook kích hoạt    │
  │  → Chạy lint-staged                 │
  │  → lint-staged format các file      │
  │    trong staging area               │
  │  → prettier --write                 │
  └─────────┬────────────────────────────┘
            │
        ┌───┴────┐
        │ PASS?  │
        └───┬────┘
       ✅   │   ❌
   Commit   │   Commit
   thành    │   thất bại
   công     │
```

### Xử Lý Xung Đột Prettier + ESLint

Nếu project dùng scaffolding (create-react-app, etc.) → có sẵn ESLint config → **prettier và ESLint có thể xung đột**. Cài `eslint-config-prettier`:

```bash
npm install --save-dev eslint-config-prettier
```

Config trong `.eslintrc` (ví dụ Create-React-App):

```json
{
  "eslintConfig": {
    "extends": ["react-app", "react-app/jest", "prettier"]
  }
}
```

> `"prettier"` ở cuối sẽ **override** các rule xung đột phía trước.

---

## 7. Code Style — JS/TS (ESLint)

### Các Bộ Quy Tắc Phổ Biến

```
CÁC JS/TS STYLE GUIDE PHỔ BIẾN:
══════════════════════════════════════════════

  ┌──────────────────────────────────────────┐
  │                                          │
  │  ⭐ Airbnb JavaScript Style Guide       │
  │    → 120K+ stars trên GitHub             │
  │    → Bao phủ gần như mọi tính năng JS   │
  │    → ĐÂY LÀ KHUYẾN NGHỊ SỐ 1          │
  │                                          │
  │  ○ Google JavaScript Style Guide         │
  │  ○ Idiomatic JavaScript Style Guide      │
  │  ○ JavaScript Standard Style Guide       │
  │  ○ jQuery JavaScript Style Guide         │
  │                                          │
  └──────────────────────────────────────────┘
```

### Cấu Hình ESLint

**Bước 1: Cài đặt**

```bash
npm install eslint --save-dev
# hoặc
yarn add eslint --dev
```

**Bước 2: Tạo config file**

```bash
npm init @eslint/config
# hoặc
yarn create @eslint/config
```

> Theo hướng dẫn trên terminal, chọn từng bước theo nhu cầu.

**Bước 3: Tích hợp vào lint-staged**

```json
{
  "lint-staged": {
    "**/*": "prettier --write --ignore-unknown",
    "src/*": "eslint --ext .js,.ts,.tsx"
  }
}
```

### TypeScript Type Checking

```
TYPESCRIPT TYPE CHECKING — 2 PHƯƠNG PHÁP:
══════════════════════════════════════════════════

  PHƯƠNG PHÁP 1: Plugin ESLint
  ┌──────────────────────────────────────────────────────┐
  │  Thêm vào extends:                                  │
  │  "plugin:@typescript-eslint/                        │
  │   recommended-requiring-type-checking"              │
  │                                                      │
  │  ⚠️ Kết quả không tốt — một số type cơ bản        │
  │     vẫn không phát hiện được                        │
  └──────────────────────────────────────────────────────┘

  PHƯƠNG PHÁP 2: yarn run tsc (KHUYẾN NGHỊ)
  ┌──────────────────────────────────────────────────────┐
  │  Chạy yarn run tsc trong pre-commit                 │
  │  → Type check toàn bộ file .ts trong project        │
  │  → Đọc config từ tsconfig.json gốc                  │
  │                                                      │
  │  ⚠️ Nhược điểm: KIỂM TRA TOÀN BỘ                  │
  │     → Project nhỏ: OK                               │
  │     → Project lớn: 10-20 giây là bình thường       │
  └──────────────────────────────────────────────────────┘
```

---

## 8. Code Style — CSS (Stylelint)

### Cấu Hình Từng Bước

**Bước 1: Cài đặt**

```bash
npm install --save-dev stylelint stylelint-config-standard
```

**Bước 2: Tạo `.stylelintrc.json`**

```json
{
  "extends": "stylelint-config-standard"
}
```

**Bước 3: Xử lý xung đột với Prettier**

```bash
npm install --save-dev stylelint-config-prettier
```

```json
{
  "extends": ["stylelint-config-standard", "stylelint-config-prettier"]
}
```

**Bước 4: Tích hợp vào lint-staged**

```json
{
  "lint-staged": {
    "**/*": "prettier --write --ignore-unknown",
    "src/**.{js,jsx,ts,tsx}": "eslint --ext .js,.jsx,.ts,.tsx",
    "**/*.{less,css}": "stylelint --fix"
  }
}
```

### Tổng Quan Pipeline Kiểm Tra Code

```
PIPELINE KIỂM TRA TOÀN DIỆN — lint-staged:
══════════════════════════════════════════════════════════════

  git commit
       │
       ▼
  ┌──────────────────────────────────────────────────────────┐
  │  lint-staged chạy 3 BƯỚC:                               │
  │                                                          │
  │  BƯỚC 1: prettier --write --ignore-unknown               │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  Format TẤT CẢ file → code style thống nhất      │  │
  │  └────────────────────────────────────────────────────┘  │
  │                      │                                   │
  │                      ▼                                   │
  │  BƯỚC 2: eslint --ext .js,.jsx,.ts,.tsx                  │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  Lint JS/TS files → phát hiện lỗi logic/style    │  │
  │  └────────────────────────────────────────────────────┘  │
  │                      │                                   │
  │                      ▼                                   │
  │  BƯỚC 3: stylelint --fix                                 │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  Lint CSS/LESS files → fix auto nếu có thể       │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  └────────────────────────────┬─────────────────────────────┘
                               │
                          ┌────┴────┐
                          │ ALL OK? │
                          └────┬────┘
                         ✅   │   ❌
                     Commit   │  Commit bị
                     thành    │  CHẶN → phải
                     công     │  fix trước
```

---

## 9. Code Style — Quy Tắc Tùy Chỉnh Khác

### ❶ Quy Tắc Đặt Tên

```
QUY TẮC ĐẶT TÊN — SELF-DOCUMENTING:
══════════════════════════════════════════════════

  ┌── BIẾN ──────────────────────────────────────┐
  │                                              │
  │  👎 Viết tắt tự cảm thấy hay:               │
  │     let rContent = 'willen';                 │
  │                                              │
  │  👍 Tên tự giải thích — không cần comment:   │
  │     let firstName = 'jackie';                │
  │                                              │
  └──────────────────────────────────────────────┘

  ┌── HÀM ──────────────────────────────────────┐
  │                                              │
  │  👎 Không biết return type từ tên:           │
  │     function showFriendsList() {...}         │
  │     → Return array? object? boolean?         │
  │                                              │
  │  👍 Intent rõ ràng, return type rõ ràng:     │
  │                                              │
  │     // Boolean → bắt đầu should/is/can/has  │
  │     function shouldShowFriendsList() {...}   │
  │     function isEmpty() {...}                 │
  │     function canCreateDocuments() {...}      │
  │     function hasLicense() {...}              │
  │                                              │
  │     // Action → bắt đầu bằng động từ       │
  │     function sendEmailToUser(user) {...}     │
  │                                              │
  └──────────────────────────────────────────────┘
```

### ❷ Viết Comment

```javascript
/**
 * Navigation Page — Khu vực bên phải
 */
const Content = () => xxx;

const MAX_INPUT_LENGTH = 8; // Giới hạn ô nhập password

function Component(props) {
  return (
    <>
      {/* Nếu user chưa subscribe thì không hiển thị quảng cáo */}
      {user.subscribed ? null : <SubscriptionPlans />}
    </>
  );
}
```

### ❸ Fallback Cho Biến

```javascript
// 👎 Không có fallback cho biến từ API
const { data } = getApiRequest();
data.map((s) => s.id); // data có thể undefined → BÙM!

// 👍 Luôn có fallback
const { data = [] } = getApiRequest();
data.map((s) => s?.id); // An toàn với optional chaining
```

### ❹ Hàm Phụ Trợ Phải Là Pure Function

```javascript
// 👎 Output bất ổn — phụ thuộc API bên ngoài
function plusAbc(a, b, c) {
  var c = fetch("../api"); // Side effect!
  return a + b + c;
}

// 👍 Pure function — cùng input → luôn cùng output
function plusAbc(a, b, c) {
  return a + b + c;
}
```

### ❺ Ưu Tiên Functional Programming

```javascript
// 👎 Vòng for
for (i = 1; i <= 10; i++) {
  a[i] = a[i] + 1;
}

// 👍 Functional
let b = a.map((item) => ++item);
```

### ❻ Ưu Tiên Functional Components

Trừ khi cần Error Boundaries, luôn dùng functional components.

### ❼ Component Complexity — Chia Nhỏ

```
QUY TẮC CHIA NHỎ COMPONENT:
══════════════════════════════════

  ┌──────────────────────────────────────────────────────┐
  │  • Component làm quá nhiều → tách logic ra           │
  │  • Component phức tạp → tách thành nhiều component  │
  │  • Số dòng code KHÔNG phải tiêu chí khách quan     │
  │  • Quan trọng hơn: PHÂN CHIA TRÁCH NHIỆM           │
  │    và mức độ TRỪU TƯỢNG                             │
  └──────────────────────────────────────────────────────┘
```

### ❽ Sử Dụng Error Boundaries

```jsx
// Khi render data lớn → cần error boundary để xử lý
// degradation
function Component() {
  return (
    <Layout>
      <ErrorBoundary>
        <CardWidget />
      </ErrorBoundary>

      <ErrorBoundary>
        <FiltersWidget />
      </ErrorBoundary>

      <div>
        <ErrorBoundary>
          <ProductList />
        </ErrorBoundary>
      </div>
    </Layout>
  );
}
```

### ❾ Props — Context Rõ Ràng

```
TRUYỀN PROPS — BEST PRACTICES:
══════════════════════════════════════════════

  ⚠️ Vấn đề props drilling:
     → Không biết props đến từ component gốc nào
     → Không biết props chứa gì
     → Context mơ hồ

  ✅ Giải pháp:
     → Deep context → dùng React Context trực tiếp
     → Dùng TypeScript cho props rõ ràng
```

```tsx
// A.tsx
interface AProps {
  param: string;
}
const A = ({ param }: AProps) => {
  return <B param={param} />;
};

// 👍 Context rõ ràng — B biết param đến từ AProps
// B.tsx
const B = ({ param }: { param: AProps["param"] }) => {
  return <div>hello world</div>;
};
```

### ❿ Giới Hạn Số Props

```
QUY TẮC PROPS:
══════════════════════════════════

  Component có > 5 props → CÂN NHẮC TÁCH NHỎ

  ⚠️ Component càng dùng nhiều props
     → Càng nhiều lý do RE-RENDER
```

### ⓫ Tránh Nested Ternary

```jsx
// 👎 Khó đọc — nếu lồng thêm 1-2 tầng nữa?
isSubscribed ? (
  <ArticleRecommendations />
) : isRegistered ? (
  <SubscribeCallToAction />
) : (
  <RegisterCallToAction />
);

// 👍 Tách logic rõ ràng
function CallToActionWidget({ subscribed, registered }) {
  if (subscribed) return <ArticleRecommendations />;
  if (registered) return <SubscribeCallToAction />;
  return <RegisterCallToAction />;
}

function Component() {
  return <CallToActionWidget subscribed={subscribed} registered={registered} />;
}
```

### ⓬ Tách List Component Thành Component Riêng

```jsx
// 👎 List rendering lẫn với logic khác
function Component({ topic, page, articles, onNextPage }) {
  return (
    <div>
      <h1>{topic}</h1>
      {articles.map((article) => (
        <div>
          <h3>{article.title}</h3>
          <p>{article.teaser}</p>
          <img src={article.image} />
        </div>
      ))}
      <div>You are on page {page}</div>
      <button onClick={onNextPage}>Next</button>
    </div>
  );
}

// 👍 Tách list ra — rõ ràng
function Component({ topic, page, articles, onNextPage }) {
  return (
    <div>
      <h1>{topic}</h1>
      <ArticlesList articles={articles} />
      <div>You are on page {page}</div>
      <button onClick={onNextPage}>Next</button>
    </div>
  );
}
```

### ⓭ Tránh Nested Render Functions

```jsx
// 👎 Định nghĩa render function BÊN TRONG component
function Component() {
  function renderHeader() {
    return <header>...</header>;
  }
  return <div>{renderHeader()}</div>;
}

// 👍 Tách thành component riêng
import Header from "@modules/common/components/Header";

function Component() {
  return (
    <div>
      <Header />
    </div>
  );
}
```

### ⓮ Thứ Tự Import/Export

```javascript
// 👍 Import ở đầu file, thứ tự:
// 1. Third-party libraries
// 2. Public components / methods
// 3. Private components / methods

import React from "react";
import _ from "lodash";
import Header from "@components/header";
import Content from "./Content";

// 👍 Export ở cuối file
export { Content, Header };
export default Component;
```

---

## 10. Cấu Trúc Thư Mục Dự Án

> Team đã dành nhiều thời gian suy nghĩ và thực hành về vấn đề này. Nếu không chú ý ngay từ đầu → project sẽ lộn xộn → khó tìm file mong muốn.

### Quy Tắc

```
QUY TẮC ĐẶT TÊN THƯ MỤC:
══════════════════════════════════

  ✅ Tên folder: chữ thường, phân tách bằng "-"
  ✅ index.ts chủ yếu dùng để EXPORT
     → Tránh editor đầy index.tsx, khó phân biệt
  ✅ Các file utility, hooks, API đặt SUFFIX rõ ràng
     → Dễ phân biệt khi import
```

### Cấu Trúc Khuyến Nghị

```
CẤU TRÚC THƯ MỤC CHUẨN:
══════════════════════════════════════════════════════════

  src/                        ← Thư mục phát triển
  ├── pages/                  ← Các trang (views)
  │   ├── module-a/           ← Module A
  │   │   ├── components/     ← Private components
  │   │   │   ├── ComA.tsx
  │   │   │   └── ComB.tsx
  │   │   ├── index.module.less
  │   │   ├── index.tsx
  │   │   └── Content.tsx
  │   └── module-b/           ← Module B
  │
  ├── components/             ← Public components
  │   ├── index.ts            ← Export tất cả
  │   └── header/
  │       ├── index.tsx
  │       ├── index.module.less
  │       ├── User.tsx
  │       └── useGetBaseInfo.hooks.ts
  │
  ├── routers/                ← Route definitions
  │
  ├── store/                  ← Redux state
  │
  ├── utils/                  ← Suffix: .utils.ts
  │   ├── index.ts
  │   ├── a.utils.ts
  │   └── b.utils.ts
  │
  ├── hooks/                  ← Suffix: .hooks.ts
  │   ├── index.ts
  │   ├── a.hooks.ts
  │   └── b.hooks.ts
  │
  ├── styles/                 ← Static resources
  │
  ├── service/                ← API requests
  │   ├── a.api.ts            ← Suffix: .api.ts
  │   └── b.api.ts            ← Chia theo microservice
  │
  └── constants/              ← Hằng số
```

```
TẠI SAO SUFFIX LẠI QUAN TRỌNG?
══════════════════════════════════════════════

  ┌──────────────────────────────────────────┐
  │                                          │
  │  import { getData } from './a.api'       │
  │  import { useAuth } from './a.hooks'     │
  │  import { format } from './a.utils'      │
  │                                          │
  │  → Nhìn vào import biết NGAY loại file  │
  │  → Không cần mở file để kiểm tra        │
  │                                          │
  └──────────────────────────────────────────┘
```

---

## 11. Git Commit Guidelines

### Commit Message Format

Tuân theo [Angular Commit Convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit):

```
FORMAT:
══════════════════════════════════

  <type>(<scope>): <subject>
  <BLANK LINE>
  <body>
  <BLANK LINE>
  <footer>
```

> Quy tắc: Không dòng nào trong commit message vượt quá **100 ký tự**.

### Các Loại Type

```
CÁC LOẠI TYPE — COMMIT:
══════════════════════════════════════════════════════════

  ┌────────────┬──────────────────────────────────────────┐
  │    Type    │              Mô tả                      │
  ├────────────┼──────────────────────────────────────────┤
  │  feat      │  Tính năng mới                          │
  │  fix       │  Sửa bug                                │
  │  docs      │  Thay đổi tài liệu                      │
  │  style     │  Không ảnh hưởng logic                  │
  │            │  (space, format, thiếu dấu ;)           │
  │  refactor  │  Tái cấu trúc code                     │
  │  perf      │  Tối ưu hiệu năng                      │
  │  test      │  Thay đổi test case                     │
  │  chore     │  Build process, tools, libs             │
  └────────────┴──────────────────────────────────────────┘
```

### Chi Tiết Từng Phần

```
CHI TIẾT COMMIT MESSAGE:
══════════════════════════════════════════════════════════

  SCOPE:
  ┌──────────────────────────────────────────────────────┐
  │  Phạm vi ảnh hưởng — có thể là bất cứ thứ gì      │
  │  Ví dụ: auth, header, api, router, etc.             │
  └──────────────────────────────────────────────────────┘

  SUBJECT — quy tắc:
  ┌──────────────────────────────────────────────────────┐
  │  ✅ Dùng câu trần thuật                             │
  │  ✅ Không viết hoa chữ đầu                          │
  │  ✅ Không có dấu chấm (.) ở cuối                    │
  └──────────────────────────────────────────────────────┘

  BODY:
  ┌──────────────────────────────────────────────────────┐
  │  Thay đổi cụ thể, có thể chia nhiều dòng           │
  │  Nên bao gồm:                                       │
  │  • Động lực thay đổi                                │
  │  • So sánh với hành vi trước đó                     │
  └──────────────────────────────────────────────────────┘

  FOOTER:
  ┌──────────────────────────────────────────────────────┐
  │  Ghi chú, thường là link bug fixes                  │
  │  Ví dụ: Closes #123                                 │
  └──────────────────────────────────────────────────────┘
```

### Ví Dụ

```
VÍ DỤ COMMIT MESSAGES:
══════════════════════════════════════════════════════════

  feat(auth): add login with Google OAuth

  fix(header): fix dropdown menu not closing on blur

  docs(readme): update installation instructions

  refactor(api): extract common request handler

  perf(list): implement virtual scrolling for
  large datasets

  chore(deps): upgrade webpack to v5.73.0
```

### Enforce Bằng Commitlint

```bash
# Cài commitlint CLI và conventional config
npm install --save-dev @commitlint/{config-conventional,cli}

# Cấu hình commitlint rules
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js

# Thêm vào husky
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

```
FLOW — COMMITLINT + HUSKY:
══════════════════════════════════════════════════════════

  git commit -m "fix bug"
       │
       ▼
  ┌──────────────────────────────────────┐
  │  husky: commit-msg hook             │
  │  → commitlint kiểm tra message      │
  └─────────┬────────────────────────────┘
            │
       ┌────┴────┐
       │ VALID?  │
       └────┬────┘
      ✅    │    ❌
   Commit   │   "fix bug" không hợp lệ!
   thành    │   → type(scope): subject
   công     │   → Phải sửa lại message
            │
            │   ✅ Sửa thành:
            │   "fix(auth): resolve login bug"
            │   → Commit thành công
```

---

## 12. UI Design Guidelines

> Developer xuất sắc nên thúc đẩy UI standards và có khả năng hỗ trợ triển khai.

### Lợi Ích Đa Chiều

```
UI STANDARDS — LỢI ÍCH TOÀN DIỆN:
══════════════════════════════════════════════════════════

  ┌──────────────┬───────────────────────────────────────┐
  │   Góc nhìn   │           Lợi ích                    │
  ├──────────────┼───────────────────────────────────────┤
  │  Developer   │  Tạo component library đồng bộ      │
  │              │  → Không phát minh lại bánh xe       │
  ├──────────────┼───────────────────────────────────────┤
  │  Tester      │  Tránh walkthrough lặp lại           │
  │              │  và vô nghĩa                          │
  ├──────────────┼───────────────────────────────────────┤
  │  UI Designer │  Giảm chi phí thiết kế               │
  │              │  → Tiếp nhận yêu cầu mới nhanh hơn  │
  ├──────────────┼───────────────────────────────────────┤
  │  Product     │  Cải thiện hiệu suất iteration       │
  │              │  → Giảm chi phí thử nghiệm          │
  ├──────────────┼───────────────────────────────────────┤
  │  User        │  Trải nghiệm người dùng NHẤT QUÁN   │
  └──────────────┴───────────────────────────────────────┘
```

### Cách Thúc Đẩy UI Standards

```
CHIẾN LƯỢC TRIỂN KHAI UI STANDARDS:
══════════════════════════════════════════════════════════

  ❶ Designer đưa ra bộ quy chuẩn design
     (nếu chưa có → kéo PM vào cùng xây dựng)
             │
             ▼
  ❷ Frontend xây dựng Component Library
     (đồng bộ với design specs)
             │
             ▼
  ❸ Cung cấp Component Library cho Designer
             │
             ▼
  ❹ HAI BÊN GIÁM SÁT LẪN NHAU
     → Kiểm tra xem đã đạt thỏa thuận quy chuẩn chưa

  Tham khảo: Ant Design Guidelines
  → https://ant.design/docs/spec/introduce
```

---

## 13. Tổng Kết

```
TỔNG KẾT — TOÀN BỘ QUY CHUẨN:
══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Mục đích cơ bản: ĐẢM BẢO TÍNH NHẤT QUÁN              │
  │  → Giảm chi phí giao tiếp                              │
  │  → Nâng cao hiệu suất phát triển                       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  CHECKLIST CÔNG CỤ:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ☑ Prettier        → Format thống nhất                  │
  │  ☑ ESLint          → JS/TS linting                      │
  │  ☑ Stylelint       → CSS linting                        │
  │  ☑ Husky           → Git hooks                          │
  │  ☑ lint-staged     → Chỉ check staged files             │
  │  ☑ Commitlint      → Commit message validation          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  NGUYÊN TẮC QUAN TRỌNG:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ✅ Chấp nhận quy chuẩn, nhưng quy chuẩn              │
  │     KHÔNG phải bất biến                                 │
  │                                                          │
  │  ✅ Nếu quy chuẩn không phù hợp team                   │
  │     → ĐIỀU CHỈNH và VIẾT LẠI bất kỳ rule nào          │
  │                                                          │
  │  ✅ Không phải ÉP một cách làm việc                     │
  │     → Mà là THÚC ĐẨY TƯƠNG TÁC trong team             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
TỔNG QUAN TOÀN BỘ PIPELINE:
══════════════════════════════════════════════════════════════

  Developer viết code
       │
       ├── IDE: Prettier format on save
       │
       ▼
  git add .
       │
       ▼
  git commit -m "feat(auth): add login"
       │
       ├── pre-commit hook (husky):
       │   ├── prettier --write (format)
       │   ├── eslint (JS/TS lint)
       │   └── stylelint --fix (CSS lint)
       │
       ├── commit-msg hook (husky):
       │   └── commitlint (validate message)
       │
       ▼
  ┌──────────────────┐
  │   ALL PASS? ✅   │──── Commit thành công!
  │                  │
  │   ANY FAIL? ❌   │──── Commit bị chặn → fix
  └──────────────────┘
       │
       ▼
  Code Review (team)
       │
       ▼
  Merge & Deploy ✅
```
