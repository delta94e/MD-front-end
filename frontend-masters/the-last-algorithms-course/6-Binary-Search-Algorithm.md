# The Last Algorithms Course You'll Need — Phần 6: Binary Search Algorithm — "Half the Input = O(log N), Deriving from Scratch!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Binary Search Algorithm — "Is it ordered? Jump 10% fails, halving works, N/2^k = 1, log N derivation, 4096 = 12 steps!"
> Độ khó: ⭐️⭐️⭐️ | Core — binary search derivation, logarithm proof, O(log N)!

---

## Mục Lục

| #   | Phần                                            |
| --- | ----------------------------------------------- |
| 1   | "Is It Ordered?" — "New Advantages!"            |
| 2   | Jump 10% — "Emotionally Defeating, Still O(N)!" |
| 3   | Jump to Middle! — "Halving!"                    |
| 4   | Derivation — "N/2^k = 1 → log N!"               |
| 5   | 4096 Example — "12 Steps!"                      |
| 6   | Big O Trick — "Halving Input = log N!"          |
| 7   | Tự Implement: Binary Search Concept             |
| 8   | 🔬 Deep Analysis — Linear vs Binary             |

---

## §1. "Is It Ordered?" — "New Advantages!"

> Prime: _"An IMPORTANT question you should always ask yourself when it comes to your data set — IS IT ORDERED? If it is, you have new advantages."_

### Dữ liệu sorted mở khoá thuật toán tốt hơn!

Với unsorted data → chỉ có thể linear search (O(N))!
Với sorted data → có thể **chia đôi** không gian tìm kiếm! 🚀

### Giải thích sâu: tại sao "Is it ordered?" là câu hỏi đầu tiên?

Đây là một trong những câu hỏi **quan trọng nhất** mà bạn nên hỏi trong mọi bài toán tìm kiếm — dù trong phỏng vấn hay trong công việc thực tế. Lý do rất đơn giản nhưng sâu sắc:

**Khi dữ liệu KHÔNG sorted**: bạn không biết **bất cứ điều gì** về vị trí của phần tử cần tìm. Bất kỳ phần tử nào cũng có thể ở bất kỳ vị trí nào. Vì vậy, cách duy nhất để chắc chắn là **kiểm tra từng cái** → O(N).

**Khi dữ liệu CÓ sorted**: bạn biết rất nhiều! Bạn biết rằng nếu phần tử ở giữa lớn hơn giá trị cần tìm, thì **tất cả phần tử bên phải** cũng lớn hơn → bạn có thể **bỏ cả nửa phải** mà không cần kiểm tra! Đây chính là sức mạnh của dữ liệu sorted.

```
UNSORTED vs SORTED — SỰ KHÁC BIỆT:
═══════════════════════════════════════════════════════════════

  UNSORTED: [9, 2, 7, 1, 5, 3, 8]   Tìm: 3
  → 3 có thể ở BẤT KỲ ĐÂU!
  → Phải kiểm tra TỪNG PHẦN TỬ!
  → Không thể bỏ qua bất kỳ phần tử nào!
  → O(N) — không có cách nào nhanh hơn!

  SORTED: [1, 2, 3, 5, 7, 8, 9]     Tìm: 3
  → Nhìn giữa: 5. 3 < 5 → 3 chắc chắn ở BÊN TRÁI!
  → Bỏ toàn bộ [5, 7, 8, 9] mà không cần kiểm tra!
  → Giảm 50% công việc trong 1 bước!
  → O(log N) — nhanh hơn NHIỀU!

  Bài học: "SẮP XẾP = KIẾN THỨC"
  → Dữ liệu sorted cho bạn THÔNG TIN
    để bỏ qua phần không cần thiết!
```

Trong phỏng vấn, khi nhận được bài toán tìm kiếm, **câu hỏi đầu tiên** bạn nên hỏi interviewer là: "Dữ liệu có sorted không?" Nếu có → binary search. Nếu không → linear search hoặc cân nhắc sort trước (nếu cần tìm nhiều lần).

---

## §2. Jump 10% — "Emotionally Defeating, Still O(N)!"

> Prime: _"Jump 10% of N — hey Xi, are you equal to V? If not, jump 10% more. If larger, walk back and linear search."_

### Ý tưởng đầu tiên: nhảy 10%!

Prime không nhảy thẳng vào binary search — ông ấy **xây dựng trực giác** bằng cách thử một ý tưởng "gần đúng" trước: thay vì duyệt từng phần tử, nhảy 10% mỗi lần.

Cách hoạt động:

1. Nhảy đến vị trí 10% → kiểm tra
2. Nếu chưa tìm thấy → nhảy đến 20% → kiểm tra
3. ...tiếp tục đến khi tìm thấy phần tử **lớn hơn** needle
4. Quay lại đoạn 10% trước đó → linear search trong đoạn nhỏ

Worst case: 10 lần nhảy + linear scan 10% cuối = `10 + 0.1N` = **vẫn O(N)!**

Prime: _"Isn't that just EMOTIONALLY DEFEATING? It's still way more efficient practically, but theoretically — from 10,000 to a million, your algorithm is gonna be 100x slower. We didn't IMPROVE the algorithm."_

### Tại sao cách này thất bại?

```
NHẢY 10% — VẪN O(N):
═══════════════════════════════════════════════════════════════

  Mảng 1000 phần tử, tìm giá trị gần cuối:

  Nhảy 1: vị trí 100 → chưa tìm thấy
  Nhảy 2: vị trí 200 → chưa
  Nhảy 3: vị trí 300 → chưa
  ...
  Nhảy 9: vị trí 900 → quá lớn!
  → Quay lại scan từ 800 đến 900 = 100 comparisons!

  Tổng: 9 nhảy + 100 scan = 109 comparisons
  → Nhanh hơn linear (1000) thật!
  → Nhưng Big O: 10 + 0.1N → drop constants → O(N)! 😤

  N = 10,000:    10 + 1,000 = 1,010
  N = 100,000:   10 + 10,000 = 10,010
  N = 1,000,000: 10 + 100,000 = 100,010

  → Vẫn tăng TUYẾN TÍNH theo N!
  → "Chúng ta KHÔNG CẢI THIỆN thuật toán
     về mặt lý thuyết." — Prime

  Vấn đề cốt lõi:
  → Phần "scan 10%" vẫn phụ thuộc N!
  → 0.1N vẫn là N sau khi drop constants!
  → Cần cách khác để THẬT SỰ giảm complexity!
```

Bài học quan trọng: thực tế (practically) và lý thuyết (theoretically) khác nhau. Nhảy 10% **nhanh hơn** linear search gấp 10 lần — nhưng Big O vẫn là O(N). Trong phỏng vấn, nếu bạn nói "tôi cải thiện bằng cách nhảy 10%", interviewer sẽ hỏi: "Big O là bao nhiêu?" → "O(N)." → "Vậy có cải thiện từ lý thuyết không?" → "Không." 😅

---

## §3. Jump to Middle! — "Halving!"

> Prime: _"What happens if we just jump to the MIDDLE? If our value is larger, we only look on one half. Then half AGAIN."_

### Chia đôi = insight cốt lõi!

- Mảng N → nhảy vào giữa → kiểm tra!
- Chưa tìm thấy, giá trị lớn hơn → **chỉ tìm nửa phải!** (N/2)
- Nhảy vào giữa nửa phải → kiểm tra!
- Chưa tìm thấy → **chỉ tìm một phần tư!** (N/4)
- Tiếp tục...

_"We keep halving until either there's no half left or we find our value."_

### Giải thích sâu: tại sao chia đôi hiệu quả hơn chia 10%?

Sự khác biệt cốt lõi nằm ở chỗ: khi bạn nhảy 10%, phần "linear scan" vẫn **tỷ lệ thuận với N** (0.1N). Nhưng khi bạn **chia đôi**, bạn **không cần linear scan** — bạn chỉ cần **một comparison** tại midpoint, rồi bỏ nguyên **nửa mảng**.

Đây là sự khác biệt giữa **loại bỏ hằng số** (10% vẫn là O(N)) và **loại bỏ luỹ thừa** (chia đôi là O(log N)).

```
CHIA ĐÔI — MAGIC:
═══════════════════════════════════════════════════════════════

  [1, 3, 5, 7, 9, 11, 13, 15]  Tìm: 11
   ↑                        ↑
   lo                       hi

  Bước 1: mid = 7, 11 > 7 → tìm NỬA PHẢI!
                      [9, 11, 13, 15]
                       ↑           ↑
                       lo          hi

  Bước 2: mid = 11, 11 == 11 → TÌM THẤY! ✅

  Chỉ 2 bước thay vì 6 (linear)!

  SO SÁNH:
  ┌──────────────────────────────────────────────────────────┐
  │ Linear: 3 → 5 → 7 → 9 → 11 → tìm thấy! (5 bước)     │
  │ Nhảy 10%: không hiệu quả với mảng 8 phần tử            │
  │ Chia đôi: 7 → 11 → tìm thấy! (2 bước!) 🚀            │
  └──────────────────────────────────────────────────────────┘

  Tại sao chia đôi mạnh hơn:
  → Mỗi bước loại bỏ ĐÚNG 50% dữ liệu!
  → Không cần "quay lại scan" như nhảy 10%!
  → Chỉ cần 1 comparison mỗi bước!
```

---

## §4. Derivation — "N/2^k = 1 → log N!"

> Prime: _"This is the most MATHY part of the whole course."_

### Chứng minh O(log N)!

Mỗi bước, chia đôi:

- N → N/2 → N/4 → N/8 → N/16 → ... → 1

Tổng quát: **N / 2^k = 1** (k = số lần chia)

### Giải thích chi tiết phép chứng minh

Prime nói đây là phần "toán nhất" của cả khoá, nhưng thật ra rất đơn giản nếu bạn đi từng bước:

**Câu hỏi:** "Cần bao nhiêu lần chia đôi để từ N phần tử còn 1 phần tử?"

```
CHỨNG MINH TỪNG BƯỚC:
═══════════════════════════════════════════════════════════════

  Bắt đầu: N phần tử

  Sau 1 lần chia: N/2 phần tử
  Sau 2 lần chia: N/4  = N/2² phần tử
  Sau 3 lần chia: N/8  = N/2³ phần tử
  Sau k lần chia: N/2ᵏ phần tử

  Dừng khi chỉ còn 1 phần tử:
  N / 2ᵏ = 1

  Giải phương trình:
  ┌──────────────────────────────────────────────────────────┐
  │ Bước 1: N / 2ᵏ = 1                                      │
  │                                                          │
  │ Bước 2: Nhân cả hai vế với 2ᵏ:                          │
  │         N = 2ᵏ                                           │
  │                                                          │
  │ Bước 3: Lấy log cơ số 2 cả hai vế:                     │
  │         log₂(N) = k                                      │
  │                                                          │
  │ Kết luận: k = log₂(N)                                    │
  │ → Cần log₂(N) lần chia đôi!                             │
  │ → Thời gian chạy = O(log N)! 🎯                        │
  └──────────────────────────────────────────────────────────┘

  "Log cơ số 2 của N = k.
   Thời gian chạy của chúng ta là log N." — Prime
```

### Logarithm là gì? (cho người chưa biết)

Nếu bạn chưa quen với logarithm, hãy hiểu nó là **phép ngược của luỹ thừa**:

```
LOGARITHM — PHÉP NGƯỢC CỦA LUỸ THỪA:
═══════════════════════════════════════════════════════════════

  Luỹ thừa: 2³ = 8     → "2 nhân 3 lần = 8"
  Logarithm: log₂(8) = 3  → "chia 8 cho 2 bao nhiêu lần = 3"

  Luỹ thừa: 2¹⁰ = 1024
  Logarithm: log₂(1024) = 10 → "chia 1024 cho 2 = 10 lần!"

  Luỹ thừa: 2²⁰ = 1,048,576 (hơn 1 triệu!)
  Logarithm: log₂(1,048,576) = 20 → chỉ 20 bước cho 1 triệu!

  Trong binary search:
  → log₂(N) = "cần chia đôi bao nhiêu lần
    để từ N phần tử còn 1?"
  → Đây là số bước tối đa của binary search!
```

---

## §5. 4096 Example — "12 Steps!"

> Prime: _"If our array was 4096 and we half it..."_

### 4096 → 12 lần chia!

```
4096 → 2048 → 1024 → 512 → 256 → 128 → 64 → 32 → 16 → 8 → 4 → 2 → 1

Số bước: 12!
log₂(4096) = 12! ✅
```

### So sánh trực quan

```
4096 PHẦN TỬ — LINEAR vs BINARY:
═══════════════════════════════════════════════════════════════

  Linear Search: tối đa 4,096 bước! 😱
  ████████████████████████████████████████████████████████████

  Binary Search: tối đa 12 bước! 🚀
  ████████████

  → Nhanh hơn 341 lần!

  Mô phỏng chia đôi:
  Bước 1:  4096 phần tử → kiểm tra giữa → bỏ 2048!
  Bước 2:  2048 phần tử → kiểm tra giữa → bỏ 1024!
  Bước 3:  1024 phần tử → kiểm tra giữa → bỏ 512!
  Bước 4:   512 phần tử → kiểm tra giữa → bỏ 256!
  Bước 5:   256 phần tử → kiểm tra giữa → bỏ 128!
  Bước 6:   128 phần tử → kiểm tra giữa → bỏ 64!
  Bước 7:    64 phần tử → kiểm tra giữa → bỏ 32!
  Bước 8:    32 phần tử → kiểm tra giữa → bỏ 16!
  Bước 9:    16 phần tử → kiểm tra giữa → bỏ 8!
  Bước 10:    8 phần tử → kiểm tra giữa → bỏ 4!
  Bước 11:    4 phần tử → kiểm tra giữa → bỏ 2!
  Bước 12:    2 phần tử → kiểm tra giữa → bỏ 1! → xong!

  → Mỗi bước bỏ ĐÚNG 50% → chỉ cần 12 bước cho 4096!
```

---

## §6. Big O Trick — "Halving Input = log N!"

> Prime: _"When you HALVE the input at each step, it's either log N or N log N — depending if you're scanning that input or not."_

### Quy tắc nhanh!

- **Chia đôi + chỉ xem 1 giá trị** → O(log N)! (binary search)
- **Chia đôi + duyệt phần còn lại** → O(N log N)! (quicksort, merge sort)

### Giải thích sâu: tại sao có hai loại?

Đây là một mẹo cực kỳ hữu ích trong phỏng vấn. Khi bạn thấy pattern "chia đôi", bạn ngay lập tức biết Big O là **log N** hoặc **N log N** — tuỳ thuộc vào bạn **làm gì** với mỗi nửa:

```
HALVING TRICK — HAI DẠNG:
═══════════════════════════════════════════════════════════════

  DẠNG 1: Chia đôi + NHÌN 1 GIÁ TRỊ → O(log N)!
  ┌──────────────────────────────────────────────────────────┐
  │ Binary Search:                                           │
  │ → Chia mảng làm đôi                                     │
  │ → Chỉ nhìn phần tử GIỮA (1 comparison!)                │
  │ → Bỏ nửa không cần                                      │
  │ → Mỗi bước: O(1) công việc × log N bước = O(log N)!    │
  └──────────────────────────────────────────────────────────┘

  DẠNG 2: Chia đôi + DUYỆT PHẦN CÒN LẠI → O(N log N)!
  ┌──────────────────────────────────────────────────────────┐
  │ Merge Sort / Quicksort:                                  │
  │ → Chia mảng làm đôi                                     │
  │ → DUYỆT TOÀN BỘ N phần tử ở mỗi tầng (merge/partition)│
  │ → Có log N tầng                                         │
  │ → Mỗi tầng: O(N) công việc × log N tầng = O(N log N)! │
  └──────────────────────────────────────────────────────────┘

  Cách nhớ:
  → Thấy "chia đôi" → nghĩ log N!
  → Chia đôi + nhìn 1 cái → O(log N)!
  → Chia đôi + duyệt tất cả → O(N log N)!

  "Khi bạn CHIA ĐÔI input mỗi bước,
   nó hoặc là log N hoặc N log N — tuỳ thuộc
   bạn có đang scan input hay không." — Prime
```

---

## §7. Tự Implement: Binary Search Concept

```javascript
// ═══ Minh Hoạ Chia Đôi ═══

function minhHoaChiaDoi(n) {
  let steps = 0;
  let current = n;
  const history = [current];

  while (current > 1) {
    current = Math.floor(current / 2);
    steps++;
    history.push(current);
  }

  console.log(`N = ${n}`);
  console.log(`Chia đôi: ${history.join(" → ")}`);
  console.log(`Số bước: ${steps}`);
  console.log(`log₂(${n}) = ${Math.log2(n)}`);
  console.log(`Khớp: ${steps === Math.log2(n) ? "✅" : "≈"}\n`);
}

console.log("═══ MINH HOẠ CHIA ĐÔI ═══\n");
minhHoaChiaDoi(8); // 3 bước
minhHoaChiaDoi(16); // 4 bước
minhHoaChiaDoi(256); // 8 bước
minhHoaChiaDoi(4096); // 12 bước!
minhHoaChiaDoi(1048576); // 20 bước cho 1 triệu!

console.log("═══ LINEAR vs BINARY ═══\n");
const sizes = [100, 1000, 10000, 100000, 1000000];
sizes.forEach((n) => {
  const linearSteps = n;
  const binarySteps = Math.ceil(Math.log2(n));
  const speedup = Math.round(n / binarySteps);
  console.log(
    `N = ${n.toLocaleString().padStart(10)}: ` +
      `Linear = ${linearSteps.toLocaleString().padStart(10)} bước, ` +
      `Binary = ${binarySteps.toString().padStart(3)} bước → ` +
      `nhanh hơn ${speedup.toLocaleString()}×! 🚀`,
  );
});
```

---

## §8. 🔬 Deep Analysis — Linear vs Binary

```
LINEAR vs BINARY:
═══════════════════════════════════════════════════════════════

  N            │ Linear O(N)     │ Binary O(log N) │ Nhanh hơn
  ─────────────┼─────────────────┼─────────────────┼──────────
  10           │ 10              │ ~3              │ 3×
  100          │ 100             │ ~7              │ 14×
  1,000        │ 1,000           │ ~10             │ 100×
  10,000       │ 10,000          │ ~13             │ 769×
  1,000,000    │ 1,000,000       │ ~20             │ 50,000×!
  1 Tỷ         │ 1,000,000,000   │ ~30             │ 33,000,000×!!

  ĐIỀU KIỆN: Mảng PHẢI được sorted!

  KHI NÀO DÙNG CÁI NÀO:
  ┌──────────────────────────────────────────────────────────┐
  │ Linear Search:                                           │
  │ → Dữ liệu UNSORTED (bắt buộc!)                         │
  │ → Mảng rất nhỏ (N < 10 → overhead binary không đáng!)  │
  │ → Chỉ tìm 1 lần (không đáng sort trước!)               │
  │                                                          │
  │ Binary Search:                                           │
  │ → Dữ liệu ĐÃ SORTED!                                   │
  │ → Mảng lớn (N > 100 → tiết kiệm đáng kể!)             │
  │ → Tìm NHIỀU LẦN (sort 1 lần, search nhiều lần!)        │
  └──────────────────────────────────────────────────────────┘

  MẸO: Halving input = log N hoặc N log N!

  "Binary — hoặc bên này hoặc bên kia.
   Bạn luôn chia đôi." — Prime 🎯
```

---

## Checklist

```
[ ] "Dữ liệu có sorted không?" — câu hỏi ĐẦU TIÊN!
[ ] Nhảy 10% = vẫn O(N)! "Thất bại về mặt cảm xúc!"
[ ] Chia đôi mỗi bước = insight cốt lõi!
[ ] Chứng minh: N/2ᵏ = 1 → N = 2ᵏ → log₂(N) = k → O(log N)!
[ ] Logarithm = phép ngược của luỹ thừa!
[ ] 4096 phần tử = chỉ 12 bước! (vs 4096 bước linear!)
[ ] Mẹo: chia đôi + nhìn 1 = log N, chia đôi + scan = N log N!
[ ] Điều kiện: mảng PHẢI sorted!
[ ] 1 triệu phần tử = 20 bước binary vs 1 triệu bước linear!
TIẾP THEO → Phần 7: Pseudo-code Binary Search!
```
