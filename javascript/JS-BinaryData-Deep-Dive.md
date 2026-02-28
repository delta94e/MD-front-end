# JavaScript Binary Data — Deep Dive!

> **Blob, File, FileReader, ArrayBuffer, Base64, Object URL**
> Phân tích cực kỳ chi tiết toàn bộ hệ thống xử lý dữ liệu nhị phân trong JavaScript!

---

## §1. Sơ Đồ Quan Hệ Tổng Quan!

```
  QUAN HỆ GIỮA CÁC API BINARY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │                     ┌──────────────┐                         │
  │                     │  Object URL  │                         │
  │                     └──────┬───────┘                         │
  │                            ↑ URL.createObjectURL()           │
  │                            │                                 │
  │  ┌──────┐  kế thừa   ┌────┴─────┐                          │
  │  │ File │ ──────────→ │   Blob   │                          │
  │  └──────┘              └────┬─────┘                          │
  │     ↑                      │ làm tham số                    │
  │     │ <input type="file">  ↓                                │
  │     │ DataTransfer    ┌──────────┐    ┌──────────┐          │
  │     │                 │FileReader│──→ │ Base64   │          │
  │     │                 │          │──→ │ Text     │          │
  │  ┌──────────┐         │          │──→ │BinaryStr │          │
  │  │ArrayBuffer│ ←──────│          │    └──────────┘          │
  │  └────┬─────┘  readAsArrayBuffer()                          │
  │       │                                                      │
  │  ┌────┴──────────────────┐                                  │
  │  │ Cung cấp khả năng   │                                  │
  │  │ đọc/ghi buffer!      │                                  │
  │  ├───────────┬───────────┤                                  │
  │  │ DataView  │TypedArray │                                  │
  │  │           │ Uint8Array│                                  │
  │  │           │ Int16Array│                                  │
  │  │           │ Float32..│                                  │
  │  └───────────┴───────────┘                                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Blob — Binary Large Object!

```
  BLOB:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Blob = Binary Large Object!                           │    │
  │  │ → Đối tượng chứa DỮ LIỆU NHỊ PHÂN thô!           │    │
  │  │ → IMMUTABLE! Không thể thay đổi sau khi tạo! ★    │    │
  │  │ → Giống file nhưng chỉ tồn tại trong MEMORY!       │    │
  │  │ → Dùng để: truyền tải, download, upload file!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠO BLOB:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ new Blob(array, options)                               │    │
  │  │                                                      │    │
  │  │ array: mảng dữ liệu!                                │    │
  │  │ → String, ArrayBuffer, TypedArray, Blob khác!        │    │
  │  │ → Nối THEO THỨ TỰ thành 1 Blob!                    │    │
  │  │                                                      │    │
  │  │ options: { type: "MIME type" }                         │    │
  │  │ → type = loại nội dung!                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BẢNG MIME TYPES PHỔ BIẾN:                                     │
  │  ┌──────────────────────┬──────────────────────────┐        │
  │  │ MIME Type             │ Mô tả                    │        │
  │  ├──────────────────────┼──────────────────────────┤        │
  │  │ text/plain            │ File text thường          │        │
  │  │ text/html             │ File HTML                 │        │
  │  │ text/css              │ File CSS                  │        │
  │  │ text/javascript       │ File JavaScript           │        │
  │  │ application/json      │ File JSON                 │        │
  │  │ application/pdf       │ File PDF                  │        │
  │  │ image/jpeg            │ Ảnh JPEG                 │        │
  │  │ image/png             │ Ảnh PNG                  │        │
  │  │ image/gif             │ Ảnh GIF                  │        │
  │  │ image/svg+xml         │ Ảnh SVG                  │        │
  │  │ audio/mpeg            │ File MP3                  │        │
  │  │ video/mpeg            │ File MP4                  │        │
  │  └──────────────────────┴──────────────────────────┘        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// BLOB — TẠO VÀ SỬ DỤNG!
// ═══════════════════════════════════════════════════════════

// ① Tạo Blob từ string!
const textBlob = new Blob(
  ["Hello World"], // array: dữ liệu!
  { type: "text/plain" }, // options: MIME type!
);
console.log(textBlob.size); // 11 (bytes!)
console.log(textBlob.type); // "text/plain"

// ② Tạo Blob từ JSON!
const jsonData = { name: "Nguyễn Văn A", age: 25 };
const jsonBlob = new Blob([JSON.stringify(jsonData)], {
  type: "application/json",
});

// ③ Tạo Blob từ NHIỀU phần!
const multiBlob = new Blob(
  ["Phần 1", " + ", "Phần 2"], // NỐI THEO THỨ TỰ!
  { type: "text/plain" },
);
// → "Phần 1 + Phần 2" ★

// ④ Tạo Blob từ HTML!
const htmlBlob = new Blob(["<h1>Xin Chào!</h1><p>Đây là HTML blob</p>"], {
  type: "text/html",
});

// ═══════════════════════════════════════════════════════════
// BLOB.SLICE() — CẮT LÁT BLOB!
// ═══════════════════════════════════════════════════════════

// blob.slice(start, end, contentType)
// → start: vị trí bắt đầu (byte!)
// → end: vị trí kết thúc (byte!)
// → contentType: MIME type mới (tùy chọn!)
// → Trả về BLOB MỚI! (Blob gốc KHÔNG thay đổi!)

const fullBlob = new Blob(["Hello World"], { type: "text/plain" });
const sliced = fullBlob.slice(0, 5); // Blob("Hello")

// ★ ỨNG DỤNG: CẮT FILE LỚN THÀNH CHUNKS!
// (Đây là nền tảng của Large File Upload!)
function sliceFile(file, chunkSize) {
  const chunks = [];
  let start = 0;
  while (start < file.size) {
    // file.slice() → vì File kế thừa Blob!
    chunks.push(file.slice(start, start + chunkSize));
    start += chunkSize;
  }
  return chunks;
}

// ★ THUỘC TÍNH CỦA BLOB:
// blob.size → kích thước (bytes!)
// blob.type → MIME type (string!)
// blob.slice() → cắt lát! (trả Blob mới!)
// blob.text() → đọc thành string! (Promise!)
// blob.arrayBuffer() → đọc thành ArrayBuffer! (Promise!)
// blob.stream() → đọc thành ReadableStream!
```

---

## §3. File — Blob Đặc Biệt!

```
  FILE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ File = BLOB ĐẶC BIỆT! ★                             │    │
  │  │ → File KẾ THỪA (extends) Blob!                      │    │
  │  │ → Có TẤT CẢ thuộc tính/method của Blob!            │    │
  │  │ → THÊM: name, lastModified!                          │    │
  │  │ → Đại diện cho file THỰC TẾ từ user!               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH LẤY FILE:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① <input type="file"> → e.target.files (FileList!) │    │
  │  │ ② Drag & Drop → e.dataTransfer.files (FileList!)   │    │
  │  │ ③ new File(bits, name, options) → tạo thủ công!   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ KẾ THỪA:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Blob                                                 │    │
  │  │  ├── size (bytes!)                                   │    │
  │  │  ├── type (MIME!)                                    │    │
  │  │  ├── slice(start, end)                               │    │
  │  │  ├── text() → Promise<string>                       │    │
  │  │  └── arrayBuffer() → Promise<ArrayBuffer>           │    │
  │  │       ↑                                               │    │
  │  │       │ KẾ THỪA!                                     │    │
  │  │       │                                               │    │
  │  │  File (extends Blob!)                                 │    │
  │  │  ├── name (tên file!) ★                             │    │
  │  │  ├── lastModified (timestamp!) ★                    │    │
  │  │  ├── lastModifiedDate (Date object!)                 │    │
  │  │  └── webkitRelativePath (đường dẫn tương đối!)    │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// FILE — LẤY VÀ SỬ DỤNG!
// ═══════════════════════════════════════════════════════════

// ① CÁCH 1: <input type="file">
// HTML: <input type="file" id="fileInput" multiple>
const fileInput = document.getElementById("fileInput");
fileInput.onchange = (e) => {
  const files = e.target.files; // FileList! (giống mảng!)
  const file = files[0]; // File object đầu tiên!

  console.log(file.name); // "photo.jpg"
  console.log(file.size); // 1048576 (bytes!)
  console.log(file.type); // "image/jpeg"
  console.log(file.lastModified); // 1701234567890 (timestamp!)

  // File KẾ THỪA Blob → có thể slice()!
  const firstMB = file.slice(0, 1024 * 1024);
};

// ② CÁCH 2: Drag & Drop!
// HTML: <div id="drop-zone">Thả file vào đây!</div>
const dropZone = document.getElementById("drop-zone");

dropZone.ondragover = (e) => {
  e.preventDefault(); // ★ BẮT BUỘC! Cho phép drop!
};

dropZone.ondrop = (e) => {
  e.preventDefault(); // ★ BẮT BUỘC! Ngăn browser mở file!
  const files = e.dataTransfer.files; // FileList!
  console.log(files[0].name); // tên file kéo thả!
};
// ★ CẢ HAI e.preventDefault() ĐỀU CẦN!
// → ondragover: cho phép drop (mặc định browser KHÔNG cho!)
// → ondrop: ngăn browser mở file trong tab mới!

// ③ CÁCH 3: Tạo thủ công!
const myFile = new File(
  ["Nội dung file!"], // bits: dữ liệu!
  "hello.txt", // name: tên file!
  { type: "text/plain", lastModified: Date.now() },
);
```

---

## §4. FileReader — Đọc File/Blob!

```
  FILEREADER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ FileReader = API KHÔNG ĐỒNG BỘ đọc file! ★          │    │
  │  │ → Đọc Blob/File → chuyển sang FORMAT KHÁC!         │    │
  │  │ → Kết quả lưu trong reader.result!                  │    │
  │  │ → Bất đồng bộ → dùng EVENT (onload)!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁC METHOD ĐỌC:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ readAsArrayBuffer(blob)                               │    │
  │  │ → result = ArrayBuffer (binary thô!)                 │    │
  │  │ → Dùng khi: thao tác binary, tính hash! ★          │    │
  │  │                                                      │    │
  │  │ readAsBinaryString(blob)                              │    │
  │  │ → result = chuỗi nhị phân thô!                     │    │
  │  │ → Ít dùng! Nên dùng ArrayBuffer thay thế!          │    │
  │  │                                                      │    │
  │  │ readAsDataURL(blob)                                   │    │
  │  │ → result = "data:MIME;base64,XXXXXX" ★              │    │
  │  │ → Dùng khi: preview ảnh, gán src cho <img>!       │    │
  │  │                                                      │    │
  │  │ readAsText(blob, encoding?)                           │    │
  │  │ → result = chuỗi text (UTF-8 mặc định!)            │    │
  │  │ → Dùng khi: đọc file .txt, .json, .csv!            │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ INPUT → OUTPUT:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Blob/File ──→ FileReader ──→ ?                      │    │
  │  │                    │                                  │    │
  │  │                    ├── readAsArrayBuffer() → ArrayBuffer│  │
  │  │                    ├── readAsDataURL()     → Base64     │  │
  │  │                    ├── readAsText()        → String     │  │
  │  │                    └── readAsBinaryString()→ BinaryStr  │  │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EVENTS:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ onload    → đọc XONG! (thành công!) ★              │    │
  │  │ onerror   → đọc LỖI!                                │    │
  │  │ onabort   → đọc BỊ HỦY!                            │    │
  │  │ onprogress→ đang đọc! (loaded, total!) ★           │    │
  │  │ onloadstart → bắt đầu đọc!                        │    │
  │  │ onloadend → kết thúc (kể cả lỗi/hủy!)            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// FILEREADER — ĐỌC FILE THEO NHIỀU CÁCH!
// ═══════════════════════════════════════════════════════════

// ① readAsText — Đọc thành chuỗi text!
function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8"); // encoding mặc định!

    reader.onload = (e) => {
      resolve(e.target.result); // result = string!
    };
    reader.onerror = (e) => {
      reject(e.target.error);
    };
  });
}
// Sử dụng:
// const text = await readAsText(jsonFile);
// const data = JSON.parse(text); // parse JSON!

// ② readAsDataURL — Đọc thành Base64! (Preview ảnh!)
function previewImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      // result = "data:image/jpeg;base64,/9j/4AAQ..."
      resolve(e.target.result); // Data URL! ★
    };
  });
}
// Sử dụng: gán src cho <img>!
// const img = document.createElement('img');
// img.src = await previewImage(file); ← hiển thị ảnh!

// ③ readAsArrayBuffer — Đọc thành binary buffer!
function readAsBuffer(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = (e) => {
      const buffer = e.target.result; // ArrayBuffer!
      resolve(buffer);
    };
  });
}
// Sử dụng: tính HASH file!
// const buffer = await readAsBuffer(file);
// const hash = await crypto.subtle.digest('SHA-256', buffer);

// ④ PROGRESS — Theo dõi tiến trình đọc!
function readWithProgress(file) {
  const reader = new FileReader();

  reader.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      console.log(`Đang đọc: ${percent.toFixed(1)}%`);
    }
  };

  reader.onload = () => console.log("Đọc xong!");
  reader.readAsArrayBuffer(file);
}
```

---

## §5. ArrayBuffer — Bộ Đệm Nhị Phân!

```
  ARRAYBUFFER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ArrayBuffer = vùng nhớ chứa DỮ LIỆU NHỊ PHÂN THÔ!  │    │
  │  │ → Kích thước CỐ ĐỊNH! Không thay đổi sau tạo!     │    │
  │  │ → KHÔNG THỂ đọc/ghi TRỰC TIẾP! ★                  │    │
  │  │ → Phải dùng VIEW (DataView / TypedArray)!            │    │
  │  │ → ArrayBuffer = "HỘP ĐEN" chứa bytes!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ARRAYBUFFER vs BLOB:                                           │
  │  ┌──────────────────────┬──────────────────────────────┐    │
  │  │ Blob                 │ ArrayBuffer                   │    │
  │  ├──────────────────────┼──────────────────────────────┤    │
  │  │ IMMUTABLE!            │ CÓ THỂ đọc/ghi (qua view)! │    │
  │  │ Phù hợp TRUYỀN TẢI! │ Phù hợp THAO TÁC dữ liệu! │    │
  │  │ Đại diện cho FILE!  │ Đại diện cho MEMORY!         │    │
  │  │ Upload, download!    │ Chỉnh sửa binary!           │    │
  │  └──────────────────────┴──────────────────────────────┘    │
  │                                                              │
  │  TYPED ARRAY — CÁC LOẠI VIEW:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ArrayBuffer (raw bytes!)                              │    │
  │  │       │                                               │    │
  │  │  ┌────┴─────────────────┐                              │    │
  │  │  │     TypedArray       │ ← "Kính" nhìn buffer!     │    │
  │  │  ├──────────────────────┤                              │    │
  │  │  │ Int8Array     (1B)   │ số nguyên có dấu 8-bit!   │    │
  │  │  │ Uint8Array    (1B)   │ số nguyên không dấu 8-bit!│    │
  │  │  │ Uint8ClampedArray(1B)│ clamped 0-255 (canvas!)    │    │
  │  │  │ Int16Array    (2B)   │ số nguyên 16-bit!          │    │
  │  │  │ Uint16Array   (2B)   │ không dấu 16-bit!         │    │
  │  │  │ Int32Array    (4B)   │ số nguyên 32-bit!          │    │
  │  │  │ Uint32Array   (4B)   │ không dấu 32-bit!         │    │
  │  │  │ Float32Array  (4B)   │ số thực 32-bit!            │    │
  │  │  │ Float64Array  (8B)   │ số thực 64-bit!            │    │
  │  │  └──────────────────────┘                              │    │
  │  │                                                      │    │
  │  │  DataView                                              │    │
  │  │  → Linh hoạt hơn! Tùy chỉnh format + byte order!  │    │
  │  │  → getInt8(), getUint16(), getFloat32(), ...          │    │
  │  │  → Chỉ định endianness (Big/Little Endian)!         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// ARRAYBUFFER + TYPED ARRAY!
// ═══════════════════════════════════════════════════════════

// ① Tạo ArrayBuffer!
const buffer = new ArrayBuffer(16); // 16 bytes!
console.log(buffer.byteLength); // 16

// ② KHÔNG THỂ đọc trực tiếp!
// console.log(buffer[0]); → undefined! ★
// → Phải dùng VIEW!

// ③ Dùng Uint8Array (mỗi phần tử = 1 byte!)
const view8 = new Uint8Array(buffer);
view8[0] = 72; // 'H' = 72 (ASCII!)
view8[1] = 101; // 'e' = 101
view8[2] = 108; // 'l' = 108
console.log(view8); // Uint8Array [72, 101, 108, 0, 0, ...]

// ④ Dùng Int32Array (mỗi phần tử = 4 bytes!)
const view32 = new Int32Array(buffer);
// 16 bytes / 4 bytes = 4 phần tử!
console.log(view32.length); // 4

// ⑤ DataView — linh hoạt hơn!
const dv = new DataView(buffer);
dv.setInt8(0, 42); // ghi 42 tại byte 0!
dv.setUint16(1, 1000, true); // ghi 1000 tại byte 1 (little-endian!)
console.log(dv.getInt8(0)); // 42

// ═══════════════════════════════════════════════════════════
// CHUYỂN ĐỔI: ArrayBuffer ↔ String ↔ Blob!
// ═══════════════════════════════════════════════════════════

// String → ArrayBuffer (TextEncoder!)
function stringToBuffer(str) {
  const encoder = new TextEncoder(); // UTF-8!
  return encoder.encode(str).buffer; // ArrayBuffer!
}

// ArrayBuffer → String (TextDecoder!)
function bufferToString(buffer) {
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(buffer); // string!
}

// ArrayBuffer → Blob
function bufferToBlob(buffer, type) {
  return new Blob([buffer], { type });
}

// Blob → ArrayBuffer
async function blobToBuffer(blob) {
  return await blob.arrayBuffer(); // Promise<ArrayBuffer>!
}

// ArrayBuffer → Hex String (cho hash!)
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

---

## §6. Object URL — Blob URL!

```
  OBJECT URL (BLOB URL):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Object URL = URL TẠM trỏ đến Blob/File trong memory!│   │
  │  │ → Format: "blob:http://localhost/uuid-xxx-yyy" ★    │    │
  │  │ → Dùng làm src cho <img>, <video>, <a>, <script>!   │    │
  │  │ → TẠM THỜI! Chỉ tồn tại khi tab/page còn mở!     │    │
  │  │ → PHẢI giải phóng khi không dùng! (memory leak!) ★ │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  API:                                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ URL.createObjectURL(blob) → tạo Blob URL!           │    │
  │  │ URL.revokeObjectURL(url)  → giải phóng! ★          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ THỰC TẾ — YOUTUBE:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ <video src="blob:https://youtube.com/fd40f316-...">  │    │
  │  │                                                      │    │
  │  │ → YouTube dùng Blob URL cho video! ★                 │    │
  │  │ → Video data → Blob → Blob URL → gán src!         │    │
  │  │ → Không thể copy URL để download!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// OBJECT URL — TẠO VÀ GIẢI PHÓNG!
// ═══════════════════════════════════════════════════════════

// ① Preview ảnh bằng Object URL!
function previewWithObjectURL(file) {
  const url = URL.createObjectURL(file);
  // url = "blob:http://localhost:3000/550e8400-..."

  const img = document.createElement("img");
  img.src = url; // gán Blob URL!
  document.body.appendChild(img);

  // ★ GIẢI PHÓNG khi không cần!
  img.onload = () => {
    URL.revokeObjectURL(url); // Giải phóng memory! ★
  };
}

// ② Download file bằng Object URL!
function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName; // tên file khi download!
  a.click(); // tự động click!
  URL.revokeObjectURL(url); // giải phóng!
}
// Sử dụng:
// const blob = new Blob(["Hello!"], { type: "text/plain" });
// downloadBlob(blob, "hello.txt"); // Download file!

// ③ Object URL vs Data URL (Base64):
// Object URL: "blob:http://..." → NHẸ, NHANH! ★
//   → Chỉ lưu THAM CHIẾU đến Blob!
//   → Cần revokeObjectURL()!
//   → Chỉ tồn tại trong session!
//
// Data URL: "data:image/png;base64,iVBOR..." → NẶNG!
//   → Embed TOÀN BỘ data trong URL!
//   → Không cần giải phóng!
//   → Tồn tại vĩnh viễn (lưu được!)
```

---

## §7. Base64 — Mã Hóa Nhị Phân!

```
  BASE64:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Base64 = cách biểu diễn BINARY bằng 64 ký tự!      │    │
  │  │ → 64 ký tự: A-Z, a-z, 0-9, +, /!                   │    │
  │  │ → Padding: = (cuối chuỗi!)                          │    │
  │  │ → Dùng khi: truyền binary qua kênh TEXT!            │    │
  │  │ → VD: email, JSON, HTML attribute, CSS url()!        │    │
  │  │ → ★ TĂNG 33% kích thước! (3 bytes → 4 chars!)     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NGUYÊN LÝ MÃ HÓA:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Input: "Hi" (2 bytes = 16 bits!)                      │    │
  │  │                                                      │    │
  │  │  H = 72 = 01001000                                    │    │
  │  │  i = 105 = 01101001                                   │    │
  │  │                                                      │    │
  │  │  NỐI LIỀN: 01001000 01101001                          │    │
  │  │                                                      │    │
  │  │  CHIA NHÓM 6-bit: 010010 000110 1001(00)              │    │
  │  │  (Thêm padding 00 cho đủ bội số 6!)                 │    │
  │  │                                                      │    │
  │  │  010010 = 18 → S                                      │    │
  │  │  000110 = 6  → G                                      │    │
  │  │  100100 = 36 → k                                      │    │
  │  │  + padding "=" (vì 2 bytes, thêm 1 =!)               │    │
  │  │                                                      │    │
  │  │  KẾT QUẢ: "SGk=" ★                                    │    │
  │  │  btoa("Hi") = "SGk="                                  │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DATA URL FORMAT:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ data:[MIME type];base64,[Base64 data]                  │    │
  │  │                                                      │    │
  │  │ VD:                                                    │    │
  │  │ data:text/plain;base64,SGVsbG8=                        │    │
  │  │ data:image/png;base64,iVBORw0KGgo...                   │    │
  │  │ data:application/json;base64,eyJuYW1l...               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// BASE64 — MÃ HÓA VÀ GIẢI MÃ!
// ═══════════════════════════════════════════════════════════

// ① Built-in: btoa() / atob()
const encoded = btoa("Hello World"); // "SGVsbG8gV29ybGQ="
const decoded = atob(encoded); // "Hello World"

// ★ btoa() CHỈ hỗ trợ ASCII!
// → btoa("Xin chào") → LỖI! (có ký tự Unicode!) ❌

// ② Hỗ trợ Unicode:
function utf8ToBase64(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str); // UTF-8 bytes!
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToUtf8(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// ③ Canvas → Base64 (toDataURL!)
function canvasToBase64() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, 100, 100);

  // → "data:image/png;base64,iVBORw0KGgo..."
  const dataUrl = canvas.toDataURL("image/png");
  return dataUrl; // Data URL Base64! ★
}

// ④ FileReader → Base64 (readAsDataURL!)
function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    // result = "data:image/jpeg;base64,/9j/4AAQ..." ★
  });
}

// ⑤ Base64 → Blob (tự viết bằng tay!)
function base64ToBlob(dataUrl) {
  // dataUrl = "data:image/png;base64,iVBORw0KGgo..."
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)[1]; // "image/png"
  const binary = atob(base64); // decode Base64!

  // Tạo Uint8Array từ binary string!
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime }); // Blob! ★
}
```

---

## §8. Bảng Chuyển Đổi Toàn Diện!

```
  CHUYỂN ĐỔI GIỮA CÁC KIỂU:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────┬──────────────────────────────────────────┐    │
  │  │ TỪ → ĐẾN │ CÁCH CHUYỂN                              │    │
  │  ├──────────┼──────────────────────────────────────────┤    │
  │  │Blob→Text │ blob.text() hoặc readAsText()            │    │
  │  │Blob→Buf  │ blob.arrayBuffer() hoặc readAsArrayBuffer│    │
  │  │Blob→B64  │ readAsDataURL()                           │    │
  │  │Blob→URL  │ URL.createObjectURL(blob)                 │    │
  │  │Blob→Strm │ blob.stream()                             │    │
  │  ├──────────┼──────────────────────────────────────────┤    │
  │  │File→Blob │ File KẾ THỪA Blob! (đã là Blob!)        │    │
  │  │File→Text │ readAsText(file)                          │    │
  │  │File→Buf  │ readAsArrayBuffer(file)                   │    │
  │  │File→B64  │ readAsDataURL(file)                       │    │
  │  │File→URL  │ URL.createObjectURL(file)                 │    │
  │  ├──────────┼──────────────────────────────────────────┤    │
  │  │Buf→Blob  │ new Blob([buffer], {type})                │    │
  │  │Buf→U8Arr │ new Uint8Array(buffer)                    │    │
  │  │Buf→Str   │ new TextDecoder().decode(buffer)          │    │
  │  │Buf→Hex   │ Array.from(u8).map(b=>b.toString(16))    │    │
  │  ├──────────┼──────────────────────────────────────────┤    │
  │  │Str→Blob  │ new Blob([str], {type:'text/plain'})      │    │
  │  │Str→Buf   │ new TextEncoder().encode(str).buffer      │    │
  │  │Str→B64   │ btoa(str)                                 │    │
  │  ├──────────┼──────────────────────────────────────────┤    │
  │  │B64→Str   │ atob(b64)                                 │    │
  │  │B64→Blob  │ atob() → Uint8Array → new Blob()        │    │
  │  │B64→Buf   │ atob() → Uint8Array → .buffer            │    │
  │  └──────────┴──────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Câu Hỏi Luyện Tập!

```
  CÂU HỎI PHỎNG VẤN — JS BINARY DATA:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ CÂU 1: Blob là gì? Khác File thế nào?                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Blob = Binary Large Object = dữ liệu nhị phân!   │    │
  │  │ → IMMUTABLE! Không thể thay đổi!                    │    │
  │  │ → File KẾ THỪA Blob! File = Blob + name + lastModified│  │
  │  │ → File lấy từ <input> hoặc drag-drop! ★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 2: ArrayBuffer khác Blob thế nào?                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Blob: immutable, phù hợp TRUYỀN TẢI (upload!)    │    │
  │  │ → ArrayBuffer: có thể đọc/ghi qua view!             │    │
  │  │ → ArrayBuffer phù hợp THAO TÁC binary! (sửa data!) │    │
  │  │ → ArrayBuffer cần TypedArray/DataView để đọc/ghi! ★│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 3: Object URL khác Data URL thế nào?                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Object URL: "blob:http://..." = THAM CHIẾU! NHẸ! │    │
  │  │   Cần revokeObjectURL()! Chỉ tồn tại trong session!│    │
  │  │ → Data URL: "data:mime;base64,..." = EMBED dữ liệu!│    │
  │  │   Nặng hơn 33%! Không cần giải phóng! ★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 4: FileReader có những method đọc nào?                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → readAsText() → String (đọc text!)                 │    │
  │  │ → readAsDataURL() → Base64 Data URL (preview ảnh!) │    │
  │  │ → readAsArrayBuffer() → ArrayBuffer (tính hash!)    │    │
  │  │ → readAsBinaryString() → Binary string (ít dùng!)  │    │
  │  │ → Tất cả ĐỌC BẤT ĐỒNG BỘ, kết quả trong onload! ★│  │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 5: Base64 tăng bao nhiêu % kích thước?                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → TĂNG ~33%! ★                                       │    │
  │  │ → 3 bytes binary → 4 ký tự Base64!                  │    │
  │  │ → VD: file 3MB → Base64 ~4MB!                       │    │
  │  │ → Vì 6-bit mã hóa thành 1 ký tự ASCII 8-bit!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 6: Tại sao phải revokeObjectURL()?                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → createObjectURL() tạo THAM CHIẾU đến Blob!       │    │
  │  │ → Browser giữ Blob trong memory!                     │    │
  │  │ → Không revoke → Blob KHÔNG được garbage collected! │    │
  │  │ → GÂY MEMORY LEAK! ★                                 │    │
  │  │ → Revoke = xóa tham chiếu → GC dọn Blob!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 7: Uint8Array dùng để làm gì?                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → View (kính) để đọc/ghi ArrayBuffer!               │    │
  │  │ → Mỗi phần tử = 1 byte (0-255)!                    │    │
  │  │ → Phổ biến nhất trong các TypedArray!                │    │
  │  │ → Dùng: chuyển đổi format, xử lý binary, hash! ★  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 8: btoa() có hỗ trợ Unicode không?                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → KHÔNG! btoa() chỉ hỗ trợ ASCII (Latin-1)! ★     │    │
  │  │ → btoa("Xin chào") → LỖI!                          │    │
  │  │ → Giải pháp: TextEncoder → Uint8Array → btoa()!    │    │
  │  │ → Hoặc dùng encodeURIComponent() trước!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
