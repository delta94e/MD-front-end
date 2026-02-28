# Tree ↔ Array Conversion — Handwritten Series!

> **3 cách Array→Tree + Tree→Array!**
> Recursive O(n²), Filter O(n²), Map O(n), deep copy!

---

## §1. Cấu Trúc Dữ Liệu!

```
  ARRAY (phẳng!) vs TREE (cây!):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ARRAY (backend trả về!):                                     │
  │  ┌────┬────────┬──────────┐                                  │
  │  │ id │ name   │ parentId │                                  │
  │  ├────┼────────┼──────────┤                                  │
  │  │ 0  │ root   │ null     │  ← gốc!                         │
  │  │ 1  │ A      │ 0        │                                  │
  │  │ 2  │ B      │ 0        │                                  │
  │  │ 3  │ C      │ 1        │                                  │
  │  │ 4  │ D      │ 1        │                                  │
  │  │ 5  │ E      │ 2        │                                  │
  │  │ 6  │ F      │ 3        │                                  │
  │  │ 7  │ G      │ 2        │                                  │
  │  │ 8  │ H      │ 4        │                                  │
  │  │ 9  │ I      │ 5        │                                  │
  │  └────┴────────┴──────────┘                                  │
  │                                                              │
  │  TREE (frontend cần!):                                        │
  │       root (0)                                                │
  │      /       \                                                 │
  │    A(1)      B(2)                                              │
  │   / \       / \                                                │
  │  C(3) D(4) E(5) G(7)                                          │
  │  |    |    |                                                   │
  │  F(6) H(8) I(9)                                                │
  │                                                              │
  │  ★ parentId = null → ROOT node!                               │
  │  ★ parentId = id của cha! ★                                  │
  │  ★ Dữ liệu có thể KHÔNG SẮP XẾP! ★                         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Array → Tree: 3 Cách!

### 2.1 Cách 1: Recursive — O(n²)

```javascript
// ═══════════════════════════════════════════════════════════
// CÁCH 1: ĐỆ QUY — đơn giản, dễ hiểu! ★
// Mỗi node duyệt TOÀN BỘ mảng → O(n²)!
// ═══════════════════════════════════════════════════════════

function arrToTreeRecursive(arr, parentId) {
  // parentId = null cho root!
  var result = [];

  for (var i = 0; i < arr.length; i++) {
    // ★ Tìm tất cả node có parentId khớp!
    if (arr[i].parentId === parentId) {
      // ★ Đệ quy: tìm con của node này!
      var children = arrToTreeRecursive(arr, arr[i].id);

      // ★ Tạo node mới (KHÔNG sửa data gốc!)
      var node = {
        id: arr[i].id,
        name: arr[i].name,
        parentId: arr[i].parentId,
      };

      // Chỉ thêm children nếu CÓ con!
      if (children.length > 0) {
        node.children = children;
      }

      result.push(node);
    }
  }

  return result;
}

// TEST:
// var nodes = [
//   { id: 0, name: 'root',  parentId: null },
//   { id: 1, name: 'A',     parentId: 0 },
//   { id: 2, name: 'B',     parentId: 0 },
//   { id: 3, name: 'C',     parentId: 1 },
// ];
// arrToTreeRecursive(nodes, null);
// → [{ id:0, name:'root', children: [
//      { id:1, name:'A', children: [{ id:3, name:'C' }] },
//      { id:2, name:'B' }
//    ]}]
```

### 2.2 Cách 2: Filter — O(n²) nhưng gọn!

```javascript
// ═══════════════════════════════════════════════════════════
// CÁCH 2: FILTER + FILTER — cú pháp gọn! ★
// Vẫn O(n²) vì filter lồng filter!
// ═══════════════════════════════════════════════════════════

function arrToTreeFilter(arr) {
  // ★ Deep copy để không sửa data gốc!
  var cloned = [];
  for (var i = 0; i < arr.length; i++) {
    cloned.push({
      id: arr[i].id,
      name: arr[i].name,
      parentId: arr[i].parentId,
    });
  }

  // ★ filter lớp ngoài: tìm ROOT nodes!
  var result = [];
  for (var j = 0; j < cloned.length; j++) {
    var father = cloned[j];

    // ★ filter lớp trong: tìm CON của father!
    var childrenArr = [];
    for (var k = 0; k < cloned.length; k++) {
      if (cloned[k].parentId === father.id) {
        childrenArr.push(cloned[k]);
      }
    }

    if (childrenArr.length > 0) {
      father.children = childrenArr;
    }

    // ★ Chỉ push ROOT vào result!
    if (father.parentId === null) {
      result.push(father);
    }
  }

  return result;
}
```

```
  GIẢI THÍCH FILTER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TẠI SAO FILTER HOẠT ĐỘNG?                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Duyệt MỖI node:                                       │    │
  │  │   → Tìm TẤT CẢ con → gán vào .children               │    │
  │  │   → ★ .children chứa REFERENCE đến node khác! ★      │    │
  │  │                                                      │    │
  │  │ Duyệt node root (id=0):                                │    │
  │  │   → children = [nodeA, nodeB]  (reference!)            │    │
  │  │                                                      │    │
  │  │ Duyệt node A (id=1):                                   │    │
  │  │   → children = [nodeC, nodeD]  (reference!)            │    │
  │  │   → nodeA.children = [nodeC, nodeD]                    │    │
  │  │   → root.children[0].children = [nodeC, nodeD]! ★    │    │
  │  │                                                      │    │
  │  │ → Nhờ REFERENCE → cây tự xây dựng! ★★★               │    │
  │  │ → return chỉ root → có TOÀN BỘ cây! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 2.3 Cách 3: Map — O(n)! ★★★

```javascript
// ═══════════════════════════════════════════════════════════
// CÁCH 3: MAP — TỐI ƯU NHẤT! O(n)! ★★★
// Chỉ duyệt 2 lần! (hoặc 1 lần!)
// ═══════════════════════════════════════════════════════════

function arrToTreeMap(arr) {
  var map = {};
  var result = [];

  // ★ BƯỚC 1: Tạo map index — O(n)!
  for (var i = 0; i < arr.length; i++) {
    map[arr[i].id] = {
      id: arr[i].id,
      name: arr[i].name,
      parentId: arr[i].parentId,
      children: [], // ★ Chuẩn bị!
    };
  }

  // ★ BƯỚC 2: Xây dựng quan hệ — O(n)!
  for (var j = 0; j < arr.length; j++) {
    var node = map[arr[j].id];

    if (arr[j].parentId === null) {
      // ★ Root node!
      result.push(node);
    } else {
      // ★ Tìm cha trong map — O(1)! ★
      var parent = map[arr[j].parentId];
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
// Map — 1 LẦN DUYỆT! (xử lý con xuất hiện TRƯỚC cha!)
// ═══════════════════════════════════════════════════════════

function arrToTreeMapOnePass(arr) {
  var map = {};
  var result = [];

  for (var i = 0; i < arr.length; i++) {
    var id = arr[i].id;
    var parentId = arr[i].parentId;

    // ★ Tạo node nếu chưa có!
    if (!map[id]) {
      map[id] = { children: [] };
    }
    // Copy properties!
    map[id].id = arr[i].id;
    map[id].name = arr[i].name;
    map[id].parentId = arr[i].parentId;

    if (parentId === null) {
      result.push(map[id]);
    } else {
      // ★ Tạo cha nếu chưa có! (con trước cha!)
      if (!map[parentId]) {
        map[parentId] = { children: [] };
      }
      map[parentId].children.push(map[id]);
    }
  }

  return result;
}
```

---

## §3. Tree → Array!

```javascript
// ═══════════════════════════════════════════════════════════
// CÁCH 1: ĐỆ QUY — DFS (Depth-First!) ★
// ═══════════════════════════════════════════════════════════

function treeToArrDFS(tree) {
  var result = [];

  function walk(nodes) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];

      // ★ Push node KHÔNG có children!
      result.push({
        id: node.id,
        name: node.name,
        parentId: node.parentId,
      });

      // ★ Đệ quy nếu có con!
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  }

  walk(tree);
  return result;
}

// ═══════════════════════════════════════════════════════════
// CÁCH 2: BFS (Breadth-First!) — dùng queue! ★
// ═══════════════════════════════════════════════════════════

function treeToArrBFS(tree) {
  var result = [];
  var queue = []; // ★ Queue (FIFO!)

  // Đưa root nodes vào queue!
  for (var i = 0; i < tree.length; i++) {
    queue.push(tree[i]);
  }

  while (queue.length > 0) {
    var node = queue.shift(); // ★ Lấy từ ĐẦU!

    result.push({
      id: node.id,
      name: node.name,
      parentId: node.parentId,
    });

    // ★ Đưa con vào CUỐI queue!
    if (node.children) {
      for (var j = 0; j < node.children.length; j++) {
        queue.push(node.children[j]);
      }
    }
  }

  return result;
}
```

```
  DFS vs BFS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Tree:        root                                            │
  │              /    \                                            │
  │             A      B                                           │
  │            / \    / \                                          │
  │           C   D  E   G                                         │
  │                                                              │
  │  DFS (Depth-First!): root → A → C → D → B → E → G ★        │
  │  → ĐI SÂU trước! (recursion/stack!)                          │
  │                                                              │
  │  BFS (Breadth-First!): root → A → B → C → D → E → G ★      │
  │  → ĐI RỘNG trước! (queue!)                                   │
  │                                                              │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Tiêu chí        │ DFS             │ BFS            │    │
  │  ├──────────────────┼─────────────────┼────────────────┤    │
  │  │ Thứ tự          │ Sâu trước! ★    │ Rộng trước! ★ │    │
  │  │ Cấu trúc        │ Stack/Recursion  │ Queue (FIFO!) │    │
  │  │ Dùng khi         │ Tìm đường đi   │ Tìm gần nhất │    │
  │  │ Tree→Array       │ Giữ thứ tự cha│ Theo tầng! ★ │    │
  │  └──────────────────┴─────────────────┴────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. So Sánh 3 Cách Array→Tree!

```
  ┌──────────────────┬──────────────────┬──────────────────┐
  │ Tiêu chí        │ Recursive        │ Filter           │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Thời gian        │ O(n²) ❌         │ O(n²) ❌         │
  │ Cách hoạt động  │ Đệ quy tìm con │ Filter lồng!    │
  │ Dễ hiểu        │ ⭐⭐⭐⭐⭐           │ ⭐⭐⭐⭐             │
  │ Data không sort  │ ✅ OK!           │ ✅ OK!           │
  │ 1000 nodes       │ 1,000,000 ops!   │ 1,000,000 ops!   │
  └──────────────────┴──────────────────┴──────────────────┘

  ┌──────────────────┬──────────────────┐
  │ Tiêu chí        │ Map ★★★          │
  ├──────────────────┼──────────────────┤
  │ Thời gian        │ O(n) ✅ ★★★     │
  │ Cách hoạt động  │ Index table!     │
  │ Dễ hiểu        │ ⭐⭐⭐              │
  │ Data không sort  │ ✅ OK! ★         │
  │ 1000 nodes       │ 2,000 ops! ★★★  │
  │ Production       │ ĐÂY LÀ CÁCH TỐI │
  │                  │ ƯU NHẤT! ★★★    │
  └──────────────────┴──────────────────┘
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Có mấy cách chuyển array → tree?                         │
  │  → 3 cách: Recursive O(n²), Filter O(n²), Map O(n)! ★      │
  │  → Map TỐI ƯU NHẤT! Dùng index table tra O(1)! ★           │
  │                                                              │
  │  ❓ 2: Tại sao cần deep copy?                                    │
  │  → JS object = reference type! ★                              │
  │  → item.children = [...] → SỬA data gốc! ❌                 │
  │  → Deep copy → data gốc nguyên vẹn! ✅                      │
  │  → JSON method có hạn chế (Date, function!) ★               │
  │                                                              │
  │  ❓ 3: DFS vs BFS khi tree → array?                              │
  │  → DFS: đi SÂU trước (recursion/stack!) ★                   │
  │  → BFS: đi RỘNG trước (queue!) ★                             │
  │  → DFS: giữ thứ tự cha-con!                                  │
  │  → BFS: theo từng tầng!                                       │
  │                                                              │
  │  ❓ 4: Filter hoạt động nhờ gì?                                  │
  │  → REFERENCE! ★★★                                             │
  │  → Gán children cho mỗi node = gán reference!                │
  │  → Return chỉ root → nhưng root.children = reference ★     │
  │  → → Toàn bộ cây tự xây qua reference chain! ★             │
  │                                                              │
  │  ❓ 5: Data không sắp xếp (con trước cha) có OK?                │
  │  → Recursive: OK! (duyệt toàn bộ mỗi lần!)                 │
  │  → Filter: OK! (duyệt toàn bộ!)                              │
  │  → Map 2-pass: OK! (build map trước!) ★                     │
  │  → Map 1-pass: OK! (tạo cha rỗng nếu chưa có!) ★★★        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
