# The Last Algorithms Course You'll Need — Phần 14: Linked List Complexity — "Head/Tail O(1), Middle O(N), Every LL Is a Graph!"

> 📅 2026-03-08 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Linked List Complexity — "get/delete head/tail = O(1), middle = traversal + O(1), LL is a graph, is a tree!"
> Độ khó: ⭐️⭐️⭐️ | Analysis — operation costs, traversal vs operation, foundational for trees/graphs!

---

## Mục Lục

| #   | Phần                                                  |
| --- | ----------------------------------------------------- |
| 1   | Get by Index — "Walk the List, O(N)!"                 |
| 2   | Head & Tail — "Constant Time Gets!"                   |
| 3   | Deletion — "Ends = O(1), Middle = Traversal!"         |
| 4   | Prepend & Append — "O(1)!"                            |
| 5   | The Pattern — "Traversal Is the Cost!"                |
| 6   | Interface — "Constrain for Performance!"              |
| 7   | Why Start with Linked Lists? — "Every LL Is a Graph!" |
| 8   | 🔬 Deep Analysis — Complete Complexity Table          |

---

## §1. Get by Index — "Walk the List, O(N)!"

> Prime: _"If I asked for the fifth value, I literally have to write a loop — for 0 to 5, current = current.next. I have to WALK it until we get to the correct value."_

### Không có random access!

Prime: _"Then I can return current's VALUE — not the containing node. We don't return the node because then someone can mess with next and previous, and boom our whole list sucks."_

_"The container is our abstraction for OURSELVES, not for the outside world."_

### Giải thích sâu: tại sao linked list không thể random access?

Nhớ lại từ phần 3: array access O(1) nhờ **công thức toán**: `address = base + (index × width)`. Công thức này hoạt động vì array là **bộ nhớ liên tục** — biết vị trí đầu + khoảng cách = biết vị trí bất kỳ.

Linked list **không liên tục** — mỗi node ở **địa chỉ ngẫu nhiên** trên heap. Không có công thức nào tính ra "node thứ 5 ở địa chỉ nào." Cách duy nhất: bắt đầu từ head, đi theo con trỏ `next`, đếm 1, 2, 3, 4, 5 — lấy được!

```
TẠI SAO KHÔNG RANDOM ACCESS:
═══════════════════════════════════════════════════════════════

  Array: bộ nhớ LIÊN TỤC
  Địa chỉ: 100, 104, 108, 112, 116
  → arr[3] = 100 + 3×4 = 112 → đọc NGAY! → O(1)!

  Linked List: bộ nhớ RẢI RÁC
  Node 0 ở 100 → next trỏ đến 500
  Node 1 ở 500 → next trỏ đến 200
  Node 2 ở 200 → next trỏ đến 800
  Node 3 ở 800 → next trỏ đến 350
  → "Node 3 ở đâu?" → Chỉ biết bắt đầu từ 100!
  → 100 → 500 → 200 → 800 → lấy được! → O(N)!

  Code:
  function get(index) {
    let current = this.head;
    for (let i = 0; i < index; i++) {
      current = current.next;  // đi theo con trỏ!
    }
    return current.value;  // trả value, KHÔNG trả node!
  }
```

---

## §2. Head & Tail — "Constant Time Gets!"

> Prime: _"Getting head can become a CONSTANT operation. Getting tail can ALSO be constant — because we already have a defined pointer."_

### Reference trực tiếp = O(1)!

```
HEAD & TAIL — CON TRỎ TRỰC TIẾP:
═══════════════════════════════════════════════════════════════

  head ──→ (A) ⇄ (B) ⇄ (C) ⇄ (D) ←── tail

  Lấy head: this.head.value → O(1)! 🚀
  → Đã có con trỏ trực tiếp! Không cần duyệt!

  Lấy tail: this.tail.value → O(1)! 🚀
  → Đã có con trỏ trực tiếp! Không cần duyệt!

  Lấy giữa: duyệt từ head → O(N)! 🐢
  → Không có con trỏ trực tiếp! Phải đi bộ!
```

### Giải thích sâu: tại sao tail pointer quan trọng?

Nếu bạn **không** giữ tail pointer, mọi thao tác ở cuối list đều phải **duyệt từ head đến cuối** = O(N). Với tail pointer, append và get-tail trở thành O(1).

```
CÓ vs KHÔNG CÓ TAIL POINTER:
═══════════════════════════════════════════════════════════════

  KHÔNG CÓ tail pointer:
  ┌────────────────────────────────────────────────────────┐
  │ head → (A) → (B) → (C) → (D) → null                 │
  │                                                        │
  │ Append: phải duyệt A→B→C→D → thêm E ở cuối!         │
  │ → O(N) vì phải tìm node cuối!                        │
  │                                                        │
  │ Get tail: cũng O(N)!                                  │
  └────────────────────────────────────────────────────────┘

  CÓ tail pointer:
  ┌────────────────────────────────────────────────────────┐
  │ head → (A) → (B) → (C) → (D) ← tail                 │
  │                                                        │
  │ Append: tail.next = newNode → tail = newNode!         │
  │ → O(1) vì đã có reference! 🚀                       │
  │                                                        │
  │ Get tail: tail.value!                                  │
  │ → O(1)! 🚀                                           │
  └────────────────────────────────────────────────────────┘

  → Tail pointer = O(1) thêm bổ nhớ cho MỘT con trỏ
    nhưng TẤT CẢ thao tác cuối list nhanh hơn!
  → Luôn nên có tail pointer! 💡
```

---

## §3. Deletion — "Ends = O(1), Middle = Traversal!"

> Prime: _"Deletion at head or tail — constant. But if you delete in the MIDDLE, you have to TRAVERSE to that point. So you have a two-operation cost: traversal PLUS deletion."_

### Hai chi phí!

```
CHI PHÍ XOÁ:
═══════════════════════════════════════════════════════════════

  Xoá head: O(1) — có reference trực tiếp!
  ┌────────────────────────────────────────────────────────┐
  │ head → (A) ⇄ (B) ⇄ (C) ⇄ (D) ← tail               │
  │ Xoá A: head = A.next → head = B! Xong!               │
  │ head → (B) ⇄ (C) ⇄ (D) ← tail                      │
  │ → O(1)! 🚀                                           │
  └────────────────────────────────────────────────────────┘

  Xoá tail: O(1) nếu doubly! O(N) nếu singly!
  ┌────────────────────────────────────────────────────────┐
  │ Doubly: tail có prev → tail.prev = C                  │
  │ → tail = C, C.next = null! → O(1)! 🚀               │
  │                                                        │
  │ Singly: KHÔNG có prev! Phải duyệt từ head            │
  │ đến node ÁP CUỐI (C) để set C.next = null!           │
  │ → O(N)! 🐢 (đây là nhược điểm lớn của singly!)      │
  └────────────────────────────────────────────────────────┘

  Xoá giữa: O(N) traversal + O(1) deletion = O(N)!
  ┌────────────────────────────────────────────────────────┐
  │ Tìm node cần xoá: duyệt từ head = O(N)!             │
  │ Xoá node: set con trỏ = O(1)!                        │
  │ → Tổng: O(N) + O(1) = O(N)!                          │
  │                                                        │
  │ "Bản thân việc xoá KHÔNG tốn kém.                    │
  │  Chính việc DUYỆT mới tốn." — Prime                  │
  └────────────────────────────────────────────────────────┘
```

### Giải thích sâu: singly vs doubly khi xoá tail

Đây là **nhược điểm lớn nhất** của singly linked list: xoá node cuối cần biết node **áp cuối** (để set `áp_cuối.next = null`). Nhưng singly list không có `prev` → phải duyệt từ đầu đến áp cuối = O(N).

Doubly list có `prev` → `tail.prev` cho bạn node áp cuối ngay = O(1). Đây là lý do tại sao doubly list phổ biến hơn trong practice — chi phí thêm 1 con trỏ mỗi node nhưng **xoá cuối từ O(N) xuống O(1)**.

---

## §4. Prepend & Append — "O(1)!"

> Prime: _"Prepending and appending — constant time, because you just break the links from head or tail."_

### Thêm đầu và cuối đều O(1)!

```
PREPEND & APPEND — O(1):
═══════════════════════════════════════════════════════════════

  PREPEND (thêm đầu):
  Trước: head → (A) ⇄ (B) ⇄ (C) ← tail

  Thêm Z vào đầu:
  Z.next = head (= A)        // Z trỏ đến A!
  head.prev = Z              // A trỏ về Z! (doubly)
  head = Z                   // head giờ là Z!

  Sau: head → (Z) ⇄ (A) ⇄ (B) ⇄ (C) ← tail
  → O(1)! Chỉ 2-3 phép gán! 🚀

  APPEND (thêm cuối):
  Trước: head → (A) ⇄ (B) ⇄ (C) ← tail

  Thêm Z vào cuối:
  tail.next = Z              // C trỏ đến Z!
  Z.prev = tail (= C)        // Z trỏ về C! (doubly)
  tail = Z                   // tail giờ là Z!

  Sau: head → (A) ⇄ (B) ⇄ (C) ⇄ (Z) ← tail
  → O(1)! Chỉ 2-3 phép gán! 🚀
```

### So sánh với array

```
PREPEND — ARRAY vs LINKED LIST:
═══════════════════════════════════════════════════════════════

  Array: thêm vào đầu [1, 2, 3, 4, 5]
  → Dịch TẤT CẢ sang phải! [_, 1, 2, 3, 4, 5]
  → Gán: [0] = newValue
  → O(N)! 🐌

  Linked List: thêm vào đầu
  → Tạo node mới, trỏ next đến head!
  → head = newNode!
  → O(1)! 🚀

  → Nếu bạn thêm/xoá đầu list NHIỀU
    → Linked list HOÀN TOÀN phù hợp!
    → Queue và Stack dùng pattern này!
```

---

## §5. The Pattern — "Traversal Is the Cost!"

> Prime: _"So long as you can traverse FAST, your insertion is fast."_

### Sức mạnh & điểm yếu!

Prime: _"The list can be whatever SIZE you want. Deletion from front or back is extremely fast. That's very important — a lot of structures want to delete the OLDEST item. The oldest would be at the tail — constant operation."_

### Giải thích sâu: insight cốt lõi

Đây là insight **quan trọng nhất** của toàn bộ bài về linked list:

```
INSIGHT CỐT LỖI:
═══════════════════════════════════════════════════════════════

  Bản thân mỗi operation trên linked list:
  → insert = O(1)!
  → delete = O(1)!
  → get value = O(1)!

  CHI PHÍ THẬT SỰ nằm ở TRAVERSAL:
  → Tìm node = O(N)!

  TỔNG = traversal + operation = O(N) + O(1) = O(N)!

  Nhưng nếu bạn ĐÃ CÓ reference đến node:
  → insert = O(1)! (không cần traverse!)
  → delete = O(1)! (không cần traverse!)

  → Head pointer: đã có → O(1)!
  → Tail pointer: đã có → O(1)!
  → Giữa: chưa có → traverse O(N) + operation O(1) = O(N)!
```

Pattern này xuất hiện lại trong nhiều data structures:
- **Queue**: chỉ thao tác đầu/cuối → O(1)!
- **Stack**: chỉ thao tác đầu → O(1)!
- **Hash map**: tìm node bằng hash → O(1)! (không cần traverse!)

Chính vì vậy, Prime nói: _"From here on out, you'll notice that most things are CONSTRAINED intentionally, such that we get very good performance."_ — các data structures **giới hạn** operations để đảm bảo O(1).

---

## §6. Interface — "Constrain for Performance!"

> Prime: _"From here on out, you'll notice that most things are CONSTRAINED intentionally, such that we get very good performance."_

### Interface linked list!

```typescript
interface LinkedList<T> {
  get length(): number;
  insertAt(item: T, index: number): void;
  remove(item: T): T | undefined;
  removeAt(index: number): T | undefined;
  append(item: T): void;
  prepend(item: T): void;
  get(index: number): T | undefined;
}
```

### Giải thích sâu: interface = contract + constraint

Interface định nghĩa **những gì bạn CÓ THỂ làm** với linked list — và ngầm hiểu **những gì bạn KHÔNG THỂ**. Người dùng không biết (và không cần biết) bên trong là nodes và pointers. Họ chỉ thấy: "tôi có thể thêm, xoá, lấy."

```
INTERFACE — CONTRACT + CONSTRAINT:
═══════════════════════════════════════════════════════════════

  Những gì người dùng THẤY:
  ┌──────────────────────────────────────────────────────────┐
  │ list.append(42)         // thêm cuối!                   │
  │ list.prepend(1)         // thêm đầu!                    │
  │ list.get(3)             // lấy giá trị ở index 3!      │
  │ list.removeAt(2)        // xoá ở index 2!              │
  │ list.length             // số phần tử!                  │
  └──────────────────────────────────────────────────────────┘

  Những gì người dùng KHÔNG THẤY:
  ┌──────────────────────────────────────────────────────────┐
  │ Nodes, con trỏ next/prev, head/tail pointers            │
  │ → Encapsulation! Che giấu implementation!                │
  │ → Người dùng không thể phá cấu trúc nội bộ!            │
  └──────────────────────────────────────────────────────────┘

  "Các data structures GIỚI HẠN CỐ Ý
   để đạt hiệu suất TỐT." — Prime
```

---

## §7. Why Start with Linked Lists? — "Every LL Is a Graph!"

> Prime: _"Every single linked list IS a graph. Every linked list is technically a TREE. They are the most fundamental unit."_

_"As long as you understand how to traverse and move around in a linked list, you're going to understand ALL these other data structures."_

### Linked list → Tree → Graph!

```
LINKED LIST → TẤT CẢ DATA STRUCTURES:
═══════════════════════════════════════════════════════════════

  Linked List: mỗi node có 1 "next"
  (A) → (B) → (C) → (D)
       ↓

  Tree: mỗi node có NHIỀU "next" (children)
         (A)
        / \
      (B)  (C)     ← node có 2 children = 2 "next"!
      /
    (D)
       ↓

  Graph: nodes có thể TRỎ NGƯỢC (cycles!)
    (A) → (B) → (C)
     ↑           ↓
     └─── (D) ←──┘   ← D trỏ về A = CYCLE!

  "Linked lists là đơn vị NỀN TẢNG NHẤT." — Prime
```

### Giải thích sâu: tại sao hiểu linked list = hiểu tất cả?

```
TẠI SAO NỀN TẢNG:
═══════════════════════════════════════════════════════════════

  Linked List dạy bạn:
  1. NODES — đơn vị chứa dữ liệu!
  2. POINTERS — kết nối giữa các nodes!
  3. TRAVERSAL — đi qua các nodes!
  4. INSERT/DELETE — thay đổi pointers!
  5. OPERATION ORDERING — thứ tự quan trọng!

  Tất cả concepts này ÁP DỤNG cho:
  → Trees: duyệt cây = đi theo children!
  → Graphs: duyệt đồ thị = đi theo edges!
  → Hash Maps: chains = linked lists!
  → Heaps: cây nhị phân!
  → Tries: cây ký tự!

  → Learned linked list = FOUNDATION cho mọi thứ!

  Thao tác trên tree? = thay đổi pointers!
  Thao tác trên graph? = thay đổi pointers!
  → Cùng concept, khác cấu trúc!
```

---

## §8. 🔬 Deep Analysis — Complete Complexity Table

```
BẢNG COMPLEXITY ĐẦY ĐỦ:
═══════════════════════════════════════════════════════════════

  Operation          │ Singly  │ Doubly  │ Ghi chú
  ────────────────── │─────────│─────────│──────────────
  Lấy head           │ O(1)    │ O(1)    │ con trỏ trực tiếp!
  Lấy tail           │ O(1)*   │ O(1)*   │ *nếu có tail pointer!
  Lấy giữa (index)  │ O(N)    │ O(N)    │ phải duyệt!
  Thêm đầu (prepend)│ O(1)    │ O(1)    │ update head!
  Thêm cuối (append)│ O(1)*   │ O(1)*   │ *nếu có tail pointer!
  Chèn tại node     │ O(1)    │ O(1)    │ nếu ĐÃ CÓ ref!
  Chèn tại index    │ O(N)    │ O(N)    │ traverse trước!
  Xoá head          │ O(1)    │ O(1)    │ update head!
  Xoá tail          │ O(N)    │ O(1)    │ singly: không prev!
  Xoá tại node      │ O(N)^   │ O(1)    │ ^singly: ko prev!
  Xoá tại index     │ O(N)    │ O(N)    │ traverse trước!

  INSIGHT CỐT LÕI:
  ┌──────────────────────────────────────────────────────────┐
  │ Bản thân OPERATION luôn O(1)!                           │
  │ Phần TRAVERSAL mới O(N)!                                │
  │ Nếu ĐÃ CÓ node → O(1)!                                │
  │ Nếu CẦN TÌM node → O(N)!                               │
  └──────────────────────────────────────────────────────────┘

  SINGLY vs DOUBLY — KHI NÀO DÙNG GÌ:
  ┌──────────────────────────────────────────────────────────┐
  │ Singly: đủ cho stack (chỉ thao tác đầu!)               │
  │ → Tiết kiệm bộ nhớ (1 pointer/node)!                   │
  │ → Đơn giản hơn!                                         │
  │                                                          │
  │ Doubly: cần cho queue (thao tác cả đầu lẫn cuối!)      │
  │ → Linh hoạt hơn!                                        │
  │ → Xoá cuối O(1)!                                        │
  │ → Phức tạp hơn + nhiều bộ nhớ hơn!                     │
  └──────────────────────────────────────────────────────────┘

  NỀN TẢNG:
  ┌──────────────────────────────────────────────────────────┐
  │ Linked List         → Queue, Stack, Deque               │
  │ Linked List + tree  → Binary Tree, BST, Heap            │
  │ Linked List + graph → Adjacency List, Hash Map Chains   │
  │ "Mọi linked list ĐỀU LÀ graph." — Prime               │
  └──────────────────────────────────────────────────────────┘
```

---

## Checklist

```
[ ] Lấy theo index: duyệt list = O(N)!
[ ] Head/tail với con trỏ trực tiếp = O(1)!
[ ] Tail pointer: biến append/get-tail từ O(N) → O(1)!
[ ] Xoá đầu/cuối = O(1) (doubly), xoá giữa = O(N) traversal!
[ ] Singly xoá cuối = O(N) vì không có prev!
[ ] Prepend/append = O(1) với head/tail pointers!
[ ] TRAVERSAL là chi phí, KHÔNG PHẢI operation!
[ ] "Đừng trả node — rò rỉ abstraction!"
[ ] Interface: giới hạn cố ý → hiệu suất tốt!
[ ] Mọi linked list là graph/tree — NỀN TẢNG!
[ ] Singly: đủ cho stack! Doubly: cần cho queue!
TIẾP THEO → Phần 15: Queue!
```
