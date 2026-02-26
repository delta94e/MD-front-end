# List To Tree — Deep Dive!

> **Chuyển danh sách phẳng thành cây!**
> Recursive O(n²) → Map O(n), reference mechanism, spread copy!

---

## §1. Hiểu Cấu Trúc Dữ Liệu!

```
  FLAT LIST → TREE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FLAT LIST (danh sách phẳng — backend trả!):                  │
  │  ┌──────┬──────────┬────────────┐                            │
  │  │ id   │ name     │ parentId   │                            │
  │  ├──────┼──────────┼────────────┤                            │
  │  │ 1    │ A        │ 0 (root!)  │                            │
  │  │ 2    │ B        │ 1 (cha: A) │                            │
  │  │ 3    │ C        │ 1 (cha: A) │                            │
  │  │ 4    │ D        │ 2 (cha: B) │                            │
  │  └──────┴──────────┴────────────┘                            │
  │                                                              │
  │  TREE (cấu trúc cây — frontend cần!):                        │
  │       A (root)                                                │
  │      / \                                                       │
  │     B   C                                                      │
  │    /                                                           │
  │   D                                                            │
  │                                                              │
  │  JSON:                                                          │
  │  [{                                                             │
  │    id: 1, name: 'A',                                           │
  │    children: [                                                  │
  │      { id: 2, name: 'B',                                       │
  │        children: [                                              │
  │          { id: 4, name: 'D' }                                   │
  │        ]                                                       │
  │      },                                                        │
  │      { id: 3, name: 'C' }                                      │
  │    ]                                                           │
  │  }]                                                            │
  │                                                              │
  │  TẠI SAO CẦN CHUYỂN?                                            │
  │  → Backend: flat list → DỄ LƯU (1 bảng SQL!) ★              │
  │  → Frontend: tree → DỄ HIỂN THỊ! ★                           │
  │    → Menu sidebar (tree menu!)                                │
  │    → Tỉnh/Thành/Quận (cascading!)                           │
  │    → Tổ chức nhân sự (org chart!)                            │
  │    → Phân quyền (permission tree!)                           │
  │    → Danh mục sản phẩm (category tree!)                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cách 1: Recursive — Đệ Quy! (O(n²))

```
  RECURSIVE FLOW:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  listToTree(list, parentId=0)                                  │
  │  │                                                            │
  │  ├─ Duyệt list → tìm parentId === 0 → TÌM A! ★             │
  │  │  ├─ listToTree(list, 1) ← tìm con của A!                 │
  │  │  │  ├─ tìm parentId === 1 → TÌM B! ★                    │
  │  │  │  │  ├─ listToTree(list, 2) ← tìm con của B!          │
  │  │  │  │  │  ├─ tìm parentId === 2 → TÌM D! ★             │
  │  │  │  │  │  │  ├─ listToTree(list, 4) ← tìm con của D!   │
  │  │  │  │  │  │  │  └─ KHÔNG TÌM THẤY → return []          │
  │  │  │  │  │  │  └─ D không có children!                     │
  │  │  │  │  │  └─ return [D]                                   │
  │  │  │  │  └─ B.children = [D] ★                              │
  │  │  │  ├─ tìm parentId === 1 → TÌM C! ★                    │
  │  │  │  │  ├─ listToTree(list, 3) → KHÔNG TÌM THẤY          │
  │  │  │  │  └─ C không có children!                            │
  │  │  │  └─ return [B, C]                                       │
  │  │  └─ A.children = [B, C] ★                                 │
  │  └─ return [A] ← toàn bộ cây! ★                              │
  │                                                              │
  │  VẤN ĐỀ: Mỗi node duyệt TOÀN BỘ list! ★                    │
  │  → n nodes × n items = O(n²)! ❌                              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// CÁCH 1: Recursive — đơn giản nhưng O(n²)!
// ═══════════════════════════════════════════════════════════

function listToTreeRecursive(list, parentId) {
  if (parentId === undefined) parentId = 0;

  var result = [];

  for (var i = 0; i < list.length; i++) {
    // ★ Tìm tất cả node có parentId khớp!
    if (list[i].parentId === parentId) {
      // ★ ĐỆ QUY: tìm con của node này!
      var children = listToTreeRecursive(list, list[i].id);

      // ★ Tạo bản SAO để không sửa dữ liệu gốc!
      var node = {};
      for (var key in list[i]) {
        if (list[i].hasOwnProperty(key)) {
          node[key] = list[i][key];
        }
      }

      // ★ Chỉ thêm children nếu có con!
      if (children.length > 0) {
        node.children = children;
      }

      result.push(node);
    }
  }

  return result;
}

// TEST:
// var list = [
//   { id: 1, name: 'A', parentId: 0 },
//   { id: 2, name: 'B', parentId: 1 },
//   { id: 3, name: 'C', parentId: 1 },
//   { id: 4, name: 'D', parentId: 2 },
// ];
// listToTreeRecursive(list)
// → [{ id:1, name:'A', children: [
//      { id:2, name:'B', children: [{ id:4, name:'D' }] },
//      { id:3, name:'C' }
//    ]}]
```

---

## §3. Cách 2: Map — O(n)! ★★★

```
  MAP OPTIMIZATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ "ĐỔI KHÔNG GIAN LẤY THỜI GIAN!" ★                         │
  │                                                              │
  │  Recursive: Mỗi lần tìm con → duyệt TOÀN BỘ list! ❌       │
  │  Map: Tạo index TABLE → tra cứu O(1)! ★                      │
  │                                                              │
  │  BƯỚC 1: Tạo map (index table!) — Duyệt lần 1!               │
  │  ┌────────────────────────────────────────────┐              │
  │  │ map = {                                     │              │
  │  │   1: { id:1, name:'A', children: [] }       │              │
  │  │   2: { id:2, name:'B', children: [] }       │              │
  │  │   3: { id:3, name:'C', children: [] }       │              │
  │  │   4: { id:4, name:'D', children: [] }       │              │
  │  │ }                                           │              │
  │  └────────────────────────────────────────────┘              │
  │                                                              │
  │  BƯỚC 2: Thiết lập quan hệ cha-con! — Duyệt lần 2!          │
  │  ┌────────────────────────────────────────────┐              │
  │  │ item 1: parentId=0 → ROOT! push vào result!│              │
  │  │ item 2: parentId=1 → map[1].children.push! │              │
  │  │ item 3: parentId=1 → map[1].children.push! │              │
  │  │ item 4: parentId=2 → map[2].children.push! │              │
  │  └────────────────────────────────────────────┘              │
  │                                                              │
  │  ★ CHỈ 2 lần duyệt! O(n) + O(n) = O(n)! ★                   │
  │                                                              │
  │  TẠI SAO RESULT CÓ TOÀN BỘ CÂY? ★★★                          │
  │  ┌────────────────────────────────────────────┐              │
  │  │ result.push(map[1])   ← push REFERENCE! ★  │              │
  │  │ map[1].children = [map[2], map[3]]          │              │
  │  │ map[2].children = [map[4]]                  │              │
  │  │                                             │              │
  │  │ result[0] = map[1]                           │              │
  │  │ result[0].children[0] = map[2]               │              │
  │  │ result[0].children[0].children[0] = map[4]   │              │
  │  │                                             │              │
  │  │ → TẤT CẢ liên kết qua REFERENCE! ★★★       │              │
  │  │ → Return result = return TOÀN BỘ cây! ✅    │              │
  │  └────────────────────────────────────────────┘              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// CÁCH 2: Map — O(n)! ★★★
// ═══════════════════════════════════════════════════════════

function listToTree(list) {
  var map = {}; // ★ Index table!
  var result = []; // ★ Root nodes!

  // ★ BƯỚC 1: Tạo map — copy mỗi node + children rỗng!
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    // ★ Tạo bản SAO (không sửa data gốc!)
    var node = {};
    for (var key in item) {
      if (item.hasOwnProperty(key)) {
        node[key] = item[key];
      }
    }
    node.children = []; // ★ Chuẩn bị mảng con!
    map[item.id] = node; // ★ Lưu vào map theo id!
  }

  // ★ BƯỚC 2: Thiết lập quan hệ cha-con!
  for (var j = 0; j < list.length; j++) {
    var current = list[j];

    if (current.parentId === 0) {
      // ★ Root node → push vào result!
      result.push(map[current.id]);
    } else {
      // ★ Có cha → tìm cha trong map → push!
      var parent = map[current.parentId];
      if (parent) {
        parent.children.push(map[current.id]);
        // ★ parent.children LƯU REFERENCE đến node!
        // ★ Khi result chứa parent → tự động có con! ★★★
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
// CÁCH 2b: Map — 1 lần duyệt! (tối ưu hơn!) ★★★
// ═══════════════════════════════════════════════════════════

function listToTreeOnePass(list) {
  var map = {};
  var result = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = item.id;
    var parentId = item.parentId;

    // ★ Nếu node đã tồn tại trong map (do con tạo trước!)
    if (!map[id]) {
      map[id] = { children: [] };
    }

    // ★ Copy properties vào node!
    for (var key in item) {
      if (item.hasOwnProperty(key)) {
        map[id][key] = item[key];
      }
    }

    if (parentId === 0) {
      // ★ Root!
      result.push(map[id]);
    } else {
      // ★ Tạo cha nếu chưa có! (con xuất hiện TRƯỚC cha!)
      if (!map[parentId]) {
        map[parentId] = { children: [] };
      }
      map[parentId].children.push(map[id]);
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
// NGƯỢC LẠI: Tree → Flat List! ★
// ═══════════════════════════════════════════════════════════

function treeToList(tree) {
  var result = [];

  function walk(nodes) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      // ★ Copy node KHÔNG có children!
      var flat = {};
      for (var key in node) {
        if (key !== "children" && node.hasOwnProperty(key)) {
          flat[key] = node[key];
        }
      }
      result.push(flat);

      // ★ Đệ quy nếu có con!
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  }

  walk(tree);
  return result;
}
```

---

## §4. Spread — Tại Sao Copy?

```
  TẠI SAO PHẢI COPY (spread/manual copy)?
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❌ KHÔNG COPY — sửa data gốc!                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  var original = [{ id: 1, name: 'A' }];              │    │
  │  │  var map = {};                                         │    │
  │  │  map[1] = original[0]; // ★ CÙNG reference! ★         │    │
  │  │  map[1].children = []; // ★ SỬA original! ❌          │    │
  │  │                                                      │    │
  │  │  console.log(original[0]);                              │    │
  │  │  → { id:1, name:'A', children:[] } ← BỊ SỬA! ❌     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ✅ CÓ COPY — data gốc nguyên vẹn!                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  var original = [{ id: 1, name: 'A' }];              │    │
  │  │  var map = {};                                         │    │
  │  │  // Tạo bản sao!                                       │    │
  │  │  map[1] = { id: original[0].id, name: original[0].name,│   │
  │  │            children: [] };                              │    │
  │  │  // ES6: map[1] = { ...original[0], children: [] };   │    │
  │  │                                                      │    │
  │  │  console.log(original[0]);                              │    │
  │  │  → { id:1, name:'A' } ← NGUYÊN VẸN! ✅              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHI NÀO CẦN COPY?                                              │
  │  → Data từ API → KHÔNG muốn sửa! ★                          │
  │  → Dùng data nhiều lần! ★                                    │
  │  → Thêm property (children) mà không ảnh hưởng gốc! ★     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. So Sánh!

```
  ┌──────────────────┬──────────────────┬──────────────────┐
  │ Tiêu chí        │ Recursive O(n²) │ Map O(n) ★       │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Thời gian        │ O(n²) ❌ chậm!  │ O(n) ✅ nhanh!  │
  │ Bộ nhớ          │ O(1) ít!        │ O(n) nhiều hơn! │
  │ Độ phức tạp code│ Ngắn (5 dòng!)  │ Dài hơn (15!)    │
  │ Dễ hiểu        │ ⭐⭐⭐⭐⭐ ★       │ ⭐⭐⭐              │
  │ 100 nodes        │ 10,000 ops ❌   │ 200 ops ✅       │
  │ 1,000 nodes      │ 1,000,000 ❌    │ 2,000 ✅ ★       │
  │ Khi nào dùng    │ ≤ 100 items!     │ > 100 items! ★   │
  │ Phỏng vấn       │ Nói trước! ★     │ Tối ưu sau! ★   │
  └──────────────────┴──────────────────┴──────────────────┘
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI + CÁCH TRẢ LỜI (5 TẦNG!):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TẦNG 1 — Cơ bản:                                               │
  │  "Dùng đệ quy! Tìm root → đệ quy tìm con mỗi node!" ★    │
  │                                                              │
  │  TẦNG 2 — Tối ưu:                                               │
  │  "Đệ quy O(n²) chậm! Dùng Map index table → O(n)!" ★      │
  │                                                              │
  │  TẦNG 3 — Chi tiết:                                              │
  │  "Copy object (spread) → không sửa data gốc!" ★             │
  │  "Xử lý edge case: parent không tồn tại!" ★                 │
  │                                                              │
  │  TẦNG 4 — Nguyên lý:                                            │
  │  "Map dùng reference! result chứa root → root.children      │
  │   chứa reference đến con → trả result = trả toàn bộ!" ★   │
  │                                                              │
  │  TẦNG 5 — Ứng dụng:                                             │
  │  "Menu sidebar, tỉnh/thành/quận, org chart, permission!" ★ │
  │                                                              │
  │  ❓ Nhiều root node?                                              │
  │  → OK! result chứa TẤT CẢ root → "rừng" (forest!) ★       │
  │                                                              │
  │  ❓ Circular reference (A→B→A)?                                  │
  │  → Infinite recursion! ❌ Cần validate data trước! ★        │
  │  → Hoặc set max depth!                                       │
  │                                                              │
  │  ❓ Tại sao return result = toàn bộ cây?                         │
  │  → JS object = REFERENCE! ★★★                                │
  │  → result[0] = root → root.children = [child refs]          │
  │  → Qua reference chain → truy cập MỌI descendant! ★        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
