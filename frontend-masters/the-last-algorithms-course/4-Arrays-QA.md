# The Last Algorithms Course You'll Need — Phần 4: Arrays Q&A — "No Push, No Pop, Reallocation, Capacity Game!"

> 📅 2026-03-08 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Arrays Q&A — "No insert/push/pop, size must be specified, reallocation, capacity tradeoff, JS underneath!"
> Độ khó: ⭐️⭐️ | Q&A — trả lời các câu hỏi về arrays!

---

## Mục Lục

| #   | Phần                                                        |
| --- | ----------------------------------------------------------- |
| 1   | Q: "No Insert, Push, Pop?" — "Technically No!"              |
| 2   | Q: "Must Specify Size?" — "Yes, Always!"                    |
| 3   | Q: "JS Creates Array Underneath?" — "Yes, But Complicated!" |
| 4   | Q: "How Big Is the Initial Buffer?" — "The Capacity Game!"  |
| 5   | 🔬 Deep Analysis — Static vs Dynamic                        |

---

## §1. Q: "No Insert, Push, Pop?" — "Technically No!"

> Student: _"So you're saying there is NO insert or push or pop in arrays?"_
> Prime: _"Technically no — not if it's a static array or traditional array. There are NO methods on it."_

### Older languages don't even have .length!

Prime: _"In some older languages, there's not even dot length. You have to pass the length AS WELL AS the pointer to the beginning."_

_"That's why when you look at any C program, the entry point is an array of strings AND how many strings there are."_

```c
// Điểm vào của C — array + độ dài!
int main(int argc, char* argv[]) {
  // argc = BAO NHIÊU strings
  // argv = con trỏ đến các strings
  // Không có .length! Bạn PHẢI truyền số lượng!
}
```

_"It has to TELL YOU how to interpret these pieces of data."_

### Giải thích sâu: tại sao array KHÔNG có push/pop/insert?

Đây là điều khiến nhiều JavaScript developer bất ngờ nhất, vì trong JS bạn dùng `push()`, `pop()`, `shift()`, `unshift()` hàng ngày. Nhưng **đây không phải là tính năng của array** — đây là tính năng của **data structure bọc ngoài array**.

Hãy nghĩ thế này: array thật giống như **một tờ giấy kẻ ô cố định**.

```
Tờ giấy 5 ô:
┌──────┬──────┬──────┬──────┬──────┐
│  10  │  20  │  30  │      │      │
└──────┴──────┴──────┴──────┴──────┘
```

Bạn có thể **ghi vào ô** (set) và **đọc ô** (get). Nhưng bạn **không thể**:

- "Chèn thêm một ô giữa ô 1 và ô 2" → tờ giấy không co giãn!
- "Thêm ô thứ 6 ở cuối" → tờ giấy chỉ có 5 ô!
- "Xoá ô 2 và dồn ô 3, 4 lại" → các ô không tự di chuyển!

Nếu bạn muốn "chèn" giá trị 15 giữa 10 và 20, bạn phải **tự tay shift** tất cả phần tử từ vị trí 1 trở đi:

```
Trước: [10, 20, 30, _, _]

Bước 1: shift ô 2 → ô 3:  [10, 20, 30, 30, _]  (copy 30 sang ô 3)
Bước 2: shift ô 1 → ô 2:  [10, 20, 20, 30, _]  (copy 20 sang ô 2)
Bước 3: ghi ô 1 = 15:     [10, 15, 20, 30, _]   ✅

→ Phải shift N phần tử → O(N)! Rất tốn kém!
```

Đây là lý do tại sao **insert vào giữa array tốn O(N)** — bạn phải di chuyển tất cả phần tử phía sau để "mở chỗ." Array bản thân nó không biết làm điều này — bạn phải tự viết code hoặc dùng data structure hỗ trợ (ArrayList, Vector...).

### Tại sao C không có .length?

Trong C, khi bạn khai báo `int a[5]`, compiler biết kích thước **tại thời điểm biên dịch**, nhưng **runtime thì không lưu thông tin đó**. Array trong C chỉ là **con trỏ đến byte đầu tiên** (pointer). CPU không biết array dài bao nhiêu — nó chỉ biết "bắt đầu ở đây, mỗi ô 4 bytes."

Đây là lý do tại sao hàm `main` trong C nhận **hai tham số**: `argc` (argument count — số lượng) và `argv` (argument values — giá trị). Nếu array tự biết kích thước, thì `argc` sẽ thừa. Nhưng vì **array trong C không biết kích thước của chính mình**, bạn phải truyền riêng.

```
TẠI SAO C CẦN argc + argv:
═══════════════════════════════════════════════════════════════

  int main(int argc, char* argv[])

  Khi chạy: ./program hello world

  argc = 3 (tên program + 2 arguments)
  argv = con trỏ đến mảng:
         argv[0] → "./program"
         argv[1] → "hello"
         argv[2] → "world"

  Nếu không có argc, bạn sẽ KHÔNG BIẾT dừng ở đâu!
  → Đọc argv[3]? argv[4]? → Đọc rác! → Segfault! 💀

  So sánh JavaScript:
  process.argv.length  ← JS tự biết!
  → Không cần truyền riêng!

  Nhưng... đó là vì JS array KHÔNG PHẢI array thật!
  JS lưu .length như một PROPERTY trên object!
```

Một hệ quả nguy hiểm: nếu bạn viết C và quên kiểm tra giới hạn array, bạn sẽ **đọc/ghi vào vùng nhớ không thuộc về mình**. Đây là nguồn gốc của rất nhiều lỗ hổng bảo mật nổi tiếng (buffer overflow attacks). Ngôn ngữ hiện đại như Rust, Go, Java đều tự động kiểm tra bounds — nhưng C thì không.

---

## §2. Q: "Must Specify Size?" — "Yes, Always!"

> Student: _"If an array doesn't grow, does its size and memory allocation have to be specified at initialization?"_
> Prime: _"If you use Rust and try to use an array, you will realize right away that you have to put in a SIZE."_

### Size = phần bắt buộc của allocation!

Prime: _"It has to be a specified size. You can still create an array with N as its size — but it STILL has to be specified."_

_"There are also compile-time arrays where you actually have to say 'this thing is a 3, it's ALWAYS a 3.'"_

### Giải thích sâu: hai loại "chỉ định kích thước"

Có hai cách chỉ định kích thước array, và chúng rất khác nhau:

**1. Compile-time array (kích thước cố định khi biên dịch)**

Kích thước được "đóng đinh" vào chương trình từ lúc biên dịch. Compiler biết chính xác bao nhiêu bytes cần cấp, và thường đặt array trên **stack** (nhanh hơn heap).

```rust
// Rust: [kiểu; kích_thước] — kích thước là PHẦN CỦA KIỂU!
let a: [i32; 3] = [10, 20, 30];
// [i32; 3] và [i32; 5] là HAI KIỂU KHÁC NHAU!
// Không thể gán một cái cho cái kia!
```

```c
// C: chỉ định kích thước trực tiếp
int a[3] = {10, 20, 30};
// Compiler biết: cần 12 bytes trên stack!
```

**2. Runtime array (kích thước xác định khi chạy)**

Kích thước được quyết định khi chương trình đang chạy — ví dụ nhận input từ người dùng. Array vẫn **cố định sau khi tạo**, nhưng bạn không biết trước kích thước khi viết code.

```c
// C99: Variable Length Array (VLA)
int n;
scanf("%d", &n);      // Người dùng nhập: 100
int a[n];             // Tạo array 100 phần tử!
// Sau khi tạo: vẫn FIXED! Không thể thay đổi!
```

```
KÍCH THƯỚC CỐ ĐỊNH vs KÍCH THƯỚC BIẾN:
═══════════════════════════════════════════════════════════════

  Compile-time (cố định mãi mãi!):
  ┌──────────────────────────────────────────────────────────┐
  │ int a[3];  // LUÔN là 3! Không thể thay đổi!            │
  │ → Compiler biết chính xác cần bao nhiêu bộ nhớ          │
  │ → Thường nằm trên STACK (nhanh!)                        │
  │ → Ví dụ: bảng tra cứu, matrix cố định                  │
  └──────────────────────────────────────────────────────────┘

  Runtime (biến, nhưng vẫn cố định sau khi tạo!):
  ┌──────────────────────────────────────────────────────────┐
  │ int n = getUserInput();                                  │
  │ int a[n]; // Kích thước = n, nhưng KHÔNG đổi sau tạo!   │
  │ → Chỉ biết kích thước khi chạy                          │
  │ → Thường dùng malloc/calloc trên HEAP                   │
  │ → Ví dụ: đọc file, nhận request                        │
  └──────────────────────────────────────────────────────────┘

  Cả hai đều: "Array PHẢI có kích thước là PHẦN CỦA
  quá trình cấp phát bộ nhớ. Bạn KHÔNG THỂ mở rộng." — Prime
```

### Reallocation!

Prime: _"You CAN reallocate — create a NEW array, take your old array, write it into the new one. You now have a bigger array, more room. But nonetheless, it is these FIXED sizes."_

### Giải thích sâu: Reallocation hoạt động như thế nào?

Reallocation là quá trình **"đổi nhà"** khi cần chỗ rộng hơn. Vì array không thể mở rộng tại chỗ (remember Fred?), bạn phải:

```
REALLOCATION — "ĐỔI NHÀ":
═══════════════════════════════════════════════════════════════

  Bước 1: Array cũ đầy!
  ┌─────┬─────┬─────┐
  │  10 │  20 │  30 │  ← capacity = 3, FULL!
  └─────┴─────┴─────┘

  Bước 2: Tạo array MỚI lớn hơn (thường gấp đôi!)
  ┌─────┬─────┬─────┬─────┬─────┬─────┐
  │     │     │     │     │     │     │  ← capacity = 6
  └─────┴─────┴─────┴─────┴─────┴─────┘

  Bước 3: COPY tất cả từ cũ sang mới!
  ┌─────┬─────┬─────┬─────┬─────┬─────┐
  │  10 │  20 │  30 │     │     │     │  ← copy xong!
  └─────┴─────┴─────┴─────┴─────┴─────┘

  Bước 4: Giải phóng (free) array cũ!
  Array cũ bị xoá! → Bộ nhớ trả lại cho OS!

  Bước 5: Giờ có thể push thêm!
  ┌─────┬─────┬─────┬─────┬─────┬─────┐
  │  10 │  20 │  30 │  40 │     │     │  ← push 40! ✅
  └─────┴─────┴─────┴─────┴─────┴─────┘

  Chi phí:
  → Copy N phần tử → O(N) cho MỖI LẦN reallocation!
  → Nhưng nếu gấp đôi mỗi lần → chỉ xảy ra O(log N) lần!
  → Amortized: O(1) per push! (trung bình!)
```

Trong thực tế, đây chính xác là cách **ArrayList** (Java), **std::vector** (C++), **Vec<T>** (Rust), và **slice** (Go) hoạt động bên dưới. Tất cả đều là **static array + reallocation logic** được gói lại thành API dễ dùng.

Một chi tiết quan trọng: chi phí copy là O(N), nhưng vì **mỗi lần gấp đôi**, lần reallocation tiếp theo sẽ **xa hơn rất nhiều**. Ví dụ: capacity 5 → 10 → 20 → 40 → 80. Sau khi resize lên 80, bạn có thể push thêm **40 phần tử** trước khi cần resize lại. Tính trung bình, mỗi lần push chỉ tốn **O(1)** — đây gọi là **amortized O(1)**.

---

## §3. Q: "JS Creates Array Underneath?" — "Yes, But Complicated!"

> Student: _"When creating an array in JavaScript, are you creating something that has an array underneath?"_
> Prime: _"In some sense, yes. There IS a literal array, a memory buffer at some point underneath. But we don't see it that way."_

### JS arrays = thông minh và phức tạp!

Prime: _"I'm sure they have — turn it into a MAP once you have too many items, or too sparse of an array. I'm sure they have a LOT of algorithms that make it 10 times more complicated."_

_"But for the most part, it OPERATES like an array."_

Then teases: _"I don't wanna give it away..."_ 😏

### Giải thích sâu: V8 engine xử lý JS arrays như thế nào?

Prime không muốn spoil, nhưng đây là kiến thức bổ sung giúp bạn hiểu bức tranh toàn cảnh.

V8 (engine của Chrome/Node.js) dùng nhiều **chiến lược khác nhau** để lưu trữ JS arrays, tuỳ thuộc vào cách bạn sử dụng:

```
V8 XỬ LÝ JS ARRAYS:
═══════════════════════════════════════════════════════════════

  TRƯỜNG HỢP 1: "Packed Elements" (Dense Array)
  ┌──────────────────────────────────────────────────────────┐
  │ const a = [1, 2, 3, 4, 5];                               │
  │ → Tất cả cùng kiểu (SMI — Small Integer)               │
  │ → Không có lỗ hổng (holes)                              │
  │ → V8 lưu HẲN NHƯ ARRAY THẬT! Contiguous memory!       │
  │ → Truy cập O(1) thực sự!                                │
  │ → NHANH NHẤT! ✅                                        │
  └──────────────────────────────────────────────────────────┘

  TRƯỜNG HỢP 2: "Holey Elements" (Sparse Array)
  ┌──────────────────────────────────────────────────────────┐
  │ const a = [1, 2, , , , 6];  // có lỗ hổng!             │
  │ hoặc: a[1000] = 5;         // lỗ hổng khổng lồ!        │
  │ → V8 phải check "ô này có giá trị không?" mỗi lần     │
  │ → Chậm hơn packed! ⚠️                                  │
  └──────────────────────────────────────────────────────────┘

  TRƯỜNG HỢP 3: "Dictionary Mode"
  ┌──────────────────────────────────────────────────────────┐
  │ const a = [];                                            │
  │ a[999999] = 5;  // index cực lớn, chỉ 1 phần tử!      │
  │ → V8 KHÔNG tạo 1 triệu ô trống!                        │
  │ → Chuyển sang HASH MAP (dictionary)!                    │
  │ → Key = "999999", Value = 5                             │
  │ → Tiết kiệm bộ nhớ nhưng CHẬM hơn! 🐌                │
  └──────────────────────────────────────────────────────────┘

  "Tôi chắc chắn họ chuyển sang MAP khi
   có quá nhiều items, hoặc array quá sparse.
   Tôi chắc họ có RẤT NHIỀU algorithms
   khiến nó phức tạp gấp 10 lần." — Prime
```

Điều thú vị: Prime nói đúng khi dùng từ "morph" — V8 thật sự **biến đổi** cấu trúc bên dưới tuỳ theo cách bạn sử dụng. Nếu bạn tạo `[1, 2, 3]` (packed), V8 dùng array thật. Nếu bạn sau đó gán `a[10000] = 5`, V8 có thể **chuyển sang dictionary mode** — và **không bao giờ chuyển ngược lại!** Đây là lý do tại sao hiểu bản chất giúp bạn viết code hiệu quả hơn.

### Mẹo thực tế cho JavaScript developers

```
MẸO HIỆU SUẤT VỚI JS ARRAYS:
═══════════════════════════════════════════════════════════════

  ✅ NÊN LÀM (giữ packed mode):
  → Dùng cùng kiểu dữ liệu: [1, 2, 3, 4, 5]
  → Push/pop từ cuối!
  → Khởi tạo đủ kích thước: new Array(1000).fill(0)

  ❌ ĐỪNG LÀM (trigger dictionary mode):
  → Trộn kiểu: [1, "hello", true, {}]
  → Tạo lỗ hổng: a[10000] = 5
  → Delete phần tử: delete a[2] (tạo lỗ hổng!)
  → Dùng key không phải số: a[-1] = 5, a["key"] = 5
```

---

## §4. Q: "How Big Is the Initial Buffer?" — "The Capacity Game!"

> Student: _"How big is the array that you instantiate?"_
> Prime: _"That is part of OPTIMIZING."_

### Capacity = tradeoff!

Prime: _"In Rust, if you create a new vector, it's gonna create a memory buffer with size 5 underneath. As you push and pop, it has 5 units for you to play with."_

_"But is that efficient? How big do you need to create your underlying buffer to use that space without having to reallocate too much — or without NOT using it?"_

_"We could all create 10,000 units and never have to reallocate. But if they're big units, you're gonna use a LOT of memory just to have that there."_

### Giải thích sâu: "Capacity Game" là gì?

Đây là một trong những bài toán tối ưu **kinh điển** trong Computer Science: **chọn kích thước ban đầu (initial capacity) bao nhiêu là tối ưu?**

Vấn đề: bạn không biết trước user sẽ push bao nhiêu phần tử. Nếu đoán sai:

**Đoán quá nhỏ** → phải reallocation liên tục → mỗi lần tốn O(N) copy → chậm!
**Đoán quá lớn** → lãng phí bộ nhớ → ứng dụng ngốn RAM vô ích!

```
TRÒ CHƠI CAPACITY:
═══════════════════════════════════════════════════════════════

  Quá nhỏ (capacity = 2):
  push, push → ĐẦY! → reallocate! (tốn kém!)
  push, push → ĐẦY! → reallocate! (lại tốn!)
  push, push → ĐẦY! → reallocate! (lại nữa!)
  → Quá nhiều reallocations! 😤

  Quá lớn (capacity = 10,000):
  push, push, push → dùng 3 trong 10,000!
  → Lãng phí 9,997 ô bộ nhớ! 😤
  → Nếu mỗi ô là 1 object lớn → lãng phí cả MB!

  Vừa phải (tăng trưởng thông minh):
  Bắt đầu với ~5, GẤP ĐÔI khi đầy!
  → 5 → 10 → 20 → 40 → 80 → 160 → ...
  → Amortized O(1) push! 🎯

  "Đó là TRÒ CHƠI mà mọi người chơi." — Prime
```

### Chiến lược tăng trưởng trong các ngôn ngữ thực tế

Các ngôn ngữ khác nhau chọn hệ số tăng trưởng (growth factor) khác nhau:

```
CHIẾN LƯỢC TĂNG TRƯỞNG:
═══════════════════════════════════════════════════════════════

  Java ArrayList:
  → Initial capacity: 10
  → Growth: 50% mỗi lần (newCapacity = old + old/2)
  → 10 → 15 → 22 → 33 → 49 → ...
  → Tiết kiệm bộ nhớ hơn, nhưng reallocate thường xuyên hơn

  C++ std::vector:
  → Initial capacity: phụ thuộc compiler (thường 0 hoặc 1)
  → Growth: gấp đôi (×2)
  → 1 → 2 → 4 → 8 → 16 → 32 → ...
  → Ít reallocate hơn, nhưng tốn bộ nhớ hơn

  Rust Vec<T>:
  → Initial capacity: 0 (không cấp phát cho đến khi push!)
  → Growth: gấp đôi
  → 0 → 4 → 8 → 16 → 32 → ...
  → Với Vec::with_capacity(n): bạn TỰ chọn!

  Python list:
  → Growth: ~12.5% mỗi lần (tiết kiệm nhất!)
  → Công thức phức tạp: new = old + (old >> 3) + 6

  Tại sao gấp đôi phổ biến nhất?
  → Vì nó đảm bảo amortized O(1)!
  → Chứng minh: tổng chi phí copy
    = N + N/2 + N/4 + N/8 + ... ≈ 2N
    → Amortized: 2N / N = 2 = O(1)! ✅
```

### Rust: Vec::with_capacity — "đoán trước kích thước"

Nhiều ngôn ngữ cho phép bạn **đoán trước** kích thước để tránh reallocation:

```rust
// Rust: biết trước cần ~1000 phần tử
let mut v = Vec::with_capacity(1000);
// → Tạo array 1000 ô ngay từ đầu!
// → Không cần reallocate cho 1000 lần push đầu tiên!
// → Tiết kiệm rất nhiều chi phí copy!
```

Đây là mẹo tối ưu cực kỳ phổ biến trong production code: **nếu biết trước (hoặc ước lượng được) số phần tử**, hãy chỉ định capacity ngay từ đầu. Điều này loại bỏ hoàn toàn chi phí reallocation.

---

## §5. 🔬 Deep Analysis — Static vs Dynamic

### Tổng quan ba loại "array"

Sau phần Q&A, chúng ta có thể phân loại rõ ràng ba loại "array" mà bạn sẽ gặp:

```
BA LOẠI "ARRAY":
═══════════════════════════════════════════════════════════════

  1️⃣ STATIC ARRAY (C, Rust [T; N]):
  ┌──────────────────────────────────────────────────────────┐
  │ Kích thước cố định khi compile hoặc tạo!                │
  │ Không có methods! Phải truyền length riêng!             │
  │ Phải tự quản lý bộ nhớ!                                 │
  │ Không push, pop, insert!                                 │
  │ → Nền tảng của mọi thứ!                                 │
  │                                                          │
  │ Dùng khi: biết chính xác kích thước                      │
  │ Ví dụ: bảng RGB (3 giá trị), matrix 4×4, buffer cố định │
  └──────────────────────────────────────────────────────────┘

  2️⃣ DYNAMIC ARRAY (Vec<T>, ArrayList, std::vector):
  ┌──────────────────────────────────────────────────────────┐
  │ Static array BÊN DƯỚI!                                   │
  │ Tự quản lý capacity + reallocation cho bạn!             │
  │ Có push, pop, insert, v.v.!                              │
  │ Tự mở rộng bằng cách tạo array mới + copy!             │
  │ → Phổ biến nhất trong thực tế!                           │
  │                                                          │
  │ Dùng khi: không biết trước kích thước                    │
  │ Ví dụ: danh sách users, items, logs, events              │
  └──────────────────────────────────────────────────────────┘

  3️⃣ JS "ARRAY" ([]):
  ┌──────────────────────────────────────────────────────────┐
  │ Phức tạp nhất! Morphing thông minh!                      │
  │ Có thể chuyển sang hash map nếu sparse!                 │
  │ "Phức tạp gấp 10 lần" — Prime                           │
  │ Hành vi giống dynamic array nhưng bản chất là object!   │
  │ → Tiện lợi nhất nhưng khó kiểm soát hiệu suất!         │
  │                                                          │
  │ Dùng khi: viết JavaScript (không có lựa chọn khác!)     │
  │ Mẹo: giữ cùng kiểu + không tạo lỗ hổng = nhanh hơn!   │
  └──────────────────────────────────────────────────────────┘
```

### Bảng so sánh chi tiết

```
SO SÁNH CHI TIẾT:
═══════════════════════════════════════════════════════════════

  Tính năng         │ Static Array │ Dynamic Array │ JS []
  ──────────────────┼──────────────┼───────────────┼──────────
  Kích thước        │ Cố định      │ Tự mở rộng    │ Tự mở rộng
  Push/Pop          │ ❌            │ ✅ O(1)*      │ ✅ O(1)*
  Insert giữa       │ ❌            │ ✅ O(N)       │ ✅ O(N)
  Get by index      │ ✅ O(1)      │ ✅ O(1)       │ ✅ O(1)†
  Cùng kiểu         │ ✅ Bắt buộc  │ ✅ Bắt buộc   │ ❌ Tuỳ ý
  .length           │ ❌ Tự track  │ ✅ Tự động     │ ✅ Tự động
  Bộ nhớ liên tục   │ ✅ Luôn luôn │ ✅ Luôn luôn   │ ⚠️ Tuỳ V8
  Reallocation      │ ❌ Tự làm    │ ✅ Tự động     │ ✅ Tự động

  * Amortized O(1)
  † O(1) khi packed mode, chậm hơn khi dictionary mode
```

### Tại sao cần biết tất cả điều này?

Bạn có thể nghĩ: "Tôi dùng JavaScript, tôi chỉ cần biết `[]`." Nhưng hiểu static array giúp bạn:

1. **Hiểu Big O thật sự**: khi ai đó nói "array access là O(1)", họ nói về static array. JS array **có thể** không phải O(1) nếu ở dictionary mode.

2. **Tối ưu hiệu suất**: biết V8 có packed mode vs dictionary mode giúp bạn viết code nhanh hơn (giữ cùng kiểu, tránh lỗ hổng).

3. **Hiểu data structures khác**: ArrayList, HashMap, LinkedList... tất cả đều được xây trên nền static array. Nếu không hiểu array, bạn không hiểu bất kỳ data structure nào khác.

4. **Phỏng vấn**: interviewer muốn thấy bạn hiểu **bản chất**, không chỉ API bề mặt.

---

## Checklist

```
[ ] Không có push/pop/insert trên static arrays!
[ ] Ngôn ngữ cũ: không có .length — phải truyền count riêng!
[ ] C main(): argc + argv vì array không biết kích thước!
[ ] Kích thước phải chỉ định khi tạo — compile-time hoặc runtime!
[ ] Compile-time: cố định mãi mãi, thường trên stack!
[ ] Runtime: biến nhưng vẫn cố định sau tạo!
[ ] Reallocation: tạo array mới + copy cũ sang mới!
[ ] Amortized O(1): gấp đôi capacity → tổng copy ≈ 2N!
[ ] JS arrays: array bên dưới nhưng "phức tạp gấp 10 lần"!
[ ] V8: packed mode (nhanh) vs dictionary mode (chậm)!
[ ] Capacity game: quá nhỏ = reallocate, quá lớn = lãng phí!
[ ] Growth factor: Java 1.5×, C++/Rust 2×, Python ~1.125×!
[ ] Vec::with_capacity: đoán trước để tránh reallocation!
[ ] Ba loại: Static Array → Dynamic Array → JS []!
TIẾP THEO → Phần 5: Linear Search & Kata Setup!
```
