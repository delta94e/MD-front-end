# The Last Algorithms Course You'll Need — Phần 5: Linear Search & Kata Setup — "Simplest Algorithm, indexOf Underneath, O(N)!"

> 📅 2026-03-08 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Linear Search & Kata Setup — "Whiteboard first → code, indexOf = linear search, O(N) worst case, kata machine setup!"
> Độ khó: ⭐️⭐️ | Beginner — first algorithm, linear search implementation, kata project!

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | Phương Pháp — "Whiteboard First, Code Second!" |
| 2   | Linear Search — "The Simplest Search!"         |
| 3   | Big O Analysis — "Worst Case = O(N)!"          |
| 4   | Implementation — "indexOf Under the Hood!"     |
| 5   | Kata Machine Setup — "Practice Every Day!"     |
| 6   | Tự Implement: Linear Search                    |
| 7   | 🔬 Deep Analysis — Search Foundations          |

---

## §1. Phương Pháp — "Whiteboard First, Code Second!"

> Prime: _"We're gonna be VISUALIZING all the problems first — circles and arrows, boxes and arrows — and THEN we program it."_

### Core competency: trừu tượng → cụ thể!

Prime: _"If you can get really good at visualizing, creating your problems on a whiteboard, then translating abstraction into concreteness — it's going to follow you for the REST OF YOUR LIFE."_

_"At this point, I can just think about it in my head in these terms and write out a program without the intermediate step."_

→ **Luôn vẽ trước, code sau!** Đây là skill quan trọng nhất!

### Tại sao "vẽ trước, code sau" lại quan trọng?

Đây không phải là lời khuyên cho người mới — đây là **phương pháp làm việc chuyên nghiệp** mà mọi senior engineer đều dùng. Prime nói rất rõ: kỹ năng này sẽ **theo bạn suốt đời**.

Lý do cốt lõi: **não người xử lý hình ảnh nhanh hơn chữ 60,000 lần** (theo nghiên cứu thần kinh học). Khi bạn vẽ sơ đồ, bạn đang kích hoạt phần não chuyên xử lý không gian (spatial reasoning), giúp bạn nhìn thấy patterns mà code thuần không cho thấy.

Hãy thử nghĩ: nếu ai đó nói "duyệt mảng từ đầu đến cuối, so sánh từng phần tử" — bạn hiểu, nhưng hơi trừu tượng. Nhưng nếu họ **vẽ**:

```
WHITEBOARD FIRST — TẠI SAO:
═══════════════════════════════════════════════════════════════

  Khi chỉ đọc mô tả bằng chữ:
  "Duyệt mảng từ trái sang phải, so sánh từng phần tử
   với giá trị cần tìm, nếu bằng thì trả về true..."
  → Trừu tượng! Khó hình dung edge cases!

  Khi VẼ:
  [3] → [7] → [2] → [9] → [5]
   ↑
   "Bạn có phải là 5 không?"
   "Không!" → di chuyển →

  [3] → [7] → [2] → [9] → [5]
         ↑
         "Bạn có phải là 5 không?"
         "Không!" → di chuyển →

  ...

  [3] → [7] → [2] → [9] → [5]
                              ↑
                              "Bạn có phải là 5 không?"
                              "ĐÚNG RỒI!" ✅

  → Khi vẽ, bạn NHÌN THẤY thuật toán hoạt động!
  → Bạn thấy ngay: "nếu 5 không tồn tại thì sao?"
  → Bạn thấy ngay: "loop đi hết mảng → O(N)!"
```

Prime cũng nói một điều rất hay: sau nhiều năm kinh nghiệm, ông ấy có thể **bỏ qua bước vẽ** và "vẽ trong đầu." Nhưng đó là sau **hàng nghìn giờ luyện tập**. Khi bạn mới bắt đầu, **luôn vẽ ra giấy hoặc whiteboard**. Đây không phải là "chậm" — đây là "đầu tư để nhanh hơn."

### Quy trình 4 bước

Từ phần mở đầu này, Prime thiết lập **quy trình chuẩn** cho toàn bộ khoá học:

```
QUY TRÌNH CỦA PRIME:
═══════════════════════════════════════════════════════════════

  Bước 1: HIỂU BÀI TOÁN
  → Bài toán yêu cầu gì? Input là gì? Output là gì?
  → Edge cases nào có thể xảy ra?

  Bước 2: VẼ TRÊN WHITEBOARD
  → Vẽ ví dụ cụ thể!
  → Mô phỏng từng bước bằng tay!
  → Phát hiện pattern!

  Bước 3: VIẾT PSEUDOCODE
  → Chuyển hình vẽ thành các bước logic!
  → Chưa cần cú pháp ngôn ngữ cụ thể!

  Bước 4: CODE
  → Dịch pseudocode sang ngôn ngữ thật!
  → Test! Debug! Refine!

  "Nếu bạn giỏi việc trừu tượng hoá rồi
   chuyển thành cụ thể — nó sẽ theo bạn
   SUỐT CUỘC ĐỜI." — Prime 🎯
```

---

## §2. Linear Search — "The Simplest Search!"

> Prime: _"We're gonna start with the SIMPLEST form of search — linear search. First thing we do is whiteboard this."_

### Concept!

Array từ 0 đến N, tìm giá trị V:

- Bắt đầu từ index 0: _"X0, are you V?"_
- Nếu không → index 1: _"X1, are you V?"_
- Tiếp tục cho đến khi tìm thấy hoặc hết array!

Prime: _"Who in here hasn't used indexOf? Wanna guess what indexOf is probably doing underneath the hood? It's just walking LINEARLY until it finds the thing."_

→ **Linear search = indexOf!**

### Giải thích sâu: tại sao bắt đầu bằng linear search?

Linear search là thuật toán **đơn giản nhất có thể**. Nó không yêu cầu dữ liệu phải sorted, không cần data structure đặc biệt, không cần tiền xử lý — chỉ cần **duyệt từng phần tử** và so sánh.

Tại sao Prime chọn bắt đầu từ đây? Vì nó giúp bạn hiểu **3 điều cơ bản** mà mọi thuật toán tìm kiếm đều cần:

1. **Input**: mảng + giá trị cần tìm (needle — "cây kim")
2. **Process**: cách duyệt qua dữ liệu
3. **Output**: tìm thấy hay không (boolean) hoặc vị trí (index)

Thuật ngữ **haystack** (đống cỏ khô) và **needle** (cây kim) đến từ thành ngữ tiếng Anh "looking for a needle in a haystack" — tìm kim trong đống cỏ. Đây là cách đặt tên rất phổ biến trong lập trình: `haystack` = nơi tìm kiếm, `needle` = thứ cần tìm.

```
LINEAR SEARCH — "TÌM KIM TRONG ĐỐNG CỎ":
═══════════════════════════════════════════════════════════════

  Haystack (đống cỏ): [3, 7, 2, 9, 5, 1, 8]
  Needle (cây kim): 5

  Bước 1: [3] == 5? Không! →
  Bước 2: [7] == 5? Không! →
  Bước 3: [2] == 5? Không! →
  Bước 4: [9] == 5? Không! →
  Bước 5: [5] == 5? ĐÚNG RỒI! ✅ Tìm thấy ở index 4!

  "Chúng ta đang implementing indexOf." — Prime

  Nhận xét:
  → Không cần mảng sorted!
  → Hoạt động với BẤT KỲ mảng nào!
  → Đơn giản nhất có thể!
  → Nhưng... chậm nhất cũng có thể! 🐌
```

### Linear search trong đời thực

Bạn dùng linear search **hàng ngày** mà không biết:

- **indexOf()** trong JavaScript: `"hello".indexOf("l")` → duyệt từng ký tự!
- **Array.includes()**: `[1,2,3].includes(2)` → duyệt từng phần tử!
- **Array.find()**: `arr.find(x => x > 5)` → duyệt từng phần tử!
- **Array.filter()**: `arr.filter(x => x > 5)` → duyệt TOÀN BỘ mảng!
- **Tìm file trên máy tính**: nếu không có index, OS phải duyệt từng file!

Tất cả đều là linear search bên dưới — O(N) worst case.

---

## §3. Big O Analysis — "Worst Case = O(N)!"

> Prime: _"What is the possible WORST CASE? If the value is not in the array, we go from 0 all the way to N and never find it."_

### Phân tích worst case!

Prime áp dụng 3 quy tắc Big O:

1. **Tăng trưởng theo input**: Input gấp đôi → tìm kiếm gấp đôi!
2. **Drop constants**: Luôn luôn!
3. **Worst case**: Giá trị không có trong mảng = phải duyệt hết!

Student: _"O(N)."_ → Prime: _"O(N), awesome!"_

_"As your input grows, so does the time it takes EQUIVALENTLY or linearly. If it grows by 10, you get 10 more cycles."_

### Phân tích chi tiết 3 trường hợp

```
3 TRƯỜNG HỢP CỦA LINEAR SEARCH:
═══════════════════════════════════════════════════════════════

  BEST CASE — O(1):
  Mảng: [5, 3, 7, 2, 9]    Tìm: 5
  → Phần tử ĐẦU TIÊN! → Tìm thấy ngay! → 1 comparison!

  AVERAGE CASE — O(N/2) = O(N):
  Mảng: [3, 7, 5, 2, 9]    Tìm: 5
  → Phần tử ở GIỮA! → ~N/2 comparisons!
  → Drop constant → O(N)!

  WORST CASE — O(N):
  Mảng: [3, 7, 2, 9, 1]    Tìm: 42
  → KHÔNG CÓ trong mảng! → Duyệt HẾT N phần tử!
  → Hoặc phần tử ở cuối cùng!

  Kích thước mảng → Comparisons tối đa:
  N = 5       → 5 comparisons
  N = 50      → 50 comparisons
  N = 500     → 500 comparisons
  N = 5,000   → 5,000 comparisons
  N = 5M      → 5,000,000 comparisons 💀

  → Tăng TUYẾN TÍNH theo input!
  → Phỏng vấn: luôn nói WORST CASE → O(N)!
```

Một điều hay mà Prime ám chỉ nhưng chưa nói rõ: O(N) là **giới hạn chặn dưới (lower bound)** cho bất kỳ thuật toán tìm kiếm nào trên dữ liệu **không sorted**. Bạn **không thể** tìm nhanh hơn O(N) trên unsorted data — vì không có cách nào biết phần tử ở đâu mà không kiểm tra từng cái. Đó là lý do tại sao **sorting** mở ra cánh cửa mới — topic của bài tiếp theo (Binary Search).

---

## §4. Implementation — "indexOf Under the Hood!"

> Prime: _"This is as simple as it gets."_

### Code walkthrough!

```typescript
function linear_search(haystack: number[], needle: number): boolean {
  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i] === needle) {
      return true;
    }
  }
  return false;
}
```

Prime: _"If we see it, we return true. If we don't, we return false. The SIMPLEST form of search."_

_"I normally do NOT return in the middle of a for loop. But for algorithms, I'm totally willing to make concessions on good programming techniques."_

### Phân tích từng dòng code

Hãy đi qua từng dòng và hiểu **tại sao** mỗi dòng tồn tại:

```javascript
function linear_search(haystack: number[], needle: number): boolean {
  // haystack = mảng cần tìm kiếm (đống cỏ!)
  // needle = giá trị cần tìm (cây kim!)
  // return boolean = tìm thấy hay không!

  for (let i = 0; i < haystack.length; i++) {
    // Bắt đầu từ index 0, đi đến cuối mảng!
    // Mỗi bước tăng i lên 1 → linear (tuyến tính)!

    if (haystack[i] === needle) {
      // So sánh phần tử hiện tại với needle!
      // === dùng strict equality (không type coercion!)
      return true;
      // Tìm thấy → DỪNG NGAY! Không cần duyệt nữa!
      // Đây là early return → best case O(1)!
    }
  }
  return false;
  // Nếu loop kết thúc mà không return true
  // → needle KHÔNG CÓ trong mảng!
  // Đây là worst case → O(N)!
}
```

### Lưu ý về early return trong for loop

Prime thừa nhận: _"I normally do NOT return in the middle of a for loop."_ Đây là một quan điểm về clean code — nhiều developer thích có **một điểm return duy nhất** (single return) ở cuối hàm. Nhưng trong algorithms, **early return** là pattern chuẩn vì:

1. Nó giúp **tối ưu best case** — nếu tìm thấy sớm, dừng ngay
2. Code ngắn hơn và dễ đọc hơn cho algorithm nhỏ
3. Trong phỏng vấn, interviewer mong đợi early return

```
EARLY RETURN vs SINGLE RETURN:
═══════════════════════════════════════════════════════════════

  Early return (algorithms style): ✅
  function search(arr, needle) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === needle) return true;  // thoát ngay!
    }
    return false;
  }

  Single return (clean code style):
  function search(arr, needle) {
    let found = false;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === needle) {
        found = true;
        break;
      }
    }
    return found;  // một điểm return duy nhất!
  }

  → Trong algorithms: dùng early return!
  → Trong production code: tuỳ team convention!
  → "Trong algorithms, tôi sẵn sàng nhượng bộ
     về kỹ thuật lập trình tốt." — Prime
```

```
FLOW MÔ PHỎNG:
═══════════════════════════════════════════════════════════════

  linear_search([3, 7, 2, 9, 5], 9):

  i=0: haystack[0]=3, 3===9? Không!
  i=1: haystack[1]=7, 7===9? Không!
  i=2: haystack[2]=2, 2===9? Không!
  i=3: haystack[3]=9, 9===9? ĐÚNG! → return true! ✅
  → 4 comparisons, tìm thấy ở index 3!

  linear_search([3, 7, 2, 9, 5], 42):

  i=0: 3===42? Không!
  i=1: 7===42? Không!
  i=2: 2===42? Không!
  i=3: 9===42? Không!
  i=4: 5===42? Không!
  → return false! ❌ (O(N) worst case!)
  → 5 comparisons = toàn bộ mảng!
```

---

## §5. Kata Machine Setup — "Practice Every Day!"

> Prime: _"I created this little library to be able to do a bunch of algorithms. If you want to do them every day, it creates a way for you to do them as much as you want."_

### Kata = luyện tập hàng ngày!

**Kata** là thuật ngữ từ võ thuật Nhật Bản — nghĩa là "bài quyền" — một bài tập được lặp đi lặp lại cho đến khi trở thành bản năng. Trong lập trình, kata có nghĩa là **viết cùng một thuật toán nhiều lần** cho đến khi bạn có thể viết mà không cần suy nghĩ.

Prime's kata machine:

- Clone repo → `npm install` → `npm run generate`
- Mỗi ngày tạo **files trống mới** cho tất cả algorithms!
- Test với: `npx jest Linear` → xanh = pass! ✅

Prime jokes: _"You could also just return true the first time and false the second time. And if you can keep state between the two tests, you will also win. Don't do that — actually program."_ 😂

Config trong `ligma.config` (đúng, "ligma" 😂): chỉ định algorithm nào muốn tạo!

### Tại sao luyện tập lặp lại quan trọng?

Quay lại phần Introduction, Prime đã cảnh báo: **atrophy** — kiến thức sẽ mất trong 6 tháng nếu không luyện. Kata machine là giải pháp thực tế cho vấn đề đó.

```
KATA — LUYỆN TẬP NHƯ VÕ SĨ:
═══════════════════════════════════════════════════════════════

  Ngày 1: Viết binary search → 15 phút, nhìn note!
  Ngày 2: Viết binary search → 10 phút, ít note hơn!
  Ngày 5: Viết binary search → 5 phút, không cần note!
  Ngày 10: Viết binary search → 3 phút, nhắm mắt! 😎
  Ngày 30: Binary search = BẢN NĂNG! Không cần nghĩ!

  Quy trình:
  ┌──────────────────────────────────────────────────────────┐
  │ 1. npm run generate → tạo files trống cho ngày mới!     │
  │ 2. Tự viết code cho mỗi algorithm từ trí nhớ!          │
  │ 3. npx jest [tên-algorithm] → kiểm tra!                │
  │ 4. Nếu sai → sửa → hiểu lý do → chạy lại!            │
  │ 5. Lặp lại ngày mai!                                    │
  └──────────────────────────────────────────────────────────┘

  "Tôi đã tạo thư viện nhỏ này để bạn có thể
   luyện bao nhiêu tuỳ thích." — Prime
```

---

## §6. Tự Implement: Linear Search

```javascript
// ═══ Linear Search ═══

// Phiên bản cơ bản — trả về boolean!
function linearSearch(haystack, needle) {
  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i] === needle) {
      return true;
    }
  }
  return false;
}

// Phiên bản trả về index (giống indexOf!)
function linearSearchIndex(haystack, needle) {
  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i] === needle) {
      return i; // trả về VỊ TRÍ!
    }
  }
  return -1; // sentinel: không tìm thấy!
}

// Demo
const arr = [3, 7, 2, 9, 5, 1, 8, 4, 6];

console.log("═══ LINEAR SEARCH ═══\n");

// Tìm thấy!
console.log("Tìm 9:", linearSearch(arr, 9)); // true
console.log("Tìm 1:", linearSearch(arr, 1)); // true
console.log("Tìm 6:", linearSearch(arr, 6)); // true

// Không tìm thấy!
console.log("Tìm 42:", linearSearch(arr, 42)); // false
console.log("Tìm 0:", linearSearch(arr, 0)); // false

// Đếm comparisons — thấy rõ O(N)!
function linearSearchVerbose(haystack, needle) {
  let comparisons = 0;
  for (let i = 0; i < haystack.length; i++) {
    comparisons++;
    if (haystack[i] === needle) {
      console.log(`  Tìm thấy ở index ${i}! (${comparisons} lần so sánh)`);
      return true;
    }
  }
  console.log(`  Không tìm thấy! (${comparisons} lần so sánh = O(N))`);
  return false;
}

console.log("\n═══ CHI TIẾT ═══\n");
linearSearchVerbose(arr, 5); // tìm thấy sớm
linearSearchVerbose(arr, 6); // tìm thấy muộn
linearSearchVerbose(arr, 99); // không tìm thấy = worst case!

console.log("\n✅ Linear search = indexOf bên dưới!");
console.log("✅ O(N) worst case!");
console.log("✅ Thuật toán đơn giản nhất có thể!");
```

---

## §7. 🔬 Deep Analysis — Search Foundations

```
NỀN TẢNG TÌM KIẾM:
═══════════════════════════════════════════════════════════════

  LINEAR SEARCH:
  ┌──────────────────────────────────────────────────────────┐
  │ Input: BẤT KỲ mảng nào (sorted hay unsorted!)          │
  │ Phương pháp: kiểm tra TỪNG phần tử một!                │
  │ Time: O(N) worst case!                                   │
  │ Best case: O(1) — phần tử đầu tiên!                    │
  │ Khi nào dùng: dữ liệu unsorted, mảng nhỏ!             │
  │ Trong JS: indexOf, includes, find, filter!              │
  └──────────────────────────────────────────────────────────┘

  SẮP TỚI — BINARY SEARCH:
  ┌──────────────────────────────────────────────────────────┐
  │ Input: mảng ĐÃ SORTED!                                  │
  │ Phương pháp: chia đôi không gian tìm kiếm mỗi bước!   │
  │ Time: O(log N)!                                          │
  │ Nhanh hơn NHIỀU cho mảng lớn đã sorted!                │
  └──────────────────────────────────────────────────────────┘

  KHI NÀO DÙNG LINEAR vs BINARY:
  ┌──────────────────────────────────────────────────────────┐
  │ Dữ liệu UNSORTED → Linear Search (O(N))  → bắt buộc!  │
  │ Dữ liệu SORTED + mảng nhỏ → Linear (đơn giản hơn!)    │
  │ Dữ liệu SORTED + mảng lớn → Binary Search → nhanh hơn!│
  │                                                          │
  │ Câu hỏi đầu tiên: "DỮ LIỆU CÓ SORTED KHÔNG?"         │
  │ → Đây là câu hỏi thay đổi TẤT CẢ! — Prime             │
  └──────────────────────────────────────────────────────────┘

  PHƯƠNG PHÁP:
  1. Vẽ trên whiteboard trước! (trực quan hoá!)
  2. Xác định worst case! (điều gì khiến nó chậm nhất?)
  3. Áp dụng 3 quy tắc Big O! (growth, drop, worst!)
  4. Code! (chuyển trừu tượng → cụ thể!)

  "Trực quan hoá rồi chuyển trừu tượng thành
   cụ thể — theo bạn SUỐT ĐỜI." — Prime 🎯
```

---

## Checklist

```
[ ] Phương pháp: whiteboard → pseudocode → code!
[ ] Linear search: kiểm tra từng phần tử từ đầu đến cuối!
[ ] indexOf, includes, find = linear search bên dưới!
[ ] Haystack = nơi tìm, Needle = thứ cần tìm!
[ ] O(N) worst case (phần tử không tồn tại)!
[ ] O(1) best case (phần tử đầu tiên)!
[ ] Implementation: for loop + early return!
[ ] Không yêu cầu sorted — hoạt động với mọi mảng!
[ ] Kata machine: luyện tập thuật toán hàng ngày!
[ ] ligma.config 😂: cấu hình algorithm cần luyện!
TIẾP THEO → Phần 6: Binary Search!
```
