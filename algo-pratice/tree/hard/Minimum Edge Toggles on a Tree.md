# 🔀 Minimum Edge Toggles on a Tree — LeetCode #3812 (Hard)

> 📖 Code: [Minimum Edge Toggles on a Tree.js](./Minimum%20Edge%20Toggles%20on%20a%20Tree.js)

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

> ⚡ **Đọc phần này TRƯỚC. Nếu bạn chỉ nhớ 1 thứ, nhớ phần này.**

### 1️⃣ Analogy — Ví dụ đời thường

```
🏥 BỆNH VIỆN TRÊN CÂY — đây là TẤT CẢ bạn cần nhớ!

  Tưởng tượng: N người đứng trên cây (tree), nối nhau bằng DÂY.
  Mỗi người có trạng thái: 😊 KHỎE hoặc 🤒 BỆNH.

  Bạn có 1 loại THUỐC ĐẶC BIỆT:
    → Bôi vào DÂY (edge) → ĐỔI trạng thái CẢ 2 ĐẦU DÂY!
    → Người khỏe → bệnh 😊→🤒 (tác dụng phụ!)
    → Người bệnh → khỏe 🤒→😊 (chữa được!)

  ĐỀ BÀI: Cho trạng thái ban đầu (start) và mong muốn (target).
  Tìm BÔI THUỐC VÀO NHỮNG DÂY NÀO để biến start → target!
```

### 🎯 Hiểu toggle BẰNG HÌNH — Xem rồi tự hiểu!

```
VÍ DỤ ĐƠN GIẢN NHẤT: 3 người xếp hàng

  start:    😊 ——— 🤒 ——— 😊
            A  dây0  B  dây1  C
  target:   🤒       😊       😊

  So sánh từng người:
    A: 😊→🤒 = CẦN ĐỔI ❗
    B: 🤒→😊 = CẦN ĐỔI ❗
    C: 😊→😊 = OK ✅

  Bôi thuốc vào DÂY 0 (giữa A và B):
    
  TRƯỚC:  😊 ——— 🤒 ——— 😊
              ↑ bôi!
  SAU:    🤒 ——— 😊 ——— 😊   ← ĐÚNG TARGET! ✅
          A đổi! B đổi! C giữ nguyên!

  → Chỉ cần 1 dây! Answer = [0]
```

```
VÍ DỤ KHÓ HƠN: 2 người CẦN ĐỔI nhưng KHÔNG kề nhau!

  start:    🤒 ——— 😊 ——— 😊
            A  dây0  B  dây1  C
  target:   😊       😊       🤒

  So sánh: A cần đổi ❗, B ok ✅, C cần đổi ❗
  Nhưng A và C không kề nhau! Phải "chuyền" qua B!

  Bước 1 — bôi dây 0 (A-B):
    🤒→😊  😊→🤒  😊       A xong! Nhưng B bị đổi nhầm!
     A✅     B❌   C

  Bước 2 — bôi dây 1 (B-C):
    😊   🤒→😊  😊→🤒      B quay lại! C cũng xong!
    A     B✅     C✅

  node A: đổi 1 lần → thay đổi thật! ✅
  node B: đổi 2 lần → quay lại ban đầu! ✅ (TỰ HỦY!)
  node C: đổi 1 lần → thay đổi thật! ✅

  💡 Node ở GIỮA bị đổi 2 lần = CHẴN lần = tự hủy!
     Chỉ 2 ĐẦU ĐƯỜNG bị đổi LẺ lần = đổi thật!
```

```
VÍ DỤ IMPOSSIBLE:

  start:    😊 ——— 😊
            A  dây0  B
  target:   😊       🤒

  Chỉ 1 người cần đổi! Nhưng bôi dây = đổi CẢ 2!
  → Không thể chỉ đổi 1 người! → [-1]

  💡 Số người cần đổi phải CHẴN!
     (vì mỗi lần bôi = đổi đúng 2 người)
```

### 2️⃣ Recipe — DFS + XOR

```
📝 RECIPE:

  Bước 1: Tính diff[i] = start[i] XOR target[i]
           → diff[i]=1 nghĩa là node i CẦN ĐỔI trạng thái
           
  Bước 2: Đếm tổng diff = bao nhiêu node cần đổi?
           → Nếu là SỐ LẺ → IMPOSSIBLE! (return [-1])
           → Vì mỗi toggle đổi ĐÚNG 2 node (chẵn!)

  Bước 3: DFS từ root:
           → Ở mỗi cạnh (u, v): nếu subtree(v) có SỐ LẺ
             node cần đổi → PHẢI toggle cạnh này!
           → Vì: số lẻ node bên trong → không tự ghép hết
             → phải "gửi" 1 lần đổi qua cạnh → toggle!

  Thu thập edge indices → sort → return!
```

```javascript
// BẢN CHẤT:
function minEdgeToggles(n, edges, start, target) {
  // Bước 1: tính diff
  const diff = new Array(n);
  for (let i = 0; i < n; i++) {
    diff[i] = start[i] !== target[i] ? 1 : 0;
  }

  // Bước 2: check chẵn
  const totalDiff = diff.reduce((a, b) => a + b, 0);
  if (totalDiff % 2 !== 0) return [-1];

  // Bước 3: DFS — đếm subtree diff, toggle khi lẻ
  // ... (xem code đầy đủ)
}
```

### 3️⃣ Visual — Hình ảnh ghi vào đầu

```
VÍ DỤ 1: n=3, edges=[[0,1],[1,2]], start="010", target="100"

  Tree:     0 --- 1 --- 2
           edge0  edge1

  start:    0     1     0
  target:   1     0     0
  diff:     1     1     0    (cần đổi node 0 và node 1)

  Tổng diff = 2 (chẵn → OK!)

  Toggle edge 0 (giữa node 0 và node 1):
    node 0: 0 → 1 ✅
    node 1: 1 → 0 ✅
  
  Kết quả: start biến thành target! Output: [0]
```

```
VÍ DỤ 2: n=7, edges=[[0,1],[1,2],[2,3],[3,4],[3,5],[1,6]]
         start="0011000", target="0010001"

  Tree:        0
               |  edge0
               1
              / \
         edge1   edge5
            2       6
            |  edge2
            3
           / \
      edge3   edge4
         4       5

  diff:     0  0  0  1  0  0  1
                      ↑           ↑
                    node 3     node 6

  Nhìn cây: node 3 cần đổi, node 6 cần đổi.
  
  Nhưng toggle 1 edge đổi 2 ENDPOINTS! 
  Phải tìm ĐƯỜNG ĐI toggle sao cho:
  - node 3 và node 6 bị flip số lần LẺ → đổi trạng thái
  - các node khác bị flip số lần CHẴN → giữ nguyên

  Toggle edges [1, 2, 5]:
    edge 1 (1-2): flip 1,2
    edge 2 (2-3): flip 2,3  
    edge 5 (1-6): flip 1,6

    node 0: 0 flips → giữ nguyên ✅
    node 1: 2 flips → giữ nguyên ✅
    node 2: 2 flips → giữ nguyên ✅
    node 3: 1 flip  → đổi ✅
    node 4: 0 flips → giữ nguyên ✅
    node 5: 0 flips → giữ nguyên ✅
    node 6: 1 flip  → đổi ✅

  Output: [1, 2, 5] ✅
```

```
VÍ DỤ 3: n=2, edges=[[0,1]], start="00", target="01"

  diff: [0, 1] → tổng = 1 (LẺ!) → IMPOSSIBLE!
  Vì toggle cạnh duy nhất đổi CẢ 2 node → không thể chỉ đổi 1!
  Output: [-1]
```

### 4️⃣ Tại sao "subtree lẻ → toggle"?

```
❓ "Tại sao đếm subtree diff?"

  Với mỗi cạnh (parent — child), chia cây thành 2 phần:
  - Phần TRONG subtree(child)
  - Phần NGOÀI subtree(child)

  Nếu subtree(child) có SỐ CHẴN diff:
  → Tự ghép cặp bên trong được → KHÔNG cần toggle cạnh này!

  Nếu subtree(child) có SỐ LẺ diff:
  → Không tự ghép hết → PHẢI toggle cạnh này
  → Toggle = "gửi" 1 flip qua cạnh cho bên ngoài!

  VÍ DỤ:
       parent
         |  ← toggle cạnh này?
       child
        / \
       A   B

  subtree(child) có diff = [child:1, A:0, B:1] → tổng = 2 (chẵn)
  → A và B tự ghép cặp bên trong → KHÔNG toggle!

  subtree(child) có diff = [child:1, A:0, B:0] → tổng = 1 (lẻ)
  → Không ghép được → PHẢI toggle cạnh parent-child!
```

### 5️⃣ Flashcard — Tự kiểm tra

| ❓ Câu hỏi | ✅ Đáp án |
|---|---|
| Toggle 1 edge ảnh hưởng gì? | Flip CẢ 2 endpoints! |
| diff[i] = ? | `start[i] XOR target[i]` (cần đổi?) |
| Khi nào IMPOSSIBLE? | Tổng diff là SỐ LẺ |
| Khi nào toggle 1 cạnh? | Subtree bên kia có SỐ LẺ diff |
| Duyệt thế nào? | **DFS** (post-order, từ lá lên) |
| Time? | **O(n)** — DFS 1 lần |
| Space? | **O(n)** — adjacency list + diff |
| Tại sao tree? | Giữa 2 node chỉ có 1 đường → duy nhất! |

### 6️⃣ Sai lầm phổ biến

```
❌ SAI LẦM #1: Quên check tổng diff chẵn/lẻ!

   Tổng lẻ → IMPOSSIBLE! Return [-1] trước!
   Nếu không check: algorithm chạy sai!

─────────────────────────────────────────────────────

❌ SAI LẦM #2: Nhầm diff = start[i] - target[i]!

   Phải dùng XOR (hoặc !=):
   diff[i] = start[i] !== target[i] ? 1 : 0
   Vì chỉ cần biết "CÓ KHÁC không", không cần biết khác bao nhiêu!

─────────────────────────────────────────────────────

❌ SAI LẦM #3: Toggle = đổi 1 node!

   KHÔNG! Toggle = đổi CẢ 2 ENDPOINTS cùng lúc!
   Đây là điểm khó của bài — 1 action ảnh hưởng 2 node!

─────────────────────────────────────────────────────

❌ SAI LẦM #4: Quên return edge INDEX!

   Bài yêu cầu edge INDEX (vị trí trong edges array)
   KHÔNG phải cặp nodes!
```

---

### 7️⃣ CHIA NHỎ BÀI TOÁN — Từ 0 đến hiểu hoàn toàn!

> 🚨 **Bí quyết: BẮT ĐẦU TỪ VÍ DỤ NHỎ NHẤT, rồi mở rộng dần!**

#### 🔬 Bài con #1: Chỉ có 2 node

```
  A ——— B         toggle = flip CẢ HAI! 
 edge0

Trường hợp 1: start="00", target="00" → diff=[0,0]
  → Không cần đổi gì! → answer = []

Trường hợp 2: start="00", target="11" → diff=[1,1]
  → Cả 2 cần đổi! Toggle edge 0 → flip A,B → done!
  → answer = [0]

Trường hợp 3: start="00", target="01" → diff=[0,1]
  → Chỉ 1 node cần đổi, nhưng toggle đổi 2!
  → IMPOSSIBLE! → answer = [-1]

💡 INSIGHT #1: Số node cần đổi phải CHẴN!
   (vì mỗi toggle đổi đúng 2 node)
```

#### 🔬 Bài con #2: Đường thẳng 3 node

```
  A ——— B ——— C
 edge0  edge1

start = "010"
target = "100"
diff =   [1, 1, 0]    ← A cần đổi, B cần đổi, C OK

Tổng diff = 2 (chẵn → có thể!)

  Thử toggle edge 0 (A-B): flip A và B
    A: 0→1 ✅   B: 1→0 ✅   C: 0 (không đổi) ✅
  → XONG! Chỉ cần 1 toggle!

💡 INSIGHT #2: Nếu 2 node CẦN ĐỔI nằm KỀ NHAU 
   → toggle cạnh giữa chúng = giải quyết CẢ 2!
```

```
  Thay đổi ví dụ:
  start = "100"
  target = "001"
  diff =   [1, 0, 1]    ← A cần đổi, C cần đổi (B thì OK)

  Nhưng A và C KHÔNG kề nhau! Phải qua B!

  Toggle edge 0 (A-B): A: 1→0 ✅,  B: 0→1 ❌ (B bị đổi nhầm!)
  Toggle edge 1 (B-C): B: 1→0 ✅,  C: 0→1 ✅

  → Cần 2 toggles! B bị flip 2 lần → quay lại ban đầu!

💡 INSIGHT #3: Node ở GIỮA ĐƯỜNG bị flip 2 lần = CHẴN lần!
   → Tự hủy nhau! Chỉ 2 đầu bị flip LẺ lần → đổi thật!
```

#### 🔬 Bài con #3: Tree có nhánh (4 nodes)

```
       0
       |  edge0
       1
      / \
 edge1   edge2
   2       3

start  = "0000"
target = "1001"
diff   = [1,0,0,1]   ← node 0 và node 3 cần đổi

Tổng diff = 2 (chẵn → OK!)

Hỏi: toggle những edge nào?

  Node 0 và node 3 cần "kết nối" → đường đi: 0→1→3
  Toggle edge 0 (0-1): flip 0,1
  Toggle edge 2 (1-3): flip 1,3

  Node 0: 1 flip → đổi ✅
  Node 1: 2 flips → giữ nguyên ✅ (flip 2 lần = hủy nhau!)
  Node 3: 1 flip → đổi ✅
  Node 2: 0 flips → giữ nguyên ✅

  Answer = [0, 2] ✅

💡 INSIGHT #4: Toggle = "vẽ ĐƯỜNG ĐI" giữa 2 node cần đổi!
   Các node trên đường bị flip CHẴN lần → tự hủy!
   Chỉ 2 ĐẦU ĐƯỜNG bị flip LẺ lần → đổi thật!
```

#### 🔬 Bài con #4: Tại sao "subtree lẻ → toggle"?

```
Quay lại bài con #3:

       0 (diff=1)
       |  edge0     ← TOGGLE?
       1 (diff=0)
      / \
 edge1   edge2
   2       3
(diff=0) (diff=1)

Nhìn từ GÓC ĐỘ EDGE 0 (cắt cây thành 2 phần):

  Phần TRÊN: chỉ có node 0 → diff = 1 (LẺ!)
  Phần DƯỚI: node 1,2,3 → diff = 0+0+1 = 1 (LẺ!)

  Phần dưới có 1 node cần đổi (node 3).
  1 là SỐ LẺ → không tự ghép cặp bên trong được!
  → PHẢI "gửi" 1 flip qua edge 0 → TOGGLE edge 0!

─────────────────────────────────────────────────────

Bây giờ nhìn EDGE 1 (cắt subtree node 2):

  Subtree(2): chỉ node 2 → diff = 0 (CHẴN!)
  → Không cần đổi gì → KHÔNG toggle edge 1!

─────────────────────────────────────────────────────

Nhìn EDGE 2 (cắt subtree node 3):

  Subtree(3): chỉ node 3 → diff = 1 (LẺ!)
  → Phải gửi flip qua → TOGGLE edge 2!

─────────────────────────────────────────────────────

  Kết quả: toggle edge 0 và edge 2 = [0, 2] ✅

💡 INSIGHT #5 (CUỐI CÙNG!):
   Với MỖI CẠNH → nhìn subtree con → đếm diff:
     CHẴN → subtree tự giải quyết bên trong → KHÔNG toggle!
     LẺ   → subtree cần "gửi" 1 flip ra ngoài → TOGGLE!
   
   Dùng DFS post-order (từ lá lên) → đếm tự động!
```

#### 📌 TÓM LẠI — 5 insights xây từ ví dụ nhỏ:

```
  Insight #1 (2 nodes):  Tổng diff phải CHẴN → nếu lẻ = IMPOSSIBLE
  Insight #2 (3 nodes):  2 node kề cần đổi → toggle cạnh giữa
  Insight #3 (3 nodes):  Node giữa bị flip CHẴN lần → tự hủy!
  Insight #4 (4 nodes):  Toggle = "vẽ đường" giữa 2 node cần đổi
  Insight #5 (tổng quát): Subtree diff LẺ → TOGGLE cạnh!
                          Subtree diff CHẴN → KHÔNG toggle!
  
  → DFS post-order: mỗi con return diff count cho cha
  → Cha check: lẻ? toggle! chẵn? skip!
```

```
📌 PATTERN: "TREE + EDGE CUT + PARITY"
  
  Trick chung: cắt 1 cạnh chia tree thành 2 phần
  → kiểm tra TÍNH CHẤT mỗi phần (chẵn/lẻ, size, sum...)
  → quyết định có cắt/toggle hay không!
```

---

> 📚 **GIẢI THÍCH CHI TIẾT + INTERVIEW SCRIPT bên dưới.**

---

## R — Repeat & Clarify

💬 *"Tree n nodes, mỗi node có màu (0/1). Toggle 1 edge = flip cả 2 endpoints. Tìm tập edges tối thiểu để biến start → target."*

### Câu hỏi:

1. **"Toggle ảnh hưởng gì?"** → Flip CẢ 2 endpoints (0→1, 1→0).
2. **"Có luôn khả thi?"** → KHÔNG! Nếu số node cần đổi là lẻ → return [-1].
3. **"Return gì?"** → Edge INDICES, sorted ascending.
4. **"Tree hay graph?"** → TREE! (n-1 edges, connected, no cycles).

---

## E — Examples

```
VÍ DỤ 1: edges=[[0,1],[1,2]], start="010", target="100"
  diff = [1,1,0], tổng=2 (chẵn)
  Toggle edge 0 → flip node 0,1 → done!
  Output: [0]

VÍ DỤ 2: edges=[[0,1],[1,2],[2,3],[3,4],[3,5],[1,6]]
  start="0011000", target="0010001"
  diff = [0,0,0,1,0,0,1], tổng=2 (chẵn)
  Output: [1,2,5]

VÍ DỤ 3: edges=[[0,1]], start="00", target="01"
  diff = [0,1], tổng=1 (LẺ → IMPOSSIBLE!)
  Output: [-1]
```

---

## A — Approach

```
┌──────────────────────────────────────────────────────────┐
│ DFS + PARITY CHECK                                       │
│                                                          │
│ 1. Tính diff[i] = start[i] XOR target[i]                │
│ 2. Tổng diff lẻ? → return [-1]                          │
│ 3. DFS post-order: mỗi cạnh, đếm subtree diff           │
│    → Subtree diff lẻ? → toggle cạnh này!                │
│ 4. Collect edge indices → sort → return                  │
│                                                          │
│ Time: O(n) | Space: O(n)                                │
└──────────────────────────────────────────────────────────┘
```

---

## C — Code

```javascript
function minEdgeToggles(n, edges, start, target) {
  // 1. Tính diff: node nào cần đổi?
  const diff = new Array(n);
  for (let i = 0; i < n; i++) {
    diff[i] = start[i] !== target[i] ? 1 : 0;
  }

  // 2. Check: tổng lẻ → impossible
  const totalDiff = diff.reduce((a, b) => a + b, 0);
  if (totalDiff % 2 !== 0) return [-1];
  if (totalDiff === 0) return []; // đã giống rồi!

  // 3. Build adjacency list (lưu edge index!)
  const adj = Array.from({ length: n }, () => []);
  for (let i = 0; i < edges.length; i++) {
    const [a, b] = edges[i];
    adj[a].push({ node: b, edgeIdx: i });
    adj[b].push({ node: a, edgeIdx: i });
  }

  // 4. DFS post-order: đếm subtree diff
  const result = [];
  const visited = new Array(n).fill(false);

  function dfs(node) {
    visited[node] = true;
    let subtreeDiff = diff[node]; // bắt đầu từ chính node

    for (const { node: neighbor, edgeIdx } of adj[node]) {
      if (visited[neighbor]) continue; // skip parent!
      const childDiff = dfs(neighbor); // hỏi con: bao nhiêu diff?
      subtreeDiff += childDiff;

      // Nếu subtree con có SỐ LẺ diff → toggle cạnh này!
      if (childDiff % 2 !== 0) {
        result.push(edgeIdx);
      }
    }

    return subtreeDiff;
  }

  dfs(0);
  result.sort((a, b) => a - b); // sort ascending
  return result;
}
```

### Trace chi tiết:

```
n=7, edges=[[0,1],[1,2],[2,3],[3,4],[3,5],[1,6]]
start="0011000", target="0010001"

Tree (rooted at 0):
         0
         | edge0
         1
        / \ 
   edge1   edge5
      2       6
      | edge2
      3
     / \
 edge3  edge4
   4      5

diff = [0, 0, 0, 1, 0, 0, 1]

DFS post-order từ 0:
  dfs(4): leaf, diff=0 → return 0
  dfs(5): leaf, diff=0 → return 0
  dfs(3): diff[3]=1, children=[0,0]
    subtreeDiff = 1+0+0 = 1
    child 4: childDiff=0 (chẵn) → KHÔNG toggle edge3
    child 5: childDiff=0 (chẵn) → KHÔNG toggle edge4
    return 1

  dfs(2): diff[2]=0, children=[1]
    subtreeDiff = 0+1 = 1
    child 3: childDiff=1 (LẺ!) → TOGGLE edge2! ✅
    return 1

  dfs(6): leaf, diff[6]=1 → return 1

  dfs(1): diff[1]=0, children=[1, 1]
    subtreeDiff = 0+1+1 = 2
    child 2: childDiff=1 (LẺ!) → TOGGLE edge1! ✅
    child 6: childDiff=1 (LẺ!) → TOGGLE edge5! ✅
    return 2

  dfs(0): diff[0]=0, children=[2]
    subtreeDiff = 0+2 = 2
    child 1: childDiff=2 (chẵn) → KHÔNG toggle edge0
    return 2

result = [2, 1, 5] → sort → [1, 2, 5] ✅
```

---

## T — Test

```
  ✅ n=3, [[0,1],[1,2]], "010", "100"               → [0]
  ✅ n=7, [[0,1],...,[1,6]], "0011000", "0010001"   → [1,2,5]
  ✅ n=2, [[0,1]], "00", "01"                        → [-1]
  ✅ n=3, [[0,1],[1,2]], "000", "000"               → []
  ✅ n=4, [[0,1],[1,2],[2,3]], "0000", "1111"       → [0,2]
  ✅ n=2, [[0,1]], "01", "10"                        → [0]
```

---

## O — Optimize

```
┌─────────────────────┬──────────────┬──────────────┐
│ Approach             │ Time         │ Space        │
├─────────────────────┼──────────────┼──────────────┤
│ DFS + Parity ⭐      │ O(n)         │ O(n)         │
└─────────────────────┴──────────────┴──────────────┘

  Chỉ 1 lần DFS! Không thể nhanh hơn O(n)!
  Space O(n): adjacency list + diff + recursion stack
```

---

## 🧩 Pattern Recognition

```
Pattern: "TREE + EDGE CUT + PARITY/SIZE"

  Edge Toggles (#3812):  subtree diff lẻ → toggle
  Good Nodes (#3249):    subtree SIZE bằng nhau
  Delete Edge Balance:   subtree SUM chia đều

  CHUNG: DFS post-order, return thông tin subtree cho cha!
  Cha quyết định dựa trên info con trả về!
```

---

## 🔗 Liên hệ

```
Edge Toggles vs Good Nodes (#3249):
  Good Nodes: return SIZE subtree, check bằng nhau
  Edge Toggles: return DIFF COUNT subtree, check chẵn/lẻ
  Cả 2: DFS post-order, con trả thông tin cho cha!

Edge Toggles vs Balanced Tree:
  Balanced: return HEIGHT, check |left - right| ≤ 1
  Edge Toggles: return DIFF SUM, check % 2
  Cả 2: bottom-up DFS!
```

---

## 🗣️ Think Out Loud — Kịch Bản Interview

> Format: 🎙️ = **NÓI TO** | 🧠 = **SUY NGHĨ THẦM**

---

### 📌 Phút 0–2: Clarify

> 🎙️ *"Toggling an edge flips BOTH endpoints. I need to find the minimum set of edges to toggle so start becomes target. Return edge indices sorted, or [-1] if impossible."*

---

### 📌 Phút 2–4: Key Observations

> 🎙️ *"First, I compute diff[i] = start[i] XOR target[i]. If the total number of diffs is odd, it's impossible — each toggle flips exactly 2 nodes, so we can only change an even number."*

> 🎙️ *"On a tree, if I cut any edge, it splits into two parts. If one part has an odd number of diffs, those nodes can't be fully paired within that part — so the edge MUST be toggled."*

---

### 📌 Phút 4–8: Code

> 🎙️ *"DFS post-order: each node returns the count of diffs in its subtree. If a child's subtree has an odd diff count, I toggle that edge. Collect edge indices, sort, return."*

---

### 📌 Phút 8–10: Complexity

> 🎙️ *"O(n) time — single DFS pass. O(n) space — adjacency list and recursion stack. This is optimal."*

---

### 📌 Follow-up Q&A

**Q1: "Why does parity determine the answer?"**

> 🎙️ *"Each toggle flips exactly 2 nodes. So if a subtree has an odd number of nodes needing change, one MUST cross the boundary — meaning that edge must be toggled."*

**Q2: "Is the answer unique?"**

> 🎙️ *"Yes! On a tree, each edge is a bridge — cutting it uniquely splits the tree. The parity of each part is fixed, so which edges to toggle is deterministic."*

---

### 🧠 Tóm tắt

```
  KEY POINTS:
  ✅ diff[i] = start[i] XOR target[i]
  ✅ Tổng diff LẺ → IMPOSSIBLE
  ✅ DFS post-order: subtree diff LẺ → toggle cạnh!
  ✅ Mỗi toggle = flip 2 endpoints = "ghép cặp"
  ✅ O(n) time, O(n) space
  ✅ Return edge INDICES (sorted!)
  ✅ Tree → mỗi cạnh là bridge → answer duy nhất!
```
