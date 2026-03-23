# The Last Algorithms Course You'll Need — Phần 13: Linked List Data Structures — "Nodes, Pointers, O(1) Insert/Delete, First Real Data Structure!"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Linked List Data Structures — "Node-based, singly vs doubly, insert/delete O(1), no index, operation ordering matters!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — linked lists, nodes, pointers, insert/delete at a node, singly vs doubly!

---

## Mục Lục

| #   | Phần                                               |
| --- | -------------------------------------------------- |
| 1   | JS [] Is NOT an Array — The Reveal!                |
| 2   | What Sucks About Arrays? — "No Delete, No Insert!" |
| 3   | Linked List — "First REAL Data Structure!"         |
| 4   | Node — "Container for Your Data!"                  |
| 5   | Singly vs Doubly — "Can You Walk Back?"            |
| 6   | Insertion — "Break 4 Links, Set 4 Links, O(1)!"    |
| 7   | Deletion — "Operation Ordering is CRUCIAL!"        |
| 8   | No Index! — "Traverse to Get There!"               |
| 9   | Tự Implement: Linked List Node                     |
| 10  | 🔬 Deep Analysis — Array vs Linked List            |

---

## §1. JS [] Is NOT an Array — The Reveal!

> Prime: _"We have a solid definition of an array now. Is this thing an array? It's NOT. You've got push — you can GROW it. Something's happening ON TOP of an array."_

### JavaScript [] = nhiều hơn một array!

Prime: _"You can insert, delete, and all the indices are being adjusted. If I shift, the first element becomes the zeroth. Something more than just an array is happening — some sort of organizational structure."_

Prime's hot takes: _"HTML is not a programming language. Neovim is the greatest editor. Rust is the greatest language. Linux is the only machine you should develop on."_ 😂

### Giải thích sâu: JS [] thật sự là gì?

Từ phần 3 (Arrays), bạn đã biết "real array" là **bộ nhớ liên tục, kích thước cố định**. JavaScript `[]` vi phạm CẢ HAI quy tắc: nó **tự grow**, nó **cho phép insert/delete**. Vậy nó là gì?

```
JS [] — KHÔNG PHẢI "REAL ARRAY":
═══════════════════════════════════════════════════════════════

  "Real" array (C, Java):
  → Kích thước CỐ ĐỊNH từ lúc tạo!
  → Chỉ get/set — KHÔNG insert/delete!
  → KHÔNG grow!

  JavaScript []:
  → .push() → grow! ← SAI quy tắc!
  → .splice() → insert ở giữa! ← SAI!
  → .shift() → xoá đầu, đánh lại index! ← SAI!
  → .length tự thay đổi! ← SAI!

  Vậy JS [] là gì BÊN DƯỚI?
  → V8 engine dùng MIX: array + hash map + hidden classes!
  → Hành xử NHƯ array nhưng KHÔNG PHẢI array thuần!
  → Đây là abstraction — che giấu complexity bên dưới!

  "Có CÁI GÌ ĐÓ đang xảy ra BÊN TRÊN một array.
   Một thứ tổ chức nào đó." — Prime
```

---

## §2. What Sucks About Arrays? — "No Delete, No Insert!"

> Prime: _"What sucks about an array? Deletion — you can't really delete, just zero out. Insertion — you can't really insert. It's ungrowable. Remember Fred? F's in chat."_

### Arrays = giới hạn!

- ❌ Không thể xoá (chỉ gán 0 hoặc sentinel)!
- ❌ Không thể chèn (chỉ ghi đè)!
- ❌ Không thể grow (Fred chết — từ phần 3)!

→ Cần cái gì đó tốt hơn → **Linked List!**

### Giải thích sâu: tại sao array "tệ" cho insert/delete?

```
ARRAY — VẤN ĐỀ VỚI INSERT VÀ DELETE:
═══════════════════════════════════════════════════════════════

  INSERT ở giữa:
  [1, 2, 3, 4, 5]  ← chèn 99 vào index 2

  Bước 1: dịch tất cả từ index 2 sang phải!
  [1, 2, _, 3, 4, 5]  ← mở "lỗ" ← COPY N phần tử!
  Bước 2: gán giá trị!
  [1, 2, 99, 3, 4, 5] ← xong!
  → O(N) vì phải dịch! 🐌

  DELETE ở giữa:
  [1, 2, 3, 4, 5]  ← xoá index 2 (giá trị 3)

  Bước 1: dịch tất cả từ index 3 sang trái!
  [1, 2, 4, 5, _]  ← COPY N phần tử!
  → O(N) vì phải dịch! 🐌

  Hoặc: gán sentinel (đánh dấu "trống")
  [1, 2, EMPTY, 4, 5]
  → O(1) nhưng lãng phí bộ nhớ + tạo "lỗ hổng"!

  → Array: GET nhanh (O(1)), INSERT/DELETE chậm (O(N))!
  → Linked list: ngược lại! INSERT/DELETE nhanh (O(1))!
```

---

## §3. Linked List — "First REAL Data Structure!"

> Prime: _"This is really our FIRST real data structure. They call this a NODE-BASED data structure. This was the first algorithm that BLEW MY MIND."_

_"You can see us allocating and walking memory. I thought this was the COOLEST THING. This is the coolest moment in all my programming career that I can tangibly remember."_

### Cách hoạt động!

Chuỗi các nodes, mỗi node trỏ đến node kế tiếp:

```
LINKED LIST — CẤU TRÚC:
═══════════════════════════════════════════════════════════════

   head
    ↓
   (A) → (B) → (C) → (D) → null

   Mỗi node chứa:
   - value: dữ liệu thật!
   - next: con trỏ đến node tiếp theo!

   Để lấy phần tử ở vị trí 3:
   (A) → (B) → (C) → (D) → lấy được!
    0      1      2      3

   "Chúng ta đi 1, 2, 3 — lấy phần tử thứ 4!" — Prime
```

### Giải thích sâu: tại sao đây là "data structure thật đầu tiên"?

Trước đây, chúng ta chỉ làm việc với **arrays** — bộ nhớ liên tục, tín hiệu trực tiếp. Array không phải "data structure" theo nghĩa chặt — nó chỉ là **vùng nhớ**. Linked list là data structure thật đầu tiên vì nó có **cấu trúc tổ chức**: mỗi node biết "ai ở kế bên tôi."

```
ARRAY vs LINKED LIST — CÁCH TỔ CHỨC BỘ NHỚ:
═══════════════════════════════════════════════════════════════

  ARRAY — bộ nhớ LIÊN TỤC:
  Địa chỉ:  100  104  108  112  116
            ┌────┬────┬────┬────┬────┐
            │ A  │ B  │ C  │ D  │ E  │
            └────┴────┴────┴────┴────┘
  → Phần tử nằm CẠNH NHAU trong bộ nhớ!
  → Biết địa chỉ đầu + index → tính được vị trí!

  LINKED LIST — bộ nhớ RẢI RÁC:
  Địa chỉ:  100      500      200      800
            ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
            │A|→500│ │B|→200│ │C|→800│ │D|null│
            └──────┘ └──────┘ └──────┘ └──────┘
  → Phần tử NẰM BẤT KỲ ĐÂU trong bộ nhớ!
  → Mỗi node chứa ĐỊA CHỈ của node tiếp!
  → Phải "đi" theo chuỗi con trỏ!

  → Array: compact, cache-friendly, random access!
  → Linked List: flexible, insert/delete nhanh!
```

Prime nói đây là khoảnh khắc **"tuyệt vời nhất"** trong sự nghiệp của ông ấy — lần đầu thấy **con trỏ** (pointers) hoạt động, nơi bạn **allocate** node ở heap, rồi **nối** chúng lại bằng addresses. Đây là nền tảng của **tất cả** data structures phức tạp hơn: trees, graphs, hash maps,...

---

## §4. Node — "Container for Your Data!"

> Prime: _"It's a CONTAINER item. You hand me a value T, and I put something around it."_

### Định nghĩa Node!

```typescript
type Node<T> = {
  value: T;
  next?: Node<T>; // singly linked!
  prev?: Node<T>; // doubly linked!
};
```

Prime: _"A node contains a VALUE and a REFERENCE to another node. You can walk this daisy chain of nodes which contain values."_

### Giải thích sâu: "container" và generic type T

"Container" (thùng chứa) — node **bọc** dữ liệu của bạn bên trong. Bạn đưa một giá trị bất kỳ (number, string, object...), node "bọc" nó lại và thêm con trỏ `next` (và `prev` nếu doubly) vào. Người dùng chỉ thấy **value** — node là **abstraction** cho linked list.

`T` là **generic type** — nghĩa là "bất kỳ kiểu nào." `Node<number>` chứa số, `Node<string>` chứa chuỗi. Đây là cú pháp TypeScript nhưng concept tồn tại trong mọi ngôn ngữ có generics (Java, C#, Rust, Go...).

```
NODE — CONTAINER:
═══════════════════════════════════════════════════════════════

  Dữ liệu thô: 42

  Bọc trong Node:
  ┌─────────────────────────┐
  │ Node                    │
  │ ┌─────────┐             │
  │ │value: 42│             │
  │ └─────────┘             │
  │ ┌─────────────────────┐ │
  │ │next: → (node khác)  │ │
  │ └─────────────────────┘ │
  │ ┌─────────────────────┐ │
  │ │prev: ← (node khác)  │ │ ← chỉ có trong doubly!
  │ └─────────────────────┘ │
  └─────────────────────────┘

  "Daisy chain" — chuỗi hoa cúc:
  (42) → (17) → (99) → (3) → null
  Mỗi node nối với node kế tạo thành chuỗi!
```

---

## §5. Singly vs Doubly — "Can You Walk Back?"

> Prime: _"A points to B, B points to C, C points to D — you CAN'T walk backwards. The moment you go forward, if you don't have a reference to what's behind you, you've LOST IT FOREVER."_

### Singly linked = một chiều!

```
SINGLY LINKED:
═══════════════════════════════════════════════════════════════

  (A) → (B) → (C) → (D) → null

  Đi được: A → B → C → D ✅
  KHÔNG đi được: D → C → B → A ❌

  "Nếu tôi lấy head trỏ đến B, không ai
   truy cập được A nữa. Nó BIẾN MẤT." — Prime
```

### Doubly linked = hai chiều!

```
DOUBLY LINKED:
═══════════════════════════════════════════════════════════════

  null ← (A) ⇄ (B) ⇄ (C) ⇄ (D) → null

  Đi tiến:  A → B → C → D ✅
  Đi lùi:   D → C → B → A ✅

  Mỗi node có: value, next, VÀ prev!
```

### Giải thích sâu: trade-offs

```
SINGLY vs DOUBLY — TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  Singly Linked List:
  ✅ Ít bộ nhớ hơn (mỗi node chỉ cần 1 con trỏ!)
  ✅ Insert/delete đơn giản hơn (ít con trỏ cần cập nhật!)
  ❌ Chỉ đi được một chiều!
  ❌ Xoá node cuối = O(N) (phải duyệt để tìm node áp cuối!)
  ❌ Không thể "nhìn lại" — mất reference = mất vĩnh viễn!

  Doubly Linked List:
  ✅ Đi được cả hai chiều!
  ✅ Xoá đầu/cuối = O(1) (có prev!)
  ✅ Linh hoạt hơn nhiều!
  ❌ Nhiều bộ nhớ hơn (2 con trỏ mỗi node!)
  ❌ Insert/delete phức tạp hơn (phải cập nhật 4 con trỏ!)
  ❌ Dễ bug hơn (nhiều con trỏ = nhiều chỗ sai!)
```

Prime nói về garbage collection: _"JavaScript GC is so advanced it can tell that though A references data that's still alive, A itself has no references left — therefore dead."_ Điều này nghĩa là: nếu bạn set `head = head.next`, node cũ (A) sẽ bị **garbage collected** vì không còn ai trỏ đến nó — dù nó có trỏ đến B.

---

## §6. Insertion — "Break 4 Links, Set 4 Links, O(1)!"

> Prime: _"One cool property about linked lists — insertion can be very, very fast."_

### Chèn F giữa A và B (doubly linked)!

```
CHÈN NODE — DOUBLY LINKED:
═══════════════════════════════════════════════════════════════

  Trước:
  (A) ⇄ (B) ⇄ (C) ⇄ (D)

  Chèn F giữa A và B:

  Bước 1: F.next = B          (F trỏ tới B!)
  Bước 2: F.prev = A          (F trỏ về A!)
  Bước 3: A.next = F          (A giờ trỏ tới F thay vì B!)
  Bước 4: B.prev = F          (B giờ trỏ về F thay vì A!)

  Sau:
  (A) ⇄ (F) ⇄ (B) ⇄ (C) ⇄ (D)

  Operations: 4 lần gán con trỏ = HẰNG SỐ!
  → O(1)! 🎯
```

Prime: _"We set 2 nexts and 2 previouses. Are any of those operations based on how many nodes are in the list? NO. Setting next is CONSTANT. Therefore, inserting in a linked list at a given position is O(1)."_

### Giải thích sâu: tại sao O(1)?

Đây là điểm **khác biệt cốt lõi** so với array. Khi chèn vào giữa array, bạn phải **dịch tất cả phần tử** phía sau — O(N). Nhưng trong linked list, bạn chỉ cần **thay đổi vài con trỏ** — không quan trọng list có 10 hay 10 triệu nodes, vẫn là 4 phép gán!

```
ARRAY INSERT vs LINKED LIST INSERT:
═══════════════════════════════════════════════════════════════

  Array: chèn 99 vào giữa [1, 2, 3, 4, 5]
  → Dịch 3, 4, 5 sang phải!
  → Copy 3 phần tử!
  → [1, 2, 99, 3, 4, 5]
  → O(N)! 🐌

  Linked List: chèn 99 giữa (2) và (3)
  → Chỉ thay 4 con trỏ!
  → (2) ⇄ (99) ⇄ (3)
  → Không element nào khác bị ảnh hưởng!
  → O(1)! 🚀

  → List 10 phần tử: 4 operations!
  → List 10 triệu phần tử: VẪN 4 operations!
```

**LƯU Ý QUAN TRỌNG**: O(1) insert **giả định bạn ĐÃ CÓ** reference đến node muốn chèn cạnh. Nếu bạn cần **tìm** node trước (ví dụ: chèn ở index 5), bạn phải duyệt đến đó = O(N). Tổng = O(N) traversal + O(1) insert. Bản thân phép insert luôn O(1) — chi phí nằm ở **tìm kiếm**.

---

## §7. Deletion — "Operation Ordering is CRUCIAL!"

> Prime: _"We have C and we want to delete it."_

### Xoá C từ A ⇄ B ⇄ C ⇄ D!

```
XOÁ NODE — DOUBLY LINKED:
═══════════════════════════════════════════════════════════════

  Trước:
  (A) ⇄ (B) ⇄ (C) ⇄ (D)

  Xoá C — đã CÓ reference đến C:

  Bước 1: B.next = C.next     → B giờ trỏ đến D!
          (B.next = D)
  Bước 2: D.prev = C.prev     → D giờ trỏ về B!
          (D.prev = B)
  Bước 3: C.prev = null       → dọn dẹp C!
  Bước 4: C.next = null       → dọn dẹp C!
  Bước 5: return C.value      → trả lại giá trị đã xoá!

  Sau:
  (A) ⇄ (B) ⇄ (D)

  C bị ngắt kết nối: (C) → garbage collected!

  Operations: 4 lần gán con trỏ = HẰNG SỐ!
  → O(1)! 🎯
```

### ⚠️ Thứ tự operations RẤT QUAN TRỌNG!

> Prime: _"If I set C.next = undefined FIRST, could we ever access D again? NO. D is GONE, we can no longer ever access it. Operation ordering is EXTREMELY important."_

```
⚠️ THỨ TỰ QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  ❌ THỨ TỰ SAI:
  C.next = null          → D BỊ MẤT VĨNH VIỄN! 💀
  B.next = C.next        → B.next = null! HƯ HẾT!
  → Vì: C.next đã bị null, B.next cũng null!
  → List hỏng: (A) ⇄ (B) → null 💀 (D mất!)

  ✅ THỨ TỰ ĐÚNG:
  B.next = C.next        → LƯU reference đến D TRƯỚC!
  D.prev = C.prev        → LƯU reference đến B TRƯỚC!
  RỒI MỚI dọn C!

  Quy tắc vàng:
  → "LUÔN lưu references TRƯỚC KHI cắt links!" — Prime
  → "Đọc" trước, "ghi" sau!
  → Nếu bạn xoá con trỏ TRƯỚC khi ai đó dùng nó
    → dữ liệu biến mất!
```

Đây là bài học xuất hiện lại nhiều lần trong programming: **thứ tự operations**. Tương tự swap (cần temp), xoá node cần **lưu references trước khi cắt**. Pattern chung: "read first, then write."

---

## §8. No Index! — "Traverse to Get There!"

> Student: _"Linked list, there's no index?"_
> Prime: _"CORRECT. There is no index. You have access to a node from which you can TRAVERSE to get to the node you desire."_

### Truy cập bằng index = O(N)!

```
TRUY CẬP BẰNG INDEX:
═══════════════════════════════════════════════════════════════

  Array:  arr[3] → base + (3 × width) → O(1)! 🚀
  → Tính trực tiếp từ toán học! Không cần duyệt!

  Linked List: get(3) →
    head → node1 → node2 → node3 → lấy được!
    → Phải đi qua 3 nodes = O(N)! 🐢

  "Bạn không thể chỉ LẤY phần tử thứ 8.
   Bạn phải đi 1, 2, 3..." — Prime
```

### Giải thích sâu: tại sao trả value, không trả node?

Prime: _"Then I can return current's VALUE — not the containing node. We don't return the node because then someone can mess with next and previous, and boom our whole list sucks."_

```
TRẢ VALUE vs TRẢ NODE:
═══════════════════════════════════════════════════════════════

  ❌ Trả node:
  const node = list.get(3);  // → Node { value: 42, next: ..., prev: ... }
  node.next = null;          // → PHẢI HƯ TOÀN BỘ LIST! 💀
  → Người dùng có thể PHÁNÓ CẤU TRÚC!

  ✅ Trả value:
  const val = list.get(3);   // → 42
  // Không có cách nào phá list từ đây!
  → Encapsulation! Information hiding!

  "Container là abstraction cho CHÍNH CHÚNG TA,
   không phải cho thế giới bên ngoài." — Prime
```

Đây là nguyên tắc **encapsulation** — che giấu implementation details. Node là **internal** — người dùng chỉ tương tác với **values**. Nếu bạn expose node, bất kỳ ai cũng có thể phá hỏng cấu trúc list bằng cách thay đổi `next`/`prev`.

---

## §9. Tự Implement: Linked List Node

```javascript
// ═══ Linked List Node — Cấu Trúc Cơ Bản ═══

class Node {
  constructor(value) {
    this.value = value;
    this.next = null; // singly: chỉ next!
    this.prev = null; // doubly: + prev!
  }
}

// Chèn node mới SAU nodeA!
function insertAfter(nodeA, newNode) {
  const nodeB = nodeA.next; // lưu reference TRƯỚC!

  // Thiết lập con trỏ tiến
  nodeA.next = newNode;      // A → F
  newNode.next = nodeB;      // F → B

  // Thiết lập con trỏ lùi (doubly)
  newNode.prev = nodeA;      // A ← F
  if (nodeB) nodeB.prev = newNode; // F ← B

  return newNode;
}

// Xoá node (doubly)!
function deleteNode(node) {
  const prev = node.prev;    // lưu reference TRƯỚC!
  const next = node.next;    // lưu reference TRƯỚC!

  // Nối qua node bị xoá!
  if (prev) prev.next = next; // B → D (bỏ C!)
  if (next) next.prev = prev; // B ← D (bỏ C!)

  // Dọn dẹp
  node.prev = null;
  node.next = null;

  return node.value;
}

// Demo
const a = new Node("A");
const b = new Node("B");
const c = new Node("C");
const d = new Node("D");

// Xây: A ⇄ B ⇄ C ⇄ D
a.next = b; b.prev = a;
b.next = c; c.prev = b;
c.next = d; d.prev = c;

function printList(head) {
  let curr = head;
  const values = [];
  while (curr) {
    values.push(curr.value);
    curr = curr.next;
  }
  return values.join(" ⇄ ");
}

console.log("═══ LINKED LIST ═══\n");
console.log("Ban đầu:", printList(a)); // A ⇄ B ⇄ C ⇄ D

// Chèn F sau A
const f = new Node("F");
insertAfter(a, f);
console.log("Chèn F sau A:", printList(a)); // A ⇄ F ⇄ B ⇄ C ⇄ D

// Xoá C
const deleted = deleteNode(c);
console.log(`Xoá C (giá trị "${deleted}"):`, printList(a)); // A ⇄ F ⇄ B ⇄ D

console.log("\n✅ Chèn = O(1)! Chỉ set con trỏ!");
console.log("✅ Xoá = O(1)! Chỉ nối lại neighbors!");
console.log("✅ Truy cập index = O(N)! Phải duyệt!");
```

---

## §10. 🔬 Deep Analysis — Array vs Linked List

```
ARRAY vs LINKED LIST:
═══════════════════════════════════════════════════════════════

  Operation        │ Array    │ Linked List
  ─────────────────┼──────────┼──────────────
  Truy cập index   │ O(1)    │ O(N)          ← array thắng!
  Chèn ở vị trí   │ O(N)*   │ O(1)**        ← linked list thắng!
  Xoá ở vị trí    │ O(N)*   │ O(1)**        ← linked list thắng!
  Thêm đầu        │ O(N)    │ O(1)          ← linked list thắng!
  Thêm cuối       │ O(1)°   │ O(1)°°        ← hoà!
  Bộ nhớ          │ liên tục │ rải rác       ← array cache-friendly!

  *  Array cần dịch phần tử!
  ** NẾU đã có reference đến node! Tìm node = O(N)!
  °  Dynamic array, amortized O(1)!
  °° NẾU có tail pointer!

  INSIGHT CỐT LÕI:
  ┌──────────────────────────────────────────────────────────┐
  │ Arrays: giỏi ĐỌC (random access O(1))!                 │
  │ Linked Lists: giỏi GHI (insert/delete O(1))!           │
  │ → Công cụ khác nhau cho bài toán khác nhau!             │
  │                                                          │
  │ "Nếu bạn cần đọc nhiều → dùng array!"                  │
  │ "Nếu bạn cần chèn/xoá nhiều → dùng linked list!"      │
  └──────────────────────────────────────────────────────────┘

  CACHE FRIENDLINESS:
  ┌──────────────────────────────────────────────────────────┐
  │ Array: phần tử CẠNH NHAU → CPU cache load cả block!    │
  │ → Duyệt array rất NHANH trên phần cứng thật!           │
  │                                                          │
  │ Linked List: phần tử RẢI RÁC → cache miss liên tục!    │
  │ → Duyệt linked list CHẬM trên phần cứng thật!          │
  │                                                          │
  │ → Big O giống nhau (O(N)) nhưng THỰC TẾ array nhanh!   │
  └──────────────────────────────────────────────────────────┘

  "Đây là thuật toán đầu tiên LÀM TÔI CHOÁNG.
   Khoảnh khắc tuyệt vời nhất trong sự nghiệp." — Prime 🎯
```

---

## Checklist

```
[ ] JS [] ≠ array! Có push, grow, shift = thứ gì đó bên trên!
[ ] Arrays tệ: không delete, không insert, không grow!
[ ] Linked list = node-based, heap-allocated!
[ ] Node: { value, next, prev? } — container cho dữ liệu!
[ ] Singly: chỉ đi tiến! Mất reference = mất vĩnh viễn!
[ ] Doubly: đi cả hai chiều! Nhưng nhiều bộ nhớ + phức tạp hơn!
[ ] Chèn (tại node): set 4 con trỏ = O(1)!
[ ] Xoá (tại node): nối lại neighbors = O(1)!
[ ] ⚠️ THỨ TỰ: lưu references TRƯỚC KHI cắt links!
[ ] Không index! Truy cập index = O(N), phải duyệt!
[ ] Trả value, KHÔNG trả node — encapsulation!
[ ] Array: ĐỌC nhanh (O(1)), GHI chậm (O(N))!
[ ] Linked list: GHI nhanh (O(1)), ĐỌC chậm (O(N))!
[ ] Cache: array cache-friendly, linked list cache-hostile!
[ ] "Khoảnh khắc tuyệt vời nhất trong sự nghiệp!" — Prime
TIẾP THEO → Phần 14: Linked List Complexity & Q&A!
```
