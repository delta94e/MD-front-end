# The Last Algorithms Course You'll Need — Phần 7: Pseudo-code Binary Search — "lo, hi, Midpoint, 3 Conditions, Off-by-One!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Pseudo-code Binary Search — "lo/hi pointers, midpoint formula, 3 conditions, lo inclusive hi exclusive, off-by-one terror!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — pseudocode design, boundary conventions, the classic off-by-one!

---

## Mục Lục

| #   | Phần                                              |
| --- | ------------------------------------------------- |
| 1   | Function Signature — "lo, hi, the Search Space!"  |
| 2   | Loop Condition — "When lo and hi Cross!"          |
| 3   | Midpoint Formula — "lo + (hi - lo) / 2!"          |
| 4   | 3 Conditions — "Equal, Greater, Less!"            |
| 5   | lo Inclusive, hi Exclusive — "Off-by-One Terror!" |
| 6   | Q: "Shouldn't It Be <=?" — "NO!"                  |
| 7   | Q: "Array Must Be Sorted?" — "Absolutely!"        |
| 8   | Tự Implement: Pseudocode → Code                   |

---

## §1. Function Signature — "lo, hi, the Search Space!"

> Prime: _"We could have a function search that takes an array, and maybe it has a lo and a hi — this is the SPACE in which you need to look."_

### lo và hi xác định vùng tìm kiếm!

```
search(array, lo, hi, needle):
  lo = điểm bắt đầu vùng tìm (inclusive!)
  hi = điểm kết thúc vùng tìm (exclusive!)
  needle = giá trị cần tìm!
```

### Giải thích sâu: tại sao cần lo và hi?

Trong linear search, bạn luôn duyệt **toàn bộ mảng**. Nhưng binary search **thu hẹp vùng tìm kiếm** mỗi bước, vì vậy bạn cần **hai con trỏ** (pointers) để theo dõi: "hiện tại tôi đang tìm ở đâu?"

Hãy tưởng tượng bạn đang chơi trò **đoán số**: "Tôi nghĩ một số từ 1 đến 100."

```
TRÒ CHƠI ĐOÁN SỐ — GIỐNG BINARY SEARCH:
═══════════════════════════════════════════════════════════════

  "Tôi nghĩ số từ 1 đến 100. Bạn đoán đi!"

  lo = 1, hi = 100
  Bạn đoán: 50 → "Cao hơn!"
  → lo = 51, hi = 100     (bỏ nửa dưới!)

  Bạn đoán: 75 → "Thấp hơn!"
  → lo = 51, hi = 75      (bỏ nửa trên!)

  Bạn đoán: 63 → "Cao hơn!"
  → lo = 64, hi = 75

  Bạn đoán: 69 → "ĐÚNG RỒI!" ✅

  Chỉ 4 lần đoán cho 100 số!
  log₂(100) ≈ 7 → tối đa 7 lần!

  lo và hi = VÙNG CÒN CẦN TÌM!
  → Ban đầu: toàn bộ mảng!
  → Sau mỗi bước: nửa mảng!
  → Khi lo >= hi: hết chỗ tìm → dừng!
```

Trò chơi đoán số chính xác là binary search. Và `lo`, `hi` là hai biến giúp bạn **nhớ** vùng nào đã loại bỏ, vùng nào còn cần kiểm tra.

---

## §2. Loop Condition — "When lo and hi Cross!"

> Student: _"Comparing to the low..."_ → Prime: _"Yeah, exactly! When lo and hi effectively become each other, we're done. We've halved our space to the point where we can no longer halve."_

### Lặp cho đến khi lo >= hi!

`do...while (lo < hi)` → tiếp tục cho đến khi hai con trỏ gặp nhau!

Prime: _"They're gonna always keep getting closer to each other. We'll know that will eventually happen."_

### Giải thích sâu: điều gì xảy ra khi lo >= hi?

Khi `lo >= hi`, điều đó có nghĩa là **vùng tìm kiếm trống** — không còn phần tử nào để kiểm tra. Đây là điều kiện **dừng** (termination condition) của binary search.

```
LOOP DỪY KHI NÀO:
═══════════════════════════════════════════════════════════════

  Ban đầu: lo = 0, hi = 8
  [1, 3, 5, 7, 9, 11, 13, 15]
   ↑                          ↑
   lo                         hi
  → Vùng tìm: 8 phần tử! Tiếp tục!

  Sau vài bước: lo = 3, hi = 4
  [_, _, _, 7, _, _, _, _]
            ↑  ↑
           lo  hi
  → Vùng tìm: 1 phần tử! Kiểm tra lần cuối!

  Sau bước cuối: lo = 4, hi = 4
  [_, _, _, _, _, _, _, _]
               ↑
            lo = hi
  → Vùng tìm: 0 phần tử! DỪNG!
  → lo < hi? KHÔNG! → Thoát loop!

  Quy tắc:
  → lo < hi → CÓ phần tử cần kiểm tra → TIẾP TỤC!
  → lo >= hi → KHÔNG CÒN phần tử → DỪNG!
  → Nếu needle không tìm thấy → return false!
```

Một điểm quan trọng: `lo` và `hi` **luôn tiến về phía nhau** — `lo` chỉ tăng, `hi` chỉ giảm. Vì vậy, loop **chắc chắn dừng** — không bao giờ chạy vô hạn. Đây là đảm bảo **termination** (kết thúc) quan trọng cho mọi thuật toán.

---

## §3. Midpoint Formula — "lo + (hi - lo) / 2!"

> Prime: _"Midpoint is lo + (hi - lo) / 2 — we're getting the middle point with the offset."_

### Tại sao không dùng (lo + hi) / 2?

- `(lo + hi) / 2` → có thể **integer overflow** nếu lo và hi lớn!
- `lo + (hi - lo) / 2` → an toàn hơn! Luôn dùng cách này!

### Giải thích sâu: bug overflow triệu đô

Đây là một trong những bug **nổi tiếng nhất** trong lịch sử lập trình. Năm 2006, Joshua Bloch (tác giả Effective Java, engineer tại Google) [phát hiện](https://research.google/blog/extra-extra-read-all-about-it-nearly-all-binary-searches-and-mergesorts-are-broken/) rằng implementation binary search trong Java (và hầu hết ngôn ngữ!) bị bug overflow này **suốt 20 năm**!

```
BUG OVERFLOW:
═══════════════════════════════════════════════════════════════

  ❌ Cách SAI (overflow!):
  mid = (lo + hi) / 2

  Nếu lo = 2,000,000,000 và hi = 2,000,000,000:
  lo + hi = 4,000,000,000
  → VƯỢT giới hạn int32 (2,147,483,647)! 💀
  → Tràn số → giá trị ÂM → index âm → CRASH!

  ✅ Cách ĐÚNG (an toàn!):
  mid = lo + Math.floor((hi - lo) / 2)

  hi - lo = 0 (không bao giờ tràn vì hi >= lo!)
  lo + 0 = 2,000,000,000 ✅

  Ví dụ bình thường: lo = 3, hi = 9
  ❌ (3 + 9) / 2 = 6  ← đúng kết quả, nhưng nguy hiểm!
  ✅ 3 + floor((9 - 3) / 2) = 3 + 3 = 6  ← an toàn!

  Tại sao an toàn?
  → (hi - lo) luôn >= 0 và <= kích thước mảng!
  → lo + (hi - lo) / 2 luôn nằm GIỮA lo và hi!
  → Không bao giờ tràn!

  "Bug này tồn tại trong Java standard library
   SUỐT 20 NĂM trước khi được phát hiện!" 😱
```

Trong JavaScript, bạn ít gặp overflow hơn vì number là 64-bit float (chính xác đến 2^53). Nhưng **thói quen tốt** là luôn dùng `lo + (hi - lo) / 2` — nó chứng tỏ **bạn biết vấn đề tồn tại**, và đây là điểm cộng lớn trong phỏng vấn.

---

## §4. 3 Conditions — "Equal, Greater, Less!"

> Prime: _"Does anyone know what the three conditions are?"_

### Ba trường hợp tại midpoint!

Khi bạn tìm được midpoint và đọc giá trị tại đó, chỉ có **đúng 3 khả năng**:

```
3 TRƯỜNG HỢP:
═══════════════════════════════════════════════════════════════

  value = array[midpoint]

  1. value === needle → TÌM THẤY! Trả về true! 🎉

  2. value < needle → needle nằm BÊN PHẢI!
     → lo = midpoint + 1 (bỏ qua midpoint!)
     → Tìm nửa phải!

  3. value > needle → needle nằm BÊN TRÁI!
     → hi = midpoint (loại trừ midpoint!)
     → Tìm nửa trái!
```

Prime: _"We don't need to consider the midpoint — we already know it's not the right value. So we adjust and put it right in front."_

### Giải thích sâu: tại sao lo = mid + 1 nhưng hi = mid?

Đây là phần **gây nhầm nhất** của binary search, và là nơi off-by-one errors thường xảy ra. Hãy hiểu từng trường hợp:

**Trường hợp 2: value < needle → lo = mid + 1**

Giá trị tại mid **nhỏ hơn** needle → needle chắc chắn **không phải** tại vị trí mid → bỏ qua mid → lo đặt ở **mid + 1** (ngay sau mid).

**Trường hợp 3: value > needle → hi = mid**

Giá trị tại mid **lớn hơn** needle → needle chắc chắn **không phải** tại vị trí mid → bỏ qua mid. Nhưng hi là **exclusive** (không bao gồm), nên `hi = mid` có nghĩa là "tìm đến **trước** mid" — tức là mid đã bị loại rồi!

```
TẠI SAO lo = mid + 1 NHƯNG hi = mid:
═══════════════════════════════════════════════════════════════

  Convention: [lo, hi) — lo inclusive, hi exclusive!

  Ví dụ: sorted = [1, 3, 5, 7, 9],  needle = 3
  lo = 0, hi = 5 → vùng tìm: [0, 5) = index 0,1,2,3,4

  Bước 1: mid = 0 + (5-0)/2 = 2 → value = 5
          5 > 3 → needle ở BÊN TRÁI!
          hi = mid = 2 → vùng mới: [0, 2) = index 0,1
          (mid=2 bị loại vì hi exclusive!)

  Bước 2: mid = 0 + (2-0)/2 = 1 → value = 3
          3 === 3 → TÌM THẤY! ✅

  Nếu dùng hi = mid - 1 thì SAO?
  → hi = 2 - 1 = 1 → vùng: [0, 1) = chỉ index 0!
  → BỎ MẤT index 1! → Không tìm thấy 3! → SAI! 💀

  Kết luận:
  → lo = mid + 1: vì lo INCLUSIVE → cần +1 để bỏ mid!
  → hi = mid: vì hi EXCLUSIVE → mid tự động bị bỏ!
  → Hai quy tắc khác nhau vì CONVENTIONS khác nhau!
```

---

## §5. lo Inclusive, hi Exclusive — "Off-by-One Terror!"

> Prime: _"I always do: lo is INCLUSIVE, hi is EXCLUSIVE. Always have these in your head or else this +1 is gonna eat your lunch."_

### Convention cứu mạng!

```
QUY ƯỚC RANH GIỚI:
═══════════════════════════════════════════════════════════════

  lo là INCLUSIVE:  ta CÓ kiểm tra index lo!
  hi là EXCLUSIVE:  ta KHÔNG kiểm tra index hi!

  [lo, hi)  ← nửa-mở (half-open interval)!

  Tại sao convention này quan trọng:
  - value < needle → lo = mid + 1 (bỏ mid, inclusive!)
  - value > needle → hi = mid (loại trừ mid, exclusive!)

  "Luôn đến với MỘT KẾ HOẠCH hoặc
   nó sẽ PHÁ HUỶ bạn." — Prime ⚠️
```

### Giải thích sâu: tại sao half-open interval?

Convention `[lo, hi)` (inclusive-exclusive, hay "half-open") không phải ngẫu nhiên — nó có nhiều ưu điểm toán học:

```
ƯU ĐIỂM CỦA [lo, hi) — HALF-OPEN INTERVAL:
═══════════════════════════════════════════════════════════════

  1. KÍCH THƯỚC = hi - lo (không cần +1!)
     [2, 5) → kích thước = 5 - 2 = 3 phần tử (index 2,3,4)
     Nếu dùng [2, 5] → kích thước = 5 - 2 + 1 = 3 (cần +1!)

  2. VÙNG TRỐNG khi lo === hi
     [3, 3) → kích thước = 3 - 3 = 0 → trống! Rõ ràng!
     Nếu dùng [3, 2] → ??? khó hiểu!

  3. CHIA MẢNG dễ dàng
     [0, N) = toàn bộ mảng
     [0, mid) = nửa trái
     [mid, N) = nửa phải (không overlap!)

  4. GHÉP HAI NỬA: [0, mid) + [mid, N) = [0, N) ← trùng khít!
     Không bỏ sót, không trùng lắp!

  Đây cũng là lý do tại sao:
  → for (let i = 0; i < N; i++) dùng < chứ không phải <=
  → Array indices: 0 đến N-1 = [0, N) = half-open!
  → Python slicing: a[2:5] = index 2,3,4 = [2, 5)!
```

### Pseudocode hoàn chỉnh!

```
function search(array, needle):
  lo = 0
  hi = array.length          // exclusive!

  do:
    mid = lo + floor((hi - lo) / 2)
    value = array[mid]

    if value === needle:
      return true             // tìm thấy!
    else if value > needle:
      hi = mid                // tìm trái (exclusive!)
    else:
      lo = mid + 1            // tìm phải (inclusive!)

  while lo < hi

  return false                // không tìm thấy!
```

### Mô phỏng từng bước

```
MÔ PHỎNG: search([1, 3, 5, 7, 9, 11, 13, 15], 11)
═══════════════════════════════════════════════════════════════

  Bước 1: lo=0, hi=8, mid=4, value=9
  [1, 3, 5, 7, 9, 11, 13, 15]
   ↑              ↑           ↑
   lo            mid          hi
  9 < 11 → lo = 4 + 1 = 5

  Bước 2: lo=5, hi=8, mid=6, value=13
  [_, _, _, _, _, 11, 13, 15]
                   ↑    ↑    ↑
                   lo   mid  hi
  13 > 11 → hi = 6

  Bước 3: lo=5, hi=6, mid=5, value=11
  [_, _, _, _, _, 11, _, _]
                   ↑  ↑
                  lo  hi
                  mid
  11 === 11 → TÌM THẤY! ✅ (3 bước cho 8 phần tử!)

  log₂(8) = 3 → đúng! ✅
```

---

## §6. Q: "Shouldn't It Be <=?" — "NO!"

> Student: _"Shouldn't it be less than or equal to hi?"_
> Prime: _"We DON'T want to do less than or equal to."_

### lo < hi, KHÔNG PHẢI lo <= hi!

Prime: _"lo is INCLUDED but hi should NOT be included. If we include 1 but should exclude 1, what does that mean? It means our pointers are actually BEHIND each other — a fundamentally broken state."_

### Giải thích sâu: nếu dùng <= thì sao?

Đây là một trong những câu hỏi phổ biến nhất. Hãy xem điều gì xảy ra nếu dùng `<=`:

```
TẠI SAO lo < hi (KHÔNG PHẢI <=):
═══════════════════════════════════════════════════════════════

  Với convention [lo, hi) — hi EXCLUSIVE:

  Khi lo === hi:
  [lo/hi)  ← vùng trống! Không có gì để tìm!
  → Dừng! Xong!

  Khi lo < hi:
  [lo .... hi)  ← vẫn có phần tử!
  → Tiếp tục tìm!

  NẾU dùng lo <= hi:
  Khi lo === hi (ví dụ: lo = 5, hi = 5):
  → mid = 5 + (5-5)/2 = 5
  → value = array[5]
  → Nếu value !== needle:
    → hi = mid = 5 hoặc lo = mid + 1 = 6
    → Giờ lo = 5, hi = 5 (nếu hi = mid)
    → Loop kiểm tra: 5 <= 5 → TRUE → lặp lại!
    → mid = 5 lần nữa → cùng kết quả → VÔ HẠN! 💀

  Hoặc lo = 6, hi = 5:
  → Con trỏ "ngược" → TRẠNG THÁI HỎNG!

  "Nếu bạn include hi trong khi nó nên bị exclude,
   con trỏ sẽ ở trạng thái HỎNG." — Prime
```

**LƯU Ý**: Nếu bạn dùng convention `[lo, hi]` (cả hai inclusive), thì bạn **nên** dùng `<=`. Nhưng khi đó `hi = mid - 1` thay vì `hi = mid`. Đây là convention khác, cũng đúng, nhưng Prime chọn `[lo, hi)` vì nó nhất quán hơn.

```
HAI CONVENTION — CẢ HAI ĐÚNG:
═══════════════════════════════════════════════════════════════

  Convention 1: [lo, hi) — Prime dùng cái này!
  ┌──────────────────────────────────────────────────────────┐
  │ hi = array.length (exclusive!)                           │
  │ Loop: while (lo < hi)                                    │
  │ Đi trái: hi = mid                                       │
  │ Đi phải: lo = mid + 1                                   │
  └──────────────────────────────────────────────────────────┘

  Convention 2: [lo, hi] — cũng phổ biến!
  ┌──────────────────────────────────────────────────────────┐
  │ hi = array.length - 1 (inclusive!)                       │
  │ Loop: while (lo <= hi)                                   │
  │ Đi trái: hi = mid - 1                                   │
  │ Đi phải: lo = mid + 1                                   │
  └──────────────────────────────────────────────────────────┘

  → CHỌN MỘT convention và GIỮ NHẤT QUÁN!
  → Đừng trộn! Trộn = off-by-one = bug! 💀
```

---

## §7. Q: "Array Must Be Sorted?" — "Absolutely!"

> Student: _"This is all under the assumption the array is sorted?"_
> Prime: _"You can NEVER do this on a non-sorted array."_

### Sorted = điều kiện tiên quyết!

Prime: _"When you come to these two conditions — if I am larger than the current element, then the rest of the LEFT side is ALL lower. I know that for a FACT. It reduces your search space by half because you can make that single value statement."_

### Giải thích sâu: tại sao PHẢI sorted?

Logic chia đôi phụ thuộc vào một tiên đề: **nếu midpoint lớn hơn needle, thì TẤT CẢ phần tử bên phải cũng lớn hơn needle**. Điều này CHỈ đúng khi mảng sorted.

```
TẠI SAO PHẢI SORTED:
═══════════════════════════════════════════════════════════════

  SORTED: [1, 3, 5, 7, 9]   Tìm: 3
  mid = 5. 5 > 3 → tìm trái!
  → [1, 3] chắc chắn chứa 3 nếu có! ✅
  → [7, 9] chắc chắn KHÔNG chứa 3! ✅

  UNSORTED: [9, 3, 7, 1, 5]   Tìm: 3
  mid = 7. 7 > 3 → tìm trái?
  → Trái = [9, 3] — CÓ chứa 3! May mắn!
  → Nhưng nếu mid = 1. 1 < 3 → tìm phải?
  → Phải = [5] — KHÔNG chứa 3! → BỎ MẤT 3! 💀

  → Trên unsorted: chia đôi BỎ MẤT phần tử!
  → Trên sorted: chia đôi AN TOÀN vì thứ tự đảm bảo!
```

---

## §8. Tự Implement: Pseudocode → Code

```javascript
// ═══ Binary Search — Pseudocode → Code ═══

function binarySearch(haystack, needle) {
  let lo = 0; // inclusive!
  let hi = haystack.length; // exclusive!

  do {
    const mid = lo + Math.floor((hi - lo) / 2); // safe midpoint!
    const value = haystack[mid];

    if (value === needle) {
      return true; // TÌM THẤY!
    } else if (value > needle) {
      hi = mid; // tìm BÊN TRÁI (exclusive!)
    } else {
      lo = mid + 1; // tìm BÊN PHẢI (inclusive!)
    }
  } while (lo < hi);

  return false; // KHÔNG TÌM THẤY!
}

// Demo
const sorted = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

console.log("═══ BINARY SEARCH ═══\n");
console.log("Mảng:", sorted.join(", "));

[1, 9, 15, 19, 4, 20].forEach((target) => {
  const found = binarySearch(sorted, target);
  console.log(
    `Tìm ${target}: ${found ? "✅ Tìm thấy!" : "❌ Không tìm thấy!"}`,
  );
});

// Phiên bản verbose — hiển thị từng bước!
function binarySearchVerbose(haystack, needle) {
  let lo = 0,
    hi = haystack.length,
    steps = 0;
  console.log(`  Tìm ${needle} trong [${haystack.join(", ")}]`);
  do {
    steps++;
    const mid = lo + Math.floor((hi - lo) / 2);
    const value = haystack[mid];
    console.log(`  Bước ${steps}: lo=${lo} hi=${hi} mid=${mid} value=${value}`);
    if (value === needle) {
      console.log(`  → TÌM THẤY trong ${steps} bước!`);
      return true;
    } else if (value > needle) {
      console.log(`  → ${value} > ${needle} → tìm BÊN TRÁI! hi = ${mid}`);
      hi = mid;
    } else {
      console.log(`  → ${value} < ${needle} → tìm BÊN PHẢI! lo = ${mid + 1}`);
      lo = mid + 1;
    }
  } while (lo < hi);
  console.log(`  → KHÔNG TÌM THẤY trong ${steps} bước!`);
  return false;
}

console.log("\n═══ CHI TIẾT ═══\n");
console.log("Tìm 13:");
binarySearchVerbose(sorted, 13);
console.log("\nTìm 4 (không có trong mảng):");
binarySearchVerbose(sorted, 4);
```

---

## Checklist

```
[ ] lo/hi = ranh giới vùng tìm kiếm!
[ ] Trò đoán số = binary search!
[ ] Convention: lo INCLUSIVE, hi EXCLUSIVE → [lo, hi)!
[ ] Midpoint: lo + floor((hi - lo) / 2) — công thức AN TOÀN!
[ ] (lo + hi) / 2 có thể overflow — bug 20 năm trong Java!
[ ] 3 trường hợp: bằng (tìm thấy!), lớn hơn (đi trái!), nhỏ hơn (đi phải!)
[ ] lo = mid + 1 vì lo inclusive → cần +1 để bỏ mid!
[ ] hi = mid vì hi exclusive → mid tự động bị bỏ!
[ ] Loop: while lo < hi (KHÔNG PHẢI <=!)
[ ] lo <= hi có thể gây infinite loop với convention [lo, hi)!
[ ] Hai convention đều đúng — chọn MỘT và GIỮ NHẤT QUÁN!
[ ] Mảng PHẢI sorted — unsorted = bỏ sót phần tử!
[ ] "Off-by-one sẽ ĂN BỮA TRƯA CỦA BẠN!" — Prime ⚠️
TIẾP THEO → Phần 8: Implementing Binary Search!
```
