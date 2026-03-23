# The Last Algorithms Course You'll Need — Phần 3: Arrays Data Structure — "Contiguous Memory, Width × Offset, O(1) Everything!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Arrays Data Structure — "Contiguous memory, ArrayBuffer demo, width × offset, get/set/delete all O(1), no grow!"
> Độ khó: ⭐️⭐️⭐️ | Fundamental — real arrays vs JS "arrays", memory interpretation, constant time operations!

---

## Mục Lục

| #   | Phần                                            |
| --- | ----------------------------------------------- |
| 1   | "const a = [] Is NOT an Array!" — Reveal!       |
| 2   | Array = Contiguous Memory — "Zeros and Ones!"   |
| 3   | Width × Offset — "How Indexing Actually Works!" |
| 4   | ArrayBuffer Demo — "Node.js Proof!"             |
| 5   | Endianness Teaser — "Where Did 45 Go?!"         |
| 6   | Operations — "Get, Set, Delete = O(1)!"         |
| 7   | No Grow! — "F's in the Chat for Fred!"          |
| 8   | Tự Implement: Array Operations                  |
| 9   | 🔬 Deep Analysis — Real Array vs JS Array       |

---

## §1. "const a = [] Is NOT an Array!" — Reveal!

> Prime: _"If const array isn't an array, well what IS it? Hopefully by the end, we will be able to DERIVE what it is — we will empirically look at it and say, it's actually THIS data structure."_

### JavaScript "arrays" ≠ real arrays!

Prime: _"JavaScript arrays are much more complicated — they do a lot of cool tricks underneath. I'm sure they morph algorithms depending on how you use them."_

_"If you set one element at index a billion, I'm very sure JavaScript's not creating 999,999,999 positions. They're very smart."_

→ JS arrays = **something else** (sẽ reveal data structure thật sau!)

### Tại sao Prime bắt đầu khoá học bằng việc "phá vỡ ảo tưởng"?

Đây là một chiến lược giảng dạy rất thông minh. Khi bạn bước vào một khoá algorithms, bạn mang theo rất nhiều **giả định** (assumptions) từ kinh nghiệm lập trình hàng ngày. Một trong những giả định lớn nhất của JavaScript developer là: "tôi biết array là gì — nó là `[1, 2, 3]`."

Prime muốn **phá vỡ giả định đó ngay lập tức** để bạn bắt đầu khoá học với tâm thế đúng: **đặt câu hỏi về mọi thứ, không chấp nhận bề mặt**.

Khi Prime nói JavaScript "arrays" không phải là arrays thật, ông ấy muốn nói rằng **cấu trúc bên dưới** hoàn toàn khác với định nghĩa CS. JavaScript engine (V8) thực hiện rất nhiều tối ưu phức tạp: khi bạn tạo `[1, 2, 3]`, V8 **có thể** lưu nó như array thật (packed elements) cho hiệu suất. Nhưng khi bạn làm những việc "không phải array" — như trộn kiểu dữ liệu, tạo lỗ hổng, hay dùng string làm key — V8 chuyển sang dạng "dictionary mode" hoàn toàn khác.

Điều thú vị là Prime để bạn **tự discover** data structure thật đằng sau JS arrays ở cuối khoá học, thay vì nói trước. Đây là phương pháp "learning by building" — khi bạn đã hiểu đủ data structures, bạn sẽ nhìn vào hành vi của JS arrays và tự nhận ra: "À, nó hoạt động giống **HashMap** hơn array thật!"

```
REVEAL SẼ XẢYRA SAU KHI HỌC ĐỦ DATA STRUCTURES:
═══════════════════════════════════════════════════════════════

  Bài này: "const a = [] KHÔNG PHẢI là array!"
          → "Vậy nó là gì?"
          → "Chờ đã... chúng ta sẽ reveal sau!"

  Sau khi học Hash Map:
          → "Ồ! JS array hoạt động giống hash map!"
          → "Key = index (dạng string), Value = giá trị!"
          → "Vì vậy a['hello'] = 5 cũng hoạt động!"

  "Cuối khoá, ta sẽ nhìn vào nó và nói:
   nó thật ra là DATA STRUCTURE NÀY." — Prime
```

---

## §2. Array = Contiguous Memory — "Zeros and Ones!"

> Prime: _"The most fundamental idea of an array is that it's a CONTIGUOUS memory space — contiguous meaning UNBREAKING — in which contains a certain amount of bytes."_

### Mọi thứ trong máy tính chỉ là 0 và 1!

Prime: _"Everything about a computer is just numbers — zeros and ones. How memory is INTERPRETED is based on what you tell the compiler."_

_"When it sees a chunk of memory and goes 'these four bytes I'm gonna treat as a singular number' — a 32-bit number — that's the program understanding this memory in a very specific way."_

### Giải thích sâu: "Contiguous Memory" là gì?

**Contiguous** nghĩa là **liên tục, không bị đứt đoạn**. Trong ngữ cảnh bộ nhớ máy tính, nó có nghĩa là các phần tử của array nằm **cạnh nhau trong RAM**, không có khoảng trống xen giữa.

Hãy tưởng tượng RAM của máy tính như một dãy **tủ đồ** (lockers) ở trường học:

```
RAM = dãy tủ đồ (mỗi ô = 1 byte):
┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
│00│01│02│03│04│05│06│07│08│09│10│11│12│13│14│15│16│17│
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
```

Khi bạn tạo `int a[3]` (3 số nguyên, mỗi số 4 bytes), hệ điều hành tìm **12 ô liên tiếp** và giao cho bạn:

```
Array int a[3] chiếm ô 04→15:
┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
│  │  │  │  │▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│  │  │
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
              ← a[0] →  ← a[1] →  ← a[2] →
              4 bytes    4 bytes    4 bytes
```

**Tại sao contiguous quan trọng?** Vì nhờ nằm liên tiếp, CPU có thể tính **chính xác** vị trí của bất kỳ phần tử nào chỉ bằng một phép toán đơn giản (width × offset), mà không cần "đi tìm" từ đầu. Đây là lý do array cho phép truy cập O(1).

### Ý nghĩa của "interpretation"

Đây là một concept rất powerful mà Prime nhấn mạnh: **cùng một vùng nhớ có thể được hiểu theo nhiều cách khác nhau**. Bộ nhớ chỉ là 0 và 1 — không có "kiểu dữ liệu" ở mức phần cứng. Kiểu dữ liệu là **cách chúng ta quyết định đọc** các bit đó.

Ví dụ: 4 bytes `00 00 00 2D` (hex) có thể được đọc là:

- **Một số int32**: giá trị 45 (thập phân)
- **Bốn số int8**: giá trị 0, 0, 0, 45
- **Hai số int16**: giá trị 0, 45
- **Một chuỗi ASCII**: ba ký tự null + ký tự '-'
- **Một số float32**: một giá trị số thực rất nhỏ

**Cùng dữ liệu, khác interpretation, khác kết quả hoàn toàn!** Đây chính là sức mạnh (và nguy hiểm) của lập trình cấp thấp: bạn có toàn quyền quyết định "đọc" bộ nhớ theo cách nào.

```
CONTIGUOUS MEMORY & INTERPRETATION:
═══════════════════════════════════════════════════════════════

  Bộ nhớ thô (raw bytes):
  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
  │ 00 │ 00 │ 00 │ 2D │ 00 │ 00 │ 00 │ 02 │ 00 │ 00 │ 00 │ 00 │
  └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘

  Đọc dạng int8 (1 byte mỗi phần tử):
  [0, 0, 0, 45, 0, 0, 0, 2, 0, 0, 0, 0]  ← 12 phần tử!

  Đọc dạng int32 (4 bytes mỗi phần tử):
  [45, 2, 0]  ← 3 phần tử! Cùng bộ nhớ!

  "Chỉ vì nó liên tục không có nghĩa nó có
   bất kỳ ý nghĩa cụ thể nào cho đến khi
   BẠN gán ý nghĩa cho nó." — Prime
```

### Định nghĩa Array!

> Array = **zero or more pieces of memory**, understood as a **single type**, in a **row** (contiguous)!

Ba đặc điểm bắt buộc để được gọi là "array" trong Computer Science:

1. **Contiguous** — liên tục trong bộ nhớ, không có khoảng trống
2. **Fixed size** — kích thước cố định khi khởi tạo, không thể thay đổi
3. **Homogeneous** — cùng kiểu dữ liệu (tất cả int, tất cả float, v.v.)

Nếu thiếu **bất kỳ** đặc điểm nào, nó **không phải** array theo nghĩa CS.

```
int a[3];  // 3 số nguyên, liên tục!

Bộ nhớ:
┌──────────┬──────────┬──────────┐
│  a[0]    │  a[1]    │  a[2]    │
│ 4 bytes  │ 4 bytes  │ 4 bytes  │
└──────────┴──────────┴──────────┘
← 12 bytes tổng, không bị đứt! →
```

---

## §3. Width × Offset — "How Indexing Actually Works!"

> Prime: _"If you did a[0], you're telling the computer: go to the memory address of a. Add in the offset of zero MULTIPLIED by how big my type is."_

### Công thức truy cập!

```
address = memory_address_of_a + (offset × width_of_type)
```

Prime: _"If your type is 32 bits or 4 bytes, index 1 has to be 4 bytes INTO the array."_

### Giải thích sâu: tại sao công thức này quan trọng?

Đây là **lý do cốt lõi** tại sao array truy cập O(1). Hãy phân tích từng phần:

- **`memory_address_of_a`**: khi bạn khai báo `int a[3]`, hệ điều hành cấp cho bạn một vùng nhớ và trả về **địa chỉ đầu tiên**. Ví dụ: `0x1000`. Đây là "điểm bắt đầu" — nơi phần tử đầu tiên nằm.

- **`offset`**: đây là index bạn muốn truy cập. `a[0]` → offset = 0, `a[1]` → offset = 1, `a[2]` → offset = 2.

- **`width_of_type`**: kích thước (bytes) của mỗi phần tử. `int` = 4 bytes, `char` = 1 byte, `double` = 8 bytes.

Khi bạn viết `a[2]`, CPU **không cần** duyệt qua a[0] và a[1] để đến a[2]. CPU chỉ cần **tính toán**: `0x1000 + (2 × 4) = 0x1008` → đọc 4 bytes tại địa chỉ `0x1008`. **Một phép nhân, một phép cộng, xong.** Đó là O(1).

Hãy so sánh với Linked List (sẽ học sau): để truy cập phần tử thứ 2, bạn phải **bắt đầu từ đầu**, đi qua phần tử 0, rồi phần tử 1, rồi mới đến phần tử 2. Đó là O(N). Array không cần "đi bộ" — nó "teleport" trực tiếp đến vị trí cần thiết.

```
WIDTH × OFFSET — CÁCH INDEXING HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  int a[3];  // int = 4 bytes (32 bits)
  Địa chỉ gốc của a = 0x1000

  a[0]: 0x1000 + (0 × 4) = 0x1000  ← int đầu tiên!
  a[1]: 0x1000 + (1 × 4) = 0x1004  ← int thứ hai!
  a[2]: 0x1000 + (2 × 4) = 0x1008  ← int thứ ba!

  Bộ nhớ:
  0x1000  0x1004  0x1008
  ┌───────┬───────┬───────┐
  │ a[0]  │ a[1]  │ a[2]  │
  │ 4B    │ 4B    │ 4B    │
  └───────┴───────┴───────┘

  So sánh: Array vs Linked List
  ┌──────────────────────────────────────────────────────────┐
  │ Array: a[1000] = base + 1000 × 4 → TÍNH → O(1)!        │
  │ Linked List: node[1000] = đi qua 1000 nodes → O(N)!    │
  └──────────────────────────────────────────────────────────┘

  "Đây là thứ TẠO RA một array thật sự." — Prime
```

### Tại sao array bắt đầu từ index 0?

Đây là câu hỏi rất nhiều người mới thắc mắc: "tại sao array bắt đầu từ 0 chứ không phải 1?" Câu trả lời nằm ngay trong công thức width × offset:

- `a[0]` = base + **(0 × width)** = base + 0 = **chính địa chỉ gốc!**
- Nếu bắt đầu từ 1, `a[1]` = base + **(1 × width)** = base + 4 → bỏ qua 4 bytes đầu! Lãng phí!

Index 0 có nghĩa là "offset = 0" — tức là "không di chuyển, ở ngay đầu." Điều này giúp công thức truy cập **đơn giản nhất có thể**, không cần trừ 1 mỗi lần. Đó là lý do hầu hết ngôn ngữ lập trình bắt đầu mảng từ 0.

---

## §4. ArrayBuffer Demo — "Node.js Proof!"

> Prime: _"An array buffer is a contiguous piece of memory you can create in JavaScript. Then you can create VIEWS into this data."_

### ArrayBuffer = raw contiguous memory!

```javascript
// Tạo 6 bytes bộ nhớ liên tục!
const a = new ArrayBuffer(6);
// → <00 00 00 00 00 00>  Toàn số 0!

// Xem dưới dạng 8-bit (1 byte mỗi phần tử)
const a8 = new Uint8Array(a);
a8[0] = 45; // gán byte 0 = 45 (0x2D)
a8[2] = 2; // gán byte 2 = 2
// a → <2D 00 02 00 00 00>

// Xem dưới dạng 16-bit (2 bytes mỗi phần tử)
const a16 = new Uint16Array(a);
a16[2] = 0x4545; // gán phần tử 2 (byte 4-5)!
// a → <2D 00 02 00 45 45>
```

Prime: _"I took a contiguous memory space and interpreted it in TWO DIFFERENT WAYS. First as 8-bit units, then as 16-bit units. Very, very different."_

### Giải thích sâu: ArrayBuffer là "array thật" duy nhất trong JavaScript

Đây là một điểm rất quan trọng: **ArrayBuffer** (và các Typed Arrays như Uint8Array, Int32Array, Float64Array...) chính là thứ gần nhất với "array thật" trong JavaScript. Chúng có đầy đủ các đặc điểm của array theo định nghĩa CS:

1. **Contiguous** ✅ — `new ArrayBuffer(6)` tạo **đúng 6 bytes liên tiếp** trong bộ nhớ
2. **Fixed size** ✅ — sau khi tạo, bạn **không thể thay đổi** kích thước
3. **Homogeneous** ✅ — Uint8Array chỉ chứa unsigned 8-bit integers, Int32Array chỉ chứa signed 32-bit integers

Đây cũng là lý do tại sao ArrayBuffer/Typed Arrays được sử dụng rất nhiều trong **WebGL** (xử lý đồ hoạ), **WebAudio** (xử lý âm thanh), **WebSocket** (truyền dữ liệu binary), và **SharedArrayBuffer** (đa luồng). Tất cả những ứng dụng này cần **hiệu suất thật sự**, không thể dùng JavaScript arrays bình thường.

### Concept: "Views" — cùng dữ liệu, khác cách đọc

Trong demo, Prime tạo **một** ArrayBuffer duy nhất, rồi tạo **hai views** (Uint8Array và Uint16Array) trên cùng buffer đó. Điều kỳ diệu là: **thay đổi thông qua view này tự động ảnh hưởng view kia**, vì chúng chia sẻ cùng vùng nhớ!

```
HAI VIEWS — CÙNG BỘ NHỚ:
═══════════════════════════════════════════════════════════════

  Bộ nhớ thô (6 bytes):
  ┌────┬────┬────┬────┬────┬────┐
  │ 2D │ 00 │ 02 │ 00 │ 45 │ 45 │
  └────┴────┴────┴────┴────┴────┘

  View dạng Uint8Array (1 byte mỗi phần tử):
  [0]  [1]  [2]  [3]  [4]  [5]
   45   0    2    0    69   69    ← 6 phần tử!

  View dạng Uint16Array (2 bytes mỗi phần tử):
  [ 0 ]   [ 1 ]   [ 2 ]
    45      2     0x4545          ← 3 phần tử!

  Thay đổi a8[4] = 99 sẽ:
  → a8: [..., ..., ..., ..., 99, 69]
  → a16[2] cũng thay đổi! Vì chia sẻ cùng bộ nhớ!

  "Tôi đã INTERPRET nó theo hai cách khác nhau!" — Prime
```

Đây chính là bản chất của array: **dữ liệu thô (raw bytes) + interpretation (cách đọc)** = thông tin có ý nghĩa. Và trong lập trình cấp thấp (C, Rust, systems programming), bạn làm việc với concept này **hàng ngày**.

---

## §5. Endianness Teaser — "Where Did 45 Go?!"

> Prime: _"Due to something called ENDIANNESS — when I store this value, it will be a bit confusing. It put 45 in the most significant position — probably NOT where you thought."_

### Endianness = byte order!

Prime: _"We won't talk about endianness."_ → Nhưng hint: **Little-endian** (Intel/AMD) lưu byte thấp trước!

### Giải thích ngắn: Endianness là gì?

Endianness quyết định **thứ tự** các bytes khi lưu một số lớn hơn 1 byte vào bộ nhớ.

Ví dụ: số `0x0045` (2 bytes: `00` và `45`) có thể được lưu theo hai cách:

```
ENDIANNESS:
═══════════════════════════════════════════════════════════════

  Số cần lưu: 0x0045 (decimal: 69)

  Big-Endian (byte cao trước — "tự nhiên"):
  ┌────┬────┐
  │ 00 │ 45 │  ← Đọc trái→phải: 0x0045 = 69 ✅
  └────┴────┘

  Little-Endian (byte thấp trước — Intel/AMD dùng cái này!):
  ┌────┬────┐
  │ 45 │ 00 │  ← Đọc trái→phải: 0x4500 = 17664 ❌
  └────┴────┘     Nhưng CPU hiểu: byte thấp trước → 0x0045 = 69 ✅

  → "45 đi đâu rồi?!" — vì CPU đặt nó ở vị trí khác
     với mong đợi "tự nhiên" của con người!

  → Tại sao little-endian? Vì CPU cộng số từ byte thấp
    lên byte cao, nên đặt byte thấp trước = tiện hơn!
```

Prime chỉ mention endianness như một **teaser** — bạn không cần hiểu sâu cho khoá này. Nhưng nếu bạn từng làm network programming hay đọc binary files, endianness là kiến thức bắt buộc.

---

## §6. Operations — "Get, Set, Delete = O(1)!"

> Prime: _"Does getting at a specific index GROW with respect to input? If I give 7 as my index, if I give 100 — does anything change? It's CONSTANT TIME."_

### Tất cả operations = O(1)!

**Get** (đọc): `a[i]` → address + (i × width) → O(1)!
**Set** (ghi): `a[i] = value` → cùng công thức → O(1)!
**Delete**: Gán giá trị zero/null → cùng công thức → O(1)!

Prime: _"Nothing goes over the entire array. We KNOW the width, we KNOW the offset, multiply, get the position, read/write. Same for insertion, same for deletion."_

_"Constant time doesn't mean we literally do ONE thing. It means we do a CONSTANT amount of things no matter what the input is."_

### Giải thích sâu: tại sao O(1) cho mọi operation?

Hãy quay lại công thức: `address = base + (index × width)`.

Công thức này có **bao nhiêu bước**? Đúng **3 bước**: nhân, cộng, đọc/ghi. Bất kể array có 10 phần tử hay 10 triệu phần tử, bạn vẫn **chỉ cần 3 bước** để truy cập bất kỳ phần tử nào. Con số 3 **không phụ thuộc N** → đó là O(1).

Đây là điểm mà nhiều người nhầm: "O(1) nghĩa là chỉ làm 1 thao tác." **Sai.** O(1) nghĩa là **số thao tác KHÔNG ĐỔI** dù input tăng. Có thể là 1 thao tác, 3 thao tác, hay 100 thao tác — miễn là nó **không phụ thuộc vào N**, thì vẫn là O(1).

```
O(1) — MỌI THAO TÁC:
═══════════════════════════════════════════════════════════════

  GET: a[i]
  → base + (i × width) → đọc giá trị!
  → O(1)! Không quan trọng i=0 hay i=1,000,000!
  → Luôn là: 1 phép nhân + 1 phép cộng + 1 phép đọc = 3 bước!

  SET: a[i] = value
  → base + (i × width) → ghi giá trị!
  → O(1)! Cùng công thức!

  DELETE: a[i] = 0
  → Giống set! Chỉ ghi sentinel value!
  → O(1)!

  SO SÁNH VỚI CÁC DATA STRUCTURES KHÁC:
  ┌──────────────────────────────────────────────────────────┐
  │ Data Structure │  Get    │  Set    │ Insert │ Delete    │
  │────────────────┼─────────┼─────────┼────────┼───────────│
  │ Array          │  O(1)   │  O(1)   │  N/A   │ O(1)*    │
  │ Linked List    │  O(N)   │  O(N)   │  O(1)  │ O(1)**   │
  │ Hash Map       │  O(1)†  │  O(1)†  │  O(1)† │ O(1)†    │
  └──────────────────────────────────────────────────────────┘
  * Delete trong array = gán sentinel, không phải xoá thật
  ** Delete trong linked list = O(1) nếu đã có pointer
  † Average case

  "Chúng ta không cần ĐI BỘ đến vị trí đó.
   Chúng ta BIẾT width, nhân với offset, xong." — Prime
```

### Lưu ý quan trọng: "Delete" trong array

Khi Prime nói "delete" trong array, ông ấy **không** nói xoá một phần tử và dồn các phần tử còn lại lại. Đó gọi là **remove** và tốn O(N) vì phải shift tất cả phần tử phía sau.

"Delete" trong context array thật nghĩa là **gán giá trị sentinel** (ví dụ: 0, null, -1) — đánh dấu "ô này trống" nhưng **không thay đổi kích thước hay vị trí** của các phần tử khác. Đó cũng là O(1).

---

## §7. No Grow! — "F's in the Chat for Fred!"

> Prime: _"You do NOT get to grow your array into more memory. What happened if right after that you have the user's name? If you grow this, what's gonna happen to poor Fred? F's in the chat for Fred."_ 😂

### Arrays = fixed size!

Prime: _"You cannot grow it. There is no insert-at, there's no push or pop."_

_"That's WHY data structures exist — because it would be really annoying if you constantly had to reallocate everything."_

_"That's why you'll notice things like CAPACITY in other languages — they're trying to make an optimized way to use memory without reallocations."_

### Giải thích sâu: tại sao array không thể mở rộng?

Đây là constraint cơ bản nhất của array, và cũng là **lý do tại sao các data structures khác tồn tại**. Hãy hiểu vấn đề:

Khi bạn tạo `int a[3]`, hệ điều hành tìm **12 bytes liên tiếp** trong RAM và giao cho bạn. Nhưng ngay sau 12 bytes đó **có thể có dữ liệu khác** — biến của chương trình khác, tên người dùng, bất cứ gì. Bạn **không thể** đơn giản "mở rộng" array bằng cách chiếm thêm bytes phía sau, vì bạn sẽ **ghi đè** (overwrite) dữ liệu của người khác.

Đây chính là câu chuyện "Fred" mà Prime kể: nếu sau array của bạn là tên "Fred", và bạn cố mở rộng array, bạn sẽ **xoá mất Fred!** 💀

```
KHÔNG THỂ MỞ RỘNG:
═══════════════════════════════════════════════════════════════

  Bộ nhớ:
  ┌──────────┬──────────┬──────────┬──────────────────┐
  │  a[0]    │  a[1]    │  a[2]    │  "Fred" (dữ liệu│
  │  int     │  int     │  int     │   của chương      │
  │          │          │          │   trình khác!)     │
  └──────────┴──────────┴──────────┴──────────────────┘

  Nếu bạn cố mở rộng a[3]...
  → Bạn GHI ĐÈ lên Fred! 💀
  → "F's in the chat for Fred!" — Prime 😂

  VẬY LÀM SAO ĐỂ CÓ "DYNAMIC ARRAY"?
  ┌──────────────────────────────────────────────────────────┐
  │ GIẢI PHÁP: TẠO ARRAY MỚI LỚN HƠN + COPY!              │
  │                                                          │
  │ Bước 1: Tạo array mới gấp đôi kích thước               │
  │ Bước 2: Copy tất cả phần tử cũ sang array mới           │
  │ Bước 3: Xoá array cũ                                    │
  │ Bước 4: Dùng array mới                                   │
  │                                                          │
  │ → Đây chính là cách ArrayList/Vector hoạt động!         │
  │ → Copy tốn O(N) — nhưng chỉ xảy ra "đôi khi"!         │
  │ → Amortized O(1) per push! (trung bình!)                │
  └──────────────────────────────────────────────────────────┘

  Ví dụ minh hoạ (ArrayList):
  ┌──────────┬──────────┬──────────┬──────────┐
  │  10      │  20      │  30      │  (trống) │  ← capacity = 4
  └──────────┴──────────┴──────────┴──────────┘
  Push 40 → vẫn đủ chỗ, OK!

  ┌──────────┬──────────┬──────────┬──────────┐
  │  10      │  20      │  30      │  40      │  ← capacity = 4, FULL!
  └──────────┴──────────┴──────────┴──────────┘
  Push 50 → HẾT CHỖ! → Tạo array mới gấp đôi!

  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
  │  10  │  20  │  30  │  40  │  50  │      │      │      │ ← capacity = 8!
  └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

Đây là lý do tại sao trong Java có `ArrayList` (dynamic), trong C++ có `std::vector` (dynamic), và trong Go có `slices` (dynamic) — tất cả đều được xây dựng **trên nền array thật** với cơ chế reallocation tự động.

### Deletion = sentinel value!

Prime: _"You don't DELETE something out of contiguous memory. You set it to zero — a sentinel value. NULL being the zeroth value — a named way for us to understand that there's NOTHING in this very-something spot."_

Concept **sentinel value** rất quan trọng trong Computer Science. Nó xuất hiện ở nhiều nơi:

- **NULL** trong C: giá trị đặc biệt cho pointer "không trỏ đâu cả"
- **-1** trong JavaScript: `indexOf()` trả về -1 khi không tìm thấy
- **0** trong array: đánh dấu "ô trống"
- **undefined** trong JavaScript: biến chưa được gán giá trị

Tất cả đều là **sentinel** — giá trị đặc biệt mà cả programmer lẫn program đều hiểu là "ở đây không có gì."

---

## §8. Tự Implement: Array Operations

```javascript
// ═══ Thao Tác Array Thật ═══

// Mô phỏng fixed-size array (giống C!)
class RealArray {
  constructor(size, bytesPerElement) {
    this.buffer = new ArrayBuffer(size * bytesPerElement);
    this.view = new Int32Array(this.buffer); // 32-bit integers
    this.size = size;
    this.bytesPerElement = bytesPerElement;
  }

  // GET — O(1)!
  get(index) {
    // base + (index × width) → đọc!
    if (index < 0 || index >= this.size) throw new Error("Vượt giới hạn!");
    return this.view[index];
  }

  // SET — O(1)!
  set(index, value) {
    // base + (index × width) → ghi!
    if (index < 0 || index >= this.size) throw new Error("Vượt giới hạn!");
    this.view[index] = value;
  }

  // DELETE — O(1)! (gán = 0)
  delete(index) {
    this.set(index, 0); // sentinel value!
  }

  toString() {
    return Array.from(this.view).join(", ");
  }
}

// Demo
const arr = new RealArray(5, 4); // 5 ints, mỗi cái 4 bytes
console.log("Khởi tạo:", arr.toString()); // 0, 0, 0, 0, 0

arr.set(0, 42);
arr.set(2, 100);
arr.set(4, 255);
console.log("Sau khi set:", arr.toString()); // 42, 0, 100, 0, 255

console.log("Get [2]:", arr.get(2)); // 100 — O(1)!

arr.delete(2);
console.log("Sau khi delete:", arr.toString()); // 42, 0, 0, 0, 255

// Không thể mở rộng!
try {
  arr.set(5, 999);
} catch (e) {
  console.log("Không thể mở rộng:", e.message);
}

console.log("\n✅ Mọi operations O(1)!");
console.log("✅ Kích thước cố định — không mở rộng!");
console.log("✅ Bộ nhớ liên tục — width × offset!");
```

```javascript
// ═══ Bonus: Demo ArrayBuffer + Views ═══

// Tạo 12 bytes contiguous memory
const buf = new ArrayBuffer(12);

// View 1: đọc dạng 8-bit (1 byte mỗi phần tử)
const view8 = new Uint8Array(buf);
view8[3] = 45; // byte thứ 4 = 45
view8[7] = 2; // byte thứ 8 = 2

console.log("View 8-bit:", Array.from(view8));
// [0, 0, 0, 45, 0, 0, 0, 2, 0, 0, 0, 0] — 12 phần tử!

// View 2: đọc dạng 32-bit (4 bytes mỗi phần tử)
const view32 = new Int32Array(buf);
console.log("View 32-bit:", Array.from(view32));
// [kết quả phụ thuộc endianness!] — 3 phần tử!

// Thay đổi qua view32 → view8 cũng thay đổi!
view32[2] = 999;
console.log("View 8-bit sau khi thay đổi view32:", Array.from(view8));
// Bytes 8-11 thay đổi! Vì chia sẻ CÙNG BỘ NHỚ!

console.log("\n✅ ArrayBuffer = bộ nhớ liên tục thật!");
console.log("✅ Views = cách interpret cùng bộ nhớ!");
console.log("✅ Cùng dữ liệu, khác kiểu → khác kết quả!");
```

---

## §9. 🔬 Deep Analysis — Real Array vs JS Array

```
ARRAY THẬT vs JS "ARRAY":
═══════════════════════════════════════════════════════════════

  ARRAY THẬT (C, Rust, Go):
  ┌──────────────────────────────────────────────────────────┐
  │ ✅ Bộ nhớ liên tục (contiguous)!                        │
  │ ✅ Kích thước cố định (fixed size)!                      │
  │ ✅ Cùng kiểu dữ liệu (single type)!                     │
  │ ✅ O(1) get/set/delete!                                  │
  │ ❌ Không mở rộng! Không push! Không pop!                │
  │ ❌ Không insert-at (phải shift phần tử)!                │
  └──────────────────────────────────────────────────────────┘

  JS "ARRAY" (không thật sự là array!):
  ┌──────────────────────────────────────────────────────────┐
  │ ❌ Không nhất thiết liên tục!                            │
  │ ❌ Kích thước động (tự mở rộng!)                        │
  │ ❌ Trộn nhiều kiểu dữ liệu!                             │
  │ ✅ push, pop, shift, unshift!                            │
  │ ✅ Tối ưu thông minh bên dưới!                          │
  │ → Thật ra là một data structure KHÁC! (TBD!)            │
  └──────────────────────────────────────────────────────────┘

  V8 ENGINE OPTIMIZATIONS:
  ┌──────────────────────────────────────────────────────────┐
  │ Packed Elements Mode:                                    │
  │ → Khi array "đẹp" (cùng kiểu, không lỗ hổng)          │
  │ → V8 lưu HẲN NHƯ array thật cho hiệu suất!            │
  │                                                          │
  │ Dictionary Mode:                                         │
  │ → Khi array "xấu" (trộn kiểu, có lỗ hổng)             │
  │ → V8 chuyển sang dạng hash map — chậm hơn!             │
  │                                                          │
  │ Ví dụ trigger dictionary mode:                           │
  │ const a = [1, 2, 3];     // packed ✅                   │
  │ a[10000] = 5;            // dictionary 💀                │
  │ const b = [1, "hi", {}]; // dictionary 💀                │
  └──────────────────────────────────────────────────────────┘

  TÓM TẮT:
  ┌──────────────────────────────────────────────────────────┐
  │ Array = kích thước cố định, liên tục, cùng kiểu, O(1)! │
  │ JS [] = "phức tạp hơn nhiều" — Prime                    │
  │ → Sẽ reveal JS [] thật sự là gì ở phần sau! 🎯        │
  └──────────────────────────────────────────────────────────┘
```

---

## Checklist

```
[ ] Array = vùng nhớ liên tục (contiguous memory)!
[ ] Mọi thứ là 0 và 1 — interpretation tạo ra ý nghĩa!
[ ] Indexing: base + (offset × width) = O(1)!
[ ] Tại sao bắt đầu từ 0: offset 0 = chính địa chỉ gốc!
[ ] ArrayBuffer: cùng bộ nhớ, views khác nhau → kết quả khác!
[ ] Endianness: thứ tự bytes (little-endian trên Intel)!
[ ] Get, Set, Delete = TẤT CẢ O(1)!
[ ] O(1) = số thao tác KHÔNG ĐỔI (không phải "1 thao tác")!
[ ] Không mở rộng! "F's in the chat for Fred!" 😂
[ ] Dynamic array: tạo mới + copy = ArrayList/Vector!
[ ] Delete = gán sentinel value (0/null)!
[ ] JS [] KHÔNG PHẢI là array thật! (reveal sau!)
[ ] V8: packed mode vs dictionary mode!
TIẾP THEO → Phần 4: Linear Search & Kata Setup!
```
