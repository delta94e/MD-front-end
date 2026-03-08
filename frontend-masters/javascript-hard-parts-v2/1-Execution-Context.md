# JavaScript: The Hard Parts v2 — Phần 1: Execution Context

> 📅 2026-03-06 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: JavaScript: The Hard Parts, v2
> Bài: Execution Context
> Độ khó: ⭐️⭐️⭐️ | Nền tảng cốt lõi — Mọi thứ bắt đầu từ đây

---

## Mục Lục

| #   | Phần                                               |
| --- | -------------------------------------------------- |
| 1   | Hai Thứ Duy Nhất JavaScript Làm                    |
| 2   | Thread of Execution — Sợi Chỉ Thực Thi             |
| 3   | Memory — Bộ Nhớ Lưu Trữ Dữ Liệu                    |
| 4   | Execution Context — Ngữ Cảnh Thực Thi              |
| 5   | Walkthrough: multiplyBy2 — Từng Dòng Code          |
| 6   | Local Memory vs Global Memory                      |
| 7   | Parameter vs Argument — Phân Biệt Rõ Ràng          |
| 8   | Return — Cánh Cổng Duy Nhất Ra Khỏi Function       |
| 9   | Thuật Ngữ Chính Xác — Technical Communication      |
| 10  | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu |

---

## §1. Hai Thứ Duy Nhất JavaScript Làm

### 1.1 Bài Viết Chuyên Sâu

Đây là insight quan trọng nhất mà Will Sentance mở đầu bài học: **Khi chạy code, JavaScript CHỈ làm đúng 2 thứ:**

1. **Đi qua code từng dòng một** (Thread of Execution)
2. **Lưu trữ dữ liệu vào bộ nhớ** (Memory)

Nghe đơn giản đến mức bạn có thể bỏ qua. Nhưng đây chính là **"luật vật lý" của JavaScript** — mọi thứ phức tạp hơn (closure, prototype, async) đều xây trên 2 nền tảng này.

Hãy nghĩ về nó như vật lý: mọi hiện tượng trong vũ trụ đều tuân theo một vài định luật cơ bản. Tương tự, mọi "phép thuật" trong JavaScript đều quay về **thread + memory**.

> **Tại sao nhiều senior engineers vẫn hiểu sai?** Vì họ nhảy thẳng vào frameworks, patterns, abstractions mà không bao giờ quay lại kiểm tra: "Thread đang ở dòng nào? Memory đang chứa gì?" Khi debug, họ _đoán_ thay vì _trace_.

```
HAI THỨ DUY NHẤT JAVASCRIPT LÀM:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │             JAVASCRIPT RUNTIME                          │
  │                                                         │
  │  ① THREAD OF EXECUTION                                  │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │                                                   │  │
  │  │  Dòng 1 ──→ thực thi ──→ xong                    │  │
  │  │  Dòng 2 ──→ thực thi ──→ xong                    │  │
  │  │  Dòng 3 ──→ thực thi ──→ xong                    │  │
  │  │  ... (từng dòng, KHÔNG nhảy cóc)                  │  │
  │  │                                                   │  │
  │  └───────────────────────────────────────────────────┘  │
  │                                                         │
  │  ② MEMORY (Bộ nhớ)                                      │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │                                                   │  │
  │  │  num ──────────→ 3                                │  │
  │  │  multiplyBy2 ──→ ƒ (toàn bộ code)                │  │
  │  │  output ───────→ 6                                │  │
  │  │                                                   │  │
  │  └───────────────────────────────────────────────────┘  │
  │                                                         │
  │  Chỉ 2 thứ này. Không có thứ 3.                        │
  └─────────────────────────────────────────────────────────┘
```

### 1.2 Tại Sao Chỉ Có 2 Thứ?

Về bản chất, **mọi chương trình máy tính** (không chỉ JavaScript) đều làm 2 việc:

- **Lưu trữ** dữ liệu (trong RAM, disk, register...)
- **Xử lý** dữ liệu (CPU đọc instruction → thực thi)

JavaScript engine (V8, SpiderMonkey) trừu tượng hoá 2 việc này thành:

- **Memory** = nơi lưu biến, hàm, objects
- **Thread of Execution** = con trỏ đọc code từ trên xuống, một dòng một lúc

```
MÁY TÍNH vs JAVASCRIPT — CÙNG 2 THỨ:
═══════════════════════════════════════════════════════════════

  MÁY TÍNH (phần cứng):           JAVASCRIPT (trừu tượng):
  ┌──────────────────────┐        ┌──────────────────────┐
  │ CPU → đọc instruction│   ≡    │ Thread of Execution  │
  │ từng cái, tuần tự    │        │ → đọc code từng dòng │
  └──────────────────────┘        └──────────────────────┘
  ┌──────────────────────┐        ┌──────────────────────┐
  │ RAM → lưu dữ liệu   │   ≡    │ Memory → lưu biến,  │
  │ chờ CPU truy cập     │        │ hàm, objects         │
  └──────────────────────┘        └──────────────────────┘

  → JavaScript chỉ là ABSTRACTION LAYER trên phần cứng!
```

---

## §2. Thread of Execution — Sợi Chỉ Thực Thi

### 2.1 Bài Viết: "Thread" Nghĩa Là Gì?

Hình dung một sợi chỉ (thread) đang "dệt" (weave) qua trang code của bạn, từ trên xuống dưới, từng dòng một. Will Sentance dùng chính xác từ "weave" — thread **dệt** qua code, vào trong function, ra ngoài, rồi tiếp tục dệt xuống.

**3 đặc tính quan trọng của Thread of Execution:**

1. **Single-threaded** — CHỈ CÓ 1 sợi chỉ. Không có sợi thứ 2 chạy song song (trong JS engine).
2. **Synchronous** — Đi TUẦN TỰ. Dòng 1 xong mới dòng 2. Không nhảy cóc.
3. **Top-to-bottom** — Đi từ TRÊN xuống DƯỚI. Trừ khi gặp function call → "nhảy vào" function → xong rồi "nhảy ra" tiếp tục.

> **Analogy:** Thread giống như bạn đọc sách — đọc từ trang 1, dòng 1, sang dòng 2,... Khi gặp footnote → nhảy xuống đọc footnote → quay lại chỗ cũ đọc tiếp. Bạn KHÔNG đọc 2 dòng cùng lúc.

```
THREAD OF EXECUTION — HÌNH DUNG:
═══════════════════════════════════════════════════════════════

  Code:                          Thread:
  ┌──────────────────────┐
  │ const num = 3;       │ ←──── ■ Thread ở đây (dòng 1)
  │                      │       │
  │ function multiply(x) │ ←──── ■ Thread ở đây (dòng 2)
  │ {                    │       │ (LƯU function, KHÔNG chạy!)
  │   return x * 2;      │       │
  │ }                    │       │
  │                      │       │
  │ const result =       │ ←──── ■ Thread ở đây (dòng 7)
  │   multiply(num);     │       │
  │                      │       ↓ nhảy VÀO multiply()
  │                      │       ┌──────────────────┐
  │                      │       │ x = 3            │
  │                      │       │ return 3 * 2 → 6 │
  │                      │       └──────┬───────────┘
  │                      │              ↓ nhảy RA
  │ // result = 6        │ ←──── ■ Thread tiếp tục
  └──────────────────────┘

  Thread "dệt" (weave):
  → vào code → gặp function call → dệt VÀO function
  → xong function → dệt RA → tiếp tục code bên ngoài
```

### 2.2 Quá Trình "Bật" JavaScript

Will Sentance mô tả một điều mà ít ai nghĩ đến: **"Switching on JavaScript"** — khoảnh khắc bạn chạy file `.js`, điều gì xảy ra?

```
"SWITCHING ON" JAVASCRIPT:
═══════════════════════════════════════════════════════════════

  Bước 1: Runtime được khởi tạo
  ┌──────────────────────────────────────────────────────┐
  │ JS Runtime = ứng dụng có thể INTERPRET code         │
  │              và THỰC HIỆN những gì code nói          │
  └──────────────────────────────────────────────────────┘

  Bước 2: Global Execution Context được tạo
  ┌──────────────────────────────────────────────────────┐
  │ GLOBAL EXECUTION CONTEXT                             │
  │ ┌──────────────────────────────────────────────────┐ │
  │ │ Thread of Execution: bắt đầu từ DÒNG 1          │ │
  │ └──────────────────────────────────────────────────┘ │
  │ ┌──────────────────────────────────────────────────┐ │
  │ │ Global Memory: rỗng, chờ lưu dữ liệu           │ │
  │ └──────────────────────────────────────────────────┘ │
  └──────────────────────────────────────────────────────┘

  Bước 3: Thread bắt đầu "dệt" qua code, từng dòng
  → Dòng 1: gặp const num = 3 → LƯU vào Global Memory
  → Dòng 2: gặp function multiply → LƯU vào Global Memory
  → ...
```

---

## §3. Memory — Bộ Nhớ Lưu Trữ Dữ Liệu

### 3.1 Bài Viết: Memory Là "Nhà Kho" Của Chương Trình

Khi thread đi qua từng dòng code, nó cần một nơi để **lưu trữ** những gì đã gặp. Nơi đó là **Memory** — một "nhà kho" ánh xạ **tên (label/identifier)** sang **giá trị (value)**.

Mỗi khi bạn viết `const x = 5`, JavaScript engine làm đúng 1 việc: tạo một **ô** trong memory với nhãn `x` và giá trị `5`.

**Quan trọng:** Khi lưu **function**, JavaScript KHÔNG chạy code bên trong function — nó lưu **toàn bộ code** dưới dạng một "blob" vào memory. Code đó chỉ chạy khi bạn GỌI function (bằng dấu `()`).

```
MEMORY — LƯU DỮ LIỆU NHƯ THẾ NÀO:
═══════════════════════════════════════════════════════════════

  Code:                          Memory (nhà kho):
                                 ┌──────────────────────────┐
  const num = 3;        ──→      │ num: 3                   │
                                 ├──────────────────────────┤
  function multiplyBy2  ──→      │ multiplyBy2: ƒ           │
     (inputNumber) {             │   ┌──────────────────┐   │
    const result =               │   │ (inputNumber) {  │   │
     inputNumber * 2;            │   │   const result =  │   │
    return result;               │   │    inputNumber*2; │   │
  }                              │   │   return result;  │   │
                                 │   └──────────────────┘   │
                                 │   ↑ TOÀN BỘ code được   │
                                 │     lưu, CHƯA chạy!     │
                                 ├──────────────────────────┤
  const output =        ──→      │ output: (chờ...)         │
    multiplyBy2(num);            │                          │
                                 └──────────────────────────┘

  Lưu ý quan trọng:
  ─────────────────
  • const num = 3     → Lưu SỐ 3
  • function multiply → Lưu TOÀN BỘ code (chưa chạy!)
  • const output = ?  → CHƯA BIẾT giá trị! Phải chạy function
                         trước rồi mới biết → gán "uninitialized"
```

### 3.2 Hai Loại Dữ Liệu Được Lưu

```
HAI LOẠI DỮ LIỆU TRONG MEMORY:
═══════════════════════════════════════════════════════════════

  ① GIÁ TRỊ (Values):
  ─────────────────────
  num     → 3           (số)
  name    → "Jun"       (chuỗi)
  active  → true        (boolean)
  items   → [1, 2, 3]   (mảng — lưu reference)
  person  → {age: 25}   (object — lưu reference)

  ② HÀM (Functions):
  ─────────────────────
  multiplyBy2 → ƒ(inputNumber) {
                    const result = inputNumber * 2;
                    return result;
                }
  → Lưu TOÀN BỘ code definition!
  → KHÔNG chạy cho đến khi gặp dấu ()
  → Will vẽ shorthand là "ƒ" trên bảng

  PHÂN BIỆT QUAN TRỌNG:
  ═══════════════════════════════════════════
  multiplyBy2          → nhãn (label) trỏ đến function
  multiplyBy2(3)       → GỌI function → chạy code → trả kết quả
  ─────────────
  KHÔNG có ()  = chỉ THAM CHIẾU đến function (pass around)
  CÓ ()        = GỌI function, TẠO execution context mới!
```

---

## §4. Execution Context — Ngữ Cảnh Thực Thi

### 4.1 Bài Viết: "Mini Program" Bên Trong Function

Đây là khái niệm **quan trọng nhất** của toàn bộ bài học. Will Sentance gọi nó là **"the most important thing in JavaScript"**.

Khi bạn **gọi** (call/invoke/execute) một function, JavaScript tạo ra một **Execution Context** — hãy nghĩ nó như một **"chương trình con" (mini program)** bên trong chương trình chính. Mini program này có đầy đủ 2 thành phần giống hệt chương trình chính:

1. **Thread of Execution riêng** — đi qua code bên trong function từng dòng
2. **Local Memory riêng** — lưu trữ dữ liệu chỉ tồn tại bên trong function

Khi function kết thúc (return), execution context bị **huỷ** — mọi thứ bên trong (local memory) bị **quên** (garbage collected). Chỉ có giá trị return được "mang ra ngoài".

> **Analogy:** Execution Context giống như một phòng họp tạm. Bạn vào phòng, mang theo tài liệu (arguments), làm việc trên whiteboard (local memory), ra kết quả (return value). Khi họp xong, phòng bị đóng — whiteboard bị xoá sạch. Chỉ có bản báo cáo (return value) được mang ra ngoài.

```
EXECUTION CONTEXT — CẤU TRÚC:
═══════════════════════════════════════════════════════════════

  Khi GỌI function multiplyBy2(3):

  ┌─────────────────────────────────────────────────────────┐
  │         EXECUTION CONTEXT    multiplyBy2(3)             │
  │                                                         │
  │  ┌─────────────────────────────────────────────────┐    │
  │  │ LOCAL MEMORY (Variable Environment)              │    │
  │  │                                                  │    │
  │  │   inputNumber: 3      ← parameter nhận argument  │    │
  │  │   result:      6      ← kết quả tính toán       │    │
  │  │                                                  │    │
  │  └─────────────────────────────────────────────────┘    │
  │                                                         │
  │  ┌─────────────────────────────────────────────────┐    │
  │  │ THREAD OF EXECUTION                              │    │
  │  │                                                  │    │
  │  │   Dòng 1: inputNumber = 3     (gán argument)    │    │
  │  │   Dòng 2: result = 3 * 2 = 6  (tính toán)      │    │
  │  │   Dòng 3: return 6            (trả kết quả)    │    │
  │  │                                                  │    │
  │  └─────────────────────────────────────────────────┘    │
  │                                                         │
  └──────────────────────────┬──────────────────────────────┘
                             │ return 6
                             ↓
                    output = 6 (trong Global Memory)

  Sau khi return:
  → Execution Context bị ĐÓNG (closed)
  → Local Memory bị XOÁ (garbage collected)
  → Thread quay lại Global, tiếp tục dòng tiếp theo
```

### 4.2 Global Execution Context vs Function Execution Context

```
HAI LOẠI EXECUTION CONTEXT:
═══════════════════════════════════════════════════════════════

  ① GLOBAL EXECUTION CONTEXT:
  ┌─────────────────────────────────────────────────────────┐
  │ Được tạo TỰ ĐỘNG khi "bật" JavaScript                  │
  │ → Tồn tại SUỐT thời gian chạy chương trình             │
  │ → Global Memory = nơi lưu biến/hàm ở top-level         │
  │ → Thread bắt đầu từ dòng đầu tiên                      │
  │ → KHÔNG bao giờ bị "đóng" (trừ khi chương trình kết    │
  │   thúc hoặc tab browser đóng)                           │
  └─────────────────────────────────────────────────────────┘

  ② FUNCTION EXECUTION CONTEXT:
  ┌─────────────────────────────────────────────────────────┐
  │ Được tạo MỖI KHI gọi function (dấu parentheses ())     │
  │ → Tạo MỚI cho MỖI lần gọi (gọi 2 lần = 2 contexts)    │
  │ → Local Memory = chỉ tồn tại trong lần gọi này         │
  │ → Thread "dệt vào" function, chạy code bên trong       │
  │ → Khi return → context bị ĐÓNG → memory bị XOÁ         │
  │ → Giá trị return được "mang ra ngoài"                   │
  └─────────────────────────────────────────────────────────┘

  QUAN TRỌNG: Mỗi lần gọi function = CONTEXT MỚI HOÀN TOÀN!
  ─────────────────────────────────────────────────────────
  multiplyBy2(3)  → context A: inputNumber=3, result=6
  multiplyBy2(10) → context B: inputNumber=10, result=20
  → A và B HOÀN TOÀN ĐỘC LẬP, không chia sẻ gì!
```

---

## §5. Walkthrough: multiplyBy2 — Từng Dòng Code

### 5.1 Code Gốc

```javascript
const num = 3;

function multiplyBy2(inputNumber) {
  const result = inputNumber * 2;
  return result;
}

const output = multiplyBy2(num);
const newOutput = multiplyBy2(10);
```

### 5.2 Trace Từng Dòng — Verbal Walkthrough

Đây là kỹ năng **Technical Communication** mà Will Sentance yêu cầu: nói TO, chính xác, từng bước.

```
TRACE TỪNG DÒNG — VERBAL WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  "BẬT" JavaScript → Tạo Global Execution Context
  ─────────────────────────────────────────────────

  GLOBAL MEMORY                 │ THREAD
  ┌──────────────────────────┐  │
  │                          │  │  Dòng 1: const num = 3
  │  num: 3                  │ ←┤  → Khai báo constant num
  │                          │  │    → Gán giá trị 3
  │                          │  │    → Lưu vào Global Memory
  │                          │  │
  │  multiplyBy2: ƒ          │ ←┤  Dòng 2-5: function multiplyBy2...
  │                          │  │  → Khai báo function
  │                          │  │  → Lưu TOÀN BỘ code vào memory
  │                          │  │  → KHÔNG chạy code bên trong!
  │                          │  │  → Thread NHẢY QUA body,
  │                          │  │    đến dòng tiếp theo SAU }
  │                          │  │
  │  output: uninitialized   │ ←┤  Dòng 7: const output = multiplyBy2(num)
  │                          │  │  → Thấy multiplyBy2(num)
  │                          │  │  → Có dấu () → GỌI function!
  │                          │  │  → num evaluate → 3
  │                          │  │  → Chưa biết output = gì
  │                          │  │  → Phải đi VÀO function trước!
  └──────────────────────────┘  │
```

```
LẦN GỌI THỨ 1: multiplyBy2(3)
═══════════════════════════════════════════════════════════════

  Thread dệt VÀO function → Tạo Execution Context MỚI:

  ┌────────────────────────────────────────────────────────┐
  │  EXECUTION CONTEXT: multiplyBy2(3)                     │
  │                                                        │
  │  LOCAL MEMORY:              │ THREAD:                  │
  │  ┌────────────────────────┐ │                          │
  │  │                        │ │ ① Parameter assignment:  │
  │  │ inputNumber: 3         │←┤   inputNumber = 3       │
  │  │                        │ │   (argument 3 → param)  │
  │  │                        │ │                          │
  │  │ result: 6              │←┤ ② const result =        │
  │  │                        │ │   inputNumber * 2        │
  │  │                        │ │   = 3 * 2 = 6           │
  │  │                        │ │                          │
  │  └────────────────────────┘ │ ③ return result          │
  │                             │   → evaluate result → 6  │
  │                             │   → trả 6 RA NGOÀI       │
  └──────────────────────┬──────┴──────────────────────────┘
                         │
                         │ return 6
                         ↓
  GLOBAL MEMORY cập nhật:
  ┌──────────────────────────┐
  │  num: 3                  │
  │  multiplyBy2: ƒ          │
  │  output: 6  ← CẬP NHẬT! │  ← 6 từ return được gán vào
  └──────────────────────────┘

  → Execution Context bị ĐÓNG → Local Memory bị XOÁ
  → inputNumber, result → BIẾN MẤT! Chỉ còn giá trị 6
  → Thread quay lại Global, tiếp tục dòng tiếp theo
```

```
LẦN GỌI THỨ 2: multiplyBy2(10)
═══════════════════════════════════════════════════════════════

  Thread tiếp tục → gặp multiplyBy2(10) → Tạo CONTEXT MỚI:

  ┌────────────────────────────────────────────────────────┐
  │  EXECUTION CONTEXT: multiplyBy2(10)     ← HOÀN TOÀN   │
  │                                           MỚI!         │
  │  LOCAL MEMORY:              │ THREAD:                  │
  │  ┌────────────────────────┐ │                          │
  │  │                        │ │ ① Parameter assignment:  │
  │  │ inputNumber: 10        │←┤   inputNumber = 10      │
  │  │                        │ │                          │
  │  │ result: 20             │←┤ ② const result =        │
  │  │                        │ │   10 * 2 = 20            │
  │  │                        │ │                          │
  │  └────────────────────────┘ │ ③ return result → 20     │
  └──────────────────────┬──────┴──────────────────────────┘
                         │
                         │ return 20
                         ↓
  GLOBAL MEMORY cuối cùng:
  ┌──────────────────────────┐
  │  num: 3                  │
  │  multiplyBy2: ƒ          │
  │  output: 6               │
  │  newOutput: 20 ← MỚI!   │
  └──────────────────────────┘
```

### 5.3 Tự Implement: Mô Phỏng Execution Context

```javascript
// TỰ XÂY LẠI EXECUTION CONTEXT — Không dùng thư viện!

// Global Memory = plain object
const globalMemory = {};

// Mô phỏng thread đi qua code từng dòng:

// Dòng 1: const num = 3
globalMemory.num = 3;
// Thread: "Khai báo constant num, gán giá trị 3, lưu vào memory"

// Dòng 2-5: function multiplyBy2(inputNumber) { ... }
globalMemory.multiplyBy2 = function (inputNumber) {
  const result = inputNumber * 2;
  return result;
};
// Thread: "Lưu TOÀN BỘ function definition vào memory, KHÔNG chạy"

// Dòng 7: const output = multiplyBy2(num)
// Thread: "Gặp (), TẠO execution context mới!"

function executeMultiplyBy2(argument) {
  // ① Tạo Local Memory (execution context)
  const localMemory = {};

  // ② Gán argument vào parameter
  localMemory.inputNumber = argument; // 3

  // ③ Chạy code bên trong function
  localMemory.result = localMemory.inputNumber * 2; // 6

  // ④ Return: trả giá trị RA NGOÀI
  const returnValue = localMemory.result; // 6

  // ⑤ Execution context bị đóng → local memory bị xoá
  // (trong thực tế, JS engine garbage collect localMemory)

  return returnValue;
}

// Gán return value vào global memory
globalMemory.output = executeMultiplyBy2(globalMemory.num); // 6
globalMemory.newOutput = executeMultiplyBy2(10); // 20

console.log(globalMemory);
// { num: 3, multiplyBy2: ƒ, output: 6, newOutput: 20 }
```

---

## §6. Local Memory vs Global Memory

```
LOCAL MEMORY vs GLOBAL MEMORY:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │ GLOBAL MEMORY (Global Scope)                            │
  │                                                         │
  │ • Tồn tại SUỐT chương trình                            │
  │ • Mọi nơi đều truy cập được                            │
  │ • Biến khai báo ở top-level                             │
  │ • Còn gọi: Global Variable Environment                 │
  │                                                         │
  │  ┌──────────────────────────────────────────────────┐   │
  │  │ num: 3 | multiplyBy2: ƒ | output: 6             │   │
  │  └──────────────────────────────────────────────────┘   │
  │                                                         │
  │  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
  │  │ LOCAL MEMORY (khi gọi multiplyBy2(3))            │   │
  │  │                                                   │   │
  │  │ • Tồn tại CHỈ KHI function đang chạy            │   │
  │  │ • Chỉ truy cập TRONG function                    │   │
  │  │ • Bị XOÁ khi function return                     │   │
  │  │ • Còn gọi: Local Variable Environment            │   │
  │  │                                                   │   │
  │  │  ┌──────────────────────────────────────────┐    │   │
  │  │  │ inputNumber: 3 | result: 6               │    │   │
  │  │  └──────────────────────────────────────────┘    │   │
  │  │                                                   │   │
  │  │ → Sau return: inputNumber BỊ XOÁ!               │   │
  │  │                result BỊ XOÁ!                    │   │
  │  │                Chỉ GIÁ TRỊ 6 được mang ra       │   │
  │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
  └─────────────────────────────────────────────────────────┘

  NGUYÊN TẮC: "Mất label, giữ value"
  ───────────────────────────────────
  Khi return result:
  → Label "result" bị mất (local memory bị xoá)
  → Giá trị 6 được mang ra ngoài
  → Gán vào label "output" ở global memory
```

---

## §7. Parameter vs Argument — Phân Biệt Rõ Ràng

```
PARAMETER vs ARGUMENT:
═══════════════════════════════════════════════════════════════

  function multiplyBy2(inputNumber) { ... }
                        ↑
                    PARAMETER (tham số)
                    = TÊN giữ chỗ (placeholder)
                    = "cái hộp rỗng" chờ nhận giá trị
                    = Được khai báo trong function definition

  multiplyBy2(3)
               ↑
           ARGUMENT (đối số)
           = GIÁ TRỊ thực tế truyền vào
           = "thứ bỏ vào hộp"
           = Được truyền khi GỌI function

  VÍ DỤ:
  ┌──────────────────────────────────────────────────────┐
  │ function greet(name, greeting) {                     │
  │                ^^^^  ^^^^^^^^                        │
  │            parameters (tham số)                      │
  │   return greeting + ", " + name;                     │
  │ }                                                    │
  │                                                      │
  │ greet("Jun", "Hello")                                │
  │       ^^^^^  ^^^^^^^                                 │
  │       arguments (đối số)                             │
  │                                                      │
  │ Khi gọi: name = "Jun", greeting = "Hello"            │
  │ → Parameter NHẬN giá trị từ argument                 │
  │ → Lưu vào LOCAL MEMORY của execution context         │
  └──────────────────────────────────────────────────────┘

  MẸO NHỚ:
  → Parameter = Placeholder (chữ P)
  → Argument  = Actual value (chữ A)
```

---

## §8. Return — Cánh Cổng Duy Nhất Ra Khỏi Function

### 8.1 Bài Viết: Return Là "Cánh Cổng Một Chiều"

`return` là cách **duy nhất** để đưa dữ liệu từ bên trong function ra bên ngoài. Không có cách nào khác (trừ side effects như sửa global variable, nhưng đó là bad practice).

**Quan trọng:** `return` trả về **GIÁ TRỊ**, không phải **label**.

```
RETURN — CÁCH HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  function multiplyBy2(inputNumber) {
    const result = inputNumber * 2;
    return result;    ← return LABEL "result"?
  }                       KHÔNG! Return GIÁ TRỊ của result!

  BƯỚC 1: result = inputNumber * 2 = 3 * 2 = 6
  BƯỚC 2: return result
          → JS evaluate "result" → tìm trong local memory → 6
          → return 6 (CON SỐ 6, không phải chữ "result"!)

  BƯỚC 3: Execution Context đóng
          → Local memory bị xoá:
            inputNumber ← XOÁ!
            result      ← XOÁ!
          → Chỉ GIÁ TRỊ 6 thoát ra ngoài

  BƯỚC 4: 6 được gán vào label bên ngoài
          → const output = 6

  ┌─────────────────────────────────────────────────┐
  │  BÊN TRONG (local)     │    BÊN NGOÀI (global) │
  │                        │                        │
  │  inputNumber: 3  ═╗    │                        │
  │  result: 6  ══════╬═══ return 6 ═══→  output: 6│
  │                   ║    │                        │
  │  (tất cả bị XOÁ) ═╝    │    (chỉ 6 sống sót)   │
  └────────────────────────┴────────────────────────┘
```

```javascript
// MINH HOẠ: Return trả GIÁ TRỊ, không phải label

function getFullName(first, last) {
  const full = first + " " + last;
  return full; // return GIÁ TRỊ "Jun Nguyen", không phải chữ "full"
}

const name = getFullName("Jun", "Nguyen");
// name = "Jun Nguyen"
// Sau khi return:
// - first, last, full → ĐỀU BỊ XOÁ!
// - Chỉ "Jun Nguyen" sống sót, gán vào "name"

// KHÔNG CÓ RETURN → trả về undefined!
function noReturn(x) {
  const y = x * 2;
  // Không có return → implicit return undefined
}
const result = noReturn(5);
console.log(result); // undefined! (y=10 bị XOÁ, không ai mang ra)

// RETURN DỪNG FUNCTION NGAY LẬP TỨC!
function earlyReturn(x) {
  if (x < 0) return "negative"; // ← Thoát ngay!
  const y = x * 2; // ← KHÔNG chạy nếu x < 0
  return y;
}
earlyReturn(-5); // "negative" — dòng const y KHÔNG bao giờ chạy!
```

---

## §9. Thuật Ngữ Chính Xác — Technical Communication

### 9.1 Bảng Thuật Ngữ

Will Sentance nhấn mạnh: tất cả các từ sau **nghĩa GIỐNG NHAU** nhưng dùng trong ngữ cảnh khác:

```
THUẬT NGỮ TƯƠNG ĐƯƠNG:
═══════════════════════════════════════════════════════════════

  "GỌI function":
  ┌──────────────────────────────────────────────────────┐
  │ Call        │ Invoke       │ Run          │ Execute  │
  │ Evaluate    │ Trigger      │ Fire         │ Activate │
  └──────────────────────────────────────────────────────┘
  → TẤT CẢ nghĩa: "chạy code bên trong function"
  → Cách nhận biết: có dấu PARENTHESES ()

  "KHAI BÁO function":
  ┌──────────────────────────────────────────────────────┐
  │ Declare     │ Define       │ Save         │ Store    │
  └──────────────────────────────────────────────────────┘
  → TẤT CẢ nghĩa: "lưu code function vào memory"
  → Cách nhận biết: keyword "function" hoặc arrow =>

  "BIẾN":
  ┌──────────────────────────────────────────────────────┐
  │ Variable    │ Identifier   │ Label        │ Binding  │
  │ Name        │ Handle       │              │          │
  └──────────────────────────────────────────────────────┘
  → TẤT CẢ nghĩa: "tên trỏ đến giá trị trong memory"

  "GIÁ TRỊ":
  ┌──────────────────────────────────────────────────────┐
  │ Value       │ Data         │ Output       │ Result   │
  └──────────────────────────────────────────────────────┘
  → TẤT CẢ nghĩa: "dữ liệu thực tế được lưu"
```

### 9.2 Function Declaration vs Function Call

```
FUNCTION DECLARATION vs FUNCTION CALL:
═══════════════════════════════════════════════════════════════

  ① DECLARATION (Khai báo) — Keyword "function":
  ──────────────────────────────────────────────────
  function multiplyBy2(inputNumber) {
    const result = inputNumber * 2;
    return result;
  }
  → LƯU toàn bộ code vào memory
  → KHÔNG chạy code bên trong!
  → Thread NHẢY QUA body, đến dòng sau }
  → Trong memory: multiplyBy2 → ƒ

  ② CALL (Gọi) — Dấu parentheses ():
  ──────────────────────────────────────────────────
  multiplyBy2(3)
  → TẠO Execution Context MỚI
  → Thread DỆT VÀO function
  → Gán argument vào parameter
  → Chạy code bên trong
  → Return giá trị ra ngoài
  → Context bị ĐÓNG

  ⚠️ SAI LẦM PHỔ BIẾN:
  ───────────────────────
  const fn = multiplyBy2;     // SAO CHÉP reference → fn trỏ đến ƒ
  const fn = multiplyBy2();   // GỌI function → fn = giá trị return!
  //                    ^^
  //                    Dấu () = KHÁC BIỆT HOÀN TOÀN!
```

---

## §10. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

> Áp dụng 6 pattern tư duy từ Phần 0 vào chủ đề Execution Context.

### 10.1 Pattern ①: 5 Whys — Execution Context

```
5 WHYS: TẠI SAO CẦN EXECUTION CONTEXT?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao function cần Execution Context riêng?
  └→ Vì mỗi function call cần LOCAL variables riêng.
     Nếu dùng chung global → 2 calls conflict!

  WHY ②: Tại sao cần local variables riêng?
  └→ Vì cùng 1 function có thể gọi NHIỀU lần
     với arguments KHÁC NHAU → cần memory độc lập.

  WHY ③: Tại sao không dùng global memory cho tất cả?
  └→ Vì naming collision! 2 functions đều dùng biến "result"
     → ghi đè lên nhau → bug khó debug.
     Local scope = ISOLATION = an toàn.

  WHY ④: Tại sao context bị đóng sau return?
  └→ Vì memory là TÀI NGUYÊN HỮU HẠN (RAM).
     Nếu giữ mãi → memory leak → chương trình crash.
     Garbage Collector cần biết khi nào FREE memory.

  WHY ⑤: Vậy có cách nào GIỮ local memory lại không?
  └→ CÓ! Đó là CLOSURE — phần 3 của Hard Parts!
     Khi function return MỘT function khác → inner function
     "mang theo" reference đến local memory → GC KHÔNG xoá!
     ⭐ CLOSURE = exception cho quy tắc "context bị đóng"!
```

### 10.2 Pattern ②: First Principles — Phân Rã Execution Context

```javascript
// TỰ XÂY LẠI EXECUTION CONTEXT TỪ ĐẦU:

class ExecutionContext {
  constructor(name, outerEnv = null) {
    this.name = name;
    this.localMemory = {}; // Variable Environment
    this.outerEnv = outerEnv; // Scope chain link
  }

  // Gán parameter = argument
  setParameter(paramName, argValue) {
    this.localMemory[paramName] = argValue;
  }

  // Khai báo biến local
  declare(varName, value) {
    this.localMemory[varName] = value;
  }

  // Tìm biến: local trước → outer → global
  lookup(varName) {
    // ① Tìm trong local memory
    if (varName in this.localMemory) {
      return this.localMemory[varName];
    }
    // ② Tìm trong outer environment (scope chain!)
    if (this.outerEnv) {
      return this.outerEnv.lookup(varName);
    }
    // ③ Không tìm thấy
    throw new ReferenceError(`${varName} is not defined`);
  }

  // Đóng context → "xoá" local memory
  close() {
    console.log(`[EC] Closing "${this.name}" — local memory released`);
    this.localMemory = null; // Simulating GC
  }
}

// MÔ PHỎNG CODE CHẠY:
// const num = 3;
// function multiplyBy2(inputNumber) { ... }
// const output = multiplyBy2(num);

const globalEC = new ExecutionContext("Global");
globalEC.declare("num", 3);
globalEC.declare("multiplyBy2", function (inputNumber) {
  const result = inputNumber * 2;
  return result;
});

// Gọi multiplyBy2(3) → tạo Function EC
const funcEC = new ExecutionContext("multiplyBy2", globalEC);
funcEC.setParameter("inputNumber", globalEC.lookup("num")); // 3
funcEC.declare("result", funcEC.lookup("inputNumber") * 2); // 6
const returnValue = funcEC.lookup("result"); // 6
funcEC.close(); // "[EC] Closing multiplyBy2 — local memory released"

globalEC.declare("output", returnValue); // output = 6
console.log(globalEC.lookup("output")); // 6
```

### 10.3 Pattern ③: Trade-off Analysis

```
TRADE-OFF: EXECUTION CONTEXT DESIGN
═══════════════════════════════════════════════════════════════

  ┌────────────────┬──────────────────┬──────────────────────┐
  │ Quyết định      │ Lợi ích          │ Cái giá             │
  ├────────────────┼──────────────────┼──────────────────────┤
  │ Local Memory   │ ✅ Isolation:     │ ❌ Tạo/xoá liên    │
  │ mỗi call       │   không conflict │   tục → GC overhead │
  ├────────────────┼──────────────────┼──────────────────────┤
  │ Xoá sau return │ ✅ Free memory   │ ❌ Mất data!        │
  │                │   → no leak      │   (trừ khi closure) │
  ├────────────────┼──────────────────┼──────────────────────┤
  │ Single-thread  │ ✅ No race cond. │ ❌ Đệ quy sâu →    │
  │ Call Stack     │ ✅ Deterministic │   Stack Overflow     │
  ├────────────────┼──────────────────┼──────────────────────┤
  │ Return = only  │ ✅ Rõ ràng data  │ ❌ Chỉ trả 1 giá   │
  │ exit point     │   flow           │   trị (fix: object) │
  └────────────────┴──────────────────┴──────────────────────┘
```

### 10.4 Pattern ④: Mental Mapping — Execution Context Ở Đâu Trong Hệ Thống?

**Nguyên tắc:** Biết Execution Context nằm ở đâu trong "bản đồ" tổng thể — từ 1 dòng code đến framework đến phần cứng.

```
MENTAL MAP: EXECUTION CONTEXT TRONG REACT
═══════════════════════════════════════════════════════════════

  Bạn viết: <Counter />

  ┌─────────────────────────────────────────────────────────┐
  │ REACT LAYER                                             │
  │                                                         │
  │ React gọi Counter() ← function component = FUNCTION!   │
  │ → Tạo Execution Context cho Counter                     │
  │ → Local Memory chứa: props, useState values, useEffect  │
  │ → Return JSX (React elements)                           │
  │ → Context ĐÓNG — nhưng hooks dùng CLOSURE giữ state!   │
  └────────────────────────────┬────────────────────────────┘
                               ↓
  ┌─────────────────────────────────────────────────────────┐
  │ JAVASCRIPT ENGINE                                       │
  │                                                         │
  │ Call Stack: [Global] → [Counter()] → [useState()]       │
  │ → Mỗi function call = 1 Execution Context               │
  │ → useState() có CLOSURE đến React internal state        │
  │ → Re-render = GỌI LẠI Counter() = Context MỚI!          │
  └────────────────────────────┬────────────────────────────┘
                               ↓
  ┌─────────────────────────────────────────────────────────┐
  │ V8 ENGINE (C++)                                         │
  │                                                         │
  │ Execution Context = C++ object trên native stack        │
  │ → Local Memory = Hidden Class + properties array        │
  │ → Inline Caching tối ưu property access                 │
  │ → GC (Orinoco) quét và free context khi không reference │
  └─────────────────────────────────────────────────────────┘

  ⭐ 1 component React = NHIỀU execution contexts lồng nhau!
     Counter() → useState() → setState() → re-render
     → lại Counter() → lại useState()...
```

```
MENTAL MAP: EXECUTION CONTEXT TRONG NODE.JS
═══════════════════════════════════════════════════════════════

  Bạn viết: app.get("/api", handler)

  ┌─────────────────────────────────────────────────────────┐
  │ EXPRESS LAYER                                           │
  │                                                         │
  │ Request đến → Express gọi handler(req, res)             │
  │ → Tạo Execution Context cho handler                     │
  │ → Local Memory: req, res + middleware closures          │
  │ → Return response → Context ĐÓNG                        │
  └────────────────────────────┬────────────────────────────┘
                               ↓
  ┌─────────────────────────────────────────────────────────┐
  │ NODE.JS RUNTIME                                         │
  │                                                         │
  │ Event Loop nhận request → push handler lên Call Stack   │
  │ → Nếu handler có await → Context PAUSE (không đóng!)   │
  │ → Promise resolve → Context RESUME trên Call Stack      │
  │ → Mọi middleware = function call = Execution Context    │
  └─────────────────────────────────────────────────────────┘

  ⭐ 100 requests đồng thời ≠ 100 threads!
     = 100 execution contexts xếp hàng chờ Event Loop
     = Single-threaded nhưng non-blocking!
```

```
MENTAL MAP: CÁC TẦNG CỦA EXECUTION CONTEXT
═══════════════════════════════════════════════════════════════

  ┌────────────────┬──────────────────────────────────────┐
  │ Tầng           │ Execution Context = ?                │
  ├────────────────┼──────────────────────────────────────┤
  │ JavaScript     │ EC = Thread + Local Memory           │
  │                │ (đây là tầng Hard Parts dạy)         │
  ├────────────────┼──────────────────────────────────────┤
  │ V8 Engine      │ EC = C++ object chứa:                │
  │ (C++)          │ - Variable Environment pointer       │
  │                │ - Lexical Environment pointer        │
  │                │ - this binding                       │
  │                │ - Outer reference (scope chain)      │
  ├────────────────┼──────────────────────────────────────┤
  │ Operating      │ EC ≈ Stack Frame trên Call Stack      │
  │ System         │ - Return address (quay về đâu?)      │
  │                │ - Local variables trên stack memory  │
  │                │ - Giới hạn: ~1MB stack size           │
  ├────────────────┼──────────────────────────────────────┤
  │ Hardware       │ Stack Frame = vùng RAM liên tục       │
  │ (CPU/RAM)      │ - Stack Pointer register (SP) quản lý│
  │                │ - Push/Pop = di chuyển SP lên/xuống   │
  │                │ - Cache-friendly (contiguous memory)  │
  └────────────────┴──────────────────────────────────────┘
```

---

### 10.5 Pattern ⑤: Reverse Engineering & Implementation

**Châm ngôn:** _"What I cannot create, I do not understand"_ — Richard Feynman.

```javascript
// REVERSE ENGINEERING ①: TỰ XÂY LẠI GARBAGE COLLECTION
// Khi Execution Context đóng → local memory bị xoá. Nhưng NHƯ THẾ NÀO?

class MemoryManager {
  constructor() {
    this.heap = new Map(); // Mô phỏng heap memory
    this.refCounts = new Map(); // Reference counting GC
    this.nextId = 1;
  }

  // Cấp phát memory cho giá trị
  allocate(value) {
    const id = `mem_${this.nextId++}`;
    this.heap.set(id, value);
    this.refCounts.set(id, 0);
    return id;
  }

  // Thêm reference (biến trỏ đến giá trị)
  addRef(memId) {
    const current = this.refCounts.get(memId) || 0;
    this.refCounts.set(memId, current + 1);
  }

  // Xoá reference (biến bị xoá hoặc re-assign)
  removeRef(memId) {
    const current = this.refCounts.get(memId) || 0;
    const newCount = current - 1;
    this.refCounts.set(memId, newCount);

    // Nếu không ai reference nữa → GARBAGE COLLECT!
    if (newCount <= 0) {
      console.log(`[GC] Collecting ${memId}: "${this.heap.get(memId)}"`);
      this.heap.delete(memId);
      this.refCounts.delete(memId);
    }
  }

  // Xem trạng thái memory
  inspect() {
    console.log("Heap:", Object.fromEntries(this.heap));
    console.log("Refs:", Object.fromEntries(this.refCounts));
  }
}

// MÔ PHỎNG: Execution Context tạo và đóng
const gc = new MemoryManager();

// Global: const num = 3
const numId = gc.allocate(3);
gc.addRef(numId); // global variable "num" references it

// Gọi multiplyBy2(3) → tạo Execution Context
console.log("--- Entering multiplyBy2(3) ---");
const inputId = gc.allocate(3); // parameter inputNumber
gc.addRef(inputId);
const resultId = gc.allocate(6); // local variable result
gc.addRef(resultId);

gc.inspect();
// Heap: { mem_1: 3, mem_2: 3, mem_3: 6 }
// Refs: { mem_1: 1, mem_2: 1, mem_3: 1 }

// Return → Context đóng → local refs bị xoá
console.log("--- Closing multiplyBy2 context ---");
gc.removeRef(inputId); // [GC] Collecting mem_2: "3"
gc.removeRef(resultId); // [GC] Collecting mem_3: "6"
// → inputNumber và result bị GC!
// → Giá trị 6 đã được copy ra output trước khi xoá

// Global vẫn sống
const outputId = gc.allocate(6); // output = 6 (giá trị return)
gc.addRef(outputId);

gc.inspect();
// Heap: { mem_1: 3, mem_4: 6 }
// Refs: { mem_1: 1, mem_4: 1 }
// → Chỉ còn num=3 và output=6!

// ⭐ Bạn vừa BUILD cách GC xoá local memory sau return!
```

```javascript
// REVERSE ENGINEERING ②: TỰ XÂY LẠI JS RUNTIME ĐẦY ĐỦ
// Kết hợp: Call Stack + Execution Context + Memory + Thread

class JSRuntime {
  constructor() {
    this.callStack = []; // Call Stack (LIFO)
    this.globalMemory = {}; // Global Memory
    this.output = []; // Console output
  }

  // Bắt đầu chạy — tạo Global Execution Context
  boot() {
    this.callStack.push({
      name: "Global",
      memory: this.globalMemory,
      line: 0,
    });
    this.log("[BOOT] Global Execution Context created");
  }

  // Thread: đọc và thực thi 1 dòng code
  executeLine(description, action) {
    const current = this.callStack[this.callStack.length - 1];
    current.line++;
    this.log(`[LINE ${current.line}] ${current.name}: ${description}`);
    return action();
  }

  // Khai báo biến trong context hiện tại
  declare(name, value) {
    const current = this.callStack[this.callStack.length - 1];
    current.memory[name] = value;
    this.log(
      `  → Memory: ${name} = ${typeof value === "function" ? "ƒ" : JSON.stringify(value)}`,
    );
  }

  // Gọi function — tạo Execution Context mới
  callFunction(fnName, args, fn) {
    this.log(
      `[CALL] ${fnName}(${args.join(", ")}) — Creating new Execution Context`,
    );

    // Push context mới lên Call Stack
    const localMemory = {};
    this.callStack.push({
      name: fnName,
      memory: localMemory,
      line: 0,
    });

    this.log(
      `  → Call Stack: [${this.callStack.map((c) => c.name).join(" → ")}]`,
    );

    // Chạy function
    const returnValue = fn(localMemory);

    // Pop context — đóng Execution Context
    this.callStack.pop();
    this.log(`[RETURN] ${fnName} → ${JSON.stringify(returnValue)}`);
    this.log(`  → Context CLOSED. Local memory ERASED.`);
    this.log(
      `  → Call Stack: [${this.callStack.map((c) => c.name).join(" → ")}]`,
    );

    return returnValue;
  }

  log(msg) {
    this.output.push(msg);
  }

  // In toàn bộ execution log
  printLog() {
    this.output.forEach((line) => console.log(line));
  }
}

// CHẠY CODE GỐC TỪ BÀI HỌC:
const runtime = new JSRuntime();
runtime.boot();

// const num = 3;
runtime.executeLine("const num = 3", () => {
  runtime.declare("num", 3);
});

// function multiplyBy2(inputNumber) { ... }
runtime.executeLine("function multiplyBy2 — SAVE, don't run", () => {
  runtime.declare("multiplyBy2", function () {});
});

// const output = multiplyBy2(num);
runtime.executeLine("const output = multiplyBy2(num)", () => {
  const result = runtime.callFunction("multiplyBy2", [3], (local) => {
    local.inputNumber = 3;
    runtime.log("  → local: inputNumber = 3");
    local.result = 3 * 2;
    runtime.log("  → local: result = 6");
    return local.result; // return 6
  });
  runtime.declare("output", result);
});

// const newOutput = multiplyBy2(10);
runtime.executeLine("const newOutput = multiplyBy2(10)", () => {
  const result = runtime.callFunction("multiplyBy2", [10], (local) => {
    local.inputNumber = 10;
    runtime.log("  → local: inputNumber = 10");
    local.result = 10 * 2;
    runtime.log("  → local: result = 20");
    return local.result; // return 20
  });
  runtime.declare("newOutput", result);
});

runtime.printLog();
// Output:
// [BOOT] Global Execution Context created
// [LINE 1] Global: const num = 3
//   → Memory: num = 3
// [LINE 2] Global: function multiplyBy2 — SAVE, don't run
//   → Memory: multiplyBy2 = ƒ
// [LINE 3] Global: const output = multiplyBy2(num)
// [CALL] multiplyBy2(3) — Creating new Execution Context
//   → Call Stack: [Global → multiplyBy2]
//   → local: inputNumber = 3
//   → local: result = 6
// [RETURN] multiplyBy2 → 6
//   → Context CLOSED. Local memory ERASED.
//   → Call Stack: [Global]
//   → Memory: output = 6
// ... (tương tự cho multiplyBy2(10))

// ⭐ Bạn vừa BUILD toàn bộ JS Runtime từ đầu!
// ⭐ "What I cannot create, I do not understand" ✅
```

---

### 10.6 Pattern ⑥: Lịch Sử & Sự Tiến Hoá (Contextual History)

**Nguyên tắc:** Mọi công nghệ sinh ra đều để giải quyết vấn đề của công nghệ tiền nhiệm.

```
LỊCH SỬ: EXECUTION CONTEXT QUA CÁC THỜI KỲ
═══════════════════════════════════════════════════════════════

  1960s: FORTRAN — không có function scope thực sự
  │      → Tất cả biến global → naming collision liên tục!
  │      → Vấn đề: 2 subroutines dùng cùng tên biến → crash
  │
  ↓
  1970s: C — Stack-based function calls
  │      → Giải quyết: Mỗi function call = stack frame
  │      → Local variables tự động free khi return
  │      → GIỐNG execution context của JS!
  │      → Vấn đề: Không có closure, không giữ được state
  │
  ↓
  1975: Scheme — Lexical scoping + Closures
  │      → Giải quyết: Function "nhớ" environment nơi sinh ra
  │      → First-class functions + closures = cực mạnh
  │      → Vấn đề: Quá academic, ít người dùng
  │
  ↓
  1995: JavaScript — Kết hợp C + Scheme
  │    → Stack-based execution (từ C)
  │    → Lexical scoping + closures (từ Scheme)
  │    → Prototypal inheritance (từ Self)
  │    → Execution Context = TỔNG HỢP tất cả!
  │
  ↓
  2009: ES5 strict mode — Sửa lỗi thiết kế
  │    → this = undefined thay vì window
  │    → Không cho tạo biến global vô tình
  │    → Execution Context thêm strict flag
  │
  ↓
  2015: ES6 — let/const + Block Scoping
  │    → Execution Context chia thành 2 phần:
  │      Variable Environment (var, function declarations)
  │      Lexical Environment (let, const — Temporal Dead Zone)
  │
  ↓
  2020+: ES2020+ — Optional chaining, Nullish coalescing
        → Execution Context không thay đổi cấu trúc
        → Nhưng THÊM features trong Lexical Environment

  ⭐ JS Execution Context = C stack + Scheme closure + Self prototype!
     Hiểu lịch sử = hiểu TẠI SAO nó được thiết kế như vậy.
```

```
TÓM TẮT 6 PATTERNS ÁP DỤNG VÀO EXECUTION CONTEXT:
═══════════════════════════════════════════════════════════════

  ① 5 WHYS         → Tại sao cần EC? → Isolation → Naming
                      collision → Memory hữu hạn → Closure!

  ② FIRST PRINCIPLES→ EC = { localMemory (Object/Map) +
                      thread (instruction pointer) +
                      outerEnv (linked list → scope chain) }

  ③ TRADE-OFFS     → Local memory: isolation ↔ GC overhead
                      Return-only: clarity ↔ single value
                      Single thread: no race ↔ stack overflow

  ④ MENTAL MAPPING → EC trong React component, Express handler,
                      V8 C++ objects, OS stack frames, hardware

  ⑤ RE-IMPLEMENT   → Tự build: MemoryManager (GC simulator),
                      JSRuntime (Call Stack + EC + Thread)
                      "What I cannot create, I do not understand"

  ⑥ HISTORY        → FORTRAN (no scope) → C (stack frame) →
                      Scheme (closure) → JS = tổng hợp tất cả

  ═══════════════════════════════════════════════════════════
  Áp dụng 6 patterns này mỗi khi học concept mới
  → Hiểu SÂU HƠN, NHỚ LÂU HƠN, GIẢI THÍCH TỐT HƠN! 🚀
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 1:
═══════════════════════════════════════════════════════════════

  [ ] Giải thích được "2 thứ duy nhất JS làm" khi chạy code
  [ ] Định nghĩa Thread of Execution bằng lời của bạn
  [ ] Phân biệt Function Declaration vs Function Call
  [ ] Nhận biết dấu () = "gọi function, tạo execution context"
  [ ] Vẽ được Execution Context (local memory + thread)
  [ ] Trace code multiplyBy2 trên giấy, từng dòng
  [ ] Phân biệt Parameter (placeholder) vs Argument (giá trị)
  [ ] Giải thích return trả GIÁ TRỊ, không phải label
  [ ] Giải thích tại sao local memory bị xoá sau return
  [ ] Vẽ 2 lần gọi cùng 1 function với arguments khác nhau
      và chứng minh chúng HOÀN TOÀN độc lập

  NÂNG CAO:
  [ ] Tự implement ExecutionContext class từ đầu
  [ ] Giải thích tại sao scope isolation quan trọng
  [ ] Trả lời "5 Whys" cho execution context
  [ ] Liên hệ execution context → closure (preview phần 3)
```
