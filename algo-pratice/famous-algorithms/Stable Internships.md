# 💼 Stable Internships — Gale-Shapley Algorithm (AlgoExpert)

> 📖 Code: [Stable Internships.js](./Stable%20Internships.js)

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

> ⚡ **Đọc phần này TRƯỚC. Nếu bạn chỉ nhớ 1 thứ, nhớ phần này.**

### 1️⃣ Analogy — Ví dụ đời thường

```
💒 XẾP CẶP ĐI PROM — đây là TẤT CẢ bạn cần nhớ!

  N nam sinh (interns) + N nữ sinh (teams).
  Mỗi người có DANH SÁCH ƯU TIÊN.

  Quy tắc: NAM SINH CHỦ ĐỘNG TỎ TÌNH (interns propose!)

  Vòng 1: Mỗi nam → tỏ tình với NỮ SỐ 1 trong danh sách
    → Nữ chưa có bạn? → GHÉP!
    → Nữ ĐÃ có bạn? → Nữ SO SÁNH: thích ai hơn? → GIỮ người khá hơn!
    → Nam bị từ chối? → Quay lại, tỏ tình NỮ SỐ 2!

  Lặp lại cho đến khi TẤT CẢ đều có cặp!

  KẾT QUẢ = "STABLE" vì:
    → Không có cặp nào muốn BỎ nhau để đi với người khác!
    → VÀ thiên vị NAM (interns) — nam được ưu tiên tốt nhất có thể!
```

### 2️⃣ Recipe — Gale-Shapley Algorithm

```
📝 RECIPE:

  Chuẩn bị:
    ① freeInterns = stack/queue tất cả interns
    ② chosenInterns = {} (team → intern đang ghép)
    ③ currentChoice = [0, 0, ...] (mỗi intern đang ở choice thứ mấy)
    ④ teamMaps = rank lookup (team → {intern: rank}) → O(1)!

  Lặp (while freeInterns not empty):
    ① Lấy 1 intern ra
    ② Intern chọn team YÊU THÍCH NHẤT (chưa thử)
    ③ Team chưa ai? → GHÉP!
       Team có rồi? → Team SO SÁNH rank:
         → Thích intern mới hơn? → ĐỔI! Intern cũ → freeInterns
         → Thích intern cũ hơn? → TỪ CHỐI! Intern mới → freeInterns

  Kết thúc khi freeInterns rỗng!
```

```javascript
// BẢN CHẤT:
function stableInternships(interns, teams) {
  const n = interns.length;
  const chosenInterns = {};           // team → intern
  const freeInterns = [];              // stack
  const currentChoice = new Array(n).fill(0); // intern → đang ở choice nào

  // Tạo rank lookup cho mỗi team
  const teamMaps = teams.map(team => {
    const rank = {};
    team.forEach((intern, i) => rank[intern] = i);
    return rank;
  });

  // Thêm tất cả interns vào stack
  for (let i = 0; i < n; i++) freeInterns.push(i);

  while (freeInterns.length > 0) {
    const internNum = freeInterns.pop();
    const teamPref = interns[internNum][currentChoice[internNum]];
    currentChoice[internNum]++;

    if (!(teamPref in chosenInterns)) {
      chosenInterns[teamPref] = internNum; // team trống → ghép!
    } else {
      const prevIntern = chosenInterns[teamPref];
      if (teamMaps[teamPref][internNum] < teamMaps[teamPref][prevIntern]) {
        chosenInterns[teamPref] = internNum; // thích mới hơn
        freeInterns.push(prevIntern);         // cũ bị đuổi
      } else {
        freeInterns.push(internNum);          // mới bị từ chối
      }
    }
  }

  return Object.entries(chosenInterns).map(([team, intern]) => [intern, Number(team)]);
}
```

### 3️⃣ Visual — Hình ảnh ghi vào đầu

```
interns = [[0,1,2], [0,2,1], [1,2,0]]  (intern → teams ưu tiên)
teams   = [[2,1,0], [0,1,2], [0,1,2]]  (team → interns ưu tiên)

VÒNG 1: Tất cả interns chọn lần đầu

  Intern 2: muốn Team 1 → Team 1 trống → GHÉP! ✅
  Intern 1: muốn Team 0 → Team 0 trống → GHÉP! ✅
  Intern 0: muốn Team 0 → Team 0 ĐÃ có Intern 1!
    Team 0 so sánh: rank(Intern 0)=2, rank(Intern 1)=1
    → Team 0 thích Intern 1 hơn → TỪ CHỐI Intern 0!
    → Intern 0 quay lại freeInterns! ❌

VÒNG 2: Intern 0 chọn lần 2

  Intern 0: muốn Team 1 → Team 1 ĐÃ có Intern 2!
    Team 1 so sánh: rank(Intern 0)=0, rank(Intern 2)=2
    → Team 1 thích Intern 0 hơn → ĐỔI!
    → Intern 2 bị đuổi → freeInterns! 🔄

VÒNG 3: Intern 2 chọn lần 2

  Intern 2: muốn Team 2 → Team 2 trống → GHÉP! ✅

freeInterns = [] → XONG!

Kết quả: Intern 0 ↔ Team 1
         Intern 1 ↔ Team 0
         Intern 2 ↔ Team 2
         = [[0,1], [1,0], [2,2]] ✅
```

### 4️⃣ Tại sao phải tạo teamMaps?

```
❓ "teamMaps để làm gì?"

  teams = [[2,1,0], [0,1,2], [0,1,2]]

  Khi Team 0 cần so sánh Intern 0 vs Intern 1:
  ❌ Không có teamMaps: duyệt [2,1,0] tìm index → O(n)!
  ✅ Có teamMaps: teamMaps[0] = {2:0, 1:1, 0:2}
     → rank(Intern 0) = 2, rank(Intern 1) = 1 → O(1)!

  Rank NHỎ hơn = được ưu tiên HƠN! (rank 0 = top choice!)
```

### 5️⃣ Flashcard — Tự kiểm tra

| ❓ Câu hỏi | ✅ Đáp án |
|---|---|
| Ai propose (tỏ tình)? | **INTERNS!** (proposer-optimal) |
| Ai quyết định khi conflict? | **TEAMS!** (so sánh rank) |
| Kết quả thiên vị ai? | **INTERNS!** (tối ưu cho proposer) |
| Rank nhỏ nghĩa là? | Được ƯU TIÊN hơn (0 = top choice) |
| teamMaps dùng để? | Lookup O(1) rank intern theo team |
| freeInterns dùng cấu trúc gì? | Stack HOẶC Queue (đều OK!) |
| Khi nào dừng? | freeInterns rỗng (tất cả đã ghép) |
| Time? | **O(n²)** — mỗi intern thử tối đa n teams |
| Space? | **O(n²)** — teamMaps có n teams × n interns |
| Thuật toán gốc? | **Gale-Shapley** (Nobel Kinh Tế 2012!) |

### 6️⃣ Sai lầm phổ biến

```
❌ SAI LẦM #1: Quên INCREMENT currentChoice!

   Intern bị từ chối → phải chuyển sang choice TIẾP THEO!
   Nếu quên: intern cứ chọn MÃI team đầu → vô hạn!

─────────────────────────────────────────────────────

❌ SAI LẦM #2: Quên PUSH intern cũ vào freeInterns khi đổi!

   Team đổi intern mới → intern CŨ phải quay lại freeInterns!
   Nếu quên: intern cũ "mất tích" → không bao giờ ghép!

─────────────────────────────────────────────────────

❌ SAI LẦM #3: So sánh rank NGƯỢC!

   rank NHỎ = ưu tiên CAO! (0 = top choice!)
   if (rankNew < rankOld) → team thích NEW hơn!
   if (rankNew > rankOld) → team thích OLD hơn!

─────────────────────────────────────────────────────

❌ SAI LẦM #4: Duyệt teams array thay vì dùng teamMaps!

   Mỗi lần so sánh cần duyệt O(n) → tổng O(n³)!
   TeamMaps cho lookup O(1) → tổng O(n²)!

─────────────────────────────────────────────────────

❌ SAI LẦM #5: Nhầm "stable" nghĩa là "tối ưu"!

   Stable = KHÔNG CÓ cặp nào muốn bỏ nhau đi với người khác
   KHÔNG CÓ nghĩa là mọi người đều happy!
   Có thể có nhiều stable matchings → bài yêu cầu TỐI ƯU CHO INTERNS!
```

---

### 7️⃣ Cách TƯ DUY — Đọc đề xong, bắt đầu từ đâu?

> 🚨 **PHẦN QUAN TRỌNG NHẤT!** Không cần biết tên "Gale-Shapley".
> Chỉ cần hỏi đúng câu hỏi → tự khắc ra thuật toán!

```
🧠 BƯỚC 1: Đọc đề → Thử cách NGU NHẤT trước!

  Đề: "Ghép n interns với n teams, tối ưu cho interns"
  
  Câu hỏi đầu tiên: "Nếu mình là thầy giáo, mình sẽ xếp cặp thế nào?"
  → Đơn giản nhất: cho MỖI INTERN chọn team YÊU THÍCH NHẤT!

  Intern 0: muốn Team 0 ✅
  Intern 1: muốn Team 0 ❌ ← XUNG ĐỘT! 2 người cùng muốn 1 team!
  Intern 2: muốn Team 1 ✅

  💡 Bạn KHÔNG cần biết thuật toán gì cả.
     Chỉ cần THỬ → thấy VẤN ĐỀ → tìm cách SỬA!
```

```
🧠 BƯỚC 2: Xung đột! → AI sẽ QUYẾT ĐỊNH?

  Vấn đề: Intern 0 và Intern 1 cùng muốn Team 0.
  
  Câu hỏi tự nhiên: "Ai phải nhường?"
  → HỎI TEAM ĐÓ! Team 0 thích Intern nào hơn?

  Team 0 xếp hạng: [2, 1, 0] → thích Intern 2 > 1 > 0
  → Giữa Intern 0 và Intern 1: Team 0 thích Intern 1 hơn!
  → Intern 0 bị từ chối!

  💡 KEY INSIGHT: khi PROPOSER xung đột → RECEIVER quyết định!
     Bạn tự đi đến kết luận này chỉ bằng logic thông thường!
```

```
🧠 BƯỚC 3: Bị từ chối → LÀM GÌ TIẾP?

  Intern 0 bị Team 0 từ chối. Bỏ cuộc?
  → KHÔNG! Intern 0 chuyển sang choice THỨ 2: Team 1!

  Nhưng Team 1 đã có Intern 2!
  → Lại hỏi Team 1: thích Intern 0 hay Intern 2?
  → Team 1 thích Intern 0 hơn → ĐỔI!
  → Intern 2 bị đuổi → phải thử choice tiếp!

  💡 Nhận ra: đây là VÒNG LẶP!
     Lặp cho đến khi TẤT CẢ đều có cặp!
     → while (còn ai free) { ... }
```

```
🧠 BƯỚC 4: Cần THEO DÕI gì? → Data structures TỰ XUẤT HIỆN!

  Tại mỗi bước trong vòng lặp, bạn tự hỏi:

  Câu hỏi ①: "Ai chưa có cặp?"
  → Cần 1 danh sách! → freeInterns = [0, 1, 2]

  Câu hỏi ②: "Team nào đang ghép với ai?"
  → Cần 1 bảng tra cứu! → chosenInterns = {team: intern}

  Câu hỏi ③: "Intern đã thử đến team nào rồi?"
  → Cần đếm! → currentChoice = [0, 0, 0]
  → Intern 0 đã thử 2 team → currentChoice[0] = 2

  Câu hỏi ④: "Team X rank Intern A bao nhiêu? Nhanh!"
  → Duyệt array mỗi lần = O(n), chậm!
  → Pre-process thành hash map → O(1)!
  → teamMaps = [{intern: rank}, ...]

  💡 MỖI biến = trả lời 1 CÂU HỎI!
     Không phải "nhớ 4 data structures".
     Mà là "tự hỏi 4 câu → tự tạo 4 biến"!
```

```
🧠 BƯỚC 5: Tổng hợp → Code TỰ VIẾT RA!

  while (freeInterns.length > 0) {      ← "còn ai free?"
    lấy intern ra                        ← "intern nào?"
    intern chọn team tiếp theo           ← "team nào?"
    if (team trống) → ghép!              ← "có ai chưa?"
    else → team so sánh rank → giữ/đổi  ← "thích ai hơn?"
  }

  Chỉ 5 dòng logic! Từ 5 câu hỏi tự nhiên!
```

```
📌 TÓM LẠI CON ĐƯỜNG TƯ DUY:

  Đọc đề
    ↓
  "Thử cho mọi người chọn #1"     ← bắt đầu ngu nhất!
    ↓
  "Ồ, xung đột!"                   ← phát hiện vấn đề
    ↓
  "Ai quyết? → Team quyết!"        ← giải quyết tự nhiên
    ↓
  "Bị từ chối → thử tiếp!"         ← vòng lặp!
    ↓
  "Cần track gì? → 4 câu hỏi"     ← 4 data structures
    ↓
  "So sánh rank chậm? → Hash map!" ← tối ưu
    ↓
  CODE ✅

  BẠN KHÔNG CẦN BIẾT TÊN "GALE-SHAPLEY" ĐỂ GIẢI BÀI NÀY!
  Chỉ cần: THỬ → THẤY VẤN ĐỀ → HỎI CÂU HỎI → TỰ GIẢI!
```

```
💡 Tại sao đảm bảo STABLE?

  Giả sử Intern A ghép Team X, Intern B ghép Team Y.
  A thích Y hơn X? → A ĐÃ THỬ propose Y trước X rồi!
  → Y từ chối A vì thích B hơn!
  → Y sẽ KHÔNG bỏ B để đi với A!
  → Không có "instability"! ✅
```

---

> 📚 **GIẢI THÍCH CHI TIẾT + INTERVIEW SCRIPT bên dưới.**

---

## R — Repeat & Clarify

💬 *"Cho n interns và n teams, mỗi bên có danh sách ưu tiên. Tìm stable matching tối ưu cho interns."*

### Câu hỏi:

1. **"Stable nghĩa là?"** → Không có cặp (intern, team) nào CÙNG muốn bỏ match hiện tại để đi với nhau.
2. **"n interns = n teams?"** → CÓ! Luôn bằng nhau.
3. **"Tối ưu cho ai?"** → INTERNS (proposer-optimal).
4. **"Có nhiều stable matchings?"** → CÓ THỂ! Nhưng chỉ return 1.

---

## E — Examples

```
VÍ DỤ 1:
  interns = [[0,1,2], [0,2,1], [1,2,0]]
  teams   = [[2,1,0], [0,1,2], [0,1,2]]

  Output: [[0,1], [1,0], [2,2]]

  Check stable:
  Intern 0 ↔ Team 1: Intern 0 muốn Team 0 hơn, nhưng Team 0 thích Intern 1
                      → Team 0 không đồng ý! Stable ✅
  Intern 1 ↔ Team 0: Intern 1 got #1 choice! Stable ✅
  Intern 2 ↔ Team 2: Intern 2 muốn Team 1, nhưng Team 1 thích Intern 0
                      → Team 1 không đồng ý! Stable ✅

VÍ DỤ 2: (trường hợp đơn giản)
  interns = [[0], [0]]  ← SAI! n phải bằng nhau!
  interns = [[0,1], [1,0]]
  teams   = [[0,1], [1,0]]
  Output: [[0,0], [1,1]]  (mỗi bên đều được #1 choice!)
```

---

## A — Approach

```
┌──────────────────────────────────────────────────────────┐
│ GALE-SHAPLEY ALGORITHM                                   │
│                                                          │
│ Pre-process: Tạo teamMaps (rank lookup O(1))             │
│ Loop:                                                    │
│   ① Lấy intern từ freeInterns                            │
│   ② Intern propose team yêu thích nhất (chưa thử)       │
│   ③ Team trống → ghép!                                   │
│   ④ Team có rồi → so sánh rank → giữ tốt hơn!           │
│ Return matches khi freeInterns rỗng                      │
│                                                          │
│ Time: O(n²) | Space: O(n²)                              │
└──────────────────────────────────────────────────────────┘
```

---

## C — Code

> 📖 Full code: [Stable Internships.js](./Stable%20Internships.js)

```javascript
function stableInternships(interns, teams) {
  const n = interns.length;

  // 1. Tạo rank lookup cho mỗi team → O(n²)
  const teamMaps = teams.map(team => {
    const rank = {};
    team.forEach((intern, i) => rank[intern] = i);
    return rank;
  });

  // 2. Data structures
  const chosenInterns = {};                    // team → intern
  const freeInterns = Array.from({length: n}, (_, i) => i); // stack
  const currentChoice = new Array(n).fill(0); // intern → choice index

  // 3. Main loop
  while (freeInterns.length > 0) {
    const internNum = freeInterns.pop();
    const teamPref = interns[internNum][currentChoice[internNum]];
    currentChoice[internNum]++;

    if (!(teamPref in chosenInterns)) {
      // Team trống → ghép!
      chosenInterns[teamPref] = internNum;
    } else {
      const prevIntern = chosenInterns[teamPref];
      const prevRank = teamMaps[teamPref][prevIntern];
      const currRank = teamMaps[teamPref][internNum];

      if (currRank < prevRank) {
        // Team thích intern mới hơn → đổi!
        chosenInterns[teamPref] = internNum;
        freeInterns.push(prevIntern); // cũ bị đuổi
      } else {
        // Team thích intern cũ hơn → từ chối!
        freeInterns.push(internNum); // mới bị từ chối
      }
    }
  }

  // 4. Convert to output format: [[intern, team], ...]
  return Object.entries(chosenInterns)
    .map(([team, intern]) => [intern, Number(team)]);
}
```

### Trace chi tiết:

```
interns = [[0,1,2], [0,2,1], [1,2,0]]
teams   = [[2,1,0], [0,1,2], [0,1,2]]

Pre-process teamMaps:
  Team 0: [2,1,0] → {2:0, 1:1, 0:2}  (thích intern 2 nhất!)
  Team 1: [0,1,2] → {0:0, 1:1, 2:2}  (thích intern 0 nhất!)
  Team 2: [0,1,2] → {0:0, 1:1, 2:2}  (thích intern 0 nhất!)

Init:
  freeInterns = [0, 1, 2]
  chosenInterns = {}
  currentChoice = [0, 0, 0]

━━━ Pop intern 2 ━━━
  choice = interns[2][0] = 1 (Team 1)
  currentChoice = [0, 0, 1]
  Team 1 trống → chosenInterns = {1: 2}
  freeInterns = [0, 1]

━━━ Pop intern 1 ━━━
  choice = interns[1][0] = 0 (Team 0)
  currentChoice = [0, 1, 1]
  Team 0 trống → chosenInterns = {1:2, 0:1}
  freeInterns = [0]

━━━ Pop intern 0 ━━━
  choice = interns[0][0] = 0 (Team 0)
  currentChoice = [1, 1, 1]
  Team 0 có Intern 1!
    teamMaps[0]: rank(Intern 0)=2, rank(Intern 1)=1
    2 > 1 → Team 0 thích Intern 1 hơn → TỪ CHỐI Intern 0!
  freeInterns = [0]  ← Intern 0 quay lại!

━━━ Pop intern 0 (lần 2) ━━━
  choice = interns[0][1] = 1 (Team 1)
  currentChoice = [2, 1, 1]
  Team 1 có Intern 2!
    teamMaps[1]: rank(Intern 0)=0, rank(Intern 2)=2
    0 < 2 → Team 1 thích Intern 0 hơn → ĐỔI!
  chosenInterns = {1:0, 0:1}
  freeInterns = [2]  ← Intern 2 bị đuổi!

━━━ Pop intern 2 (lần 2) ━━━
  choice = interns[2][1] = 2 (Team 2)
  currentChoice = [2, 1, 2]
  Team 2 trống → chosenInterns = {1:0, 0:1, 2:2}
  freeInterns = []

XONG! Output: [[0,1], [1,0], [2,2]] ✅
```

---

## T — Test

```
  ✅ interns=[[0,1,2],[0,2,1],[1,2,0]], teams=[[2,1,0],[0,1,2],[0,1,2]]
     → [[0,1],[1,0],[2,2]]

  ✅ interns=[[0,1],[1,0]], teams=[[0,1],[1,0]]
     → [[0,0],[1,1]]  (perfect match!)

  ✅ interns=[[0,1],[0,1]], teams=[[0,1],[0,1]]
     → [[0,0],[1,1]] hoặc tùy who proposes first
```

---

## O — Optimize

```
┌─────────────────────────────────────────────────┐
│ Gale-Shapley  │ Time: O(n²) │ Space: O(n²)     │
├─────────────────────────────────────────────────┤
│ Time: mỗi intern thử tối đa n teams            │
│ Space: teamMaps = n teams × n ranks = n²        │
│ Không thể tốt hơn O(n²) — phải xem mỗi rank!   │
└─────────────────────────────────────────────────┘
```

---

## 🧩 Pattern Recognition

```
Pattern: "STABLE MATCHING — Gale-Shapley"

  Stable Internships:  interns ↔ teams
  Stable Marriage:     men ↔ women (phiên bản gốc!)
  Hospital Matching:   residents ↔ hospitals (NRMP)
  College Admissions:  students ↔ colleges

  CHUNG: 2 nhóm, mỗi bên có preference list
         → Proposer-optimal stable matching!

  Biến thể:
  - Proposer thay đổi → kết quả thay đổi!
  - Intern propose → tối ưu cho intern
  - Team propose → tối ưu cho team
```

---

## 🔗 Liên hệ

```
Stable Matching vs Two Sum:
  Two Sum: tìm 1 cặp, hash lookup
  Stable Matching: tìm n cặp, rank lookup (teamMaps = hash!)
  Cả 2: dùng hash/map cho O(1) lookup!

Stable Matching vs BFS/DFS:
  BFS/DFS: duyệt graph
  Stable Matching: KHÔNG phải graph traversal!
  Nhưng: dùng WHILE LOOP + stack (giống iterative DFS!)
```

---

## 🗣️ Think Out Loud — Kịch Bản Interview Chi Tiết

> Format: 🎙️ = **NÓI TO** | 🧠 = **SUY NGHĨ THẦM**

---

### 📌 Phút 0–2: Nhận đề + Clarify

> 🎙️ *"This is a stable matching problem — match n interns to n teams such that no unmatched pair would prefer each other over their current partners. And we want the intern-optimal solution."*

> 🎙️ *"This is the classic Gale-Shapley algorithm — proposer-optimal stable matching, which won the Nobel Prize in Economics in 2012."*

---

### 📌 Phút 2–4: Approach

> 🎙️ *"The idea: interns propose to teams in order of preference. When there's a conflict — two interns want the same team — the team decides based on its preference. The rejected intern tries their next choice."*

> 🎙️ *"I need four data structures: a stack of free interns, a map of team-to-intern matches, an array tracking each intern's current choice index, and pre-computed rank maps for O(1) team comparisons."*

---

### 📌 Phút 4–8: Code + Narrate

> 🎙️ *"First, pre-process: convert each team's preference array into a rank map. This lets me compare two interns' ranks for a team in O(1) instead of O(n)."*

> 🎙️ *"Main loop: pop a free intern, find their preferred team. If team is unmatched, pair them. If team has someone, compare ranks — keep the preferred one, push the rejected back to free interns."*

---

### 📌 Phút 8–10: Complexity + Why Stable

> 🎙️ *"Time O(n²): each intern proposes at most n times. Space O(n²): rank maps store n×n entries."*

> 🎙️ *"Why is this stable? If Intern A prefers Team Y over their match, A must have proposed to Y earlier and been rejected — meaning Y prefers their current intern over A. So no instability can exist."*

---

### 📌 Follow-up Q&A

**Q1: "What if we want team-optimal instead?"**

> 🎙️ *"Flip the roles — let teams propose to interns. Same algorithm, different proposer = different stable matching."*

**Q2: "Can there be multiple stable matchings?"**

> 🎙️ *"Yes! With n proposers and n receivers, different orderings can yield different stable matchings. Gale-Shapley always returns the proposer-optimal one."*

**Q3: "Does using stack vs queue matter?"**

> 🎙️ *"No — the order interns propose doesn't affect the final result. All orderings converge to the same proposer-optimal stable matching."*

---

### 🧠 Tóm tắt

```
  KEY POINTS:
  ✅ Gale-Shapley: interns PROPOSE, teams DECIDE
  ✅ 4 data structures: freeInterns, chosenInterns, currentChoice, teamMaps
  ✅ teamMaps cho O(1) rank lookup (quan trọng!)
  ✅ Bị từ chối → quay lại freeInterns, chọn team tiếp theo
  ✅ Bị đổi → intern cũ quay lại freeInterns
  ✅ Stable vì: ai bị từ chối = team KHÔNG THÍCH họ → không bao giờ match
  ✅ O(n²) time, O(n²) space
  ✅ Stack hay Queue đều cho CÙNG KẾT QUẢ!
```
