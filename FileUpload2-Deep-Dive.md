# Large File Upload — Advanced Techniques (Part 2)

> 📅 2026-02-12 · ⏱ 15 phút đọc
>
> Tiếp nối Part 1: nâng cấp hash calculation, concurrency control,
> TCP slow start, retry mechanism, fragment cleanup
> Keyword: requestIdleCallback, Fiber, Bloom Filter, TCP 慢启动, node-schedule
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: Performance / Concurrency / Error Handling

---

## Mục Lục

0. [Tổng Quan Bài Toán](#tổng-quan)
1. [Time Slice Hash — requestIdleCallback](#time-slice-hash)
2. [Sampling Hash — 抽样 MD5](#sampling-hash)
3. [Concurrency Control — 并发控制](#concurrency-control)
4. [TCP Slow Start Strategy — 慢启动](#slow-start)
5. [Cube Progress Bar — Visual Optimization](#cube-progress)
6. [Concurrent Retry + Error Reporting](#retry)
7. [File Fragment Cleanup — node-schedule](#cleanup)
8. [Tóm Tắt & Checklist](#tóm-tắt)

---

## Tổng Quan

```
PART 1 vs PART 2:
═══════════════════════════════════════════════════════════════

  Part 1 (Cơ bản — FileUpload-Deep-Dive.md):
  ┌─────────────────────────────────────────────────┐
  │ ✅ Blob.slice chunking                          │
  │ ✅ Concurrent upload (Promise.all)              │
  │ ✅ Server merge (readStream.pipe)               │
  │ ✅ Web Worker + SparkMD5 hash                   │
  │ ✅ Instant upload (秒传)                        │
  │ ✅ Pause (xhr.abort) + Resume                   │
  │ ✅ Progress bar (per chunk + overall)            │
  └─────────────────────────────────────────────────┘

  Part 2 (Nâng cao — BÀI NÀY):
  ┌─────────────────────────────────────────────────┐
  │ 🆕 Time Slice Hash (requestIdleCallback)        │
  │    → React Fiber inspired, không block main     │
  │ 🆕 Sampling Hash (抽样 MD5)                     │
  │    → 1.5GB: 20s → 1s (20x faster!)             │
  │ 🆕 Concurrency Control (sendRequest)            │
  │    → Max N connections, queue-based             │
  │ 🆕 TCP Slow Start (慢启动)                      │
  │    → Dynamic chunk size based on network speed  │
  │ 🆕 Cube Progress Bar (方块进度条)               │
  │    → Visual grid, green/blue/red states         │
  │ 🆕 Concurrent Retry (重试 + 报错)               │
  │    → Max 2 retries per chunk, error tracking    │
  │ 🆕 File Fragment Cleanup (碎片清理)             │
  │    → node-schedule cron, scan + delete expired  │
  └─────────────────────────────────────────────────┘
```

---

## §1. Time Slice Hash — requestIdleCallback

### Vấn Đề

```
WEB WORKER vs TIME SLICE — 2 CÁCH TRÁNH BLOCK UI:
═══════════════════════════════════════════════════════════════

  Cách 1: Web Worker (Part 1)
  → Tạo thread riêng, tính hash ở background
  → ✅ Hoàn toàn không block main thread
  → ❌ Cần file riêng (hash.js), API phức tạp hơn

  Cách 2: requestIdleCallback (Part 2) ← BÀI NÀY
  → Tính hash TRÊN main thread, nhưng CHỈ khi browser RẢNH
  → Lấy ý tưởng từ React Fiber architecture
  → ✅ Không cần file riêng, code đơn giản hơn
  → ❌ Vẫn main thread, nhưng chia nhỏ → không lag

  Core idea: KHÔNG GIẢM tổng lượng công việc
  → Chỉ CHIA NHỎ ra → thực hiện trong idle time
  → User vẫn input, animation vẫn chạy smooth! ⭐
```

### requestIdleCallback API

```
requestIdleCallback — BROWSER IDLE TIME:
═══════════════════════════════════════════════════════════════

  Mỗi frame (~16ms cho 60fps):
  ┌─────────────────────────────────────────────────────────┐
  │ Frame #1                        │ Frame #2              │
  │ ┌──────┬────────┬──────┬──────┐ │ ┌────┬────┬────┬────┐│
  │ │ Run  │Update  │ Idle │ Idle │ │ │Run │Run │Upd │Idle││
  │ │ Task │Render  │ CB   │ CB   │ │ │Task│Task│Ren │ CB ││
  │ └──────┴────────┴──────┴──────┘ │ └────┴────┴────┴────┘│
  │              idle period ──→    │    idle period ──→    │
  └─────────────────────────────────┴──────────────────────┘
              Time ──────────────────────────→

  → Task + Rendering xong → còn DƯ thời gian = idle period
  → requestIdleCallback chạy trong idle period
  → Nếu frame BẬN (nhiều task) → idle period NGẮN hoặc KHÔNG CÓ
  → Nếu frame RẢNH → idle period DÀI → chạy nhiều idle callback
```

```javascript
// requestIdleCallback API cơ bản
requestIdleCallback(myNonEssentialWork);

function myNonEssentialWork(deadline) {
  // deadline.timeRemaining(): ms còn lại trong frame hiện tại
  // deadline.didTimeout: task đã vượt timeout chưa

  // Còn thời gian VÀ còn task → chạy tiếp!
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    doWorkIfNeeded();
  }

  // Hết thời gian nhưng còn task → đăng ký frame tiếp theo
  if (tasks.length > 0) {
    requestIdleCallback(myNonEssentialWork);
  }
}
```

```
deadline OBJECT:
═══════════════════════════════════════════════════════════════

  interface Deadline {
      didTimeout: boolean         // Task vượt timeout?
      timeRemaining(): number     // Ms còn lại đến hết frame
  }

  timeRemaining() trả về:
  → Idle Callback bắt đầu → timeRemaining = idle period length
  → Idle Callback chạy    → timeRemaining GIẢM dần
  → timeRemaining ≤ 0     → DỪNG, nhường lại cho rendering/input
```

### Time Slice Hash Implementation

```javascript
async calculateHashIdle(chunks) {
    return new Promise(resolve => {
        const spark = new SparkMD5.ArrayBuffer();
        let count = 0;

        // Helper: đọc 1 chunk → append vào SparkMD5
        const appendToSpark = async (file) => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = e => {
                    spark.append(e.target.result);
                    resolve();
                };
            });
        };

        // Work loop: chạy trong idle time
        const workLoop = async (deadline) => {
            // ① Còn chunk VÀ frame còn > 1ms
            while (count < chunks.length && deadline.timeRemaining() > 1) {
                await appendToSpark(chunks[count].file);
                count++;

                if (count < chunks.length) {
                    // ② Đang tính → update progress
                    this.hashProgress = Number(
                        ((100 * count) / chunks.length).toFixed(2)
                    );
                } else {
                    // ③ Xong! → resolve hash
                    this.hashProgress = 100;
                    resolve(spark.end());
                }
            }
            // ④ Hết idle time → đăng ký frame tiếp theo
            window.requestIdleCallback(workLoop);
        };

        // ⑤ Bắt đầu!
        window.requestIdleCallback(workLoop);
    });
}
```

```
SO SÁNH: Web Worker vs requestIdleCallback
═══════════════════════════════════════════════════════════════

  ┌───────────────────┬──────────────────┬──────────────────┐
  │                   │ Web Worker       │ requestIdleCallback│
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Thread            │ Separate thread  │ Main thread      │
  │ Block UI          │ ❌ Never         │ ❌ Chia nhỏ      │
  │ Data transfer     │ postMessage      │ Trực tiếp        │
  │ Code complexity   │ Cần file riêng   │ Inline code      │
  │ Browser support   │ Rộng             │ Hẹp hơn          │
  │ DOM access        │ ❌ Không có      │ ✅ Có            │
  │ Tốc độ tính hash  │ Nhanh hơn        │ Chậm hơn một chút│
  │ "Cảm giác" user   │ UI smooth        │ UI smooth        │
  └───────────────────┴──────────────────┴──────────────────┘

  → Web Worker: phù hợp khi cần tốc độ MAX
  → requestIdleCallback: phù hợp khi code đơn giản hơn
  → Cả 2 đều giải quyết vấn đề UI freeze!
```

```
LIÊN HỆ REACT FIBER:
═══════════════════════════════════════════════════════════════

  React 15 (Stack Reconciler):
  ┌─────────────────────────────────────────────────────┐
  │ ██████████████████████████████████████████████████  │
  │ ← Diff cả cây component, KHÔNG THỂ dừng giữa chừng│
  │ → Blocking! UI freeze nếu cây lớn!                │
  └─────────────────────────────────────────────────────┘

  React 16+ (Fiber — Time Slicing):
  ┌─────────────────────────────────────────────────────┐
  │ ████ ████ ████ ████ ████ ████ ████ ████ ████ ████  │
  │ ← Chia nhỏ diff → chạy từng "fiber unit of work"  │
  │ → Giữa các fiber: nhường lại cho animation, input │
  │ → High priority task INTERRUPT low priority task   │
  └─────────────────────────────────────────────────────┘

  Hash calculation ≈ Fiber concept:
  → Chia chunks[] thành unit of work
  → Mỗi idle frame: tính 1-2 chunks
  → Input/animation: KHÔNG BỊ ẢNH HƯỞNG!

  ⚠️ React tự implement scheduler (không dùng requestIdleCallback)
  → requestIdleCallback có compatibility issues
  → React tự polyfill bằng MessageChannel + postMessage
```

```
TIME SLICE — USER CODE ↔ BROWSER INTERACTION:
═══════════════════════════════════════════════════════════════

  User Code                          Browser
  ──────────                         ───────

  ① Đăng ký requestIdleCallback
           ────→ 申请时间片 (Xin time slice)

                                     ② Thực hiện high priority tasks
                                        (animation, input, rendering)

           ←──── 时间片 (Cấp time slice)
  ③ Nhận time slice
     Tính hash trong deadline

  ④ Hết time slice
           ────→ 归还控制权 (Trả lại control)
                  申请下一个时间片 (Xin tiếp)

                                     ⑤ Lại chạy high priority...

           ←──── Cấp time slice tiếp

  ⑥ Tính tiếp...

  → Lặp lại cho đến khi tính xong! ✅
```

---

## §2. Sampling Hash — 抽样 MD5

### Ý Tưởng — Bloom Filter

```
SAMPLING HASH — "影分身 Hash":
═══════════════════════════════════════════════════════════════

  MỤC ĐÍCH: Chỉ cần biết file TỒN TẠI hay KHÔNG
  → KHÔNG CẦN hash chính xác 100%!
  → Chấp nhận MỘT CHÚT false positive (file khác → cùng hash)
  → Đổi lại: TỐC ĐỘ NHANH GẤP 20 LẦN! 🚀

  Giống ý tưởng BLOOM FILTER:
  → "Nếu hash KHÔNG match → file CHẮC CHẮN chưa có"    ← 100%
  → "Nếu hash match → file CÓ THỂ đã có (small error)" ← ~99%

  Benchmark (1.5GB file):
  ┌──────────────┬─────────┐
  │ Full MD5     │ 21.7s   │ ← Đọc TOÀN BỘ file
  │ Sampling MD5 │  1.0s   │ ← Chỉ đọc ~6MB
  └──────────────┴─────────┘
  → 20x faster! ⚡
```

### Sampling Strategy

```
CHIẾN LƯỢC SAMPLING:
═══════════════════════════════════════════════════════════════

  File gốc (chia thành slices 2MB):
  ┌────────┬────────┬────────┬────────┬─ ─ ─ ┬────────┐
  │ Slice  │ Slice  │ Slice  │ Slice  │ ...  │ Slice  │
  │   0    │   1    │   2    │   3    │      │   N    │
  │  2MB   │  2MB   │  2MB   │  2MB   │      │  2MB   │
  └────────┴────────┴────────┴────────┴─ ─ ─ ┴────────┘

  Sampling rules:
  ┌────────┬────────┬────────┬────────┬─ ─ ─ ┬────────┐
  │████████│▌  ▌  ▌│▌  ▌  ▌│▌  ▌  ▌│      │████████│
  │ ALL    │2B 2B 2B│2B 2B 2B│2B 2B 2B│      │ ALL    │
  │ 2MB    │đầu giữa cuối│       │       │      │ 2MB    │
  └────────┴────────┴────────┴────────┴─ ─ ─ ┴────────┘

  → Slice ĐẦU: lấy TOÀN BỘ (2MB)
  → Slice CUỐI: lấy TOÀN BỘ (2MB)
  → Các slice GIỮA: chỉ lấy 2 bytes ĐẦU + 2 bytes GIỮA + 2 bytes CUỐI
  → Tổng data cần đọc: ~4MB + N × 6 bytes ≈ ~4MB (rất nhỏ!)

  Merge tất cả lại → tính MD5 → "影分身 Hash"
```

### Implementation

```javascript
async calculateHashSample() {
    return new Promise(resolve => {
        const spark = new SparkMD5.ArrayBuffer();
        const reader = new FileReader();
        const file = this.container.file;
        const size = file.size;
        let offset = 2 * 1024 * 1024;  // 2MB slice

        // ① Slice đầu: lấy TOÀN BỘ
        let chunks = [file.slice(0, offset)];

        let cur = offset;
        while (cur < size) {
            if (cur + offset >= size) {
                // ② Slice cuối: lấy TOÀN BỘ
                chunks.push(file.slice(cur, cur + offset));
            } else {
                // ③ Slice giữa: chỉ lấy 2 bytes × 3 vị trí
                const mid = cur + offset / 2;
                const end = cur + offset;
                chunks.push(file.slice(cur, cur + 2));       // đầu 2B
                chunks.push(file.slice(mid, mid + 2));       // giữa 2B
                chunks.push(file.slice(end - 2, end));       // cuối 2B
            }
            cur += offset;
        }

        // ④ Gộp tất cả samples → tính MD5
        reader.readAsArrayBuffer(new Blob(chunks));
        reader.onload = e => {
            spark.append(e.target.result);
            resolve(spark.end());
        };
    });
}
```

```
KHI NÀO DÙNG SAMPLING vs FULL HASH?
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────┬───────────────────┐
  │ Scenario         │ Sampling ⚡  │ Full Hash 🔒     │
  ├──────────────────┼──────────────┼───────────────────┤
  │ Instant upload   │ ✅ Dùng được │ ✅ Chính xác hơn │
  │   check          │ (fast check) │ (fallback verify) │
  │ Resume upload    │ ❌ Không đủ  │ ✅ Cần chính xác │
  │ File dedup       │ ⚠️ Risk     │ ✅ An toàn       │
  │ File > 1GB       │ ✅ Ưu tiên  │ ⚠️ Quá chậm     │
  │ File < 100MB     │ ❌ Overkill │ ✅ Đủ nhanh      │
  └──────────────────┴──────────────┴───────────────────┘

  COMBO STRATEGY:
  ① Sampling hash → check instant upload (fast, ~1s)
  ② Nếu match → Full hash xác nhận (chắc chắn, background)
  ③ Nếu KHÔNG match → chắc chắn file mới → bắt đầu upload

  → Bloom Filter logic: "NO" = chắc chắn, "YES" = cần verify
```

---

## §3. Concurrency Control — 并发控制

### Vấn Đề

```
TẠI SAO CẦN CONCURRENCY CONTROL?
═══════════════════════════════════════════════════════════════

  Promise.all upload TẤT CẢ chunks cùng lúc:

  File 4GB ÷ 1MB = 4096 chunks
  → 4096 HTTP connections ĐỒNG THỜI!
  → Browser: "tôi chết" 💀

  Browser connection limit per domain: 6 (Chrome)
  → 4096 connections queue up → memory overflow → crash!

  Hash calculation: KHÔNG bị crash ← CPU bound
  TCP connection creation: BỊ crash ← Network/Memory bound

  SOLUTION: Queue-based concurrency control
  → Max 4 connections đồng thời (configurable)
  → 1 connection xong → start next từ queue
```

### sendRequest — Queue Implementation

```javascript
async sendRequest(forms, max = 4) {
    return new Promise(resolve => {
        const len = forms.length;
        let idx = 0;       // Index của task tiếp theo cần gửi
        let counter = 0;    // Số task ĐÃ HOÀN THÀNH

        const start = async () => {
            // Còn request VÀ còn "slot" trống
            while (idx < len && max > 0) {
                max--;  // ① Chiếm 1 slot

                console.log(idx, "start");
                const form = forms[idx].form;
                const index = forms[idx].index;
                idx++;

                request({
                    url: "/upload",
                    data: form,
                    onProgress: this.createProgressHandler(
                        this.chunks[index]
                    ),
                    requestList: this.requestList
                }).then(() => {
                    max++;      // ② Giải phóng slot
                    counter++;  // ③ Đếm hoàn thành

                    if (counter === len) {
                        resolve();  // ④ TẤT CẢ xong!
                    } else {
                        start();    // ⑤ Trigger task tiếp theo
                    }
                });
            }
        };

        start();
    });
}
```

```
CONCURRENCY FLOW (max = 4):
═══════════════════════════════════════════════════════════════

  Time ──────────────────────────────────────────────→

  Slot 1: [chunk-0]────────→ [chunk-4]──→ [chunk-8]───→ ...
  Slot 2: [chunk-1]──→ [chunk-5]────────→ [chunk-9]──→ ...
  Slot 3: [chunk-2]───────→ [chunk-6]──→ [chunk-10]──→ ...
  Slot 4: [chunk-3]──→ [chunk-7]──→ [chunk-11]────→ ...
           ↑              ↑
           4 slots         Khi 1 xong → slot trống
           đều bận         → start() gọi task tiếp

  → max-- khi bắt đầu request (chiếm slot)
  → max++ khi request.then() (giải phóng slot)
  → Luôn giữ TỐI ĐA 4 connections đồng thời
```

### Sử Dụng Trong uploadChunks

```javascript
async uploadChunks(uploadedList = []) {
    const list = this.chunks
        .filter(chunk => uploadedList.indexOf(chunk.hash) == -1)
        .map(({ chunk, hash, index }, i) => {
            const form = new FormData();
            form.append("chunk", chunk);
            form.append("hash", hash);
            form.append("filename", this.container.file.name);
            form.append("fileHash", this.container.hash);
            return { form, index };
        });

    // ❌ TRƯỚC: Promise.all → TẤT CẢ cùng lúc → crash!
    // await Promise.all(list.map(item => request(...)));

    // ✅ SAU: Concurrency control → max 4
    await this.sendRequest(list, 4);

    if (uploadedList.length + list.length === this.chunks.length) {
        await this.mergeRequest();
    }
}
```

```
INTERVIEW TIP — ĐÂY CŨNG LÀ 1 CÂU PHỎNG VẤN BYTEDANCE:
═══════════════════════════════════════════════════════════════

  "Implement async request concurrency control"

  Core pattern:
  1. Queue of tasks (forms[])
  2. Counter for available slots (max)
  3. max-- khi bắt đầu task
  4. max++ khi task hoàn thành
  5. Task xong → trigger start() để chạy task tiếp

  Biến thể:
  ① Promise Pool (generic):
     → Input: Array<() => Promise>, limit: number
     → Output: Promise<results[]>

  ② p-limit (npm library):
     const limit = pLimit(4);
     await Promise.all(urls.map(url => limit(() => fetch(url))));

  ③ Async Iterator (modern):
     → for await...of + Semaphore pattern
```

---

## §4. TCP Slow Start Strategy — 慢启动

### Ý Tưởng

```
TCP CONGESTION CONTROL → DYNAMIC CHUNK SIZE:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: Fixed chunk size (10MB) → không tối ưu!
  → Mạng nhanh: 10MB quá nhỏ, overhead nhiều HTTP requests
  → Mạng chậm: 10MB quá lớn, upload 1 chunk mất rất lâu

  Ý TƯỞNG: Tham khảo TCP Slow Start
  → Initial size: nhỏ (1MB)
  → Nếu upload NHANH hơn target → TĂNG chunk size
  → Nếu upload CHẬM hơn target → GIẢM chunk size
  → Dynamic: chunk size "tự điều chỉnh" theo network speed!

  TCP Slow Start:
  ┌──────────────────────────────────────────┐
  │  cwnd                                    │
  │   ▲                    ╱──── threshold   │
  │   │               ╱──╱                   │
  │   │          ╱──╱╱                       │
  │   │     ╱╱╱╱╱                            │
  │   │  ╱╱╱                                 │
  │   │╱╱                                    │
  │   └────────────────────────→ time        │
  │   slow start      congestion avoidance   │
  └──────────────────────────────────────────┘

  Tương tự: Chunk size = f(upload speed)
  → Exponential growth (doubling) → Linear growth (near target)
  → Network congestion → Reduce size
```

### Implementation

```javascript
async handleUpload1() {
    const file = this.container.file;
    if (!file) return;
    this.status = Status.uploading;

    const fileSize = file.size;
    let offset = 1024 * 1024;   // Initial: 1MB (慢启动 initial window)
    let cur = 0;
    let count = 0;

    // Tính hash nhanh bằng sampling
    this.container.hash = await this.calculateHashSample();

    while (cur < fileSize) {
        // ① Slice chunk với offset HIỆN TẠI (dynamic!)
        const chunk = file.slice(cur, cur + offset);
        cur += offset;

        const chunkName = this.container.hash + "-" + count;
        const form = new FormData();
        form.append("chunk", chunk);
        form.append("hash", chunkName);
        form.append("filename", file.name);
        form.append("fileHash", this.container.hash);
        form.append("size", chunk.size);

        // ② Đo thời gian upload
        let start = new Date().getTime();
        await request({ url: "/upload", data: form });
        const now = new Date().getTime();

        const time = ((now - start) / 1000).toFixed(4);

        // ③ Tính tỷ lệ so với target (30 giây)
        let rate = time / 30;

        // ④ Clamp rate: 0.5 ≤ rate ≤ 2
        if (rate < 0.5) rate = 0.5;   // Nhanh quá → chỉ tăng 2x
        if (rate > 2) rate = 2;         // Chậm quá → chỉ giảm 0.5x

        console.log(
            `Chunk ${count}: size=${format(offset)}, ` +
            `time=${time}s, rate=${rate}x of 30s, ` +
            `next size=${format(offset / rate)}`
        );

        // ⑤ Điều chỉnh offset cho chunk TIẾP THEO
        offset = parseInt(offset / rate);
        count++;
    }
}
```

```
SLOW START — EXAMPLE (3G network):
═══════════════════════════════════════════════════════════════

  Chunk 0: size=1.00MB, time=13.28s, rate=0.5x → next=2.00MB
           (Nhanh hơn target → TĂNG gấp đôi!)

  Chunk 1: size=2.00MB, time=25.41s, rate=0.85x → next=2.36MB
           (Gần target → tăng nhẹ)

  Chunk 2: size=2.36MB, time=14.13s, rate=0.5x → next=4.72MB
           (Vẫn nhanh → TĂNG gấp đôi!)

  → Chunk size TỰ ĐỘNG tăng khi mạng tốt
  → Nếu mạng yếu đi → rate > 1 → chunk size GIẢM
  → Adaptive! Không cần user config chunk size

  ┌─────────┐  ┌──────────┐  ┌────────────────┐
  │  1MB    │  │   2MB    │  │     4.72MB     │
  │ chunk 0 │  │ chunk 1  │  │    chunk 2     │
  └─────────┘  └──────────┘  └────────────────┘
  13.28s        25.41s        14.13s

  FORMULA: newSize = currentSize / rate
  → rate < 1 (upload nhanh hơn 30s) → newSize > currentSize (tăng)
  → rate > 1 (upload chậm hơn 30s) → newSize < currentSize (giảm)
  → rate = 1 (đúng 30s) → newSize = currentSize (giữ nguyên)
```

```
IMPROVEMENT IDEAS:
═══════════════════════════════════════════════════════════════

  1. Smoothing function (trigonometric):
     → Thay vì linear rate → dùng sin/cos để smooth
     → Tránh chunk size nhảy đột ngột
     → rate = 0.5 + (Math.sin(rate * Math.PI / 2)) → [0.5, 1.5]

  2. Concurrency + Slow Start:
     → PHỨC TẠP! Cần combine concurrency control + dynamic sizing
     → Mỗi slot có riêng offset? Hay shared offset?
     → Challenge: chunks size khác nhau → merge positions phức tạp

  3. Min/Max bounds:
     → MIN chunk size: 256KB (tránh quá nhiều requests)
     → MAX chunk size: 50MB (tránh 1 chunk thất bại mất quá nhiều)
```

---

## §5. Cube Progress Bar — 方块进度条

### Concept

```
CUBE PROGRESS BAR — "hard drive scanning" INSPIRATION:
═══════════════════════════════════════════════════════════════

  Thay vì table hiển thị % cho TỪNG chunk:
  ┌──────┬──────┬──────┐
  │ hash │ prog │ size │  ← Boring, khó nhìn
  │ abc-0│ 100% │ 10MB │
  │ abc-1│  45% │ 10MB │
  │ ...  │ ...  │ ...  │
  └──────┴──────┴──────┘

  → Dùng GRID SQUARES (giống hard drive scanning tool):
  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
  │🟩│🟩│🟩│🟩│🟦│🟦│🟦│🟦│⬜│⬜│
  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
  │⬜│⬜│⬜│⬜│⬜│⬜│⬜│⬜│⬜│⬜│  ← Error → 🟥
  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
  │⬜│⬜│⬜│⬜│⬜│⬜│⬜│⬜│⬜│⬜│
  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘

  🟩 = 100% (uploaded successfully)
  🟦 = 0-99% (uploading, with loading icon)
  ⬜ = 0% (waiting)
  🟥 = error (progress = -1)

  → Instant upload (秒传): TẤT CẢ xanh lá ngay lập tức!
  → Concurrent = 4: luôn thấy 4 ô xanh dương
  → Trực quan, đẹp, dễ hiểu trạng thái upload!
```

### Vue Template

```html
<div class="cube-container" :style="{ width: cubeWidth + 'px' }">
  <div class="cube" v-for="chunk in chunks" :key="chunk.hash">
    <div
      :class="{
                 'uploading': chunk.progress > 0 && chunk.progress < 100,
                 'success':   chunk.progress == 100,
                 'error':     chunk.progress < 0
             }"
      :style="{ height: chunk.progress + '%' }"
    >
      <!-- Loading icon khi đang upload -->
      <i
        v-if="chunk.progress > 0 && chunk.progress < 100"
        class="el-icon-loading"
        style="color: #F56C6C;"
      ></i>
    </div>
  </div>
</div>
```

### CSS — Stylus

```css
.cube-container {
  width: 100px;
  overflow: hidden;
}
.cube {
  width: 14px;
  height: 14px;
  line-height: 12px;
  border: 1px solid black;
  background: #eee; /* ⬜ Waiting */
  float: left;
}
.cube > .success {
  background: #67c23a; /* 🟩 Done */
}
.cube > .uploading {
  background: #409eff; /* 🟦 Uploading */
}
.cube > .error {
  background: #f56c6c; /* 🟥 Error */
}
```

### Responsive Grid Width

```javascript
computed: {
    // Ô vuông: width = ceil(√N) × 16px
    // → Grid gần vuông nhất có thể!
    cubeWidth() {
        return Math.ceil(Math.sqrt(this.chunks.length)) * 16;
    }
}

// Example:
// 100 chunks → √100 = 10 → width = 160px → 10×10 grid
// 200 chunks → √200 ≈ 15 → width = 240px → 15×14 grid
// 36 chunks  → √36 = 6  → width = 96px  → 6×6 grid
```

---

## §6. Concurrent Retry + Error Reporting

### Ý Tưởng

```
RETRY MECHANISM:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: Network không ổn định → chunk upload FAIL
  → Không retry: mất data, user phải upload lại toàn bộ!
  → Retry vô hạn: stuck forever nếu server down

  GIẢI PHÁP:
  ① Error → đặt task lại vào queue (status = error)
  ② Track retry count per chunk: retryArr[index]++
  ③ Max 2 retries → 3 lần fail tổng → REJECT (dừng upload)
  ④ Progress bar: -1 → ĐỎ (visual feedback)

  FLOW:
  chunk-5 fail lần 1 → retry (retryArr[5] = 1)
  chunk-5 fail lần 2 → REJECT! (retryArr[5] >= 2)
  → Toàn bộ upload dừng, thông báo user
```

### Implementation

```javascript
// Status enum
const Status = {
    wait: "wait",         // Chờ upload
    uploading: "uploading", // Đang upload
    done: "done",          // Xong
    error: "error"         // Lỗi (sẽ retry)
};

async sendRequest(urls, max = 4) {
    return new Promise((resolve, reject) => {
        const len = urls.length;
        let counter = 0;
        const retryArr = [];   // Track retry count per chunk

        const start = async () => {
            while (counter < len && max > 0) {
                max--;  // Chiếm slot

                // ① Tìm task CHƯA HOÀN THÀNH (wait hoặc error)
                const i = urls.findIndex(
                    v => v.status == Status.wait || v.status == Status.error
                );
                if (i === -1) return;  // Không còn task

                urls[i].status = Status.uploading;
                const form = urls[i].form;
                const index = urls[i].index;

                if (typeof retryArr[index] === "number") {
                    console.log(index, "bắt đầu retry...");
                }

                request({
                    url: "/upload",
                    data: form,
                    onProgress: this.createProgressHandler(
                        this.chunks[index]
                    ),
                    requestList: this.requestList
                })
                .then(() => {
                    // ② SUCCESS!
                    urls[i].status = Status.done;
                    max++;       // Giải phóng slot
                    counter++;   // Đếm hoàn thành

                    if (counter === len) {
                        resolve();      // TẤT CẢ xong!
                    } else {
                        start();        // Task tiếp theo
                    }
                })
                .catch(() => {
                    // ③ ERROR! → Retry logic
                    urls[i].status = Status.error;

                    if (typeof retryArr[index] !== "number") {
                        retryArr[index] = 0;
                    }
                    retryArr[index]++;

                    // ④ Quá 2 lần retry → REJECT!
                    if (retryArr[index] >= 2) {
                        return reject(
                            `Chunk ${index} failed after 2 retries`
                        );
                    }

                    console.log(
                        index,
                        retryArr[index],
                        "lần error"
                    );

                    // ⑤ Đánh dấu progress = -1 → ĐỎ
                    this.chunks[index].progress = -1;

                    max++;    // Giải phóng slot (counter KHÔNG tăng!)
                    start();  // Retry: start() sẽ tìm status=error
                });
            }
        };

        start();
    });
}
```

```
RETRY FLOW EXAMPLE:
═══════════════════════════════════════════════════════════════

  retryArr = []        (initially empty)

  chunk-3 FAIL:
  → retryArr = [,,,1]  (retryArr[3] = 1)
  → chunk-3.progress = -1 → ĐỎ
  → status = "error" → start() tìm lại → retry

  chunk-3 FAIL lần 2:
  → retryArr = [,,,2]  (retryArr[3] = 2, >= 2!)
  → REJECT! Upload dừng lại hoàn toàn

  chunk-5 FAIL lần 1:
  → retryArr = [,,,,, 1]
  → Retry...
  → chunk-5 SUCCESS lần 2!
  → counter++, tiếp tục upload → OK ✅

  KEY INSIGHT:
  → status = "error" → task vẫn ở trong urls[]
  → start() findIndex(status == error) → tìm lại task
  → counter KHÔNG tăng khi error → chỉ tăng khi success
  → max++ khi error → giải phóng slot cho retry/task khác
```

```
BACKEND — SIMULATE RANDOM ERROR:
═══════════════════════════════════════════════════════════════

  // Test retry logic:
  if (Math.random() < 0.5) {
      console.log("Random error triggered!");
      res.statusCode = 500;
      res.end();
      return;
  }

  → 50% chance mỗi chunk bị fail
  → Test retry mechanism hoạt động đúng
  → Production: remove! Chỉ dùng để test
```

---

## §7. File Fragment Cleanup — node-schedule

### Vấn Đề

```
ORPHAN CHUNKS — "FILE FRAGMENTS":
═══════════════════════════════════════════════════════════════

  User upload 50% → đóng tab → KHÔNG BAO GIỜ quay lại!
  → Server CHỨA chunks vô ích mãi mãi
  → Disk đầy → server crash! 💥

  SOLUTION: Scheduled cleanup job
  → Scan thư mục target/ định kỳ
  → Xóa chunks ĐÃ QUÁ HẠN (ví dụ: > 1 tháng)
  → Dùng node-schedule cho cron job

  Cron format:
  ┌────────────── second (0-59, optional)
  │ ┌──────────── minute (0-59)
  │ │ ┌────────── hour (0-23)
  │ │ │ ┌──────── day of month (1-31)
  │ │ │ │ ┌────── month (1-12)
  │ │ │ │ │ ┌──── day of week (0-7, 0 or 7 = Sun)
  │ │ │ │ │ │
  * * * * * *
```

### Implementation

```javascript
const fse = require("fs-extra");
const path = require("path");
const schedule = require("node-schedule");

// Kiểm tra file có quá hạn không
function remove(file, stats) {
  const now = new Date().getTime();
  const offset = now - stats.ctimeMs; // Thời gian tạo file

  if (offset > 1000 * 60 * 60 * 24 * 30) {
    // Quá 30 ngày → XÓA!
    console.log(file, "expired → deleting...");
    fse.unlinkSync(file);
  }
}

// Recursive scan directory
async function scan(dir, callback) {
  const files = fse.readdirSync(dir);
  files.forEach((filename) => {
    const fileDir = path.resolve(dir, filename);
    const stats = fse.statSync(fileDir);
    if (stats.isDirectory()) {
      return scan(fileDir, remove); // Recursive!
    }
    if (callback) {
      callback(fileDir, stats);
    }
  });
}

// Start scheduled cleanup
function start(UPLOAD_DIR) {
  // Chạy mỗi ngày lúc 3:00 AM
  schedule.scheduleJob("0 3 * * *", function () {
    console.log("Starting fragment cleanup scan...");
    scan(UPLOAD_DIR);
  });
}

exports.start = start;
```

```
CLEANUP EXAMPLE LOG:
═══════════════════════════════════════════════════════════════

  [3:00 AM] Starting fragment cleanup scan...
  /upload/target/625c.../625c...-0   expired → deleting...
  /upload/target/625c.../625c...-1   expired → deleting...
  /upload/target/625c.../625c...-10  expired → deleting...
  /upload/target/625c.../625c...-11  expired → deleting...
  /upload/target/625c.../625c...-12  expired → deleting...

  → Orphan chunks bị xóa tự động!
  → Disk space được giải phóng

  PRODUCTION IMPROVEMENTS:
  ① Xóa empty directories sau khi xóa chunks
  ② Log ra monitoring system (không chỉ console)
  ③ Gửi alert nếu quá nhiều orphan chunks (leak detection)
  ④ Backup trước khi xóa (safety net)
```

---

## Tóm Tắt

### Quick Reference

```
ADVANCED FILE UPLOAD — QUICK REF:
═══════════════════════════════════════════════════════════════

  TIME SLICE HASH:
  → requestIdleCallback: tính hash trong browser idle time
  → deadline.timeRemaining() > 1 → tính tiếp
  → Hết idle time → requestIdleCallback(workLoop) tiếp
  → React Fiber concept: chia nhỏ work, không block UI

  SAMPLING HASH:
  → First + Last slice: TOÀN BỘ (2MB each)
  → Middle slices: 2 bytes × 3 positions (đầu/giữa/cuối)
  → 1.5GB: 21s → 1s (20x faster!)
  → Bloom Filter logic: "NO" = chắc chắn, "YES" = cần verify

  CONCURRENCY CONTROL:
  → max slots (default: 4)
  → max-- khi start request, max++ khi complete
  → counter === len → resolve, else start() tiếp
  → ByteDance interview question!

  TCP SLOW START:
  → Initial chunk: 1MB
  → rate = uploadTime / targetTime (30s)
  → Clamp: 0.5 ≤ rate ≤ 2
  → newOffset = currentOffset / rate
  → Nhanh hơn target → chunk size TĂNG
  → Chậm hơn target → chunk size GIẢM

  CUBE PROGRESS BAR:
  → Grid squares: 🟩 done, 🟦 uploading, ⬜ wait, 🟥 error
  → Width: ceil(√chunks) × 16px → near-square grid
  → Visual: concurrent slots dễ thấy, error dễ spot

  CONCURRENT RETRY:
  → .catch → status = "error", retryArr[index]++
  → retryArr[index] >= 2 → reject() (dừng upload)
  → progress = -1 → đỏ (visual feedback)
  → start() findIndex(status == error) → retry task

  FILE CLEANUP:
  → node-schedule cron job
  → scan() recursive → check ctimeMs → unlinkSync
  → "0 3 * * *" = mỗi ngày lúc 3 AM
```

### Comparison Table

```
3 CÁCH TÍNH HASH — SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────┬──────────┬──────────────────┐
  │                  │ Web      │ rIdC     │ Sampling         │
  │                  │ Worker   │ Time     │ Hash             │
  │                  │          │ Slice    │                  │
  ├──────────────────┼──────────┼──────────┼──────────────────┤
  │ Thread           │ Separate │ Main     │ Main             │
  │ Block UI?        │ ❌       │ ❌       │ ❌ (fast finish) │
  │ Accuracy         │ 100%     │ 100%     │ ~99%             │
  │ Speed (1.5GB)    │ ~20s     │ ~20s     │ ~1s              │
  │ Code complexity  │ Medium   │ Medium   │ Simple           │
  │ Use case         │ Resume   │ Resume   │ Instant check    │
  │                  │ upload   │ upload   │ only             │
  └──────────────────┴──────────┴──────────┴──────────────────┘

  Best combo: Sampling (fast check) → Full hash (verify if match)
```

### Further Exploration

```
MỞ RỘNG — TOPICS CHƯA COVER:
═══════════════════════════════════════════════════════════════

  ① requestIdleCallback polyfill:
     → React tự implement bằng MessageChannel + performance.now()
     → Vì rIdC không available trên mọi browser

  ② Concurrency + Slow Start combo:
     → Mỗi concurrent slot → riêng offset?
     → Shared moving average of upload speed?

  ③ Sampling hash + Full hash + Time Slice combo:
     → Step 1: Sampling hash (instant check, ~1s)
     → Step 2: Full hash via rIdC (background, non-blocking)
     → Best of all worlds!

  ④ Large file DOWNLOAD (slice download):
     → axios.head() → get Content-Length
     → HTTP Range header → download từng segment
     → Logic tương tự upload, ngược chiều

  ⑤ WebSocket push progress:
     → Server push progress → client (thay vì client poll)
     → Real-time, less overhead

  ⑥ UX optimizations:
     → beforeunload warning khi rời page
     → Smoothing rate changes (trigonometric functions)
     → Offline detection + auto-pause
```

### Checklist

- [ ] requestIdleCallback: tính hash trong idle time, KHÔNG block UI
- [ ] deadline.timeRemaining() > 1: check trước khi tính chunk tiếp
- [ ] Khi hết idle time: requestIdleCallback(workLoop) đăng ký tiếp
- [ ] React Fiber analogy: chia nhỏ diff/work → time slice → smooth UI
- [ ] Sampling hash: first/last FULL + middle 2B×3 → Blob → MD5
- [ ] Sampling vs Full: speed (20x) vs accuracy (99% vs 100%)
- [ ] Bloom Filter logic: "NO" = certain, "YES" = probabilistic
- [ ] Concurrency control: max slots, max-- start, max++ complete
- [ ] while (idx < len && max > 0): có task VÀ có slot trống
- [ ] counter === len → resolve, counter < len → start() tiếp
- [ ] TCP Slow Start: initial 1MB, rate = time/30, offset /= rate
- [ ] Rate clamp: 0.5 ≤ rate ≤ 2 → prevent quá extreme
- [ ] Cube progress: float grid squares, √N width, color-coded
- [ ] Retry: .catch → status=error, retryArr++, findIndex retry
- [ ] Max retry: retryArr[i] >= 2 → reject() (total 3 attempts)
- [ ] progress = -1 → error state → red cube
- [ ] Fragment cleanup: node-schedule, scan recursive, ctimeMs check
- [ ] Cron: "0 3 \* \* \*" = daily 3AM, unlinkSync expired files

---

_Nguồn: ByteDance Interview — Large File Upload Advanced Techniques (Part 2)_
_Tiếp nối bài gốc @yeyan1996, mở rộng bởi @shengxinjing_
_Cập nhật lần cuối: Tháng 2, 2026_
