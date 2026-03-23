# The Last Algorithms Course You'll Want (Part 2) — Phần 1: Introduction — "Same Material Deeper, Harder Concepts, Pure Whiteboard!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Introduction — "Khoá Part 2 khác Part 1 thế nào, tại sao gọi là 'Want' chứ không phải 'Need', whiteboard-only, prerequisites, và những concept sâu hơn đang chờ!"
> Độ khó: ⭐⭐ | Intermediate — Giới thiệu khoá nâng cao!

---

## Mục Lục

| #   | Phần                                                            |
| --- | --------------------------------------------------------------- |
| 1   | Part 2 vs Part 1 — "Need vs Want!"                              |
| 2   | Whiteboard-Only Approach — "My First Whiteboarding Experience!" |
| 3   | Course Structure — "Same Material Deeper, Harder Concepts!"     |
| 4   | Prerequisites — "Trees, Recursion, Stacks, Queues!"             |
| 5   | Tại Sao "Want"? — "These Are the Fun Ones!"                     |
| 6   | Deep Dive: Tổng Quan Kiến Thức Nền Tảng Cần Có                  |
| 7   | Tự Code: Ôn Tập Nhanh Cấu Trúc Dữ Liệu Nền Tảng from Scratch    |
| 8   | Deep Dive: Mindset Cho Advanced Algorithms                      |

---

## §1. Part 2 vs Part 1 — "Need vs Want!"

> Prime: _"The last one was called the last algorithms course you'll need, this one's called the last algorithms course you'll want. You'll understand at the end of this why we called it this."_

```
PART 1 vs PART 2:
═══════════════════════════════════════════════════════════════

  PART 1: "The Last Algorithms Course You'll NEED"
  ┌──────────────────────────────────────────────────────────┐
  │ Mục tiêu: Nền tảng! Tất cả những gì bạn CẦN biết!     │
  │                                                          │
  │ Nội dung:                                                │
  │ ├── Big O, Arrays, Linear Search                        │
  │ ├── Binary Search, Two Crystal Balls                    │
  │ ├── Bubble Sort                                         │
  │ ├── Linked List, Queue, Stack                           │
  │ ├── ArrayList, Ring Buffer                              │
  │ ├── Recursion, Path Finding                             │
  │ ├── QuickSort                                           │
  │ ├── Trees, BFS, DFS                                    │
  │ ├── Binary Search Tree                                  │
  │ ├── Heap, Trie                                          │
  │ ├── Graphs, Dijkstra                                    │
  │ └── Maps, LRU Cache                                    │
  │                                                          │
  │ Level: Beginner → Intermediate                          │
  │ Style: Code behind keyboard + Vim terminal!              │
  └──────────────────────────────────────────────────────────┘

  PART 2: "The Last Algorithms Course You'll WANT"
  ┌──────────────────────────────────────────────────────────┐
  │ Mục tiêu: Sâu hơn! Những cái bạn MUỐN biết thêm!      │
  │                                                          │
  │ Nội dung:                                                │
  │ ├── Revisit some Part 1 topics (lighter versions!)      │
  │ ├── Go DEEPER on selected topics!                       │
  │ └── Brand new HARDER concepts!                          │
  │                                                          │
  │ Level: Intermediate → Advanced                          │
  │ Style: PURE WHITEBOARD! Không code trên máy!            │
  │                                                          │
  │ "I've never done anything purely on a whiteboard,        │
  │  this will be my first whiteboarding experience." — Prime│
  └──────────────────────────────────────────────────────────┘
```

### Tên Khoá Nói Lên Tất Cả:

- **"Need"** = bạn CẦN biết để có việc, pass interview, hiểu nền tảng
- **"Want"** = bạn MUỐN biết vì chúng FUN, vì chúng mở rộng tầm hiểu biết, vì bạn đã vượt qua ngưỡng "cần" và bây giờ muốn đi sâu hơn

> _"It'll be very, very much so fun. You'll understand at the end why we called it this."_ — Prime

Khoá Part 2 không phải là survival kit — nó là playground cho những ai đã có nền tảng và muốn **thưởng thức** algorithms ở level cao hơn.

---

## §2. Whiteboard-Only Approach — "My First Whiteboarding Experience!"

> Prime: _"I've always done things behind those nice keyboard keys with the Vim terminal, so this is kind of a new experience for me."_

```
WHITEBOARD vs CODE EDITOR:
═══════════════════════════════════════════════════════════════

  CODE EDITOR (Part 1):
  ┌──────────────────────────────────────────────────────────┐
  │ vim terminal                                             │
  │ ├── Syntax highlighting                                 │
  │ ├── Auto-completion                                     │
  │ ├── Compiler catches errors                             │
  │ ├── Run & test immediately                              │
  │ └── Focus: implementation details!                      │
  └──────────────────────────────────────────────────────────┘

  WHITEBOARD (Part 2):
  ┌──────────────────────────────────────────────────────────┐
  │ marker + eraser                                          │
  │ ├── Không syntax highlighting                           │
  │ ├── Vẽ diagrams trực tiếp                              │
  │ ├── Focus: THINKING PROCESS!                            │
  │ ├── Giống real interview environment!                   │
  │ └── Force understanding concept, không copy-paste!      │
  └──────────────────────────────────────────────────────────┘
```

### Tại Sao Whiteboard Quan Trọng?

Whiteboard approach quan trọng vì nhiều lý do:

1. **Interview simulation:** Hầu hết Big Tech interviews đều dùng whiteboard hoặc collaborative editor. Bạn không có IDE, không có autocomplete, không có Google. Khả năng giải thích tư duy trên whiteboard là kỹ năng **sống còn** trong phỏng vấn.

2. **Force conceptual understanding:** Khi không có compiler, bạn **buộc phải hiểu** algorithm ở level concept thay vì chỉ biết syntax. Đây là level hiểu biết sâu hơn.

3. **Visual thinking:** Whiteboard cho phép vẽ diagrams, arrows, trees, graphs — những thứ **không thể diễn tả** chỉ bằng code. Nhiều advanced algorithms chỉ "click" khi bạn thấy visual representation.

4. **Communication skill:** Senior engineers cần giải thích complex algorithms cho team. Whiteboard là công cụ giao tiếp tự nhiên nhất.

```
WHITEBOARD THINKING PROCESS:
═══════════════════════════════════════════════════════════════

  Step 1: UNDERSTAND — Vẽ input/output!
  ┌─────────────────────┐
  │ Input: [3,1,4,1,5]  │
  │ Output: [1,1,3,4,5] │
  │ Constraint: O(nlogn)│
  └─────────────────────┘

  Step 2: EXPLORE — Vẽ ví dụ nhỏ!
  ┌─────────────────────┐
  │ [3,1] → [1,3] ✓    │
  │ [3,1,4] → ???       │
  │ Divide? Merge?      │
  └─────────────────────┘

  Step 3: PLAN — Vẽ flow!
  ┌─────────────────────┐
  │ [3,1,4,1,5]         │
  │   ↓ split            │
  │ [3,1] [4,1,5]       │
  │   ↓     ↓            │
  │ [1,3] [1,4,5]       │
  │   ↓ merge            │
  │ [1,1,3,4,5] ✓       │
  └─────────────────────┘

  Step 4: CODE — Pseudocode trên board!
  Step 5: VERIFY — Walk through ví dụ!
```

---

## §3. Course Structure — "Same Material Deeper, Harder Concepts!"

> Prime: _"This course will cover some of the same material, some in way lighter versions just so we make sure we're all on the exact same page, and some in much deeper style because we have to be able to take that to the next concept which is inevitably harder."_

```
COURSE STRUCTURE:
═══════════════════════════════════════════════════════════════

  Layer 1: REVIEW (lighter versions!)
  ┌──────────────────────────────────────────────────────────┐
  │ Revisit Part 1 topics!                                   │
  │ → Ensure everyone on same page!                          │
  │ → Quick recap, not full lesson!                          │
  │ → "Some in way lighter versions" — Prime                │
  └──────────────────────────────────────────────────────────┘
       │
       ▼
  Layer 2: DEEPEN (much deeper style!)
  ┌──────────────────────────────────────────────────────────┐
  │ Go deeper on selected Part 1 topics!                     │
  │ → New perspectives, edge cases, optimizations!           │
  │ → "Some in much deeper style" — Prime                   │
  │ → BUILDING BLOCKS cho Layer 3!                           │
  └──────────────────────────────────────────────────────────┘
       │
       ▼
  Layer 3: NEW CONCEPTS (harder!)
  ┌──────────────────────────────────────────────────────────┐
  │ Brand new algorithms + data structures!                  │
  │ → "Inevitably harder than the previous one" — Prime     │
  │ → Requires Layer 1 + 2 knowledge!                       │
  │ → "The ones I liked the most" — Prime                   │
  └──────────────────────────────────────────────────────────┘
```

### Triết Lý Chọn Nội Dung:

Prime rất thẳng thắn về cách chọn nội dung:

> _"I really am only picking the ones that I just think are the most fun that aren't like your intro level algorithms."_

Đây không phải khoá dạy linked list, stack, queue lại từ đầu. Đây là khoá cho những ai **đã vượt qua** giai đoạn đó và muốn khám phá **những algorithm thú vị hơn**. Prime không chọn theo mức "cần biết" — mà theo mức **"thú vị nhất"**.

```
PRIME'S SELECTION CRITERIA:
═══════════════════════════════════════════════════════════════

  ❌ KHÔNG có trong Part 2:
  → Linked List (basic!)      "No linked list today"
  → Stack (basic!)            "No stacks"
  → Queue (basic!)            "No queues"
  → Basic sorting (đã học!)
  → Basic tree traversal (đã học!)

  ✅ CÓ trong Part 2:
  → Algorithms Prime thấy FUN nhất!
  → "Not your intro level algorithms!"
  → CÓ mention stacks/queues khi CẦN cho concept mới!
     "Though I may say the word linked list,
      there will be no stacks, queues,
      but we will use stacks and queues
      or talk about them." — Prime
```

---

## §4. Prerequisites — "Trees, Recursion, Stacks, Queues!"

> Prime: _"I kind of have an expectation that you have a basic level of understanding of algorithms. You know how to walk a tree, everyone here is comfortable with recursion, right?"_

```
PREREQUISITES — PHẢI BIẾT TRƯỚC:
═══════════════════════════════════════════════════════════════

  ✅ PHẢI thoải mái với:

  1. RECURSION:
     → Base case + recursive case!
     → Call stack! Stack overflow!
     → "Everyone comfortable with recursion?" — Prime
     → "Some joke about knowing recursion requires
        you to know recursion." — Prime 😂

  2. TREE TRAVERSAL:
     → Pre-order, In-order, Post-order (DFS!)
     → Level-order (BFS!)
     → "You know how to walk a tree" — Prime

  3. BASIC DATA STRUCTURES:
     → Linked List (concept!)
     → Stack (LIFO!)
     → Queue (FIFO!)
     → Array (real vs JS "array"!)

  4. BIG O NOTATION:
     → O(1), O(log n), O(n), O(n log n), O(n²)
     → Time vs Space complexity!

  5. SORTING BASICS:
     → Bubble Sort, QuickSort (concept!)
     → Why different sorts for different cases!

  6. GRAPH BASICS:
     → Adjacency Matrix vs List!
     → BFS, DFS on graphs!
     → Dijkstra's (concept!)
```

---

## §5. Tại Sao "Want"? — "These Are the Fun Ones!"

> Prime: _"I really am only picking the ones that I just think are the most fun."_

### Sự Khác Biệt Giữa "Need" và "Want"

Trong học thuật và career development, có 2 loại kiến thức:

**"Need" knowledge** — kiến thức **bắt buộc**:

- Bạn CẦN biết Big O để đọc documentation
- Bạn CẦN biết linked list để hiểu stacks/queues
- Bạn CẦN biết tree traversal để work với DOM, AST
- Bạn CẦN pass interview → learn algorithms

**"Want" knowledge** — kiến thức **đam mê**:

- Bạn MUỐN biết tại sao B-tree tối ưu cho disk I/O
- Bạn MUỐN hiểu Prim vs Kruskal cho minimum spanning tree
- Bạn MUỐN implement skip list vì nó elegant
- Bạn MUỐN hiểu dynamic programming vì nó mind-blowing

Ranh giới giữa "need" và "want" mờ dần khi bạn tiến bộ. Những thứ "want" hôm nay sẽ trở thành "need" khi bạn đối mặt với bài toán phức tạp hơn.

```
CAREER LEVEL vs KNOWLEDGE:
═══════════════════════════════════════════════════════════════

  Junior:
  ├── NEED: Big O, arrays, sorting, linked list ← Part 1!
  └── WANT: trees, graphs, DP ← "nice to have"

  Mid-level:
  ├── NEED: trees, graphs, BFS/DFS ← from Part 1!
  └── WANT: advanced trees, DP, graph algorithms ← Part 2!

  Senior:
  ├── NEED: DP, advanced graphs, system design
  └── WANT: specialized algorithms, research papers

  Staff/Principal:
  ├── NEED: algorithm DESIGN, complexity analysis
  └── WANT: cutting-edge research, novel approaches

  → Part 2 đưa bạn từ Mid → Senior territory!
  → "Want" hôm nay = "Need" của ngày mai!
```

---

## §6. Deep Dive: Tổng Quan Kiến Thức Nền Tảng Cần Có

### 6.1. Recursion — "Biết Recursion Yêu Cầu Bạn Biết Recursion"

Prime đùa nhưng đây là truth: recursion là **nền tảng** cho hầu hết advanced algorithms. Nếu bạn không thoải mái với recursion, Part 2 sẽ cực kỳ khó.

```
RECURSION — MENTAL MODEL:
═══════════════════════════════════════════════════════════════

  Recursion = function gọi chính nó!

  function factorial(n) {
    if (n <= 1) return 1;        ← BASE CASE! Dừng ở đây!
    return n * factorial(n - 1);  ← RECURSIVE CASE! Gọi lại!
  }

  CALL STACK cho factorial(4):
  ┌────────────────────────┐
  │ factorial(1) → return 1│ ← Base case! Bắt đầu unwinding!
  ├────────────────────────┤
  │ factorial(2) → 2 * ?   │ ← Chờ factorial(1)!
  ├────────────────────────┤
  │ factorial(3) → 3 * ?   │ ← Chờ factorial(2)!
  ├────────────────────────┤
  │ factorial(4) → 4 * ?   │ ← Chờ factorial(3)!
  └────────────────────────┘

  Unwinding (trở lại):
  factorial(1) = 1
  factorial(2) = 2 * 1 = 2
  factorial(3) = 3 * 2 = 6
  factorial(4) = 4 * 6 = 24 ✅

  3 THÀNH PHẦN CỦA MỌI RECURSION:
  1. BASE CASE — khi nào DỪNG?
  2. RECURSIVE CASE — làm gì rồi gọi lại?
  3. CONVERGENCE — mỗi bước TIẾN GẦN base case!
```

### 6.2. Tree Walking — "Bạn Biết Đi Trên Cây Chưa?"

```
TREE TRAVERSALS — 4 CÁCH ĐI:
═══════════════════════════════════════════════════════════════

  Tree:
          7
        /   \
       3     15
      / \   /  \
     1   5 9   20

  1. PRE-ORDER (Node → Left → Right):
     Visit: 7, 3, 1, 5, 15, 9, 20
     → "Thăm node TRƯỚC khi đi xuống!"

  2. IN-ORDER (Left → Node → Right):
     Visit: 1, 3, 5, 7, 9, 15, 20
     → "Sorted order cho BST!"

  3. POST-ORDER (Left → Right → Node):
     Visit: 1, 5, 3, 9, 20, 15, 7
     → "Thăm node SAU khi thăm hết con!"

  4. LEVEL-ORDER / BFS (Level by level):
     Visit: 7, 3, 15, 1, 5, 9, 20
     → "Dùng Queue! Không dùng recursion!"
```

### 6.3. Big O — Bảng Tóm Tắt

```
BIG O CHEAT SHEET:
═══════════════════════════════════════════════════════════════

  O(1)      │ Constant  │ Hash lookup, array index
  O(log n)  │ Logarithm │ Binary search, balanced BST
  O(n)      │ Linear    │ Linear search, single loop
  O(n log n)│ Linearithm│ Merge sort, heap sort
  O(n²)     │ Quadratic │ Bubble sort, nested loops
  O(2ⁿ)     │ Exponential│ Recursive fibonacci (naive!)
  O(n!)     │ Factorial │ Permutations, brute force

  Speed ranking (fastest → slowest):
  O(1) > O(log n) > O(n) > O(n log n) > O(n²) > O(2ⁿ) > O(n!)

  Với n = 1,000,000:
  O(1)      = 1 operation
  O(log n)  = ~20 operations
  O(n)      = 1,000,000 operations
  O(n log n)= ~20,000,000 operations
  O(n²)     = 1,000,000,000,000 operations 💀
```

---

## §7. Tự Code: Ôn Tập Nhanh Cấu Trúc Dữ Liệu Nền Tảng from Scratch

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 1: LINKED LIST (ôn tập — prerequisite!)
// ═══════════════════════════════════════════════════════════

class ListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.length = 0;
  }

  // Thêm vào cuối: O(n)
  append(value) {
    const node = new ListNode(value);
    if (!this.head) {
      this.head = node;
    } else {
      let current = this.head;
      while (current.next) current = current.next;
      current.next = node;
    }
    this.length++;
  }

  // Thêm vào đầu: O(1)
  prepend(value) {
    const node = new ListNode(value);
    node.next = this.head;
    this.head = node;
    this.length++;
  }

  // Tìm kiếm: O(n)
  find(value) {
    let current = this.head;
    while (current) {
      if (current.value === value) return current;
      current = current.next;
    }
    return null;
  }

  // In ra: O(n)
  print() {
    const values = [];
    let current = this.head;
    while (current) {
      values.push(current.value);
      current = current.next;
    }
    return values.join(" → ");
  }
}

// Demo:
const list = new LinkedList();
list.append(1);
list.append(2);
list.append(3);
console.log(list.print()); // "1 → 2 → 3"
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 2: STACK (ôn tập — prerequisite!)
// ═══════════════════════════════════════════════════════════

// Stack = LIFO (Last In, First Out!)
// Giống chồng đĩa: đĩa cuối đặt lên = đĩa đầu lấy ra!

class Stack {
  constructor() {
    this.items = []; // Dùng array đơn giản
    this.length = 0;
  }

  // Push: thêm vào đỉnh! O(1)
  push(value) {
    this.items[this.length] = value;
    this.length++;
  }

  // Pop: lấy từ đỉnh! O(1)
  pop() {
    if (this.length === 0) return undefined;
    this.length--;
    const value = this.items[this.length];
    this.items.length = this.length;
    return value;
  }

  // Peek: xem đỉnh không lấy! O(1)
  peek() {
    if (this.length === 0) return undefined;
    return this.items[this.length - 1];
  }

  isEmpty() {
    return this.length === 0;
  }
}

// Demo:
const stack = new Stack();
stack.push(1);
stack.push(2);
stack.push(3);
console.log(stack.pop()); // 3 (last in, first out!)
console.log(stack.peek()); // 2 (xem nhưng không lấy!)
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 3: QUEUE (ôn tập — prerequisite!)
// ═══════════════════════════════════════════════════════════

// Queue = FIFO (First In, First Out!)
// Giống xếp hàng: người đến trước = được phục vụ trước!

class Queue {
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  // Enqueue: thêm vào cuối! O(1)
  enqueue(value) {
    const node = { value, next: null };
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
  }

  // Dequeue: lấy từ đầu! O(1)
  dequeue() {
    if (!this.head) return undefined;
    const value = this.head.value;
    this.head = this.head.next;
    if (!this.head) this.tail = null;
    this.length--;
    return value;
  }

  peek() {
    return this.head?.value;
  }
  isEmpty() {
    return this.length === 0;
  }
}

// Demo:
const queue = new Queue();
queue.enqueue("A");
queue.enqueue("B");
queue.enqueue("C");
console.log(queue.dequeue()); // 'A' (first in, first out!)
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 4: BINARY TREE TRAVERSALS (ôn tập — prerequisite!)
// ═══════════════════════════════════════════════════════════

class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

// Build tree:
//        7
//      /   \
//     3     15
//    / \   /  \
//   1   5 9   20

function buildSampleTree() {
  const root = new TreeNode(7);
  root.left = new TreeNode(3);
  root.right = new TreeNode(15);
  root.left.left = new TreeNode(1);
  root.left.right = new TreeNode(5);
  root.right.left = new TreeNode(9);
  root.right.right = new TreeNode(20);
  return root;
}

// ═══ DFS: Pre-order (Node → Left → Right) ═══
function preOrder(node, result = []) {
  if (!node) return result;
  result.push(node.value); // ← VISIT node TRƯỚC!
  preOrder(node.left, result); // ← Đi trái!
  preOrder(node.right, result); // ← Đi phải!
  return result;
}

// ═══ DFS: In-order (Left → Node → Right) ═══
function inOrder(node, result = []) {
  if (!node) return result;
  inOrder(node.left, result); // ← Đi trái TRƯỚC!
  result.push(node.value); // ← VISIT node ở GIỮA!
  inOrder(node.right, result); // ← Đi phải!
  return result;
}

// ═══ DFS: Post-order (Left → Right → Node) ═══
function postOrder(node, result = []) {
  if (!node) return result;
  postOrder(node.left, result); // ← Đi trái!
  postOrder(node.right, result); // ← Đi phải!
  result.push(node.value); // ← VISIT node CUỐI!
  return result;
}

// ═══ BFS: Level-order (dùng Queue!) ═══
function levelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = new Queue();
  queue.enqueue(root);

  while (!queue.isEmpty()) {
    const node = queue.dequeue();
    result.push(node.value);
    if (node.left) queue.enqueue(node.left);
    if (node.right) queue.enqueue(node.right);
  }
  return result;
}

// Demo:
const tree = buildSampleTree();
console.log("Pre-order:", preOrder(tree)); // [7,3,1,5,15,9,20]
console.log("In-order:", inOrder(tree)); // [1,3,5,7,9,15,20]
console.log("Post-order:", postOrder(tree)); // [1,5,3,9,20,15,7]
console.log("Level-order:", levelOrder(tree)); // [7,3,15,1,5,9,20]
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 5: RECURSION PATTERNS (ôn tập — prerequisite!)
// ═══════════════════════════════════════════════════════════

// Pattern 1: ACCUMULATE (tích luỹ kết quả!)
function sum(arr, i = 0) {
  if (i >= arr.length) return 0; // Base case!
  return arr[i] + sum(arr, i + 1); // Accumulate!
}
console.log(sum([1, 2, 3, 4])); // 10

// Pattern 2: DIVIDE AND CONQUER (chia để trị!)
function mergeSort(arr) {
  if (arr.length <= 1) return arr; // Base case!

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid)); // Divide left!
  const right = mergeSort(arr.slice(mid)); // Divide right!

  return merge(left, right); // Conquer!
}

function merge(left, right) {
  const result = [];
  let i = 0,
    j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  while (i < left.length) result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);
  return result;
}

console.log(mergeSort([3, 1, 4, 1, 5, 9, 2, 6]));
// [1, 1, 2, 3, 4, 5, 6, 9]

// Pattern 3: BACKTRACKING (thử → sai → quay lại!)
function permutations(arr, start = 0, result = []) {
  if (start === arr.length) {
    result.push([...arr]);
    return result;
  }

  for (let i = start; i < arr.length; i++) {
    [arr[start], arr[i]] = [arr[i], arr[start]]; // Swap!
    permutations(arr, start + 1, result); // Recurse!
    [arr[start], arr[i]] = [arr[i], arr[start]]; // Un-swap!
  }

  return result;
}

console.log(permutations([1, 2, 3]));
// [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,2,1], [3,1,2]]

// Pattern 4: MEMOIZATION (nhớ kết quả đã tính!)
function fibonacci(n, memo = {}) {
  if (n <= 1) return n; // Base case!
  if (memo[n] !== undefined) return memo[n]; // Đã tính rồi!
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}

console.log(fibonacci(50)); // 12586269025
// Không memo: O(2^n) → VỚI memo: O(n)! Cực kỳ nhanh!
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 6: QUICKSORT (ôn tập — prerequisite!)
// ═══════════════════════════════════════════════════════════

function quickSort(arr, lo = 0, hi = arr.length - 1) {
  if (lo >= hi) return arr; // Base case!

  const pivotIdx = partition(arr, lo, hi);
  quickSort(arr, lo, pivotIdx - 1); // Sort left!
  quickSort(arr, pivotIdx + 1, hi); // Sort right!
  return arr;
}

function partition(arr, lo, hi) {
  const pivot = arr[hi]; // Chọn phần tử cuối làm pivot!
  let i = lo - 1;

  for (let j = lo; j < hi; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap!
    }
  }

  [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]]; // Pivot vào đúng vị trí!
  return i + 1;
}

console.log(quickSort([3, 6, 8, 10, 1, 2, 1]));
// [1, 1, 2, 3, 6, 8, 10]

// Time: O(n log n) average, O(n²) worst (sorted array!)
// Space: O(log n) recursion stack!
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 7: GRAPH BASICS (ôn tập — prerequisite!)
// ═══════════════════════════════════════════════════════════

// ═══ Adjacency List (phổ biến nhất!) ═══
class Graph {
  constructor() {
    this.adjacencyList = new Map();
  }

  addVertex(v) {
    if (!this.adjacencyList.has(v)) {
      this.adjacencyList.set(v, []);
    }
  }

  addEdge(v1, v2, weight = 1) {
    this.adjacencyList.get(v1).push({ node: v2, weight });
    this.adjacencyList.get(v2).push({ node: v1, weight }); // Undirected!
  }

  // BFS: O(V + E)
  bfs(start) {
    const visited = new Set();
    const result = [];
    const queue = new Queue();

    visited.add(start);
    queue.enqueue(start);

    while (!queue.isEmpty()) {
      const vertex = queue.dequeue();
      result.push(vertex);

      for (const neighbor of this.adjacencyList.get(vertex)) {
        if (!visited.has(neighbor.node)) {
          visited.add(neighbor.node);
          queue.enqueue(neighbor.node);
        }
      }
    }
    return result;
  }

  // DFS: O(V + E)
  dfs(start, visited = new Set(), result = []) {
    visited.add(start);
    result.push(start);

    for (const neighbor of this.adjacencyList.get(start)) {
      if (!visited.has(neighbor.node)) {
        this.dfs(neighbor.node, visited, result);
      }
    }
    return result;
  }
}

// Demo:
const g = new Graph();
["A", "B", "C", "D", "E"].forEach((v) => g.addVertex(v));
g.addEdge("A", "B");
g.addEdge("A", "C");
g.addEdge("B", "D");
g.addEdge("C", "E");

console.log("BFS:", g.bfs("A")); // ['A', 'B', 'C', 'D', 'E']
console.log("DFS:", g.dfs("A")); // ['A', 'B', 'D', 'C', 'E']
```

---

## §8. Deep Dive: Mindset Cho Advanced Algorithms

### Từ "Need" Đến "Want" — Sự Chuyển Hoá Tư Duy

Khi bạn học Part 1, bạn học vì **cần** — pass interview, understand code, be a better developer. Nhưng ở Part 2, Prime muốn bạn học vì **muốn** — vì algorithms đẹp, vì chúng elegant, vì chúng thay đổi cách bạn suy nghĩ.

```
MINDSET SHIFT:
═══════════════════════════════════════════════════════════════

  Part 1 Mindset (NEED):
  "Tôi phải biết binary search để pass interview."
  → Motivation: fear of failure!
  → Focus: memorize patterns!
  → Result: temporary knowledge (atrophy in 6 months!)

  Part 2 Mindset (WANT):
  "Tôi muốn hiểu TẠI SAO B-tree optimal cho disk I/O."
  → Motivation: curiosity!
  → Focus: understand WHY!
  → Result: deep, lasting knowledge!

  "It'll be very, very much so fun." — Prime
  → Fun = intrinsic motivation!
  → Intrinsic motivation = deeper learning!
  → Deeper learning = longer retention!
```

### Advanced Algorithms Thinking

```
5 CẤP ĐỘ HIỂU ALGORITHM:
═══════════════════════════════════════════════════════════════

  Level 1: BIẾT TÊN
  → "Dijkstra là shortest path algorithm."
  → Chưa đủ! Chỉ biết tên!

  Level 2: BIẾT DÙNG KHI NÀO
  → "Dùng Dijkstra khi cần shortest path
     trong weighted graph không có negative edges."
  → OK cho Junior!

  Level 3: BIẾT TẠI SAO NÓ HOẠT ĐỘNG
  → "Dijkstra dùng greedy approach: luôn chọn
     node chưa visit có distance nhỏ nhất.
     Hoạt động vì không có negative edges
     → distance không bao giờ giảm sau khi visit."
  → Part 1 level!

  Level 4: BIẾT CÁCH BIẾN THỂ
  → "Bellman-Ford handle negative edges.
     A* thêm heuristic cho speed.
     Floyd-Warshall cho all-pairs shortest path."
  → Part 2 level! ← BẠN CẦN ĐẠT!

  Level 5: BIẾT TẠO RA CÁI MỚI
  → "Tôi cần shortest path nhưng edges thay đổi
     theo thời gian → tôi modify Dijkstra
     với lazy deletion và re-insertion."
  → Senior/Staff level!
```

### Recursion Joke Giải Thích

> _"Some joke about knowing recursion requires you to know recursion."_ — Prime

Đây không chỉ là joke. Nó phản ánh bản chất self-referential của recursion:

```
RECURSION JOKE — GIẢI THÍCH:
═══════════════════════════════════════════════════════════════

  Để hiểu recursion, bạn phải hiểu recursion.
  Để hiểu recursion, bạn phải hiểu recursion.
  Để hiểu recursion, bạn phải hiểu recursion.
  ...
  → Không có BASE CASE! → Stack Overflow! 💀

  Phiên bản đúng:
  Để hiểu recursion:
    1. Nếu bạn đã hiểu → DONE (base case!)
    2. Nếu chưa → đọc lại từ đầu (recursive case!)

  Google cũng tham gia joke:
  Search "recursion" trên Google
  → "Did you mean: recursion" 😂
```

---

## Checklist

```
[ ] Part 2 = "Want" (fun!) vs Part 1 = "Need" (essential!)
[ ] Whiteboard-only: first whiteboarding experience for Prime!
[ ] 3 layers: Review (lighter) → Deepen → New harder concepts!
[ ] No linked list, stack, queue AS topics (but referenced!)
[ ] "Only picking ones I think are the most fun" — Prime
[ ] Prerequisites: recursion, trees, BFS/DFS, Big O, sorting, graphs!
[ ] "Comfortable with recursion?" ← MUST answer YES!
[ ] Part 2 = mid→senior territory algorithms!
[ ] Fun = intrinsic motivation = deeper learning = longer retention!
[ ] "You'll understand at the end why we called it 'Want'" — Prime
TIẾP THEO → Phần 2: [Next Topic]!
```
