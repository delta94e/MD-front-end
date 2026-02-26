# Large File Upload — Deep Dive!

> **Tối ưu upload file lớn: Cắt lát (Slicing), Tiếp tục upload (Resumable), Upload tức thì (Instant)!**
> Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## §1. Vấn Đề Với Upload File Lớn!

```
  TẠI SAO CẦN TỐI ƯU UPLOAD FILE LỚN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  User upload file 500MB → 1 request duy nhất!       │    │
  │  │                                                      │    │
  │  │  ❌ Nginx giới hạn mặc định 1MB!                   │    │
  │  │  ❌ Tăng client_max_body_size → vẫn có vấn đề!   │    │
  │  │                                                      │    │
  │  │  VẤN ĐỀ PHÁT SINH:                                  │    │
  │  │  ┌────────────────────────────────────────────┐      │    │
  │  │  │ 1. Server QUÁI TẢI — storage + bandwidth! │      │    │
  │  │  │ 2. Upload lâu → mất kết nối → MẤT HẾT! │      │    │
  │  │  │ 3. Không thể resume (tiếp tục)!            │      │    │
  │  │  │ 4. User phải upload LẠI TỪ ĐẦU!           │      │    │
  │  │  │ 5. File trùng → upload nhiều lần vô ích! │      │    │
  │  │  └────────────────────────────────────────────┘      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  3 GIẢI PHÁP CHÍNH:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ① CẮT LÁT (Slicing):                                │    │
  │  │  → Chia file lớn thành nhiều MẢNH NHỎ!            │    │
  │  │  → Upload từng mảnh → server ghép lại!            │    │
  │  │  → Giảm tải server, tăng tốc upload!               │    │
  │  │                                                      │    │
  │  │  ② TIẾP TỤC UPLOAD (Resumable):                      │    │
  │  │  → Ghi nhớ vị trí đã upload!                       │    │
  │  │  → Mất kết nối → tiếp tục từ chỗ dừng!          │    │
  │  │  → KHÔNG upload lại từ đầu!                        │    │
  │  │                                                      │    │
  │  │  ③ UPLOAD TỨC THÌ (Instant Upload):                   │    │
  │  │  → Tính hash file trước!                            │    │
  │  │  → Server đã có file → SKIP upload!               │    │
  │  │  → "Giây lát" upload xong file 5GB! ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Sơ Đồ Kiến Trúc Tổng Quan!

```
  PIPELINE UPLOAD FILE LỚN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  User chọn file (500MB)                                      │
  │       │                                                      │
  │       ↓                                                      │
  │  ① TÍNH HASH (MD5/SHA-256)                                   │
  │       │ → SparkMD5 / crypto                                 │
  │       │ → Hash = "a1b2c3d4e5f6..."                          │
  │       │                                                      │
  │       ↓                                                      │
  │  ② VERIFY — Kiểm tra server đã có file chưa?              │
  │       │                                                      │
  │       ├── CÓ RỒI → ③ INSTANT UPLOAD!                      │
  │       │    → Return "File đã tồn tại!" ★                  │
  │       │    → KHÔNG upload gì cả! 0 byte!                    │
  │       │                                                      │
  │       └── CHƯA CÓ → ④ CẮT LÁT (SLICING)                  │
  │            │                                                  │
  │            ↓                                                  │
  │       file.slice(0, 1MB) → chunk_0                           │
  │       file.slice(1MB, 2MB) → chunk_1                         │
  │       file.slice(2MB, 3MB) → chunk_2                         │
  │       ...                                                     │
  │       file.slice(499MB, 500MB) → chunk_499                   │
  │            │                                                  │
  │            ↓                                                  │
  │  ⑤ UPLOAD TỪNG CHUNK (đồng thời tối đa 6)                 │
  │       │                                                      │
  │       ├── chunk_0 ──→ POST /upload ──→ server lưu!         │
  │       ├── chunk_1 ──→ POST /upload ──→ server lưu!         │
  │       ├── chunk_2 ──→ POST /upload ──→ ❌ LỖI!             │
  │       ├── chunk_3 ──→ POST /upload ──→ server lưu!         │
  │       └── ...                                                 │
  │       │                                                      │
  │       │  ← chunk_2 lỗi? → ĐÁNH DẤU uploaded=false!       │
  │       │                                                      │
  │       ↓                                                      │
  │  ⑥ RESUME — Tiếp tục upload chunk lỗi!                     │
  │       │                                                      │
  │       ├── Lọc chunks.filter(c => !c.uploaded)                │
  │       ├── chunk_2 ──→ POST /upload ──→ server lưu! ✅      │
  │       │                                                      │
  │       ↓                                                      │
  │  ⑦ MERGE — Server ghép TẤT CẢ chunks!                     │
  │       │                                                      │
  │       ├── GET /merge?fileHash=xxx&fileName=yyy               │
  │       ├── Đọc thư mục temp/{fileHash}/                     │
  │       ├── Ghép chunk_0 + chunk_1 + ... + chunk_499           │
  │       ├── Tạo file hoàn chỉnh: {hash}.{ext}                │
  │       └── Xóa thư mục temp!                                │
  │       │                                                      │
  │       ↓                                                      │
  │  ✅ UPLOAD HOÀN TẤT!                                        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```
  SƠ ĐỒ SERVER STORAGE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  uploadFiles/                                                  │
  │  ├── a1b2c3d4/          ← thư mục temp (fileHash)!        │
  │  │   ├── 0              ← chunk index 0 (1MB)!             │
  │  │   ├── 1              ← chunk index 1 (1MB)!             │
  │  │   ├── 2              ← chunk index 2 (1MB)!             │
  │  │   └── ...                                                 │
  │  │                                                            │
  │  │  SAU KHI MERGE:                                            │
  │  │  ↓                                                        │
  │  ├── a1b2c3d4.mp4       ← file hoàn chỉnh! ★             │
  │  │   (thư mục a1b2c3d4/ đã bị XÓA!)                      │
  │  │                                                            │
  │  └── e5f6g7h8.zip       ← file khác đã merge!             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Cấu Trúc Project!

```
  CẤU TRÚC DỰ ÁN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  project/                                                      │
  │  ├── static/                  ← Frontend (served bởi Express)│
  │  │   ├── index.html           ← Trang chính!               │
  │  │   └── js/                                                  │
  │  │       ├── operate.js       ← Event handlers!             │
  │  │       ├── bigFileUpload.js ← Core logic upload!          │
  │  │       └── spark-md5.js     ← Thư viện hash MD5!         │
  │  │                                                            │
  │  ├── uploadFiles/             ← Nơi lưu file upload!       │
  │  │   ├── {hash}/              ← Temp folder cho chunks!     │
  │  │   └── {hash}.{ext}        ← File đã merge xong!        │
  │  │                                                            │
  │  └── app.js                   ← Server Express!             │
  │                                                              │
  │  FRONTEND ←→ BACKEND APIs:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  POST /upload                                         │    │
  │  │  → Nhận 1 chunk (FormData: file, fileHash, index)!  │    │
  │  │  → Lưu chunk vào thư mục temp!                     │    │
  │  │                                                      │    │
  │  │  GET /merge?fileHash=xxx&fileName=yyy                 │    │
  │  │  → Ghép tất cả chunks thành 1 file!                │    │
  │  │  → Xóa thư mục temp!                                │    │
  │  │                                                      │    │
  │  │  GET /verify?fileHash=xxx&fileName=yyy                │    │
  │  │  → Kiểm tra file đã tồn tại chưa?                 │    │
  │  │  → Trả { exitFile: true/false }!                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. File Slicing — Cắt Lát File!

```
  FILE SLICING — NGUYÊN LÝ:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Blob.prototype.slice():                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  File kế thừa từ Blob!                              │    │
  │  │  → File extends Blob!                               │    │
  │  │  → Blob có method .slice(start, end)!                │    │
  │  │  → Giống Array.slice() nhưng cho BINARY DATA!       │    │
  │  │                                                      │    │
  │  │  VÍ DỤ:                                               │    │
  │  │  File 5MB:                                            │    │
  │  │  ┌────┬────┬────┬────┬────┐                        │    │
  │  │  │ 0  │ 1  │ 2  │ 3  │ 4  │  (MB)                  │    │
  │  │  └────┴────┴────┴────┴────┘                        │    │
  │  │                                                      │    │
  │  │  file.slice(0, 1MB)     → chunk_0 (0-1MB)           │    │
  │  │  file.slice(1MB, 2MB)   → chunk_1 (1-2MB)           │    │
  │  │  file.slice(2MB, 3MB)   → chunk_2 (2-3MB)           │    │
  │  │  file.slice(3MB, 4MB)   → chunk_3 (3-4MB)           │    │
  │  │  file.slice(4MB, 5MB)   → chunk_4 (4-5MB)           │    │
  │  │                                                      │    │
  │  │  → 5 chunks, mỗi chunk 1MB! ★                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CODE:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const CHUNK_SIZE = 1024 * 1024 * 1; // 1MB!          │    │
  │  │                                                      │    │
  │  │ function createChunks(file) {                         │    │
  │  │   const chunks = [];                                  │    │
  │  │   let start = 0;                                      │    │
  │  │   let index = 0;                                      │    │
  │  │                                                      │    │
  │  │   while (start < file.size) {                         │    │
  │  │     // Cắt 1 mảnh từ start → start + CHUNK_SIZE!   │    │
  │  │     const blob = file.slice(start, start + CHUNK_SIZE)│   │
  │  │                                                      │    │
  │  │     chunks.push({                                     │    │
  │  │       file: blob,         // Blob data!               │    │
  │  │       uploaded: false,    // Trạng thái upload!      │    │
  │  │       chunkIndex: index,  // Thứ tự (để merge!)     │    │
  │  │       fileHash: '',       // Hash file gốc!          │    │
  │  │     });                                               │    │
  │  │                                                      │    │
  │  │     start += CHUNK_SIZE;                              │    │
  │  │     index++;                                          │    │
  │  │   }                                                   │    │
  │  │   return chunks;                                      │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI THÍCH:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → file.size = kích thước file (bytes)!              │    │
  │  │ → while(start < file.size) = lặp đến hết file!    │    │
  │  │ → file.slice(start, end) = cắt Blob con!           │    │
  │  │ → uploaded: false = chưa upload (dùng cho resume!) │    │
  │  │ → chunkIndex = THỨ TỰ (server merge đúng!) ★      │    │
  │  │                                                      │    │
  │  │ VD: file 5.3MB, chunk 1MB:                            │    │
  │  │   chunk_0: 0 → 1MB                                  │    │
  │  │   chunk_1: 1MB → 2MB                                │    │
  │  │   chunk_2: 2MB → 3MB                                │    │
  │  │   chunk_3: 3MB → 4MB                                │    │
  │  │   chunk_4: 4MB → 5MB                                │    │
  │  │   chunk_5: 5MB → 5.3MB (mảnh cuối nhỏ hơn!)     │    │
  │  │   → 6 chunks! ★                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. File Hash — Tính Hash MD5!

```
  FILE HASH — ĐỊNH DANH FILE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TẠI SAO CẦN HASH:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Hash = "DẤU VÂN TAY" của file! ★                 │    │
  │  │ → Cùng nội dung → CÙNG hash!                       │    │
  │  │ → Khác 1 byte → KHÁC hash!                          │    │
  │  │ → Dùng để:                                           │    │
  │  │   1. Instant upload (file đã tồn tại?)              │    │
  │  │   2. Đặt tên thư mục temp (fileHash/)               │    │
  │  │   3. Đặt tên file merged (fileHash.ext)              │    │
  │  │   4. Đảm bảo file KHÔNG bị trùng!                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NGUYÊN LÝ:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  File (binary) → FileReader → ArrayBuffer → MD5!   │    │
  │  │                                                      │    │
  │  │  FileReader.readAsArrayBuffer(file):                  │    │
  │  │  → Đọc file thành BUFFER (mảng bytes!)             │    │
  │  │  → Async! → onload callback!                        │    │
  │  │  → e.target.result = ArrayBuffer!                    │    │
  │  │                                                      │    │
  │  │  SparkMD5.ArrayBuffer.hash(buffer):                   │    │
  │  │  → Tính MD5 hash từ ArrayBuffer!                    │    │
  │  │  → Trả về string hex: "a1b2c3d4e5f6..."            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CODE:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function getHash(file) {                              │    │
  │  │   return new Promise((resolve) => {                   │    │
  │  │     const reader = new FileReader();                  │    │
  │  │                                                      │    │
  │  │     // Đọc file thành ArrayBuffer!                  │    │
  │  │     reader.readAsArrayBuffer(file);                   │    │
  │  │                                                      │    │
  │  │     // Khi đọc xong → tính hash!                   │    │
  │  │     reader.onload = function(e) {                     │    │
  │  │       const buffer = e.target.result;                 │    │
  │  │       const hash = SparkMD5.ArrayBuffer.hash(buffer); │   │
  │  │       resolve(hash);                                  │    │
  │  │     };                                                │    │
  │  │   });                                                 │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  File (500MB binary)                                  │    │
  │  │    │                                                  │    │
  │  │    ↓ FileReader.readAsArrayBuffer()                   │    │
  │  │  ArrayBuffer (raw bytes)                              │    │
  │  │    │                                                  │    │
  │  │    ↓ SparkMD5.ArrayBuffer.hash()                      │    │
  │  │  "a1b2c3d4e5f67890abcdef1234567890"                   │    │
  │  │    │                                                  │    │
  │  │    ↓ resolve(hash)                                    │    │
  │  │  fileHash = "a1b2c3d4e5f67890abcdef1234567890" ★     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Upload Logic — Frontend!

```
  UPLOAD LOGIC CHI TIẾT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① UPLOAD 1 CHUNK:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function uploadHandler(chunk) {                       │    │
  │  │   return new Promise(async (resolve, reject) => {     │    │
  │  │     try {                                             │    │
  │  │       // FormData — gửi multipart form!              │    │
  │  │       const fd = new FormData();                      │    │
  │  │       fd.append('file', chunk.file);                  │    │
  │  │       fd.append('fileHash', chunk.fileHash);          │    │
  │  │       fd.append('chunkIndex', chunk.chunkIndex);      │    │
  │  │                                                      │    │
  │  │       const result = await fetch('/upload', {         │    │
  │  │         method: 'POST',                               │    │
  │  │         body: fd  // KHÔNG set Content-Type!         │    │
  │  │       }).then(r => r.json());                         │    │
  │  │                                                      │    │
  │  │       chunk.uploaded = true; // ★ Đánh dấu xong!  │    │
  │  │       resolve(result);                                │    │
  │  │     } catch (err) {                                   │    │
  │  │       reject(err);                                    │    │
  │  │     }                                                 │    │
  │  │   });                                                 │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → FormData tự set Content-Type: multipart/form-data!│    │
  │  │ → KHÔNG tự set header! (browser tự thêm boundary!) │    │
  │  │ → chunk.uploaded = true → dùng cho RESUME! ★       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② UPLOAD HÀNG LOẠT — GIỚI HẠN ĐỒNG THỜI:                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Chia chunks thành các nhóm, mỗi nhóm tối đa 6! │    │
  │  │ // Upload từng nhóm tuần tự!                        │    │
  │  │ // Trong mỗi nhóm, upload ĐỒNG THỜI (Promise.all)! │    │
  │  │                                                      │    │
  │  │ function uploadChunks(chunks, maxConcurrent = 6) {    │    │
  │  │   return new Promise((resolve, reject) => {           │    │
  │  │     if (chunks.length === 0) {                        │    │
  │  │       resolve([]);                                    │    │
  │  │       return;                                         │    │
  │  │     }                                                 │    │
  │  │                                                      │    │
  │  │     // Chia thành nhóm!                              │    │
  │  │     const groups = [];                                │    │
  │  │     let i = 0;                                        │    │
  │  │     while (i < chunks.length) {                       │    │
  │  │       groups.push(                                    │    │
  │  │         chunks.slice(i, i + maxConcurrent)            │    │
  │  │       );                                              │    │
  │  │       i += maxConcurrent;                             │    │
  │  │     }                                                 │    │
  │  │                                                      │    │
  │  │     let groupIdx = 0;                                 │    │
  │  │     const results = [];                               │    │
  │  │                                                      │    │
  │  │     const processGroup = () => {                      │    │
  │  │       if (groupIdx >= groups.length) {                 │    │
  │  │         resolve(results);                             │    │
  │  │         return;                                       │    │
  │  │       }                                               │    │
  │  │       const group = groups[groupIdx];                  │    │
  │  │       Promise.all(                                    │    │
  │  │         group.map(c => uploadHandler(c))              │    │
  │  │       )                                               │    │
  │  │       .then(res => {                                  │    │
  │  │         results.push(...res);                         │    │
  │  │         groupIdx++;                                   │    │
  │  │         processGroup(); // Nhóm tiếp! ★             │    │
  │  │       })                                              │    │
  │  │       .catch(reject);                                 │    │
  │  │     };                                                │    │
  │  │     processGroup();                                   │    │
  │  │   });                                                 │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ UPLOAD ĐỒNG THỜI:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  500 chunks, maxConcurrent = 6:                       │    │
  │  │                                                      │    │
  │  │  Nhóm 1: [c0, c1, c2, c3, c4, c5] → Promise.all!   │    │
  │  │    │ (6 requests ĐỒNG THỜI!)                        │    │
  │  │    ↓ OK!                                              │    │
  │  │  Nhóm 2: [c6, c7, c8, c9, c10, c11] → Promise.all! │    │
  │  │    │ (6 requests ĐỒNG THỜI!)                        │    │
  │  │    ↓ OK!                                              │    │
  │  │  Nhóm 3: ...                                          │    │
  │  │    │                                                  │    │
  │  │    ↓                                                  │    │
  │  │  Nhóm 84: [c498, c499] → Promise.all!               │    │
  │  │    │                                                  │    │
  │  │    ↓ TẤT CẢ XONG!                                   │    │
  │  │  resolve(results) ★                                   │    │
  │  │                                                      │    │
  │  │  TẠI SAO GIỚI HẠN 6?                                 │    │
  │  │  → Browser giới hạn 6 kết nối/domain!              │    │
  │  │  → Quá 6 → hàng đợi → chậm hơn!                 │    │
  │  │  → 6 = con số TỐI ƯU! ★                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Backend — Server Express!

```
  BACKEND LOGIC:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  SETUP CƠ BẢN:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const express = require('express')                    │    │
  │  │ const multer = require('multer') // Handle file upload│   │
  │  │ const path = require('path')                          │    │
  │  │ const fse = require('fs-extra')                       │    │
  │  │ const bodyParser = require('body-parser')             │    │
  │  │                                                      │    │
  │  │ const app = express()                                 │    │
  │  │ app.use(express.static('static')) // Serve frontend! │    │
  │  │ app.use(bodyParser.urlencoded({ extended: false }))   │    │
  │  │ app.use(bodyParser.json())                            │    │
  │  │                                                      │    │
  │  │ // Multer config — lưu file vào uploadFiles/!       │    │
  │  │ const storage = multer.diskStorage({                  │    │
  │  │   destination: (req, file, cb) => {                   │    │
  │  │     cb(null, './uploadFiles');                        │    │
  │  │   }                                                   │    │
  │  │ });                                                   │    │
  │  │ const upload = multer({ storage });                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  API 1 — POST /upload (Nhận 1 chunk):                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ app.post('/upload',                                   │    │
  │  │   upload.single('file'), // multer parse file!       │    │
  │  │   (req, res) => {                                     │    │
  │  │     const { fileHash, chunkIndex } = req.body;        │    │
  │  │                                                      │    │
  │  │     // Tạo thư mục temp theo fileHash!              │    │
  │  │     let tempDir = path.resolve('uploadFiles', fileHash)│   │
  │  │     if (!fse.pathExistsSync(tempDir)) {               │    │
  │  │       fse.mkdirSync(tempDir);                         │    │
  │  │     }                                                 │    │
  │  │                                                      │    │
  │  │     // Vị trí đích cho chunk!                       │    │
  │  │     const targetPath = path.resolve(tempDir, chunkIndex)│  │
  │  │     // Vị trí hiện tại (multer đã lưu tạm)!       │    │
  │  │     let currentPath = path.resolve(req.file.path);    │    │
  │  │                                                      │    │
  │  │     if (!fse.existsSync(targetPath)) {                │    │
  │  │       // Chưa có → DI CHUYỂN chunk vào temp dir!   │    │
  │  │       fse.moveSync(currentPath, targetPath);          │    │
  │  │     } else {                                          │    │
  │  │       // Đã có → XÓA chunk trùng! (upload lại!)   │    │
  │  │       fse.removeSync(currentPath);                    │    │
  │  │     }                                                 │    │
  │  │                                                      │    │
  │  │     res.send({ msg: 'Upload thành công', success: true })│ │
  │  │   }                                                   │    │
  │  │ );                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ LƯU CHUNK:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  POST /upload (chunk_3, hash=a1b2, index=3)           │    │
  │  │    │                                                  │    │
  │  │    ↓ multer lưu tạm: uploadFiles/random_name        │    │
  │  │    │                                                  │    │
  │  │    ├── Tạo thư mục: uploadFiles/a1b2/ (nếu chưa có)│   │
  │  │    │                                                  │    │
  │  │    ├── uploadFiles/a1b2/3 đã tồn tại?              │    │
  │  │    │   ├── CHƯA → moveSync(tạm → a1b2/3) ★       │    │
  │  │    │   └── RỒI → removeSync(tạm) // xóa trùng!   │    │
  │  │    │                                                  │    │
  │  │    └── Response: { success: true }                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  API 2 — GET /merge (Ghép tất cả chunks):                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ app.get('/merge', async (req, res) => {               │    │
  │  │   const { fileHash, fileName } = req.query;           │    │
  │  │                                                      │    │
  │  │   // File đích: uploadFiles/{hash}.{ext}!            │    │
  │  │   const filePath = path.resolve(                      │    │
  │  │     'uploadFiles',                                    │    │
  │  │     fileHash + path.extname(fileName)                 │    │
  │  │   );                                                  │    │
  │  │   // Thư mục temp!                                   │    │
  │  │   let tempDir = path.resolve('uploadFiles', fileHash);│    │
  │  │   // Đọc danh sách chunk files!                     │    │
  │  │   const chunkFiles = fse.readdirSync(tempDir);        │    │
  │  │                                                      │    │
  │  │   // Ghép từng chunk THEO THỨ TỰ!                  │    │
  │  │   let tasks = [];                                     │    │
  │  │   for (let i = 0; i < chunkFiles.length; i++) {       │    │
  │  │     tasks.push(new Promise((resolve) => {             │    │
  │  │       const chunkPath = path.resolve(tempDir, i+'');  │    │
  │  │       // ĐỌC chunk → APPEND vào file đích!        │    │
  │  │       fse.appendFileSync(                             │    │
  │  │         filePath,                                     │    │
  │  │         fse.readFileSync(chunkPath)                   │    │
  │  │       );                                              │    │
  │  │       // XÓA chunk đã merge!                        │    │
  │  │       fse.unlinkSync(chunkPath);                      │    │
  │  │       resolve();                                      │    │
  │  │     }));                                              │    │
  │  │   }                                                   │    │
  │  │   await Promise.all(tasks);                           │    │
  │  │                                                      │    │
  │  │   // XÓA thư mục temp!                               │    │
  │  │   fse.removeSync(tempDir);                            │    │
  │  │                                                      │    │
  │  │   res.send({ msg: 'Merge thành công', success: true })│   │
  │  │ });                                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ MERGE:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  GET /merge?fileHash=a1b2&fileName=video.mp4          │    │
  │  │    │                                                  │    │
  │  │    ↓                                                  │    │
  │  │  uploadFiles/a1b2/                                    │    │
  │  │  ├── 0 ─→ read ─→ append ─→ xóa!                  │    │
  │  │  ├── 1 ─→ read ─→ append ─→ xóa!                  │    │
  │  │  ├── 2 ─→ read ─→ append ─→ xóa!                  │    │
  │  │  └── ...                                              │    │
  │  │    │                                                  │    │
  │  │    ↓ appendFileSync (NỐI tuần tự!)                   │    │
  │  │                                                      │    │
  │  │  uploadFiles/a1b2.mp4  ← FILE HOÀN CHỈNH! ★       │    │
  │  │  uploadFiles/a1b2/     ← ĐÃ XÓA! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Verify + Instant Upload — Upload Tức Thì!

```
  INSTANT UPLOAD:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  NGUYÊN LÝ:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Trước khi upload → hỏi server: "File đã có?"   │    │
  │  │ → Gửi fileHash + fileName lên server!               │    │
  │  │ → Server kiểm tra: fileHash.ext tồn tại?           │    │
  │  │   ├── CÓ → trả { exitFile: true }!                │    │
  │  │   │   → Frontend: "File đã tồn tại!" → XONG!     │    │
  │  │   │   → KHÔNG upload gì cả! 0 BYTE! ★             │    │
  │  │   └── KHÔNG → trả { exitFile: false }!             │    │
  │  │       → Tiếp tục quy trình cắt lát + upload!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  API 3 — GET /verify (Server):                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ app.get('/verify', (req, res) => {                    │    │
  │  │   const { fileHash, fileName } = req.query;           │    │
  │  │                                                      │    │
  │  │   // Tạo path: uploadFiles/{hash}.{ext}!            │    │
  │  │   const filePath = path.resolve(                      │    │
  │  │     'uploadFiles',                                    │    │
  │  │     fileHash + path.extname(fileName)                 │    │
  │  │   );                                                  │    │
  │  │                                                      │    │
  │  │   // Kiểm tra file đã tồn tại?                     │    │
  │  │   const exitFile = fse.pathExistsSync(filePath);      │    │
  │  │                                                      │    │
  │  │   res.send({ exitFile });                             │    │
  │  │ });                                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VERIFY FUNCTION (Frontend):                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function verify(fileHash, fileName) {                 │    │
  │  │   return fetch(                                       │    │
  │  │     `/verify?fileHash=${fileHash}&fileName=${fileName}`│   │
  │  │   ).then(r => r.json());                              │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TÍCH HỢP VÀO uploadFile:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ async function uploadFile(file) {                     │    │
  │  │   fileName = file.name;                               │    │
  │  │   fileHash = await getHash(file);                     │    │
  │  │                                                      │    │
  │  │   // ★ VERIFY TRƯỚC KHI UPLOAD!                     │    │
  │  │   let { exitFile } = await verify(fileHash, fileName);│    │
  │  │   if (exitFile) {                                     │    │
  │  │     return { msg: "File đã tồn tại!", success: true }│   │
  │  │     // → INSTANT UPLOAD! 0 byte sent! ★              │    │
  │  │   }                                                   │    │
  │  │                                                      │    │
  │  │   // Chưa có → cắt lát + upload!                   │    │
  │  │   chunks = createChunks(file);                        │    │
  │  │   try {                                               │    │
  │  │     await uploadChunks(                               │    │
  │  │       chunks.filter(c => !c.uploaded)                 │    │
  │  │     );                                                │    │
  │  │     await mergeRequest(fileHash, fileName);           │    │
  │  │   } catch (err) {                                     │    │
  │  │     return { msg: "Upload lỗi!", success: false }    │    │
  │  │   }                                                   │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ INSTANT UPLOAD:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  User chọn file video.mp4 (500MB)                     │    │
  │  │    │                                                  │    │
  │  │    ↓ getHash(file)                                    │    │
  │  │  hash = "a1b2c3d4"                                    │    │
  │  │    │                                                  │    │
  │  │    ↓ GET /verify?fileHash=a1b2c3d4&fileName=video.mp4 │    │
  │  │    │                                                  │    │
  │  │    ├── Server: uploadFiles/a1b2c3d4.mp4 tồn tại?    │    │
  │  │    │                                                  │    │
  │  │    ├── CÓ! → { exitFile: true }                     │    │
  │  │    │    → "File đã tồn tại!" → XONG! ★            │    │
  │  │    │    → Tổng data gửi: ~32 bytes (hash string!)  │    │
  │  │    │    → Thời gian: < 1 giây! 🚀                   │    │
  │  │    │                                                  │    │
  │  │    └── KHÔNG → tiếp tục slice + upload...           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Resume Upload — Tiếp Tục Upload!

```
  RESUME UPLOAD — TIẾP TỤC TỪ CHỖ DỪNG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  NGUYÊN LÝ:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Mỗi chunk có thuộc tính: uploaded = true/false!  │    │
  │  │ → Upload thành công → uploaded = true!              │    │
  │  │ → Upload thất bại → uploaded VẪN = false!          │    │
  │  │ → Khi resume: CHỈ upload chunks có uploaded=false! │    │
  │  │ → chunks.filter(c => !c.uploaded) ★                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ RESUME:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  LẦN 1 — Upload bị gián đoạn:                       │    │
  │  │  chunk_0: uploaded=true  ✅                           │    │
  │  │  chunk_1: uploaded=true  ✅                           │    │
  │  │  chunk_2: uploaded=true  ✅                           │    │
  │  │  chunk_3: uploaded=false ❌ ← MẤT KẾT NỐI!        │    │
  │  │  chunk_4: uploaded=false ❌                           │    │
  │  │  chunk_5: uploaded=false ❌                           │    │
  │  │                                                      │    │
  │  │  LẦN 2 — Resume (nhấn "Tiếp tục upload"):          │    │
  │  │  filter(c => !c.uploaded) → [chunk_3, chunk_4, chunk_5]│  │
  │  │  → CHỈ upload 3 chunks còn lại! ★                  │    │
  │  │  → chunk_0, 1, 2 KHÔNG upload lại!                  │    │
  │  │                                                      │    │
  │  │  chunk_3: uploaded=true  ✅                           │    │
  │  │  chunk_4: uploaded=true  ✅                           │    │
  │  │  chunk_5: uploaded=true  ✅                           │    │
  │  │                                                      │    │
  │  │  → TẤT CẢ uploaded=true → gọi /merge! ★           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CODE:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ async function continueUpload() {                     │    │
  │  │   // Nếu chưa có dữ liệu → bỏ qua!               │    │
  │  │   if (chunks.length === 0 || !fileHash || !fileName) {│    │
  │  │     return;                                           │    │
  │  │   }                                                   │    │
  │  │                                                      │    │
  │  │   try {                                               │    │
  │  │     // ★ CHỈ upload chunks CHƯA thành công!         │    │
  │  │     await uploadChunks(                               │    │
  │  │       chunks.filter(chunk => !chunk.uploaded)          │    │
  │  │     );                                                │    │
  │  │     // Tất cả xong → merge!                        │    │
  │  │     await mergeRequest(fileHash, fileName);           │    │
  │  │   } catch (err) {                                     │    │
  │  │     return { msg: "Upload lỗi!", success: false }    │    │
  │  │   }                                                   │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ĐÓNG GÓI (bigFileUpload.js):                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Export cho bên ngoài dùng!                        │    │
  │  │ export default {                                      │    │
  │  │   uploadFile,      // Upload mới!                    │    │
  │  │   continueUpload   // Tiếp tục upload!               │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ // Sử dụng (operate.js):                              │    │
  │  │ import bigUpload from './bigFileUpload.js'            │    │
  │  │                                                      │    │
  │  │ uploadBtn.addEventListener('click', async () => {     │    │
  │  │   let file = fileInput.files[0];                      │    │
  │  │   bigUpload.uploadFile(file);                         │    │
  │  │ });                                                   │    │
  │  │                                                      │    │
  │  │ continueBtn.addEventListener('click', async () => {   │    │
  │  │   bigUpload.continueUpload();                         │    │
  │  │ });                                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. Tự Viết — Simulator Engine!

> **Mục tiêu**: Viết LẠI bằng tay TOÀN BỘ core engine!
> KHÔNG dùng thư viện bên thứ 3 — TỰ VIẾT!

```javascript
// ============================================================
// LARGE FILE UPLOAD SIMULATOR — Tự viết bằng tay!
// Mô phỏng CHÍNH XÁC toàn bộ pipeline upload file lớn!
// ============================================================

// ──────────────────────────────────────────────────────────────
// 1. FILE HASHER — Tính hash file (thay thế SparkMD5!)
// Dùng Web Crypto API (built-in browser!)
// ──────────────────────────────────────────────────────────────

class FileHasher {
  // Tính SHA-256 hash của file (browser native!)
  static async hash(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async function (e) {
        const buffer = e.target.result;

        // ★ Web Crypto API — BUILT-IN, KHÔNG cần thư viện!
        // crypto.subtle.digest('SHA-256', buffer) → ArrayBuffer
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);

        // ArrayBuffer → Hex String!
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        resolve(hashHex);
      };
    });
  }

  // ★ GIẢI THÍCH TỪNG BƯỚC:
  // FileReader.readAsArrayBuffer(file)
  //   → Đọc file binary thành ArrayBuffer!
  //   → ArrayBuffer = vùng nhớ chứa raw bytes!
  //
  // crypto.subtle.digest('SHA-256', buffer)
  //   → Built-in browser API!
  //   → Tính SHA-256 hash → trả ArrayBuffer!
  //   → KHÔNG cần import thư viện! ★
  //
  // new Uint8Array(hashBuffer)
  //   → Chuyển ArrayBuffer thành mảng bytes!
  //   → Mỗi phần tử = 1 byte (0-255)!
  //
  // .toString(16).padStart(2, '0')
  //   → Byte → Hex: 255 → 'ff', 10 → '0a'!
  //   → padStart(2, '0') → đảm bảo 2 ký tự!
  //
  // .join('')
  //   → Nối tất cả hex → "a1b2c3d4e5f6..."!
  //   → 64 ký tự hex = SHA-256 hash!
}

// ──────────────────────────────────────────────────────────────
// 2. FILE SLICER — Cắt lát file!
// ──────────────────────────────────────────────────────────────

class FileSlicer {
  constructor(chunkSize = 1024 * 1024) {
    // Mặc định 1MB!
    this.chunkSize = chunkSize;
  }

  // Cắt file thành mảng chunks!
  slice(file, fileHash) {
    const chunks = [];
    let start = 0;
    let index = 0;

    while (start < file.size) {
      // Blob.prototype.slice(start, end)!
      // File kế thừa Blob → có method slice!
      const blob = file.slice(start, start + this.chunkSize);

      chunks.push({
        file: blob, // Blob data con!
        uploaded: false, // Trạng thái upload!
        chunkIndex: index, // Index để merge đúng thứ tự!
        fileHash: fileHash, // Hash file gốc!
      });

      start += this.chunkSize;
      index++;
    }

    return chunks;
  }

  // ★ GIẢI THÍCH:
  // file.size → kích thước file (bytes)!
  // file.slice(0, 1MB) → Blob con 0-1MB!
  // file.slice(1MB, 2MB) → Blob con 1-2MB!
  // uploaded: false → dùng cho RESUME!
  // chunkIndex → server merge ĐÚNG THỨ TỰ!
}

// ──────────────────────────────────────────────────────────────
// 3. UPLOAD MANAGER — Quản lý upload với giới hạn đồng thời!
// ──────────────────────────────────────────────────────────────

class UploadManager {
  constructor(baseUrl = "", maxConcurrent = 6) {
    this.baseUrl = baseUrl;
    this.maxConcurrent = maxConcurrent;
  }

  // Upload 1 chunk!
  async uploadChunk(chunk) {
    const fd = new FormData();
    fd.append("file", chunk.file);
    fd.append("fileHash", chunk.fileHash);
    fd.append("chunkIndex", chunk.chunkIndex);

    // ★ KHÔNG set Content-Type!
    // FormData tự thêm Content-Type: multipart/form-data
    // kèm boundary (ranh giới giữa các fields)!
    // Nếu tự set → browser KHÔNG thêm boundary → LỖI!

    const result = await fetch(`${this.baseUrl}/upload`, {
      method: "POST",
      body: fd,
    }).then((r) => r.json());

    chunk.uploaded = true; // Đánh dấu thành công!
    return result;
  }

  // Upload hàng loạt — GIỚI HẠN ĐỒNG THỜI!
  async uploadAll(chunks) {
    // Lọc chunks chưa upload (cho resume!)
    const pending = chunks.filter((c) => !c.uploaded);

    if (pending.length === 0) return [];

    // ★ Chia thành nhóm (batches)!
    // Mỗi nhóm upload ĐỒNG THỜI (Promise.all)!
    // Nhóm sau chờ nhóm trước xong!
    const batches = [];
    for (let i = 0; i < pending.length; i += this.maxConcurrent) {
      batches.push(pending.slice(i, i + this.maxConcurrent));
    }

    const results = [];
    for (const batch of batches) {
      // Promise.all → upload 6 chunks CÙNG LÚC!
      const batchResults = await Promise.all(
        batch.map((chunk) => this.uploadChunk(chunk)),
      );
      results.push(...batchResults);
    }

    return results;
  }

  // ★ GIẢI THÍCH uploadAll:
  // 500 chunks, maxConcurrent=6:
  //
  // Batch 1: [c0,c1,c2,c3,c4,c5] → Promise.all (6 đồng thời!)
  //   → Chờ tất cả 6 xong!
  // Batch 2: [c6,c7,c8,c9,c10,c11] → Promise.all
  //   → Chờ tất cả 6 xong!
  // ...
  // Batch 84: [c498,c499] → Promise.all (2 cuối!)
  //
  // TẠI SAO maxConcurrent=6?
  // → HTTP/1.1 browser giới hạn 6 kết nối/domain!
  // → Gửi 100 request → chỉ 6 chạy, 94 chờ hàng đợi!
  // → 6 = tối ưu nhất cho hầu hết trường hợp!
  //
  // TẠI SAO for...of thay vì Promise.all tất cả?
  // → Promise.all(500 chunks) → 500 requests CÙNG LÚC!
  // → Server QUÁI TẢI! ❌
  // → Chia nhóm 6 → kiểm soát được tải! ✅

  // Gọi merge API!
  async merge(fileHash, fileName) {
    return fetch(
      `${this.baseUrl}/merge?fileHash=${fileHash}&fileName=${fileName}`,
    ).then((r) => r.json());
  }

  // Gọi verify API!
  async verify(fileHash, fileName) {
    return fetch(
      `${this.baseUrl}/verify?fileHash=${fileHash}&fileName=${fileName}`,
    ).then((r) => r.json());
  }
}

// ──────────────────────────────────────────────────────────────
// 4. BIG FILE UPLOADER — Gộp tất cả thành 1 class!
// ──────────────────────────────────────────────────────────────

class BigFileUploader {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 1024 * 1024; // 1MB
    this.maxConcurrent = options.maxConcurrent || 6;
    this.baseUrl = options.baseUrl || "";

    // State!
    this.chunks = [];
    this.fileHash = "";
    this.fileName = "";

    // Helpers!
    this.slicer = new FileSlicer(this.chunkSize);
    this.manager = new UploadManager(this.baseUrl, this.maxConcurrent);
  }

  // ★ UPLOAD FILE CHÍNH!
  async uploadFile(file) {
    // ① Lưu tên file!
    this.fileName = file.name;

    // ② Tính hash!
    this.fileHash = await FileHasher.hash(file);

    // ③ Verify — file đã tồn tại?
    const { exitFile } = await this.manager.verify(
      this.fileHash,
      this.fileName,
    );

    if (exitFile) {
      // ★ INSTANT UPLOAD — 0 byte gửi đi!
      return { msg: "File đã tồn tại!", success: true };
    }

    // ④ Cắt lát file!
    this.chunks = this.slicer.slice(file, this.fileHash);

    // ⑤ Upload từng chunk!
    try {
      await this.manager.uploadAll(this.chunks);
      // ⑥ Merge!
      await this.manager.merge(this.fileHash, this.fileName);
      return { msg: "Upload thành công!", success: true };
    } catch (err) {
      return { msg: "Upload lỗi!", success: false };
    }
  }

  // ★  TIẾP TỤC UPLOAD!
  async continueUpload() {
    if (!this.chunks.length || !this.fileHash || !this.fileName) {
      return;
    }

    try {
      // Chỉ upload chunks CHƯA thành công!
      await this.manager.uploadAll(this.chunks);
      await this.manager.merge(this.fileHash, this.fileName);
      return { msg: "Upload thành công!", success: true };
    } catch (err) {
      return { msg: "Upload lỗi!", success: false };
    }
  }
}

// ══════════════════════════════════════════════════════════════
// 5. SERVER — Tự viết bằng tay (thay Express + multer!)
// Dùng Node.js built-in http module!
// ══════════════════════════════════════════════════════════════

import http from "http";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

class FileUploadServer {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.uploadDir = options.uploadDir || "./uploadFiles";
    this.staticDir = options.staticDir || "./static";

    // Đảm bảo thư mục tồn tại!
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // ★ PARSE MULTIPART FORM DATA (thay multer!)
  // Multipart format:
  // --boundary\r\n
  // Content-Disposition: form-data; name="fieldName"\r\n
  // \r\n
  // fieldValue\r\n
  // --boundary\r\n
  // Content-Disposition: form-data; name="file"; filename="x"\r\n
  // Content-Type: application/octet-stream\r\n
  // \r\n
  // <binary data>\r\n
  // --boundary--\r\n

  parseMultipart(buffer, boundary) {
    const fields = {};
    let fileData = null;

    // Tách các phần theo boundary!
    const parts = [];
    const boundaryBuf = Buffer.from(`--${boundary}`);
    let pos = 0;

    // Tìm tất cả vị trí boundary!
    const positions = [];
    while (pos < buffer.length) {
      const idx = buffer.indexOf(boundaryBuf, pos);
      if (idx === -1) break;
      positions.push(idx);
      pos = idx + boundaryBuf.length;
    }

    // Parse từng phần!
    for (let i = 0; i < positions.length - 1; i++) {
      const start = positions[i] + boundaryBuf.length + 2; // skip \r\n
      const end = positions[i + 1];
      const partBuf = buffer.slice(start, end - 2); // skip \r\n trước boundary

      // Tìm vị trí header/body separator (\r\n\r\n)!
      const headerEnd = partBuf.indexOf("\r\n\r\n");
      if (headerEnd === -1) continue;

      const headerStr = partBuf.slice(0, headerEnd).toString();
      const body = partBuf.slice(headerEnd + 4);

      // Parse headers!
      const nameMatch = headerStr.match(/name="([^"]+)"/);
      const fileNameMatch = headerStr.match(/filename="([^"]+)"/);

      if (nameMatch) {
        if (fileNameMatch) {
          // Đây là FILE!
          fileData = body;
        } else {
          // Đây là TEXT FIELD!
          fields[nameMatch[1]] = body.toString().trim();
        }
      }
    }

    return { fields, fileData };
  }

  // ★ GIẢI THÍCH parseMultipart:
  // Multipart request body = chuỗi binary phức tạp!
  // Browser tạo boundary NGẪU NHIÊN: "----WebKitFormBoundary..."
  // Mỗi field (text/file) ngăn cách bởi boundary!
  //
  // VD body:
  // ------WebKitFormBoundaryABC\r\n
  // Content-Disposition: form-data; name="fileHash"\r\n
  // \r\n
  // a1b2c3d4\r\n
  // ------WebKitFormBoundaryABC\r\n
  // Content-Disposition: form-data; name="file"; filename="chunk"\r\n
  // Content-Type: application/octet-stream\r\n
  // \r\n
  // <1MB binary data>\r\n
  // ------WebKitFormBoundaryABC--\r\n
  //
  // parseMultipart tìm boundary → tách parts → parse headers + body!

  // READ BODY — Đọc toàn bộ request body!
  readBody(req) {
    return new Promise((resolve) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  // PARSE QUERY — Parse URL query string!
  parseQuery(url) {
    const params = {};
    const queryStr = url.split("?")[1];
    if (!queryStr) return params;
    queryStr.split("&").forEach((pair) => {
      const [key, val] = pair.split("=");
      params[decodeURIComponent(key)] = decodeURIComponent(val);
    });
    return params;
  }

  // HANDLE UPLOAD — POST /upload!
  async handleUpload(req, res) {
    const body = await this.readBody(req);
    const contentType = req.headers["content-type"];
    const boundary = contentType.split("boundary=")[1];

    const { fields, fileData } = this.parseMultipart(body, boundary);
    const { fileHash, chunkIndex } = fields;

    // Tạo thư mục temp!
    const tempDir = path.resolve(this.uploadDir, fileHash);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Lưu chunk!
    const chunkPath = path.resolve(tempDir, chunkIndex);
    if (!fs.existsSync(chunkPath) && fileData) {
      fs.writeFileSync(chunkPath, fileData);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ msg: "Upload thành công", success: true }));
  }

  // HANDLE MERGE — GET /merge!
  handleMerge(req, res) {
    const { fileHash, fileName } = this.parseQuery(req.url);
    const ext = path.extname(fileName);
    const filePath = path.resolve(this.uploadDir, fileHash + ext);
    const tempDir = path.resolve(this.uploadDir, fileHash);

    if (!fs.existsSync(tempDir)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ msg: "Temp thư mục không tồn tại", success: false }),
      );
      return;
    }

    const chunkFiles = fs.readdirSync(tempDir);

    // Ghép THEO THỨ TỰ!
    for (let i = 0; i < chunkFiles.length; i++) {
      const chunkPath = path.resolve(tempDir, i + "");
      if (fs.existsSync(chunkPath)) {
        fs.appendFileSync(filePath, fs.readFileSync(chunkPath));
        fs.unlinkSync(chunkPath); // Xóa chunk đã merge!
      }
    }

    // Xóa thư mục temp! (đệ quy!)
    fs.rmdirSync(tempDir);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ msg: "Merge thành công", success: true }));
  }

  // HANDLE VERIFY — GET /verify!
  handleVerify(req, res) {
    const { fileHash, fileName } = this.parseQuery(req.url);
    const ext = path.extname(fileName);
    const filePath = path.resolve(this.uploadDir, fileHash + ext);
    const exitFile = fs.existsSync(filePath);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ exitFile }));
  }

  // SERVE STATIC — Phục vụ file tĩnh (thay express.static!)
  serveStatic(req, res) {
    let filePath = path.join(
      this.staticDir,
      req.url === "/" ? "/index.html" : req.url,
    );

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    // MIME types!
    const mimeTypes = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
    };
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || "application/octet-stream";

    const data = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  }

  // START SERVER!
  start() {
    const server = http.createServer(async (req, res) => {
      // CORS headers!
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST");

      const url = req.url.split("?")[0]; // Path without query!

      if (req.method === "POST" && url === "/upload") {
        await this.handleUpload(req, res);
      } else if (req.method === "GET" && url === "/merge") {
        this.handleMerge(req, res);
      } else if (req.method === "GET" && url === "/verify") {
        this.handleVerify(req, res);
      } else {
        this.serveStatic(req, res);
      }
    });

    server.listen(this.port, () => {
      console.log(`Server chạy: http://localhost:${this.port}`);
    });
  }
}

// KHỞI ĐỘNG!
const server = new FileUploadServer({
  port: 3000,
  uploadDir: "./uploadFiles",
  staticDir: "./static",
});
server.start();
```

```
  SƠ ĐỒ QUAN HỆ CÁC CLASS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FRONTEND:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  FileHasher (Thay SparkMD5)                           │    │
  │  │    → crypto.subtle.digest('SHA-256') ★               │    │
  │  │    → Browser BUILT-IN! Không import gì!              │    │
  │  │                                                      │    │
  │  │  FileSlicer (Blob.slice)                              │    │
  │  │    → Cắt file thành chunks[]!                       │    │
  │  │    → Mỗi chunk: { file, uploaded, chunkIndex, hash }│    │
  │  │                                                      │    │
  │  │  UploadManager (Thay fetch + Promise)                 │    │
  │  │    → uploadChunk() / uploadAll()                     │    │
  │  │    → Giới hạn đồng thời maxConcurrent=6!          │    │
  │  │    → verify() / merge()                              │    │
  │  │                                                      │    │
  │  │  BigFileUploader (Gộp tất cả!)                      │    │
  │  │    → uploadFile(file) = Full pipeline!                │    │
  │  │    → continueUpload() = Resume!                      │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BACKEND:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  FileUploadServer (Thay Express + multer!)            │    │
  │  │    → http.createServer() — Node.js built-in!        │    │
  │  │    → parseMultipart() — tự parse form data! ★       │    │
  │  │    → handleUpload() / handleMerge() / handleVerify() │    │
  │  │    → serveStatic() — phục vụ file tĩnh!             │    │
  │  │    → readBody() / parseQuery() — tự viết! ★        │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. Các Hướng Tối Ưu Thêm!

```
  HƯỚNG TỐI ƯU:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FRONTEND:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1. HASH LẤY MẪU (Sampling Hash):                     │    │
  │  │    → File 1GB → hash TOÀN BỘ = RẤT CHẬM!          │    │
  │  │    → Giải pháp: hash MẪU (sampling)!                │    │
  │  │    → Lấy 2MB đầu + 2MB cuối + vài mẫu giữa!     │    │
  │  │    → Hash nhanh hơn 10x-100x! ★                    │    │
  │  │                                                      │    │
  │  │ 2. WEB WORKER:                                        │    │
  │  │    → Tính hash trong Worker thread!                  │    │
  │  │    → Không block UI! → UX mượt mà!               │    │
  │  │                                                      │    │
  │  │ 3. PROGRESS BAR:                                      │    │
  │  │    → Đếm chunks uploaded / total chunks!            │    │
  │  │    → progress = (uploaded / total) * 100!             │    │
  │  │                                                      │    │
  │  │ 4. RETRY LOGIC:                                       │    │
  │  │    → Chunk upload fail → retry 3 lần!              │    │
  │  │    → Exponential backoff (1s, 2s, 4s)!                │    │
  │  │                                                      │    │
  │  │ 5. CLASS-BASED ENCAPSULATION:                         │    │
  │  │    → new BigUploader({ chunkSize, maxConcurrent })    │    │
  │  │    → Đảm bảo data independence giữa các instances! │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BACKEND:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1. USER IP + HASH:                                    │    │
  │  │    → Verify: hash + IP → đảm bảo uniqueness!      │    │
  │  │    → 2 user upload cùng file → 2 bản riêng!       │    │
  │  │                                                      │    │
  │  │ 2. DỌN DẸP TEMP:                                     │    │
  │  │    → Cron job xóa thư mục temp quá 24h!            │    │
  │  │    → Tránh disk đầy!                               │    │
  │  │                                                      │    │
  │  │ 3. STREAM MERGE:                                      │    │
  │  │    → appendFileSync → ĐỒNG BỘ! Block server!      │    │
  │  │    → Dùng createReadStream + createWriteStream!       │    │
  │  │    → pipe() → async, không block! ★                │    │
  │  │                                                      │    │
  │  │ 4. DATABASE TRACKING:                                 │    │
  │  │    → Lưu thông tin upload vào DB!                   │    │
  │  │    → Biết chunk nào đã upload → server-side resume! │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §12. Câu Hỏi Luyện Tập!

```
  CÂU HỎI PHỎNG VẤN — LARGE FILE UPLOAD:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ CÂU 1: Tại sao cần cắt lát file lớn khi upload?           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Upload cả file 1GB = 1 request KHỔNG LỒ!        │    │
  │  │ → Server quá tải (storage + bandwidth!)              │    │
  │  │ → Mất kết nối → mất TOÀN BỘ → upload lại!      │    │
  │  │ → Nginx mặc định giới hạn 1MB!                     │    │
  │  │ → Cắt lát: giảm tải, retry từng phần, resume! ★  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 2: Blob.slice() hoạt động thế nào?                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → File extends Blob!                                 │    │
  │  │ → Blob.slice(start, end) = cắt Blob con!            │    │
  │  │ → Giống Array.slice() nhưng cho BINARY DATA!        │    │
  │  │ → KHÔNG copy data! Chỉ tạo reference! ★            │    │
  │  │ → Nhẹ, nhanh, không tốn memory!                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 3: Instant Upload hoạt động thế nào?                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Tính HASH file trước (MD5/SHA-256)!               │    │
  │  │ → Gửi hash lên server: "File này đã có chưa?"     │    │
  │  │ → Server kiểm tra: fileHash.ext tồn tại?           │    │
  │  │ → CÓ → return "Đã tồn tại!" → 0 byte upload! ★ │    │
  │  │ → KHÔNG → tiếp tục quy trình cắt lát + upload!   │    │
  │  │ → "Instant" = chỉ gửi hash (32 bytes)! 🚀          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 4: FormData gửi multipart/form-data thế nào?           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → new FormData() tạo object chứa key-value!        │    │
  │  │ → fd.append('file', blob) → thêm binary data!      │    │
  │  │ → fd.append('fileHash', 'abc') → thêm text field!  │    │
  │  │ → fetch({ body: fd }) → browser tự set header!     │    │
  │  │ → Content-Type: multipart/form-data; boundary=xxx    │    │
  │  │ → ★ KHÔNG tự set Content-Type! Browser thêm boundary│   │
  │  │ → Nếu tự set → mất boundary → server lỗi! ❌    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 5: Tại sao giới hạn 6 kết nối đồng thời?            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → HTTP/1.1: browser giới hạn 6 connections/domain! │    │
  │  │ → Gửi 100 requests → chỉ 6 chạy, 94 chờ!        │    │
  │  │ → request thứ 7+ bị QUEUED (xếp hàng)!             │    │
  │  │ → 6 = tối ưu → tận dụng hết bandwidth!            │    │
  │  │ → > 6 = KHÔNG nhanh hơn, CHỈ tốn memory!          │    │
  │  │ → HTTP/2 multiplexing → có thể tăng lên! ★       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 6: Resume upload hoạt động thế nào?                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Mỗi chunk: { uploaded: true/false }!              │    │
  │  │ → Upload OK → uploaded = true!                      │    │
  │  │ → Upload FAIL → uploaded VẪN = false!               │    │
  │  │ → Resume: chunks.filter(c => !c.uploaded) ★          │    │
  │  │ → CHỈ upload chunks chưa xong!                      │    │
  │  │ → Chunks ĐÃ xong → SKIP (không upload lại!)       │    │
  │  │ → Tất cả uploaded=true → gọi /merge!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 7: Server merge file thế nào?                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Chunks lưu trong thư mục: uploadFiles/{hash}/    │    │
  │  │ → File tên = chunkIndex: 0, 1, 2, 3, ...!           │    │
  │  │ → Merge: đọc từng chunk THEO THỨ TỰ (0→1→2...)! │    │
  │  │ → appendFileSync(filePath, readFileSync(chunkPath))  │    │
  │  │ → Nối binary chunk vào file đích!                   │    │
  │  │ → Xóa chunk sau khi merge!                          │    │
  │  │ → Xóa thư mục temp khi hoàn tất! ★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 8: crypto.subtle.digest khác SparkMD5 thế nào?         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → SparkMD5: thư viện BÊN NGOÀI, tính MD5!          │    │
  │  │ → crypto.subtle.digest: BROWSER BUILT-IN! ★        │    │
  │  │ → crypto hỗ trợ: SHA-1, SHA-256, SHA-384, SHA-512! │    │
  │  │ → KHÔNG cần import, KHÔNG cần cài đặt!             │    │
  │  │ → Trả về Promise<ArrayBuffer>!                      │    │
  │  │ → Phải convert: ArrayBuffer → Uint8Array → Hex!    │    │
  │  │ → SHA-256 an toàn hơn MD5 (collision-resistant)! ★ │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 9: Tự viết parseMultipart thế nào?                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Multipart body = nhiều phần ngăn cách bởi boundary│   │
  │  │ → Boundary lấy từ Content-Type header!              │    │
  │  │ → Tìm tất cả vị trí boundary trong buffer!        │    │
  │  │ → Giữa 2 boundary = 1 phần (field/file)!            │    │
  │  │ → Header và body ngăn cách bởi \r\n\r\n!            │    │
  │  │ → Header chứa name="fieldName" hoặc filename="x"!   │    │
  │  │ → Có filename → FILE (binary)!                      │    │
  │  │ → Không filename → TEXT FIELD! ★                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 10: Hash lấy mẫu (Sampling) là gì?                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → File 2GB → hash TOÀN BỘ = CỰC CHẬM!            │    │
  │  │ → Sampling: CHỈ hash 1 phần file!                   │    │
  │  │ → VD: 2MB đầu + 2MB cuối + vài mẫu giữa!        │    │
  │  │ → Nhanh hơn 10x-100x!                               │    │
  │  │ → Trade-off: xác suất collision CAO hơn!            │    │
  │  │ → Nhưng thực tế: đủ chính xác cho upload! ★       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
