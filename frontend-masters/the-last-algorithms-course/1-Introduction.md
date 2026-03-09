# The Last Algorithms Course You'll Need — Phần 1: Introduction — "Linked List Blew My Mind, Learn the Handshake, That's NOT an Array!"

> 📅 2026-03-08 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Introduction — "Câu chuyện cá nhân, tại sao algorithms quan trọng, TypeScript, sách tham khảo!"
> Độ khó: ⭐ | Beginner — giới thiệu khoá học!

---

## Mục Lục

| #   | Phần                                                     |
| --- | -------------------------------------------------------- |
| 1   | Câu Chuyện Cá Nhân — "Linked List Blew My Mind!"         |
| 2   | Khoá Học Này Là Gì? — "The Last Course You'll Need!"     |
| 3   | Tại Sao Bạn Nên Quan Tâm? — "Learn the Handshake!"       |
| 4   | "That's NOT an Array!" — JavaScript Lies!                |
| 5   | Tại Sao TypeScript? — "Beginner Friendly But Kinda Bad!" |
| 6   | Khối Lượng Khoá Học — "225 Hours in 16!"                 |
| 7   | Sách Tham Khảo — "CLRS + A Common-Sense Guide!"          |
| 8   | 🔬 Deep Analysis — Mindset Cho Algorithms                |

---

## §1. Câu Chuyện Cá Nhân — "Linked List Blew My Mind!"

> Prime: _"When I first did computer science, I really actually kind of HATED the experience. Learning how to program Java — maybe it was just Java that I hated."_

### Từ ghét CS đến yêu Algorithms!

ThePrimeagen kể câu chuyện cá nhân:

1. **CS 101**: Học Java → _"Really boring, really mechanical."_ → Ghét đến mức chuyển sang Mechanical Engineering!
2. **Mechanical Engineering**: 1 năm → _"The only thing I hate MORE than intro to CS are INTEGRALS."_ 😂
3. **Quay lại CS**: Ray Babcock dạy → **Linked List** lần đầu → _"I still remember looking at the screen just BLOWN AWAY."_

Prime: _"I was like, this is AWESOME. I love this. This is the COOLEST thing ever. I just couldn't get it out of my head."_

→ Algorithms không phải là thứ khô khan — nó có thể **thay đổi cách bạn nhìn nhận programming!**

---

## §2. Khoá Học Này Là Gì? — "The Last Course You'll Need!"

> Prime: _"It IS hopefully the last algorithms course you'll ever need. But there is DEFINITELY an expectation that you will go out and continue to understand and learn."_

### Khoá cuối cùng — nhưng phải tự luyện!

Prime cảnh báo: _"Anything you do, what happens to it? It ATROPHIES super, super quick. You're gonna lose it ALL in the next 6 months if you don't think about it."_

_"One of the benefits of going to school is having the same stuff over 3 years — takes a lot longer to atrophy."_

Analogy: _"Just like I still have silly DOOM cheat codes stuck in my head from 20 years ago — because I entered it in so many times."_ 😂

→ **Repetition = retention!** Không luyện = mất hết trong 6 tháng!

---

## §3. Tại Sao Bạn Nên Quan Tâm? — "Learn the Handshake!"

> Prime: _"There IS a secret handshake to get into a very good paying job. LEARN THE HANDSHAKE. Why fight the system when it's free online to learn?"_

### Algorithms = secret handshake!

Prime phản bác các argument trên Twitter:

**Twitter says**: _"White-boarding interview = company's stupid."_
**Twitter says**: _"You don't actually use any of them on the job."_

**Prime's response**:

1. _"Sure, maybe algorithms aren't the BEST way to interview."_
2. _"Sure, maybe you don't use a lot constantly."_
3. **BUT**: _"There IS a secret handshake. Learn it. It's FREE. Why fight the system?"_

### Practical selection!

Prime: _"I have tried to hand-select the ones I've used at least ONCE in a professional setting. I've had to build or understand the difference of why use one or the other."_

_"There's a point where algorithms become UNUSABLE for the average professional. But there's a HUGE amount that are super useful — you use them ALL THE TIME, like nonstop."_

→ Khoá này chọn **practical algorithms** — không phải Merkle trees hay crypto hashing mà bạn sẽ không bao giờ dùng!

```
PRACTICAL vs ACADEMIC:
═══════════════════════════════════════════════════════════════

  ❌ NOT in this course (too academic):
  ┌──────────────────────────────────────────────────────────┐
  │ Merkle Trees → "You're never writing a crypto coin"    │
  │ Advanced Hashing → unusable for average professional   │
  │ Complex Proofs → not needed in professional world      │
  └──────────────────────────────────────────────────────────┘

  ✅ IN this course (practical!):
  ┌──────────────────────────────────────────────────────────┐
  │ Algorithms you USE in professional settings!           │
  │ "You use them ALL THE TIME, nonstop!" — Prime          │
  │ Hand-selected from interview + career experience!      │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. "That's NOT an Array!" — JavaScript Lies!

> Prime: _"Is that an array? Would everyone say that's an array? What if I told you that's NOT an array? Would you be shocked?"_

### Arrays = the most fundamental data structure!

Prime shows TypeScript code → Everyone says "Yeah, it's an array" → Prime: _"What if I told you that's NOT an array?"_ 😱

_"Remember, arrays are the SIMPLEST data structure. You should be able to know if you're looking at an array or not."_

→ JavaScript's "arrays" are **NOT real arrays** in the traditional CS sense! (Sẽ học chi tiết trong các phần sau!)

```
JAVASCRIPT "ARRAYS" — NOT REAL!
═══════════════════════════════════════════════════════════════

  const a = [1, 2, 3];  // Is this an array?

  CS Definition:
  ┌──────────────────────────────────────────────────────────┐
  │ Array = contiguous block of memory!                     │
  │ Fixed size! Same type! Direct index access!            │
  │→ JavaScript "arrays" are NONE of these! 😱            │
  └──────────────────────────────────────────────────────────┘

  JavaScript Reality:
  ┌──────────────────────────────────────────────────────────┐
  │ "Arrays" in JS = objects with numeric keys!            │
  │ Dynamic size! Any type! Hash-map-like access!          │
  │ "Your life's a LIE!" — Prime 😂                       │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Tại Sao TypeScript? — "Beginner Friendly But Kinda Bad!"

> Prime: _"I chose TypeScript because it's the most BEGINNER FRIENDLY language — even though it's actually kinda BAD for data structures and algorithms."_

### TypeScript: accessible nhưng có limitations!

Prime giải thích tại sao TypeScript "bad" cho DS&A:

1. **Không thể tạo Map thuần**: _"You can't uniquely identify an object. Can't distinguish two POJOs with same properties."_
2. **Không có real arrays**: JS arrays ≠ traditional arrays!
3. **Cần C++ cho Map thực sự**: _"You have to use C++ — there's no way in pure TypeScript."_

Nhưng chọn TypeScript vì: **broadest audience possible!**

---

## §6. Khối Lượng Khoá Học — "225 Hours in 16!"

> Prime: _"My second semester class — 3 times a week, 1 hour, 15 weeks. Expected 3-4 hours study per hour of class. Plus 1 hour lab with 5 hours preparing. That's equivalent to 225 HOURS. We're gonna do all that in 16 hours."_

### 225 giờ → 16 giờ!

Prime thẳng thắn: khoá này **nén cực kỳ nhiều nội dung**!

_"It's gonna take some of your effort OUTSIDE of this to really understand a lot of these things."_

```
KHỐI LƯỢNG:
═══════════════════════════════════════════════════════════════

  University:
  ┌──────────────────────────────────────────────────────────┐
  │ 3 lectures/week × 1 hour × 15 weeks = 45 hours        │
  │ 3-4 hours study per lecture hour    = 135-180 hours    │
  │ 1 lab/week × 1 hour × 15 weeks     = 15 hours         │
  │ 5 hours lab prep × 15 weeks        = 75 hours         │
  │                                                          │
  │ TOTAL ≈ 225 hours! 📚                                  │
  └──────────────────────────────────────────────────────────┘

  This course:
  ┌──────────────────────────────────────────────────────────┐
  │ 16 hours (minus breaks!) 😅                            │
  │ → Must practice OUTSIDE the course!                    │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Sách Tham Khảo — "CLRS + A Common-Sense Guide!"

> Prime: _"I have bought at LEAST four copies of them combined. I may or may not have lost them over the years."_ 😂

### Hai cuốn sách đề xuất!

**Sách 1: Introduction to Algorithms (CLRS)** — "The Tree Book"

- _"Extremely academic. Gonna go over PROOFS. By far the most COMPLETE book on algorithms."_
- Mọi người trong ngành đều biết → "guess what's on the cover — the tree book!"

**Sách 2: A Common-Sense Guide to Data Structures and Algorithms**

- _"More of a very simple one. Much more BEGINNER FRIENDLY."_
- _"Proofs are much smaller, topics are lighter. Don't cover nearly as much in trees."_
- Khoá này cover ~75% nội dung cuốn này!

```
SÁCH THAM KHẢO:
═══════════════════════════════════════════════════════════════

  📕 CLRS — Introduction to Algorithms:
  ┌──────────────────────────────────────────────────────────┐
  │ Level: Academic! Proofs! Complete!                      │
  │ "The Tree Book" — everyone knows it!                   │
  │ Best for: deep understanding + reference               │
  └──────────────────────────────────────────────────────────┘

  📗 A Common-Sense Guide to DS&A:
  ┌──────────────────────────────────────────────────────────┐
  │ Level: Beginner friendly! Light proofs!                │
  │ This course covers ~75% of it!                         │
  │ Best for: first-time learners!                         │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. 🔬 Deep Analysis — Mindset Cho Algorithms

```
MINDSET:
═══════════════════════════════════════════════════════════════

  1. REPETITION = RETENTION
     "Atrophies super quick — 6 months and it's gone!"
     → Practice regularly! Don't just watch!

  2. PRACTICAL OVER ACADEMIC
     "Hand-selected ones I've used professionally."
     → Focus on what you'll actually use!

  3. SECRET HANDSHAKE
     "Learn it. It's free. Why fight the system?"
     → Algorithms = career investment!

  4. JAVASCRIPT LIES
     "That's NOT an array!"
     → Understand CS fundamentals, not just syntax!

  5. THIS IS COMPRESSED
     "225 hours in 16!"
     → Must study outside the course!

  "I hope everybody is also very excited." — Prime 🎯
```

---

## Checklist

```
[ ] Prime's story: Java → Mechanical Engineering → Linked List!
[ ] "The last course" — but must practice to retain!
[ ] Atrophy: lose in 6 months without practice!
[ ] Practical selection: used professionally!
[ ] "Secret handshake" for good-paying jobs!
[ ] JavaScript "arrays" are NOT real arrays!
[ ] TypeScript: beginner-friendly but limited for DS&A!
[ ] 225 hours compressed to 16!
[ ] Books: CLRS (academic) + Common-Sense Guide (beginner)!
TIẾP THEO → Phần 2: Big O Time Complexity!
```
