# 🛤️ Binary Tree Paths — LeetCode #257 (Easy)

> 📖 Code: [Binary Tree Paths.js](./Binary%20Tree%20Paths.js)

---

## R — Repeat & Clarify

🧠 *"Trả về TẤT CẢ đường root→leaf dạng string. Trick: string immutable = tự backtrack!"*

> 🎙️ *"The problem asks me to return all root-to-leaf paths as an array of strings, where values are separated by '->'."*

> 🎙️ *"Let me clarify a few things:*
>
> *1. **Format?** — Each path is a string like '1->2->5' (values separated by '->').*
>
> *2. **Empty tree?** — Return empty array `[]`.*
>
> *3. **Single node?** — Return `['val']` (just the root value, no arrows).*
>
> *4. **What counts as a 'path'?** — Only root-to-LEAF. Must start at root and end at a node with NO children.*
>
> *5. **Do I return just one path or ALL?** — ALL paths.*
>
> *6. **Can values be negative?** — Yes, e.g. tree [-1, -2, 3] → ['-1->-2', '-1->3'].*
>
> *7. **Can values be multi-digit?** — Yes, e.g. [100, 200] → ['100->200']."*

💡 **Tại sao bài này quan trọng?**
```
Bài này là NỀN TẢNG cho:
→ #112 Path Sum (kiểm tra 1 path)
→ #113 Path Sum II (tìm paths thỏa condition)
→ #437 Path Sum III (paths bắt đầu bất kỳ)
→ #988 Smallest String Starting From Leaf
→ #129 Sum Root to Leaf Numbers
→ Backtracking nói chung!

Nếu hiểu Binary Tree Paths → hiểu pattern "DFS + track path"!
```

---

## E — Examples

> 🎙️ *"Let me draw out some examples to build intuition:"*

```
VÍ DỤ 1 — NORMAL:
     1
    / \
   2   3       Output: ["1->2->5", "1->3"]
    \
     5

  Paths: 
    ① Root(1) → Left(2) → Right(5)  = "1->2->5"
    ② Root(1) → Right(3)            = "1->3"
  
  2 paths vì có 2 LEAVES (5 và 3)!
  
  ⚠️ Chú ý: node 2 KHÔNG PHẢI leaf (có con phải=5)!
  → không tạo path "1->2"!

VÍ DỤ 2 — SINGLE NODE:
     1         Output: ["1"]
  
  Root là leaf! (không con) → trả về root value string!
  ⚠️ KHÔNG có "->" vì chỉ 1 node!
  ⚠️ Trả về STRING "1", không phải NUMBER 1!

VÍ DỤ 3 — FULL TREE (4 leaves = 4 paths):
     1
    / \
   2   3       Output: ["1->2->4", "1->2->5", "1->3->6", "1->3->7"]
  / \ / \
 4  5 6  7    
 
  Mỗi leaf tạo ĐÚNG 1 path.
  Total paths = total leaves!

VÍ DỤ 4 — LEFT SKEWED:
     1
    /
   2           Output: ["1->2->3"]
  /
 3             Chỉ 1 leaf = 1 path!

VÍ DỤ 5 — RIGHT SKEWED:
  1
   \
    2          Output: ["1->2->3"]
     \
      3        Giống left skewed nhưng ngược hướng.

VÍ DỤ 6 — NULL:
  null         Output: []
               Không có cây = không có path!

VÍ DỤ 7 — NEGATIVE VALUES:
    -1
    / \
  -2   3       Output: ["-1->-2", "-1->3"]
  
  Giá trị âm → dấu "-" xuất hiện tự nhiên trong string!
  Không cần xử lý đặc biệt!
```

🧠 *"Observation cực quan trọng: SỐ PATHS = SỐ LEAVES! Mỗi leaf tạo đúng 1 path unique."*

---

## CHIA NHỎ BÀI TOÁN — Xây dựng intuition từ số 0

> 🎙️ *"Trước khi code, hãy xây dựng giải pháp từ bài toán nhỏ nhất:"*

### Bước 1: Cây 1 node — Base case

```
  Input:   [5]
  Tree:     5      ← root cũng là leaf (không có con)
  
  Output:  ["5"]   ← chỉ 1 path, chỉ 1 giá trị

  Logic khám phá:
    → Đến node → THÊM giá trị vào path → "5"
    → Kiểm tra: có con không? → KHÔNG → đây là LEAF!
    → Lưu path "5" vào result!
    
  Rút ra: if (node is leaf) → save current path!
```

### Bước 2: Cây 2 nodes — Forward path building

```
   1        
  /         
 2          

  Đến node 1: path = "" → thêm 1 → path = "1"
    → Có con? CÓ (left=2) → CHƯA LÀ leaf → THÊM separator "->"
    → path = "1->"
    
  Đến node 2: path = "1->" → thêm 2 → path = "1->2"
    → Có con? KHÔNG → ĐÂY LÀ LEAF!
    → Save "1->2" vào result!
    
  Output: ["1->2"] ✅

  Rút ra 2 things:
    1. Thêm value TRƯỚC, rồi check leaf
    2. Thêm "->" CHỈ KHI KHÔNG PHẢI LEAF (separator giữa values)
```

### Bước 3: Cây 3 nodes — VẤN ĐỀ BACKTRACKING xuất hiện!

```
   1        
  / \       
 2   3      

  DFS: đi LEFT trước!
  
  Đến 1:  path = "1"      (not leaf, thêm "->")  path = "1->"
  Đến 2:  path = "1->2"   (LEAF! Save!)
  
  ⚠️ BÂY GIỜ: quay về node 1 để đi RIGHT
  
  CÂU HỎI QUAN TRỌNG: path lúc quay về = GÌ?
  
  ═══════════════════════════════════════════════════════════════
  NẾU path = "1->2"  → đi right → "1->2->3" → ❌ SAI!
  NẾU path = "1->"   → đi right → "1->3"    → ✅ ĐÚNG!
  ═══════════════════════════════════════════════════════════════
  
  → Phải "QUAY LẠI" path từ "1->2" về "1->" 
  → Đây gọi là BACKTRACKING!
  
  Nhưng LÀM SAO quay lại?
  → Cách 1: Dùng ARRAY, pop() để xóa phần tử cuối
  → Cách 2: Dùng STRING... không cần làm gì! Vì string IMMUTABLE!
```

### Bước 4: Hiểu BACKTRACKING qua JavaScript Memory Model

```
═══════════════════════════════════════════════════════════════
         JAVASCRIPT MEMORY — STRING vs ARRAY
═══════════════════════════════════════════════════════════════

📌 NGUYÊN TẮC QUAN TRỌNG:

  JavaScript PRIMITIVE (string, number, boolean):
    → Truyền vào function = COPY GIÁ TRỊ
    → Function con KHÔNG THỂ thay đổi giá trị của cha!
    → Giống photocopy: sửa bản photo, bản gốc không đổi!

  JavaScript OBJECT (array, object):
    → Truyền vào function = COPY THAM CHIẾU (reference)
    → Function con CÓ THỂ thay đổi object gốc!
    → Giống đưa chìa khóa: ai có chìa cũng mở cùng 1 cửa!

═══════════════════════════════════════════════════════════════

🖼️ HÌNH DUNG BỘ NHỚ — STRING:

  STACK (Call Stack)              HEAP (Memory)
  ┌─────────────────┐
  │ dfs(1):          │            ┌──────┐
  │   path ──────────┼──────────→ │ "1->"│ ← vùng nhớ A
  │                  │            └──────┘
  │ ┌───────────────┐│            ┌────────┐
  │ │ dfs(2):       ││            │ "1->2" │ ← vùng nhớ B (MỚI!)
  │ │   path ───────┼┼──────────→ └────────┘
  │ │               ││
  │ │  (path += "2")││  ← tạo string MỚI "1->2" trên heap
  │ │               ││    biến path ở dfs(2) TRỎ SANG B
  │ │               ││    biến path ở dfs(1) VẪN TRỎ A!
  │ └───────────────┘│
  │                  │     
  │ dfs(1) vẫn thấy  │
  │ path = "1->"     │  ← KHÔNG ĐỔI! ✅ "Free backtrack"
  └─────────────────┘

═══════════════════════════════════════════════════════════════

🖼️ HÌNH DUNG BỘ NHỚ — ARRAY:

  STACK (Call Stack)              HEAP (Memory)
  ┌─────────────────┐
  │ dfs(1):          │            ┌────────────┐
  │   path ──────────┼──────────→ │ [1]        │ ← vùng nhớ X
  │                  │        ┌─→ └────────────┘
  │ ┌───────────────┐│        │
  │ │ dfs(2):       ││        │   
  │ │   path ───────┼┼────────┘   ← CÙNG THAM CHIẾU!
  │ │               ││
  │ │ path.push(2)  ││  ← SỬA TRỰC TIẾP vùng nhớ X!
  │ │               ││    X giờ = [1, 2]
  │ │               ││    CẢ dfs(1) VÀ dfs(2) đều THẤY [1,2]!
  │ └───────────────┘│
  │                  │
  │ dfs(1) thấy      │
  │ path = [1, 2]    │  ← BỊ ĐỔI! ❌ Phải pop() để undo!
  └─────────────────┘

═══════════════════════════════════════════════════════════════

TÓM LẠI:

  STRING:  cha truyền copy → con tạo string mới
           → cha KHÔNG BỊ ẢNH HƯỞNG
           → FREE BACKTRACK! ✅

  ARRAY:   cha truyền reference → con sửa CÙNG 1 array
           → cha BỊ ẢNH HƯỞNG
           → PHẢI BACKTRACK THỦ CÔNG (pop)! ⚠️
```

### Bước 5: CHỨNG MINH bằng code JavaScript thực tế

```javascript
// ========================
// STRING — IMMUTABLE DEMO
// ========================
function parent_string() {
  let path = "1->";
  console.log("TRƯỚC gọi child:", path);  // "1->"
  
  child_string(path);  // truyền COPY giá trị "1->"
  
  console.log("SAU gọi child:", path);    // "1->" ← KHÔNG ĐỔI!
}

function child_string(path) {
  path += "2";  // tạo string MỚI "1->2", path local trỏ sang
  console.log("Trong child:", path);      // "1->2"
  // return → path local bị destroy, string "1->2" sẽ bị GC
}

// ========================
// ARRAY — MUTABLE DEMO
// ========================
function parent_array() {
  let path = [1];
  console.log("TRƯỚC gọi child:", path);  // [1]
  
  child_array(path);  // truyền REFERENCE đến CÙNG array!
  
  console.log("SAU gọi child:", path);    // [1, 2] ← BỊ ĐỔI!
}

function child_array(path) {
  path.push(2);  // SỬA TRỰC TIẾP array gốc!
  console.log("Trong child:", path);      // [1, 2]
  // return → array VẪN BỊ ĐỔI vì cha và con dùng CÙNG 1 object!
}
```

```
KẾT QUẢ CHẠY:

  STRING:
    TRƯỚC gọi child: "1->"
    Trong child: "1->2"
    SAU gọi child: "1->"     ← ✅ KHÔNG ĐỔI!

  ARRAY:
    TRƯỚC gọi child: [1]
    Trong child: [1, 2]
    SAU gọi child: [1, 2]    ← ❌ BỊ ĐỔI!
```

---

## A — Approach

### 🔑 Core Insight: STRING IMMUTABILITY = FREE BACKTRACKING

> 🎙️ *"The key insight: in JavaScript (and Python, Java...), strings are IMMUTABLE. When I concatenate `path + node.val`, it creates a BRAND NEW string. The original string in the parent's scope is UNTOUCHED."*

> 🎙️ *"This means I get backtracking FOR FREE — no need to undo anything! Each recursive call has its own copy of the path string."*

### So sánh chi tiết STRING vs ARRAY

```
═══════════════════════════════════════════════════════════════
STRING (IMMUTABLE) — Tự backtrack!
═══════════════════════════════════════════════════════════════

  Mỗi lần path += "something":
  → JavaScript tạo STRING MỚI trên heap
  → Biến path trong scope HIỆN TẠI trỏ sang string mới
  → Biến path trong scope CHA VẪN TRỎ sang string CŨ!

  Ví dụ (call stack — SLIDE 1):
  ┌────────────────────────┐
  │ dfs(1, ""):            │
  │   path = "" + "1" = "1"│  ← string mới "1"
  │   path += "->"         │  ← string mới "1->"
  │   ├── dfs(2, "1->"):   │  ← CHA truyền GIÁ TRỊ "1->"
  │   │   path = "1->" + "2" = "1->2"│  ← string MỚI!
  │   │   LEAF! push "1->2"│
  │   │   RETURN            │
  │   │                     │
  │   │   ← path CỦA CHA = "1->" ← KHÔNG ĐỔI! ✅
  │   │                     │
  │   └── dfs(3, "1->"):   │  ← CHA vẫn truyền "1->"
  │       path = "1->" + "3" = "1->3"│  ← string MỚI!
  │       LEAF! push "1->3"│
  └────────────────────────┘

  → KẾT QUẢ: ["1->2", "1->3"] ✅
  → KHÔNG CẦN POP, KHÔNG CẦN UNDO!

═══════════════════════════════════════════════════════════════
ARRAY (MUTABLE) — Phải backtrack THỦ CÔNG!
═══════════════════════════════════════════════════════════════

  Mỗi lần path.push(val):
  → JavaScript SỬA TRỰC TIẾP array CÙNG THAM CHIẾU
  → CHA và CON dùng CÙNG 1 ARRAY!
  → SAU KHI CON RETURN, array ĐÃ BỊ SỬA!

  Ví dụ KHÔNG pop — BUG! (SLIDE 2)
  ┌────────────────────────┐
  │ dfs(1):                │
  │   path.push(1) → [1]  │
  │   ├── dfs(2):          │
  │   │   path.push(2) → [1,2]│  ← CÙNG array!
  │   │   LEAF! push "1->2"│
  │   │   RETURN            │
  │   │   path = [1, 2]    │  ← VẪN CÒN 2! ❌
  │   │                     │
  │   └── dfs(3):          │
  │       path.push(3) → [1,2,3]│  ← SAI! 
  │       push "1->2->3"   │  ← ❌ ĐÁP ÁN SAI!
  └────────────────────────┘

  FIX: path.pop() TRƯỚC khi return! (SLIDE 3)
  ┌────────────────────────┐
  │ dfs(1):                │
  │   path.push(1) → [1]  │
  │   ├── dfs(2):          │
  │   │   path.push(2) → [1,2]│
  │   │   LEAF! push "1->2"│
  │   │   path.pop() → [1] │  ← BACKTRACK! ✅
  │   │                     │
  │   └── dfs(3):          │
  │       path.push(3) → [1,3]│  ← ĐÚNG! ✅
  │       LEAF! push "1->3"│
  │       path.pop() → [1] │
  │                         │
  │   path.pop() → []       │  ← Clean up root!
  └────────────────────────┘
```

---

## C — Code

> 📖 Full code: [Binary Tree Paths.js](./Binary%20Tree%20Paths.js)

### Approach 1: String (Automatic Backtrack) — RECOMMENDED FOR INTERVIEW

```javascript
function binaryTreePaths(root) {
  const result = [];
  
  function dfs(node, path) {
    if (!node) return;          // null → nothing to do
    
    path += node.val;           // step 1: append current value
    
    if (!node.left && !node.right) {
      result.push(path);        // step 2: LEAF! save the complete path!
      return;                    // don't add "->" after leaf!
    }
    
    path += "->";               // step 3: not leaf → add arrow separator
    dfs(node.left, path);       // step 4: explore left
    dfs(node.right, path);      // step 5: explore right
    // NO CLEANUP NEEDED! String immutability handles it!
  }
  
  dfs(root, "");
  return result;
}
```

> 🎙️ *"Let me walk through EVERY design decision:*
>
> *1. **Why `path += node.val` BEFORE the leaf check?***
>
> *Because the leaf's own value is PART of the path! If I check leaf first, I'd miss adding it.*
>   ```
>   SAI:  if (isLeaf) result.push(path);  → path thiếu giá trị leaf!
>         path += node.val;
>   
>   ĐÚNG: path += node.val;               → thêm leaf value TRƯỚC!
>         if (isLeaf) result.push(path);
>   ```
>
> *2. **Why `return` after pushing leaf path?***
>
> *To avoid adding '->' after the leaf value. Without return, we'd get '1->2->5->' with a trailing arrow.*
>   ```
>   if (isLeaf) { result.push(path); }  ← KHÔNG return!
>   path += "->";                        ← THÊM arrow SAU leaf!
>   → result chứa "1->2->5" nhưng code VẪN chạy tiếp thêm "->"
>   → Không ảnh hưởng result VÌ path là string immutable!
>   → Nhưng VẪN NÊN return để skip unnecessary work!
>   ```
>
> *3. **Why add '->' AFTER the leaf check?***
>
> *Separator goes BETWEEN values, not at the end. At a leaf, there's nothing after, so no separator needed.*
>   ```
>   Path: "1" + "->" + "2" + "->" + "5"
>          val  sep    val  sep    val  ← val cuối KHÔNG có sep!
>   ```
>
> *4. **Why not `if (!node) { result.push(path); return; }`?***
>
> *Because NULL is not a leaf! A null means 'this child doesn't exist', not 'path ends here'. Pushing at null would give DUPLICATE or WRONG paths:*
>   ```
>   Tree:  1
>         / \
>        2   3
>   
>   Nếu push ở null:
>     dfs(1) → dfs(2) → dfs(null-left of 2) → push "1->2" ① 
>                      → dfs(null-right of 2) → push "1->2" ② ← DUPLICATE!
>           → dfs(3) → dfs(null-left of 3) → push "1->3" ③
>                     → dfs(null-right of 3) → push "1->3" ④ ← DUPLICATE!
>   
>   Result: ["1->2", "1->2", "1->3", "1->3"] ← ❌ DUPLICATES!
>   
>   Nếu push ở leaf (ĐÚNG):
>     dfs(1) → dfs(2) → isLeaf! push "1->2" ①
>           → dfs(3) → isLeaf! push "1->3" ②
>   
>   Result: ["1->2", "1->3"] ← ✅ CORRECT!
>   ```
>
> *5. **Why `dfs(root, "")` with empty string?***
>
> *Starting with "" means the first `path += node.val` produces "1" (for root value 1). If I started with "1" directly, I'd have to handle root separately.*"

🧠 *"Giải thích TỪNG decision = show mình UNDERSTAND code, không chỉ memorize!"*

### Approach 2: Array (Explicit Backtrack)

```javascript
function binaryTreePaths(root) {
  const result = [];
  const path = [];              // SHARED mutable array!
  
  function dfs(node) {
    if (!node) return;
    path.push(node.val);        // FORWARD: add to path
    
    if (!node.left && !node.right) {
      result.push(path.join("->"));  // LEAF! join array into string
      // ⚠️ KHÔNG return ở đây! Phải đi đến pop() ở dưới!
    }
    
    dfs(node.left);
    dfs(node.right);
    path.pop();                 // BACKTRACK: remove from path ← CRITICAL!
  }
  
  dfs(root);
  return result;
}
```

> 🎙️ *"Notice: in the array version, I DON'T return after pushing the leaf path. Why? Because I NEED to reach the `path.pop()` at the bottom to clean up. If I returned early, the leaf's value would stay in the array forever!"*

```
⚠️ SUBTLE BUG #1: RETURN SỚM KHÔNG POP

  ❌ BUG CODE:
  if (isLeaf) {
    result.push(path.join("->"));
    return;        // ← QUÊN POP! Leaf value mắc kẹt trong array!
  }
  dfs(left);
  dfs(right);
  path.pop();      // ← KHÔNG BAO GIỜ CHẠY ĐẾN ĐÂY cho leaf!

  ✅ FIX 1: Không return (để fall-through đến pop)
  if (isLeaf) {
    result.push(path.join("->"));
    // KHÔNG return! Tiếp tục xuống pop!
  }
  dfs(left);     // left = null → return ngay
  dfs(right);    // right = null → return ngay
  path.pop();    // ← ĐÂY! Pop leaf value!

  ✅ FIX 2: Pop TRƯỚC khi return
  if (isLeaf) {
    result.push(path.join("->"));
    path.pop();   // POP TRƯỚC!
    return;        // Giờ return an toàn!
  }
```

```
⚠️ SUBTLE BUG #2: JOIN VÀ SPREAD

  Khi save path ở leaf, PHẢI TẠO BẢN SAO!

  ❌ BUG: result.push(path)
  → result chứa THAM CHIẾU đến path array
  → Sau khi pop, result[0] CŨNG BỊ ĐỔI!
  → Cuối cùng result = [[], [], []] ← TẤT CẢ RỖNG!

  ✅ FIX: result.push(path.join("->"))  ← tạo string MỚI!
  HOẶC:  result.push([...path])         ← tạo array MỚI!
```

### Approach 3: Iterative (Stack)

```javascript
function binaryTreePaths(root) {
  if (!root) return [];
  const result = [];
  const stack = [[root, String(root.val)]];  // [node, pathSoFar]
  
  while (stack.length > 0) {
    const [node, path] = stack.pop();
    
    // LEAF → save path!
    if (!node.left && !node.right) {
      result.push(path);
      continue;
    }
    
    // Push children with EXTENDED path (string = immutable!)
    if (node.right) {
      stack.push([node.right, path + '->' + node.right.val]);
    }
    if (node.left) {
      stack.push([node.left, path + '->' + node.left.val]);
    }
  }
  return result;
}
```

> 🎙️ *"The iterative version stores (node, path) pairs on the stack. Each pair carries its own independent path string — same immutability trick as the recursive version. Push LEFT last so it's popped FIRST (LIFO), maintaining left-before-right order."*

### Approach 4: BFS (Queue)

```javascript
function binaryTreePaths(root) {
  if (!root) return [];
  const result = [];
  const queue = [[root, String(root.val)]];
  
  while (queue.length > 0) {
    const [node, path] = queue.shift();   // FIFO!
    
    if (!node.left && !node.right) {
      result.push(path);
      continue;
    }
    
    if (node.left) queue.push([node.left, path + '->' + node.left.val]);
    if (node.right) queue.push([node.right, path + '->' + node.right.val]);
  }
  return result;
}
```

> 🎙️ *"BFS works too but paths come in level-order instead of DFS order. Same time complexity."*

---

### Trace Chi Tiết — String Version (Cây phức tạp hơn)

```
Tree:
       1
      / \
     2   3
    / \
   4   5

════════════════════════════════════════════════════════════════

CALL: dfs(node=1, path="")
│ path += 1 → path = "1"              🔍 Heap: "1"
│ leaf? NO (left=2, right=3)
│ path += "->" → path = "1->"         🔍 Heap: "1", "1->"
│
├── CALL: dfs(node=2, path="1->")     📋 Cha truyền VALUE "1->"
│   │ path += 2 → path = "1->2"       🔍 Heap: adds "1->2"
│   │ leaf? NO (left=4, right=5)
│   │ path += "->" → path = "1->2->"  🔍 Heap: adds "1->2->"
│   │
│   ├── CALL: dfs(node=4, path="1->2->")
│   │   │ path += 4 → path = "1->2->4"  🔍 Heap: adds "1->2->4"
│   │   │ leaf? YES!
│   │   │ result.push("1->2->4") ✅     📦 result = ["1->2->4"]
│   │   │ return
│   │   │
│   │   │ ← dfs(2) scope: path VẪNVẪN = "1->2->" ✅ (immutable!)
│   │
│   └── CALL: dfs(node=5, path="1->2->")
│       │ path += 5 → path = "1->2->5"
│       │ leaf? YES!
│       │ result.push("1->2->5") ✅     📦 result = ["1->2->4", "1->2->5"]
│       │ return
│
│   ← dfs(1) scope: path VẪN = "1->" ✅ (immutable!)
│
└── CALL: dfs(node=3, path="1->")
    │ path += 3 → path = "1->3"
    │ leaf? YES!
    │ result.push("1->3") ✅           📦 result = ["1->2->4", "1->2->5", "1->3"]
    │ return

════════════════════════════════════════════════════════════════
FINAL: result = ["1->2->4", "1->2->5", "1->3"] ✅

TOTAL STRINGS CREATED ON HEAP:
  "1", "1->", "1->2", "1->2->", "1->2->4", "1->2->5", "1->3"
  = 7 strings cho 5 nodes → mỗi node tạo ~1-2 strings
  = O(n) strings × O(h) length mỗi string = O(n·h) total memory
```

### Trace Chi Tiết — Array Version (Cùng cây)

```
Same tree:    1(2(4,5), 3)
PATH = [] (shared array, 1 object trên heap!)

════════════════════════════════════════════════════════════════

CALL: dfs(1)
│ path.push(1) → path = [1]                   🏠 Heap: array X = [1]
│ leaf? NO
│
├── CALL: dfs(2)
│   │ path.push(2) → path = [1,2]             🏠 X = [1,2]
│   │ leaf? NO
│   │
│   ├── CALL: dfs(4)
│   │   │ path.push(4) → path = [1,2,4]       🏠 X = [1,2,4]
│   │   │ leaf? YES! → push "1->2->4" ✅      📦 result = ["1->2->4"]
│   │   │ (fall through — NO return!)
│   │   │ dfs(null) → return                   X unchanged
│   │   │ dfs(null) → return                   X unchanged
│   │   │ path.pop() → path = [1,2]           🏠 X = [1,2] ← BACKTRACK!
│   │
│   └── CALL: dfs(5)
│       │ path.push(5) → path = [1,2,5]       🏠 X = [1,2,5]
│       │ leaf? YES! → push "1->2->5" ✅      📦 result = ["1->2->4","1->2->5"]
│       │ dfs(null); dfs(null);
│       │ path.pop() → path = [1,2]           🏠 X = [1,2] ← BACKTRACK!
│   │
│   path.pop() → path = [1]                   🏠 X = [1] ← BACKTRACK!
│
└── CALL: dfs(3)
    │ path.push(3) → path = [1,3]             🏠 X = [1,3]
    │ leaf? YES! → push "1->3" ✅             📦 result = ["1->2->4","1->2->5","1->3"]
    │ dfs(null); dfs(null);
    │ path.pop() → path = [1]                 🏠 X = [1] ← BACKTRACK!

path.pop() → path = []                        🏠 X = [] ← BACKTRACK root!

════════════════════════════════════════════════════════════════
FINAL: result = ["1->2->4", "1->2->5", "1->3"] ✅

TOTAL HEAP IMPACT:
  Chỉ 1 array object! push/pop modify IN-PLACE!
  vs String: 7 separate string objects!
  → Array tiết kiệm memory hơn!
```

---

## ❌ Common Mistakes — LỖI HAY GẶP

### Mistake 1: Push ở NULL thay vì LEAF

```javascript
// ❌ SAI:
function dfs(node, path) {
  if (!node) {
    result.push(path);    // NULL ≠ LEAF! → DUPLICATE paths!
    return;
  }
  path += node.val + "->";
  dfs(node.left, path);
  dfs(node.right, path);
}

// Tree: 1(2, 3)
// dfs(1) → dfs(2) → dfs(null) push "1->2->" ①
//                  → dfs(null) push "1->2->" ② ← DUPLICATE!
//        → dfs(3) → dfs(null) push "1->3->" ③
//                  → dfs(null) push "1->3->" ④ ← DUPLICATE!
// Result: ["1->2->", "1->2->", "1->3->", "1->3->"] ❌
```

### Mistake 2: Trailing arrow

```javascript
// ❌ SAI:
path += node.val + "->";    // LUÔN thêm arrow, kể cả leaf!
if (isLeaf) result.push(path);
// Result: "1->2->5->" ← trailing arrow! ❌

// ✅ FIX: thêm arrow CHỈ khi KHÔNG phải leaf
path += node.val;
if (isLeaf) { result.push(path); return; }
path += "->";  // chỉ chạy khi NOT leaf!
```

### Mistake 3: Quên convert number → string

```javascript
// ❌ POTENTIAL ISSUE:
path += node.val;    // nếu path="" và val=1 → "1" ✅ (coercion)
// Nhưng nếu val=0: "" + 0 = "0" ✅ (OK vì JS coercion)
// Thực tế JS auto-convert number to string khi += string!
// Nhưng NÊN explicit: path += String(node.val) cho clarity
```

### Mistake 4: Array — quên pop() (hoặc pop sai chỗ)

```javascript
// ❌ SAI: pop trước khi recurse
path.push(node.val);
path.pop();           // POP NGAY! node.val chưa được dùng!
dfs(node.left);       // path không chứa node.val nữa!

// ❌ SAI: pop CHỈ ở 1 branch
dfs(node.left);
path.pop();          // chỉ pop sau left, không pop sau right!
dfs(node.right);     // right vẫn bị ảnh hưởng!

// ✅ ĐÚNG: pop SAU TẤT CẢ recursive calls
dfs(node.left);
dfs(node.right);
path.pop();          // pop CUỐI CÙNG sau khi xong cả 2 branches!
```

---

## T — Test

> 🎙️ *"Let me check edge cases:"*

| # | Test | Input | Expected | Tại sao test? |
|---|---|---|---|---|
| 1 | Normal | `[1,2,3,null,5]` | `["1->2->5","1->3"]` | Core case |
| 2 | Single | `[1]` | `["1"]` | Root = leaf, no arrows |
| 3 | Empty | null | `[]` | Empty tree |
| 4 | Full tree | `[1,2,3,4,5,6,7]` | 4 paths | All leaves |
| 5 | Left skewed | `[1,2,null,3]` | `["1->2->3"]` | Only 1 path |
| 6 | Right skewed | `[1,null,2,null,3]` | `["1->2->3"]` | Only 1 path |
| 7 | Negative | `[-1,-2,3]` | `["-1->-2","-1->3"]` | Neg values |
| 8 | Large val | `[100,200,300]` | `["100->200","100->300"]` | Multi-digit |
| 9 | Zero | `[0,0,0]` | `["0->0","0->0"]` | Zero edge case |
| 10 | Deep | `[1,2,null,3,null,4]` | `["1->2->3->4"]` | Deep chain |

---

## O — Optimize

```
CHI TIẾT COMPLEXITY — 4 APPROACHES:
═══════════════════════════════════════════════════════════════

┌──────────────┬────────────────────┬────────────────────┬──────────────┬──────────────┐
│              │ String (Recur)     │ Array (Recur)      │ Iterative    │ BFS          │
├──────────────┼────────────────────┼────────────────────┼──────────────┼──────────────┤
│ Time         │ O(n·h)             │ O(n + L·h)         │ O(n·h)       │ O(n·h)       │
│ Space (aux)  │ O(h²) string copies│ O(h) 1 array       │ O(n·h) stack │ O(n·h) queue │
│ Backtrack    │ FREE ✅             │ MANUAL (pop) ⚠️    │ FREE ✅       │ FREE ✅       │
│ Code simp.   │ ✅ Simplest         │ Medium             │ Medium       │ Medium       │
│ Stack overflow│ Possible (O(n))   │ Possible (O(n))    │ NO ✅         │ NO ✅         │
│ Interview    │ DEFAULT ✅          │ Show-off           │ Follow-up    │ Unexpected   │
└──────────────┴────────────────────┴────────────────────┴──────────────┴──────────────┘

WHERE DOES O(n·h) COME FROM?
  → n nodes visited × O(h) string copy per node
  → Balanced: O(n·log n)
  → Skewed:   O(n²)

CAN WE DO BETTER?
  → O(n) total work? YES with array approach:
    push/pop = O(1), join only at leaves!
  → But OUTPUT size itself is O(L·h) = O(n·h)
  → So even READING the output is O(n·h)!
  → CONCLUSION: O(n·h) is OPTIMAL considering output size!
```

---

## 🗣️ Think Out Loud — Kịch Bản Interview Chi Tiết

### 📌 Phút 0–1: Nhận đề + Clarify

> 🎙️ *"I need to return all root-to-leaf paths as strings. Let me clarify: only root-to-leaf paths, right? Not root to any node?"*
>
> *(Interviewer: Yes)*

> 🎙️ *"And an empty tree returns an empty array? And for a single node tree, the result is just ['val'] with no arrows?"*
>
> *(Interviewer: Correct)*

> 🎙️ *"Can values be negative or zero? Are there duplicates?"*
>
> *(Interviewer: Values can be anything)*

### 📌 Phút 1–2: Draw & Think

> 🎙️ *"Let me draw an example. For tree [1, 2, 3, null, 5]:"*
>
> *(Draws tree)*
>
> 🎙️ *"I see two leaves: 5 and 3. So I expect two paths: '1->2->5' and '1->3'. An important observation: the number of paths equals the number of leaves — each leaf defines exactly one unique root-to-leaf path."*

> 🎙️ *"This is a DFS problem — I traverse from root, building the path as I go, and save the path when I reach a leaf."*

### 📌 Phút 2–3: Approach

> 🎙️ *"I'll use DFS with a path string parameter. At each node, I append its value to the path string. If it's a leaf, I save the path. If not, I add '->' and recurse into both children.*
>
> *A nice property: strings are immutable in JavaScript, so when I concatenate inside a recursive call, the parent's path is unaffected. This gives me backtracking for free — I don't need to undo anything when returning from recursion."*

🧠 *"Nói về immutability = show mình hiểu Language fundamentals!"*

### 📌 Phút 3–5: Code

> 🎙️ *(Writes code, narrating each line)*
>
> *"I add the node value first — even leaves need their value in the path. Then I check: is this a leaf? If both children are null, save the path and return — no trailing arrow. Otherwise, add the arrow separator and recurse."*

### 📌 Phút 5–6: Trace

> 🎙️ *"Let me trace: dfs(1, '') → path='1', not leaf, add arrow, path='1->'. Going left: dfs(2, '1->') → path='1->2', not leaf, path='1->2->'. Going right: dfs(5, '1->2->') → path='1->2->5', leaf! Push. Back to node 1: path is still '1->' thanks to immutability. Going right: dfs(3, '1->') → path='1->3', leaf! Push. Result: ['1->2->5', '1->3']. Correct!"*

### 📌 Phút 6–7: Test + Complexity

> 🎙️ *"Edge cases: null → empty array, single node → ['val'] with no arrow. Skewed tree → single long path. Time is O(n·h) due to string copying — O(n log n) for balanced, O(n²) for skewed. Space is O(h) call stack plus output."*

---

### 📌 Follow-up Questions — Chuẩn bị kỹ!

**Q1: "String concatenation is O(h). Isn't the total complexity O(n²)?"**

> 🎙️ *"Great question! Each concatenation copies the entire current path — up to h characters. Summing over all n nodes in a skewed tree: O(1 + 2 + ... + n) = O(n²). For a balanced tree with h=log n, it's O(n·log n).*
>
> *If the interviewer wants better, I'd switch to the array approach: push is O(1) amortized, pop is O(1), and join is O(h) called only at L ≤ n/2 leaves. Total: O(n + L·h). Same worst case but better constant."*

**Q2: "Can you do this iteratively?"**

> 🎙️ *"Yes! Using a stack of (node, path) tuples. Each element carries its own independent path string:*
> ```javascript
> const stack = [[root, String(root.val)]];
> while (stack.length > 0) {
>   const [node, path] = stack.pop();
>   if (!node.left && !node.right) result.push(path);
>   if (node.right) stack.push([node.right, path+'->'+node.right.val]);
>   if (node.left) stack.push([node.left, path+'->'+node.left.val]);
> }
> ```
> *Push left LAST so it's popped FIRST — maintaining left-before-right order."*

**Q3: "How does this relate to backtracking?"**

> 🎙️ *"This IS backtracking — the 'explore, record, undo' pattern:*
> *- EXPLORE: go deeper by appending to path*
> *- RECORD: push path when reaching leaf*
> *- UNDO: with strings, undo is automatic (immutability). With arrays, it's explicit (pop).*
> *The tree structure means I don't need a 'visited' set like in graph backtracking — each node is visited exactly once going down the tree."*

**Q4: "What if paths don't start at root?" (→ #437 Path Sum III)**

> 🎙️ *"That's much harder! For finding paths that sum to a target starting from ANY node:*
> *I'd use prefix sums with a hash map. Running sum at current node minus target = prefix sum at some ancestor. Map stores count of each prefix sum. O(n) time.*
> *When backtracking, I REMOVE the current prefix sum from the map — this is real backtracking!"*

**Q5: "What if you need paths from leaf to root?" (→ #988)**

> 🎙️ *"For Smallest String Starting From Leaf, I need reverse direction. Two options:*
> *1. Build path from leaf up using parent pointers*
> *2. DFS top-down but PREPEND instead of append (reversed path).*
> *Key difference: comparison happens at leaves and I keep the lexicographically smallest."*

---

### 📌 Pattern Recognition

```
PATH TRACKING PATTERN FAMILY:
═══════════════════════════════════════════════════════════════

4 Approaches khi cần TRACK PATH trong tree:

  ┌─────────────────────────┬──────────────────────────────┐
  │ Approach                │ When to use                  │
  ├─────────────────────────┼──────────────────────────────┤
  │ String path parameter   │ Đơn giản, interview favorite │
  │ Array + pop()           │ Cần hiệu quả bộ nhớ         │
  │ Array + [...spread]     │ Cần bản sao độc lập          │
  │ Variable (sum, count)   │ Chỉ cần tính toán, ko lưu   │
  │ Prefix sum + hashmap    │ Path ANY→ANY (#437)          │
  └─────────────────────────┴──────────────────────────────┘

Related problems — cùng "DFS + track path":
═══════════════════════════════════════════════════════════════

  ┌──────────────────────┬──────────────┬───────────────────┐
  │ Problem              │ Track what?  │ Save when?        │
  ├──────────────────────┼──────────────┼───────────────────┤
  │ #257 Binary Paths    │ path string  │ At EVERY leaf     │
  │ #112 Path Sum I      │ remaining sum│ sum=0 at leaf     │
  │ #113 Path Sum II     │ path + sum   │ sum=0 at leaf     │
  │ #437 Path Sum III    │ prefix sums  │ prefixSum=target  │
  │ #988 Smallest String │ path string  │ At leaf, keep min │
  │ #129 Sum Root→Leaf   │ running num  │ Add at leaf       │
  │ #298 Longest Consec. │ length       │ Update global max │
  └──────────────────────┴──────────────┴───────────────────┘
```

---

### 📌 Khi bạn BÍ — Emergency Rescue

```
KHI ĐANG NGHĨ:
═══════════════════════════════════════════════════════════════

  🎙️ "This is a DFS problem. I need to track the path
      from root to the current node. At each leaf,
      I save the path."
      
  🎙️ "The question is: how do I 'undo' the path when
      backtracking? In JavaScript, strings are immutable,
      so I get free backtracking!"

KHI QUÊN CODE — Template 4 bước:
═══════════════════════════════════════════════════════════════

  function dfs(node, path) {
    1. if (!node) return;               // NULL guard
    2. path += node.val;                // ADD value
    3. if (!left && !right) {           // CHECK leaf
         result.push(path); return; }
    4. path += "->"; 
       dfs(left, path);                // RECURSE
       dfs(right, path);
  }

KHI INTERVIEWER HỎI KHÓ:
═══════════════════════════════════════════════════════════════

  "Tại sao string, không array?"
  → "String immutable = free backtrack. Simpler code.
     Array is more memory-efficient but needs pop()."
     
  "Tối ưu hơn?"
  → "Array version: O(1) push/pop. String: O(h) per copy.
     Array wins in memory, string wins in simplicity."
     
  "Iterative?"
  → "Stack of (node, path) tuples. Same immutability trick."
  
  "O(n²) hay O(n)?"
  → "String: O(n·h). Array: O(n + L·h). Both O(n log n)
     balanced, O(n²) skewed. Output size is O(L·h) anyway."

  "Tại sao check leaf, không check null?"
  → "NULL không phải leaf! Check null → duplicate paths.
     Leaf = node tồn tại nhưng KHÔNG CÓ CON."
```

---

## 🌳 RECURSION CALL TREE — Toàn bộ lời gọi hàm

> Đây là cách DFS "triển khai" thành cây đệ quy. Mỗi ô = 1 lời gọi `dfs()`.

```
Tree gốc:       1
               / \
              2   3
             / \
            4   5

═══════════════════════════════════════════════════════════════
          RECURSION CALL TREE (String version)
═══════════════════════════════════════════════════════════════

                    dfs(1, "")
                   path = "1->"
                  /              \
         dfs(2, "1->")        dfs(3, "1->")
        path = "1->2->"       path = "1->3"
        /           \          → LEAF! ✅
  dfs(4, "1->2->") dfs(5, "1->2->")   push "1->3"
  path = "1->2->4" path = "1->2->5"
  → LEAF! ✅        → LEAF! ✅
  push "1->2->4"   push "1->2->5"

═══════════════════════════════════════════════════════════════

  📋 Thứ tự THỰC HIỆN (DFS = depth-first):
  
  ① dfs(1, "")            → tạo path "1->"
  ② dfs(2, "1->")         → tạo path "1->2->"
  ③ dfs(4, "1->2->")      → path "1->2->4" → LEAF! PUSH! ✅
  ④ dfs(5, "1->2->")      → path "1->2->5" → LEAF! PUSH! ✅
  ⑤ dfs(3, "1->")         → path "1->3"    → LEAF! PUSH! ✅
  
  result = ["1->2->4", "1->2->5", "1->3"]

  📋 NULL calls (omitted above for clarity):
  
  String version: LEAF → return sớm → KHÔNG gọi dfs(null)!
  Array version: KHÔNG return sớm → GỌI dfs(null) 2 lần → return ngay.

  📋 Tổng số lời gọi:
  String: 5 calls (skip null ở leaves vì return sớm)
  Array:  9 calls (gọi null 4 lần vì không return sớm)
  
  → String version CÓ ÍT calls hơn! Nhưng tạo nhiều string hơn.
```

```
═══════════════════════════════════════════════════════════════
          RECURSION CALL TREE (Array version)
═══════════════════════════════════════════════════════════════

                    dfs(1)
                   path=[1]
                  /         \
           dfs(2)           dfs(3)
          path=[1,2]       path=[1,3]
         /       \         → LEAF! ✅ push, then pop(3)
     dfs(4)    dfs(5)      /      \
    path=[1,2,4] path=[1,2,5]  dfs(null) dfs(null)
    → LEAF! ✅   → LEAF! ✅     return    return
    /     \      /     \
  dfs(N) dfs(N) dfs(N) dfs(N)  ← dfs(null) vì KHÔNG return sớm!
  return return return return
  pop(4)         pop(5)
       pop(2)
            pop(1)
```

---

## 📸 DFS STEP-BY-STEP — Hình ảnh cây TẠI TỪNG BƯỚC

> Mỗi bước show: đang ở node nào, path hiện tại, result hiện tại.
> ★ = node đang xét. ✓ = đã xong. ◯ = chưa thăm.

```
Tree:    1(2(4,5), 3)

═══════════════════════════════════════════════════════════════
STEP 1: Bắt đầu tại root
═══════════════════════════════════════════════════════════════

     ★1               path = "1"
    / \                result = []
   ◯2  ◯3              leaf? NO → path = "1->"
  / \                  → đi LEFT
 ◯4 ◯5

═══════════════════════════════════════════════════════════════
STEP 2: Đến node 2
═══════════════════════════════════════════════════════════════

      1               path = "1->2"
     / \               result = []
   ★2  ◯3              leaf? NO → path = "1->2->"
   / \                 → đi LEFT
  ◯4 ◯5

═══════════════════════════════════════════════════════════════
STEP 3: Đến node 4 → LEAF! 🎉
═══════════════════════════════════════════════════════════════

      1               path = "1->2->4"
     / \               result = []
    2  ◯3              leaf? YES! → push "1->2->4"
   / \                 result = ["1->2->4"] ✅
  ★4 ◯5                → return lên node 2

═══════════════════════════════════════════════════════════════
STEP 4: Quay về node 2, đi RIGHT → node 5 → LEAF! 🎉
═══════════════════════════════════════════════════════════════

      1               path ở node 2 scope: "1->2->"
     / \               (immutable — CHƯA ĐỔI NHỜÉ STEP 3!)
    2  ◯3             → đi RIGHT child
   / \                → dfs(5, "1->2->")
  ✓4 ★5               path = "1->2->5"                 
                       leaf? YES! → push "1->2->5"
                       result = ["1->2->4", "1->2->5"] ✅
                       → return lên node 2, rồi lên node 1

═══════════════════════════════════════════════════════════════
STEP 5: Quay về node 1, đi RIGHT → node 3 → LEAF! 🎉
═══════════════════════════════════════════════════════════════

      1               path ở node 1 scope: "1->"
     / \               (immutable — VẪN ĐÚNG TỪ STEP 1!)
    ✓2 ★3             → đi RIGHT child
   / \                → dfs(3, "1->")
  ✓4 ✓5               path = "1->3"
                       leaf? YES! → push "1->3"
                       result = ["1->2->4", "1->2->5", "1->3"] ✅
                       → DONE!

═══════════════════════════════════════════════════════════════
FINAL STATE: TẤT CẢ NODES ĐÃ THĂM
═══════════════════════════════════════════════════════════════

      ✓1              
     / \               result = ["1->2->4", "1->2->5", "1->3"]
    ✓2 ✓3              
   / \                 3 leaves = 3 paths ✅
  ✓4 ✓5                
```

---

## 🔀 TREE DFS vs GRAPH DFS — Khác nhau gì?

> Bài này dùng tree DFS. Nhưng DFS trên graph KHÁC tree DFS ở nhiều điểm quan trọng.

```
═══════════════════════════════════════════════════════════════
           SO SÁNH TREE DFS vs GRAPH DFS
═══════════════════════════════════════════════════════════════

┌────────────────────┬──────────────────────┬──────────────────────┐
│ Đặc điểm           │ Tree DFS             │ Graph DFS            │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Cycle?             │ KHÔNG có cycle       │ CÓ THỂ có cycle      │
│ Visited set?       │ KHÔNG CẦN            │ CẦN "visited" set!   │
│ Path unique?       │ Chỉ 1 path root→leaf │ Nhiều paths A→B      │
│ Backtrack undo?    │ String: free         │ Phải visited=false   │
│                    │ Array: pop()         │ VÀ pop() path        │
│ Direction          │ Luôn đi XUỐNG        │ Đi bất kỳ hướng      │
│ Base case          │ null = stop          │ visited = stop       │
│ Output completeness│ Tất cả LEAF paths    │ Tất cả TARGET paths  │
└────────────────────┴──────────────────────┴──────────────────────┘

═══════════════════════════════════════════════════════════════

TẠI SAO TREE DFS ĐƠN GIẢN HƠN:

  Tree: KHÔNG CÓ CYCLE → mỗi node chỉ visit 1 lần!
  → Không cần "visited" set
  → Không cần unmark visited khi backtrack
  → Code ngắn hơn nhiều!

  Graph example:
  A — B
  |   |       ← cycle! A→B→D→C→A vô hạn!
  C — D
  
  → Cần visited = {A} → {A,B} → {A,B,D} → {A,B,D,C}
  → Khi backtrack: visited = {A,B,D} → {A,B} → {A} → ...
  → PHẢI unmark để tìm path KHÁC qua C!

═══════════════════════════════════════════════════════════════

GRAPH BACKTRACKING CODE (so sánh):

  function graphDfs(node, target, visited, path) {
    visited.add(node);         ← MARK!
    path.push(node);
    
    if (node === target) {
      result.push([...path]);  ← found! Must COPY!
    }
    
    for (const neighbor of adj[node]) {
      if (!visited.has(neighbor)) {
        graphDfs(neighbor, target, visited, path);
      }
    }
    
    visited.delete(node);      ← UNMARK! (tree không cần!)
    path.pop();                ← UNDO path!
  }

  → Graph: cần MARK + UNMARK + POP = phức tạp!
  → Tree: chỉ cần path string + leaf check = đơn giản!
```

---

## 🔄 CODE VARIATIONS — 6 cách viết KHÁC NHAU

> Cùng 1 bài toán, 6 style code khác nhau. Chọn cái phù hợp nhất!

### Variation 1: String param — CLASSIC (recommended)

```javascript
function binaryTreePaths(root) {
  const result = [];
  function dfs(node, path) {
    if (!node) return;
    path += node.val;
    if (!node.left && !node.right) { result.push(path); return; }
    path += "->";
    dfs(node.left, path);
    dfs(node.right, path);
  }
  dfs(root, "");
  return result;
}
```

### Variation 2: Array + pop — EFFICIENT

```javascript
function binaryTreePaths(root) {
  const result = [], path = [];
  function dfs(node) {
    if (!node) return;
    path.push(node.val);
    if (!node.left && !node.right) result.push(path.join("->"));
    dfs(node.left);
    dfs(node.right);
    path.pop();
  }
  dfs(root);
  return result;
}
```

### Variation 3: Template literal — ES6 STYLE

```javascript
function binaryTreePaths(root) {
  const result = [];
  function dfs(node, path) {
    if (!node) return;
    const current = path ? `${path}->${node.val}` : `${node.val}`;
    if (!node.left && !node.right) { result.push(current); return; }
    dfs(node.left, current);
    dfs(node.right, current);
  }
  dfs(root, "");
  return result;
}
```

> 🎙️ *"Template literal: separator logic is cleaner — checks if path is empty to avoid leading '->'."*

### Variation 4: Iterative stack — NO RECURSION

```javascript
function binaryTreePaths(root) {
  if (!root) return [];
  const result = [], stack = [[root, String(root.val)]];
  while (stack.length > 0) {
    const [node, path] = stack.pop();
    if (!node.left && !node.right) { result.push(path); continue; }
    if (node.right) stack.push([node.right, `${path}->${node.right.val}`]);
    if (node.left) stack.push([node.left, `${path}->${node.left.val}`]);
  }
  return result;
}
```

### Variation 5: BFS queue — LEVEL ORDER

```javascript
function binaryTreePaths(root) {
  if (!root) return [];
  const result = [], queue = [[root, String(root.val)]];
  while (queue.length > 0) {
    const [node, path] = queue.shift();
    if (!node.left && !node.right) { result.push(path); continue; }
    if (node.left) queue.push([node.left, `${path}->${node.left.val}`]);
    if (node.right) queue.push([node.right, `${path}->${node.right.val}`]);
  }
  return result;
}
```

### Variation 6: Functional — PURE (no mutation, no helper)

```javascript
function binaryTreePaths(root) {
  if (!root) return [];
  if (!root.left && !root.right) return [String(root.val)];
  
  const leftPaths = binaryTreePaths(root.left);
  const rightPaths = binaryTreePaths(root.right);
  
  return [
    ...leftPaths.map(p => `${root.val}->${p}`),
    ...rightPaths.map(p => `${root.val}->${p}`)
  ];
}
```

> 🎙️ *"Functional: no helper, no mutation, no global. Each node collects paths from children, prepends itself, returns. Beautiful but O(n²) due to array spreading + string creation."*

```
═══════════════════════════════════════════════════════════════
              SO SÁNH 6 VARIATIONS
═══════════════════════════════════════════════════════════════

┌─────────────┬────────┬───────┬──────────┬────────────────┐
│ Variation   │ Time   │ Space │ Backtrack│ Best for       │
├─────────────┼────────┼───────┼──────────┼────────────────┤
│ 1. String   │ O(n·h) │ O(h²) │ FREE     │ Interview ✅    │
│ 2. Array    │ O(n+Lh)│ O(h)  │ pop()    │ Performance ✅  │
│ 3. Template │ O(n·h) │ O(h²) │ FREE     │ Clean code     │
│ 4. Stack    │ O(n·h) │ O(n·h)│ N/A      │ No overflow ✅  │
│ 5. BFS      │ O(n·h) │ O(n·h)│ N/A      │ Level order    │
│ 6. Func.    │ O(n²)  │ O(n²) │ N/A      │ Readable       │
└─────────────┴────────┴───────┴──────────┴────────────────┘

INTERVIEW RECOMMENDATION:
  → Bắt đầu Variation 1 (string) — simplest, cleanest
  → Nếu hỏi optimize → chuyển Variation 2 (array)
  → Nếu hỏi iterative → show Variation 4 (stack)
  → Nếu hỏi "elegant?" → Variation 6 (functional)
```

---

## 🧪 DERIVE FROM FIRST PRINCIPLES — Nếu CHƯA BAO GIỜ thấy bài này

> 🎙️ *"Giả sử tôi chưa bao giờ giải bài này. Tôi sẽ tự derive solution BẰNG CÁCH NÀO?"*

### Bước 1: Đọc đề → Nhận diện keywords

```
"Return ALL root-to-leaf PATHS as STRINGS"

  Keyword phân tích:
  ┌───────────┬───────────────────────────────────────────┐
  │ "ALL"     │ Duyệt toàn bộ cây, KHÔNG skip nhánh nào │
  │ "root-to" │ Bắt đầu từ ROOT → DFS top-down!         │
  │ "leaf"    │ Kết thúc ở LEAF → condition dừng         │
  │ "paths"   │ Cần TRACK đường đi, không chỉ visit     │
  │ "strings" │ Output = string "1->2->3"                │
  └───────────┴───────────────────────────────────────────┘
  
  → Pattern: DFS + track path + save at leaf
```

### Bước 2: Thử bằng TAY — Small case

```
Tree: [1, 2, 3]
     1
    / \
   2   3

Giống mê cung: đi từ cổng vào (root) tìm lối ra (leaf):
  Lối 1: đi left → gặp ngõ cụt (leaf 2) → ghi path: "1->2"
  Quay lại cổng vào...
  Lối 2: đi right → gặp ngõ cụt (leaf 3) → ghi path: "1->3"
  Không còn lối → XONG!

Observation:
  1. Mỗi lần rẽ, thêm "->value" vào path
  2. Khi gặp leaf (ngõ cụt), lưu path hiện tại
  3. Quay lại ngã rẽ → "bỏ" phần vừa thêm → BACKTRACK!
```

### Bước 3: Viết pseudocode

```
function allPaths(root):
  result = []
  
  function explore(node, pathSoFar):
    if node is NULL: return     ← TƯỜNG (không có node)
    
    add node.val to pathSoFar   ← BƯỚC VÀO PHÒNG
    
    if node is LEAF:            ← NGÕ CỤT (leaf)
      save pathSoFar to result  ← GHI LẠI ĐƯỜNG
      BACKTRACK!                ← QUAY LẠI
      return
    
    explore(node.left, pathSoFar)   ← THỬ ĐI LEFT
    explore(node.right, pathSoFar)  ← THỬ ĐI RIGHT
    
    BACKTRACK!                  ← XÓA BƯỚC VỪA ĐI
  
  explore(root, empty)
  return result
```

### Bước 4: Chọn data structure cho path

```
QUYẾT ĐỊNH: pathSoFar dùng STRING hay ARRAY?

  STRING (immutable):
    add:       path += "->" + val    → O(h) mỗi lần (tạo string mới)
    backtrack: KHÔNG CẦN! (imm.)    → O(0)!
    save:      result.push(path)     → O(1) (string đã sẵn)
    
  ARRAY (mutable):
    add:       path.push(val)        → O(1) amortized
    backtrack: path.pop()            → O(1)
    save:      result.push(path.join("->")) → O(h) tại leaf
    
  So sánh:  
  → String: đơn giản (no undo!), hơi tốn memory (copy)
  → Array: hiệu quả (O(1) ops), cần undo thủ công (pop)
  
  CHỌN: String cho interview (simpler code)!
```

### Bước 5: Handle separator "->"

```
Vấn đề: "1" + "->" + "2" + "->" + "5"
         val   sep    val   sep    val
                                   ↑ val CUỐI không có sep!

3 cách handle:
  ① Thêm val, check leaf, rồi thêm "->":
     path += val; if (leaf) save; path += "->"; recurse;
     → ĐÂY LÀ CÁCH CODE CUỐI CÙNG!
     
  ② Thêm "->" + val mỗi lần, bỏ prefix:
     path += "->" + val; → "->" + "1" + "->" + "2" → bỏ 2 ký tự đầu
     → Hack-ish, không đẹp.
     
  ③ Ternary check: path ? path + "->" + val : val
     → Template literal variation! Cũng OK.
```

### Bước 6: Handle edge cases

```
  1. root = null → return []              (không có cây)
  2. root is leaf → return ["val"]        (1 node = 1 path)
  3. Negative values: "->" + (-5) → "->-5" ← tự nhiên OK!
  4. Zero: "->0" ← auto coercion, OK!
  5. Multi-digit: "->100" ← OK!
  
  → KHÔNG CẦN XỬ LÝ ĐẶC BIỆT cho bất kỳ edge case nào!
  → Code generic tự handle tất cả!
```

### Bước 7: Pseudocode → Real Code → DONE

```javascript
// Pseudocode mapping:
//   "add val"     →  path += node.val
//   "is LEAF"     →  !node.left && !node.right
//   "save"        →  result.push(path)
//   "BACKTRACK"   →  (nothing! immutable!)
//   "add sep"     →  path += "->"

function binaryTreePaths(root) {
  const result = [];
  function dfs(node, path) {
    if (!node) return;
    path += node.val;
    if (!node.left && !node.right) { result.push(path); return; }
    path += "->";
    dfs(node.left, path);
    dfs(node.right, path);
  }
  dfs(root, "");
  return result;
}
```

> 🎙️ *"Từ first principles chỉ cần 7 bước: đọc đề → thử tay → pseudocode → chọn data structure → handle separator → edge cases → code. Mỗi bước đều có logic, không cần memorize!"*

---

## 📊 VISUAL SUMMARY — Tổng hợp toàn bộ 1 trang

```
═══════════════════════════════════════════════════════════════
        BINARY TREE PATHS #257 — CHEAT SHEET
═══════════════════════════════════════════════════════════════

📌 BÀI TOÁN:  Trả về TẤT CẢ root-to-leaf paths dạng string
📌 PATTERN:   DFS + Track Path + Backtrack
📌 TRICK:     String immutable = FREE backtracking!
📌 DIFFICULTY: Easy (nhưng concepts apply to MANY harder problems!)

═══════════════════════════════════════════════════════════════

📌 ALGORITHM (4 bước):
  1. if (!node) return;              ← NULL guard
  2. path += node.val;               ← ADD value
  3. if (isLeaf) push & return;      ← SAVE at leaf
  4. path += "->"; recurse L, R;     ← GO deeper

═══════════════════════════════════════════════════════════════

📌 KEY INSIGHT — WHY STRING WORKS:
  ┌──────────────────────────────────────────────────────────┐
  │ String: cha truyền VALUE → con tạo MỚI → cha KHÔNG đổi │
  │ Array:  cha truyền REF → con sửa CÙNG → cha BỊ đổi     │
  │                                                          │
  │ String: free backtrack (immutable!)                      │
  │ Array:  manual backtrack (pop!)                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

📌 COMMON TRAPS:
  ❌ Push ở NULL → DUPLICATE (null ≠ leaf!)
  ❌ Trailing arrow → check leaf TRƯỚC thêm "->"
  ❌ Array return sớm → QUÊN pop!
  ❌ result.push(path array) → push REFERENCE, không copy!

═══════════════════════════════════════════════════════════════

📌 COMPLEXITY:
  Time:  O(n·h) — n nodes × O(h) string copy
  Space: O(h) call stack + O(L·h) output
  
═══════════════════════════════════════════════════════════════

📌 6 VARIATIONS:
  1. String param (INTERVIEW DEFAULT) ✅
  2. Array + pop (OPTIMIZE)
  3. Template literal (ES6 CLEAN)
  4. Iterative stack (NO OVERFLOW)
  5. BFS queue (LEVEL ORDER)
  6. Functional pure (READABLE)
  
═══════════════════════════════════════════════════════════════

📌 FOLLOW-UPS PREPARED:
  → Iterative? Stack of (node, path)
  → Optimize? Array + pop()
  → O(n²)? Yes skewed, O(n log n) balanced
  → Any→Any paths? Prefix sum + hashmap (#437)
  → Leaf→Root? Prepend instead of append (#988)
  → Graph version? Add visited set + unmark!
  
═══════════════════════════════════════════════════════════════

📌 RELATED PROBLEMS (cùng pattern DFS + track):
  #112 Path Sum │ #113 Path Sum II │ #437 Path Sum III
  #129 Sum Root to Leaf │ #988 Smallest String │ #298 Longest Consec.
  
═══════════════════════════════════════════════════════════════
```
