# Large File Upload & Resume — Deep Dive

> 📅 2026-02-12 · ⏱ 20 phút đọc
>
> ByteDance Interview: Implement large file upload with chunking,
> resume upload, instant upload, progress tracking.
> Frontend: Vue + Element-UI | Server: Node.js + multiparty
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: File Upload / Blob / Stream / Web Worker

---

## Mục Lục

0. [Tổng Quan Architecture](#tổng-quan)
1. [Blob.prototype.slice — File Chunking](#chunking)
2. [Frontend — Upload Chunks](#frontend-upload)
3. [Server — Receive & Merge](#server-merge)
4. [Progress Bar — Chunk + Overall](#progress)
5. [Hash Generation — Web Worker + Spark-MD5](#hash)
6. [Instant Upload — 秒传](#instant-upload)
7. [Pause Upload — XHR Abort](#pause)
8. [Resume Upload — 断点续传](#resume)
9. [Progress Bar Fix — Fake Progress](#progress-fix)
10. [Production Considerations](#production)
11. [Tóm Tắt & Checklist](#tóm-tắt)

---

## Tổng Quan

```
LARGE FILE UPLOAD — OVERALL ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │                     FRONTEND (Vue)                      │
  │                                                         │
  │  ① File Input → Blob.slice() → chunks[]                │
  │  ② Web Worker → SparkMD5 → fileHash                    │
  │  ③ Verify API → check: instant upload? resume?         │
  │  ④ FormData + XHR → concurrent upload chunks           │
  │  ⑤ Merge request → notify server to merge              │
  │  ⑥ Progress: xhr.upload.onprogress per chunk           │
  │  ⑦ Pause: xhr.abort() | Resume: skip uploaded chunks   │
  └──────────────────────────┬──────────────────────────────┘
                             │ HTTP
  ┌──────────────────────────▼──────────────────────────────┐
  │                   SERVER (Node.js)                      │
  │                                                         │
  │  ① multiparty → parse FormData → save chunk to disk    │
  │  ② /verify → check file exists? return uploaded chunks  │
  │  ③ /merge  → readStream.pipe(writeStream) at position  │
  │             → concurrent merge → delete chunks folder   │
  └─────────────────────────────────────────────────────────┘

  FLOW:
  File → slice() → [chunk-0, chunk-1, ..., chunk-N]
                         ↓ concurrent upload (Promise.all)
  Server:  chunkDir/hash-0, hash-1, ..., hash-N
                         ↓ merge request
  Server:  final-file.ext (readStream → writeStream at offset)
```

```
FEATURES:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────────────────────────┐
  │ Large Upload     │ Blob.slice → concurrent chunks      │
  │ Progress         │ xhr.upload.onprogress per chunk     │
  │ Hash             │ Web Worker + SparkMD5 (non-blocking)│
  │ Instant Upload   │ Hash match → skip upload entirely   │
  │ Pause            │ xhr.abort() on all active XHRs      │
  │ Resume           │ Server returns uploaded chunks list │
  └─────────────────┴──────────────────────────────────────┘
```

---

## §1. Blob.prototype.slice — File Chunking

```
FILE CHUNKING PRINCIPLE:
═══════════════════════════════════════════════════════════════

  Blob.prototype.slice(start, end) → new Blob (sub-slice)

  100MB File, SIZE = 10MB:
  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
  │ 0-10 │10-20 │20-30 │30-40 │40-50 │50-60 │60-70 │70-80 │80-90 │90-100│
  └──┬───┴──┬───┴──┬───┴──┬───┴──┬───┴──┬───┴──┬───┴──┬───┴──┬───┴──┬───┘
     ↓      ↓      ↓      ↓      ↓      ↓      ↓      ↓      ↓      ↓
  chunk-0 chunk-1 chunk-2  ...                                    chunk-9

  → File giống Array, slice() giống Array.slice()
  → Concurrent upload: biến 1 file lớn → N file nhỏ song song
  → Giảm thời gian upload ĐÁNG KỂ!
```

```javascript
const SIZE = 10 * 1024 * 1024; // 10MB per chunk

function createFileChunk(file, size = SIZE) {
  const fileChunkList = [];
  let cur = 0;
  while (cur < file.size) {
    fileChunkList.push({
      file: file.slice(cur, cur + size), // Blob.slice!
    });
    cur += size;
  }
  return fileChunkList;
}
// 100MB file → 10 chunks × 10MB
```

---

## §2. Frontend — Upload Chunks

### XHR Request Wrapper

```javascript
// Wrapper XHR — không dùng library, phỏng vấn thường yêu cầu native
function request({
  url,
  method = "post",
  data,
  headers = {},
  onProgress = (e) => e, // ← Progress callback
  requestList, // ← Track XHR for pause/abort
}) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    // ① Progress listener
    xhr.upload.onprogress = onProgress;

    xhr.open(method, url);

    // ② Set custom headers
    Object.keys(headers).forEach((key) =>
      xhr.setRequestHeader(key, headers[key]),
    );

    xhr.send(data);

    xhr.onload = (e) => {
      // ③ Upload done → remove from requestList
      if (requestList) {
        const idx = requestList.findIndex((item) => item === xhr);
        requestList.splice(idx, 1);
      }
      resolve({ data: e.target.response });
    };

    // ④ Expose XHR for pause/abort
    requestList?.push(xhr);
  });
}
```

### Upload Flow

```javascript
// Step 1: File change → store file
handleFileChange(e) {
    const [file] = e.target.files;
    if (!file) return;
    this.container.file = file;
}

// Step 2: Upload button clicked
async handleUpload() {
    if (!this.container.file) return;

    // ① Tạo chunks
    const fileChunkList = this.createFileChunk(this.container.file);

    // ② Tính hash (Web Worker — xem §5)
    this.container.hash = await this.calculateHash(fileChunkList);

    // ③ Verify: instant upload? resume?
    const { shouldUpload, uploadedList } = await this.verifyUpload(
        this.container.file.name,
        this.container.hash
    );

    // ④ Instant upload: file đã tồn tại trên server
    if (!shouldUpload) {
        this.$message.success("秒传: file upload success!");
        return;
    }

    // ⑤ Chuẩn bị data cho mỗi chunk
    this.data = fileChunkList.map(({ file }, index) => ({
        fileHash: this.container.hash,
        index,
        hash: this.container.hash + "-" + index,  // unique chunk ID
        chunk: file,
        percentage: uploadedList.includes(index) ? 100 : 0
    }));

    // ⑥ Upload!
    await this.uploadChunks(uploadedList);
}
```

### Upload Chunks + Merge

```javascript
// Upload chunks, filter đã uploaded (resume)
async uploadChunks(uploadedList = []) {
    const requestList = this.data
        // ① Filter: skip đã uploaded chunks (resume!)
        .filter(({ hash }) => !uploadedList.includes(hash))
        .map(({ chunk, hash, index }) => {
            const formData = new FormData();
            formData.append("chunk", chunk);       // Blob data
            formData.append("hash", hash);          // chunk ID
            formData.append("filename", this.container.file.name);
            formData.append("fileHash", this.container.hash);
            return { formData, index };
        })
        .map(({ formData, index }) =>
            this.request({
                url: "http://localhost:3000",
                data: formData,
                onProgress: this.createProgressHandler(this.data[index]),
                requestList: this.requestList  // track for abort
            })
        );

    // ② Concurrent upload — Promise.all!
    await Promise.all(requestList);

    // ③ All chunks done → merge request
    if (uploadedList.length + requestList.length === this.data.length) {
        await this.mergeRequest();
    }
}

// Merge request — notify server
async mergeRequest() {
    await this.request({
        url: "http://localhost:3000/merge",
        headers: { "content-type": "application/json" },
        data: JSON.stringify({
            size: SIZE,                          // chunk size for offset
            filename: this.container.file.name
        })
    });
}
```

```
TẠI SAO DÙNG Promise.all?
═══════════════════════════════════════════════════════════════

  Sequential upload:      ──[chunk0]──[chunk1]──[chunk2]──→ SLOW
  Concurrent (Promise.all): ──[chunk0]──→
                            ──[chunk1]──→  ALL parallel → FAST!
                            ──[chunk2]──→

  ⚠️ Concurrent = thứ tự nhận KHÔNG đảm bảo
  → Cần hash index để server merge ĐÚNG thứ tự!
```

---

## §3. Server — Receive & Merge

### Receive Chunks

```javascript
const http = require("http");
const path = require("path");
const fse = require("fs-extra");
const multiparty = require("multiparty");

const UPLOAD_DIR = path.resolve(__dirname, "..", "target");

server.on("request", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.status = 200;
    res.end();
    return;
  }

  // ① Parse FormData
  const multipart = new multiparty.Form();

  multipart.parse(req, async (err, fields, files) => {
    if (err) return;

    const [chunk] = files.chunk; // file object
    const [hash] = fields.hash; // "hash-0"
    const [filename] = fields.filename;
    const [fileHash] = fields.fileHash;

    // ② Tạo folder tạm: chunkDir_<fileHash>
    const chunkDir = path.resolve(UPLOAD_DIR, "chunkDir_" + fileHash);
    if (!fse.existsSync(chunkDir)) {
      await fse.mkdirs(chunkDir);
    }

    // ③ Move chunk từ temp → chunkDir/<hash>
    await fse.move(chunk.path, `${chunkDir}/${hash}`);

    res.end("received file chunk");
  });
});
```

```
SERVER FOLDER STRUCTURE:
═══════════════════════════════════════════════════════════════

  target/
  └── chunkDir_274740166ba5b3948d17fd71c06cb918/
      ├── 274740166ba5b3948d17fd71c06cb918-0
      ├── 274740166ba5b3948d17fd71c06cb918-1
      ├── 274740166ba5b3948d17fd71c06cb918-2
      ├── ...
      └── 274740166ba5b3948d17fd71c06cb918-11

  → Mỗi file = 1 chunk
  → Tên = fileHash + "-" + index
  → Folder prefix: "chunkDir_" + fileHash
```

### Merge Chunks

```javascript
const extractExt = (filename) =>
  filename.slice(filename.lastIndexOf("."), filename.length);

// Pipe stream: readStream → writeStream
const pipeStream = (path, writeStream) =>
  new Promise((resolve) => {
    const readStream = fse.createReadStream(path);
    readStream.on("end", () => {
      fse.unlinkSync(path); // Xóa chunk sau khi merge
      resolve();
    });
    readStream.pipe(writeStream);
  });

// Merge tất cả chunks → final file
const mergeFileChunk = async (filePath, fileHash, size) => {
  const chunkDir = path.resolve(UPLOAD_DIR, "chunkDir_" + fileHash);
  const chunkPaths = await fse.readdir(chunkDir);

  // ① Sort theo index (filesystem order ≠ upload order!)
  chunkPaths.sort((a, b) => a.split("-")[1] - b.split("-")[1]);

  // ② Concurrent merge: mỗi chunk → write tại ĐÚNG position
  await Promise.all(
    chunkPaths.map((chunkPath, index) =>
      pipeStream(
        path.resolve(chunkDir, chunkPath),
        fse.createWriteStream(filePath, {
          start: index * size, // ← KEY: offset position!
        }),
      ),
    ),
  );

  // ③ Xóa folder chunks sau khi merge xong
  fse.rmdirSync(chunkDir);
};
```

```
MERGE STRATEGY — createWriteStream({ start }):
═══════════════════════════════════════════════════════════════

  File 50MB, chunk size = 10MB:

  WriteStream positions:
  ┌──────────────┬──────────────┬──────────────┬─────────────┬─────────────┐
  │ start: 0     │ start: 10MB  │ start: 20MB  │ start: 30MB │ start: 40MB │
  │ ← chunk-0 → │ ← chunk-1 → │ ← chunk-2 → │ ← chunk-3 →│ ← chunk-4 →│
  └──────────────┴──────────────┴──────────────┴─────────────┴─────────────┘

  → Mỗi readStream pipe vào ĐÚNG vị trí trong writeStream
  → Concurrent merge: stream order KHÔNG quan trọng!
  → start = index × chunkSize

  ⚠️ Alternative: sequential merge (đợi chunk trước xong mới merge tiếp)
  → KHÔNG cần start position
  → Nhưng CHẬM hơn!
  → → Nên dùng concurrent + start position ⭐
```

---

## §4. Progress Bar — Chunk + Overall

### Single Chunk Progress

```javascript
// Factory function: mỗi chunk → riêng listener
createProgressHandler(item) {
    return e => {
        item.percentage = parseInt(
            String((e.loaded / e.total) * 100)
        );
    };
}

// Sử dụng:
this.request({
    url: "http://localhost:3000",
    data: formData,
    onProgress: this.createProgressHandler(this.data[index])
});
```

```
XHR PROGRESS EVENT:
═══════════════════════════════════════════════════════════════

  xhr.upload.onprogress = function(e) {
      e.loaded  → bytes đã upload
      e.total   → tổng bytes
      e.loaded / e.total × 100 = percentage
  };

  → NATIVE XHR support! Không cần library
  → Mỗi chunk có riêng onprogress → track riêng percentage
```

### Overall Progress (Computed Property)

```javascript
computed: {
    uploadPercentage() {
        if (!this.container.file || !this.data.length) return 0;
        const loaded = this.data
            .map(item => item.size * item.percentage)
            .reduce((acc, cur) => acc + cur);
        return parseInt(
            (loaded / this.container.file.size).toFixed(2)
        );
    }
}

// Overall = Σ(chunk.size × chunk.percentage) / file.size
// → Weighted average theo kích thước chunk
```

---

## §5. Hash Generation — Web Worker + Spark-MD5

```
TẠI SAO CẦN CONTENT HASH?
═══════════════════════════════════════════════════════════════

  TRƯỚC: hash = filename + "-" + index
  → Đổi tên file → hash thay đổi → KHÔNG nhận lại uploaded chunks!

  SAU: hash = MD5(file content)
  → File content KHÔNG đổi → hash KHÔNG đổi → resume works!
  → Giống Webpack contenthash concept!

  TẠI SAO WEB WORKER?
  → File lớn → đọc + tính hash RẤT CHẬM
  → Main thread bị block → UI FREEZE!
  → Web Worker = background thread → UI vẫn responsive ⭐
```

### Web Worker — hash.js

```javascript
// /public/hash.js — Worker thread
self.importScripts("/spark-md5.min.js"); // CDN import trong worker

self.onmessage = (e) => {
  const { fileChunkList } = e.data;
  const spark = new self.SparkMD5.ArrayBuffer();
  let percentage = 0;
  let count = 0;

  const loadNext = (index) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(fileChunkList[index].file);

    reader.onload = (e) => {
      count++;
      spark.append(e.target.result); // Feed chunk vào SparkMD5

      if (count === fileChunkList.length) {
        // ① Xong tất cả → gửi hash về main thread
        self.postMessage({
          percentage: 100,
          hash: spark.end(), // Final MD5 hash
        });
        self.close();
      } else {
        // ② Chưa xong → report progress
        percentage += 100 / fileChunkList.length;
        self.postMessage({ percentage });
        loadNext(count); // Recursive next chunk
      }
    };
  };

  loadNext(0);
};
```

### Main Thread Communication

```javascript
calculateHash(fileChunkList) {
    return new Promise(resolve => {
        this.container.worker = new Worker("/hash.js");

        // ① Gửi chunks sang worker
        this.container.worker.postMessage({ fileChunkList });

        // ② Nhận kết quả từ worker
        this.container.worker.onmessage = e => {
            const { percentage, hash } = e.data;
            this.hashPercentage = percentage;  // Progress bar
            if (hash) {
                resolve(hash);  // Done!
            }
        };
    });
}
```

```
HASH FLOW:
═══════════════════════════════════════════════════════════════

  Main Thread                    Worker Thread (hash.js)
  ─────────────                  ─────────────────────────
  postMessage({fileChunkList})
           ────────────→         onmessage: receive chunks
                                 FileReader.readAsArrayBuffer(chunk0)
           ←────────────         postMessage({percentage: 10%})
                                 FileReader.readAsArrayBuffer(chunk1)
           ←────────────         postMessage({percentage: 20%})
                                 ...
           ←────────────         postMessage({percentage: 100, hash: "abc123"})
  resolve(hash)                  self.close()

  ⚠️ SparkMD5: PHẢI pass từng chunk, KHÔNG pass cả file!
  → Nếu pass cả file → files khác nhau có thể cùng hash!
```

---

## §6. Instant Upload — 秒传

```
INSTANT UPLOAD — "秒传":
═══════════════════════════════════════════════════════════════

  "秒传" = file ĐÃ TỒN TẠI trên server → skip upload!

  Flow:
  ① Frontend: tính hash → gửi hash + filename lên /verify
  ② Server: check file hash tồn tại?
     → YES: { shouldUpload: false }
     → NO:  { shouldUpload: true, uploadedList: [...] }
  ③ Frontend:
     → shouldUpload = false → "Upload thành công!" (instant ⚡)
     → shouldUpload = true  → bắt đầu upload

  Thực chất KHÔNG upload gì cả — chỉ là UI trick!
  → User thấy "upload xong" 1 giây, thực ra file đã có sẵn :)
```

### Server Verify Endpoint

```javascript
const extractExt = (filename) =>
  filename.slice(filename.lastIndexOf("."), filename.length);

// Trả về danh sách chunks đã uploaded (cho resume)
const createUploadedList = async (fileHash) =>
  fse.existsSync(path.resolve(UPLOAD_DIR, fileHash))
    ? await fse.readdir(path.resolve(UPLOAD_DIR, fileHash))
    : [];

// /verify endpoint
if (req.url === "/verify") {
  const data = await resolvePost(req);
  const { fileHash, filename } = data;
  const ext = extractExt(filename);
  const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`);

  if (fse.existsSync(filePath)) {
    // ① File đã tồn tại → instant upload!
    res.end(JSON.stringify({ shouldUpload: false }));
  } else {
    // ② File chưa có → upload, kèm danh sách đã uploaded
    res.end(
      JSON.stringify({
        shouldUpload: true,
        uploadedList: await createUploadedList(fileHash),
      }),
    );
  }
}
```

---

## §7. Pause Upload — XHR Abort

```
PAUSE PRINCIPLE:
═══════════════════════════════════════════════════════════════

  XMLHttpRequest.abort() → cancel request!

  Cách track XHR:
  ① Mỗi request() → push xhr vào requestList[]
  ② Upload xong → splice xhr ra khỏi requestList[]
  → requestList chỉ chứa ĐANG upload XHRs

  Pause:
  requestList.forEach(xhr => xhr?.abort())
  requestList = []

  → Tất cả đang upload bị cancel!
  → Browser console: "net::ERR_ABORTED"
```

```javascript
// Pause button handler
handlePause() {
    this.requestList.forEach(xhr => xhr?.abort());
    this.requestList = [];
}

// requestList tracking trong request():
// → push khi tạo XHR
// → splice khi upload xong (onload)
// → abort khi pause
```

---

## §8. Resume Upload — 断点续传

```
RESUME UPLOAD — 2 APPROACHES:
═══════════════════════════════════════════════════════════════

  ① Frontend localStorage (lưu hash đã upload)
     → ❌ Mất khi đổi browser!

  ② Server-side storage (server lưu chunks đã nhận) ⭐
     → ✅ Browser-independent!
     → Server trả về uploadedList → frontend skip

  FLOW:
  ┌──────────┐      /verify          ┌──────────┐
  │ Frontend │ ──────────────────→   │  Server  │
  │          │ ←──────────────────   │          │
  │          │   {uploadedList:      │ readdir  │
  │          │    ["hash-0","hash-1" │ chunkDir │
  │          │     "hash-2"]}        │          │
  │          │                       │          │
  │ filter:  │                       │          │
  │ skip 0,1,│                       │          │
  │ 2        │                       │          │
  │          │  upload hash-3,4,...   │          │
  │          │ ──────────────────→   │          │
  └──────────┘                       └──────────┘
```

```javascript
// Resume button handler
async handleResume() {
    // ① Verify → get uploadedList
    const { uploadedList } = await this.verifyUpload(
        this.container.file.name,
        this.container.hash
    );
    // ② Upload only remaining chunks
    await this.uploadChunks(uploadedList);
}

// uploadChunks đã có filter logic:
// .filter(({ hash }) => !uploadedList.includes(hash))
// → Chỉ upload chunks CHƯA có trên server!
```

```
COMPLETE RESUME FLOW:
═══════════════════════════════════════════════════════════════

  ① User chọn file → createFileChunk → 10 chunks
  ② calculateHash → "abc123" (Web Worker)
  ③ verifyUpload("video.mp4", "abc123")
     → Server: file chưa có, uploadedList = []
  ④ Upload 10 chunks concurrent...
  ⑤ Upload đến chunk-5 → User click PAUSE
     → xhr.abort() × 4 (chunks 6-9 bị cancel)
     → Server đã nhận: chunk-0 → chunk-5
  ⑥ User click RESUME
  ⑦ verifyUpload("video.mp4", "abc123")
     → Server: uploadedList = ["abc123-0"..."abc123-5"]
  ⑧ Frontend filter: skip 0-5, upload 6-9 only!
  ⑨ All done → mergeRequest()
  ⑩ Server merge → final file ✅
```

---

## §9. Progress Bar Fix — Fake Progress

```
PROBLEM — PROGRESS BAR REGRESSION:
═══════════════════════════════════════════════════════════════

  Pause → abort XHR → chunk progress RESET to 0
  Resume → new XHR → progress starts from 0 again
  → Overall progress bar ĐI LÙI! (60% → 30%) 😱

  SOLUTION — "FAKE" PROGRESS BAR:
  → Track fakeUploadPercentage
  → Chỉ TĂNG, KHÔNG BAO GIỜ GIẢM!
  → Khi real progress > fake → fake = real
  → Khi real progress < fake → fake ĐỨNG YÊN (no regression!)
```

```javascript
data: () => ({
    fakeUploadPercentage: 0
}),

computed: {
    // Real progress (có thể giảm khi resume)
    uploadPercentage() {
        if (!this.container.file || !this.data.length) return 0;
        const loaded = this.data
            .map(item => item.size * item.percentage)
            .reduce((acc, cur) => acc + cur);
        return parseInt((loaded / this.container.file.size).toFixed(2));
    }
},

watch: {
    // Fake progress: CHỈ TĂNG!
    uploadPercentage(now) {
        if (now > this.fakeUploadPercentage) {
            this.fakeUploadPercentage = now;  // Tăng
        }
        // now < fake → KHÔNG làm gì → progress đứng yên!
    }
}

// Hiển thị fakeUploadPercentage cho user, KHÔNG phải uploadPercentage!
```

---

## §10. Production Considerations

```
PRODUCTION — NHỮNG VẤN ĐỀ CẦN XỬ LÝ:
═══════════════════════════════════════════════════════════════

  ① CHUNK UPLOAD FAILURE HANDLING:
  → Retry failed chunks (exponential backoff)
  → Set max retry count
  → Report failed chunks to user

  ② CONCURRENCY LIMIT:
  → Promise.all upload TẤT CẢ chunks = quá nhiều connections!
  → Nên giới hạn: max 3-6 concurrent uploads
  → Dùng Promise Pool / p-limit library

  ③ HASH OPTIMIZATION:
  → File lớn (>1GB) → hash tính RẤT LÂU
  → Sampling strategy: chỉ hash đầu/cuối + random middle chunks
  → Trade-off: speed vs collision risk

  ④ CHUNK SIZE OPTIMIZATION:
  → Quá nhỏ: quá nhiều HTTP requests → overhead
  → Quá lớn: 1 chunk fail → phải upload lại nhiều
  → Sweet spot: 5-10MB (tùy network)
  → Dynamic sizing: based on connection speed

  ⑤ SERVER-SIDE CLEANUP:
  → Orphan chunks (user never completed upload)
  → Scheduled cleanup job (delete old chunkDir)
  → TTL cho chunk folders

  ⑥ SECURITY:
  → File type validation (server-side!)
  → File size limit
  → Rate limiting
  → Virus scanning after merge
```

```
CONCURRENCY LIMIT — PRODUCTION VERSION:
═══════════════════════════════════════════════════════════════

  // Thay Promise.all → concurrent pool
  async function uploadWithLimit(tasks, limit = 3) {
      const pool = new Set();
      const results = [];

      for (const task of tasks) {
          const p = task().then(res => {
              pool.delete(p);
              return res;
          });
          pool.add(p);
          results.push(p);

          if (pool.size >= limit) {
              await Promise.race(pool);  // Wait cho 1 slot trống
          }
      }

      return Promise.all(results);
  }

  → Max 3 uploads cùng lúc
  → Slot trống → chạy task tiếp
  → KHÔNG overwhelm server/browser connections
```

```
HASH OPTIMIZATION — SAMPLING:
═══════════════════════════════════════════════════════════════

  Thay vì hash TOÀN BỘ file:

  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
  │██████│      │      │  ████│      │      │      │██████│
  │ FULL │      │      │SAMPLE│      │      │      │ FULL │
  │first │ skip │ skip │middle│ skip │ skip │ skip │ last │
  │2MB   │      │      │2MB   │      │      │      │2MB   │
  └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

  → Hash first 2MB + middle samples + last 2MB
  → 1GB file: thay vì hash 1GB → chỉ hash ~6MB!
  → Risk: collision (2 files khác nhưng sample giống)
  → Mitigation: combine with file.size + file.lastModified
```

---

## Tóm Tắt

### Quick Reference

```
FILE UPLOAD — QUICK REF:
═══════════════════════════════════════════════════════════════

  CHUNKING:
  → Blob.prototype.slice(start, end) → chunk
  → while (cur < file.size) → push chunks[]
  → FormData: chunk + hash(fileHash-index) + filename

  UPLOAD:
  → Concurrent: Promise.all(chunks.map(upload))
  → Merge: POST /merge → readStream.pipe(writeStream, {start})
  → sort chunks by index BEFORE merge!

  HASH:
  → Web Worker + SparkMD5 (non-blocking!)
  → FileReader.readAsArrayBuffer per chunk
  → spark.append(each chunk) → spark.end() = final hash

  INSTANT UPLOAD:
  → POST /verify → server check hash exists?
  → YES → {shouldUpload: false} → "秒传!"
  → NO  → {shouldUpload: true, uploadedList: [...]}

  PAUSE:
  → requestList[].forEach(xhr => xhr.abort())
  → requestList tracks ACTIVE uploads only

  RESUME:
  → POST /verify → get uploadedList
  → filter: skip uploaded → upload remaining
  → merge when uploaded + remaining = total

  PROGRESS:
  → xhr.upload.onprogress per chunk
  → Overall: Σ(size × percentage) / totalSize
  → Fake progress: only increase, never decrease (watch)

  PRODUCTION:
  → Concurrency limit (3-6 parallel)
  → Chunk retry on failure (exponential backoff)
  → Hash sampling (first + middle + last)
  → Server cleanup (TTL for orphan chunks)
```

### Checklist

- [ ] Blob.prototype.slice: file.slice(start, end) → chunk Blob
- [ ] Chunk size: 5-10MB sweet spot (trade-off: requests vs retry cost)
- [ ] FormData: chunk(file) + hash(fileHash-index) + filename + fileHash
- [ ] Concurrent upload: Promise.all → tất cả chunks song song
- [ ] Server: multiparty parse FormData → save to chunkDir\_{fileHash}/
- [ ] Merge: readStream.pipe(writeStream, {start: index × size})
- [ ] Sort chunks by index BEFORE merge (filesystem order ≠ upload order)
- [ ] Xóa chunk files SAU merge, xóa chunkDir SAU merge hoàn tất
- [ ] XHR.upload.onprogress: e.loaded / e.total × 100 per chunk
- [ ] Overall progress: computed = Σ(size × percentage) / file.size
- [ ] Content hash: Web Worker + SparkMD5 (KHÔNG block UI!)
- [ ] Worker: importScripts, postMessage, readAsArrayBuffer per chunk
- [ ] Instant upload: /verify → check hash exists → skip upload
- [ ] Pause: xhr.abort() on all requestList items
- [ ] Resume: /verify → get uploadedList → filter skip → upload remaining
- [ ] Fake progress bar: watch real progress, only increase (never regress)
- [ ] Production: concurrency limit, retry, hash sampling, server cleanup
- [ ] Security: file type validation, size limit, rate limiting

---

_Nguồn: ByteDance Interview Question — Large File Upload & Resume_
_Cập nhật lần cuối: Tháng 2, 2026_
