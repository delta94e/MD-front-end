# The Last Algorithms Course You'll Need — Phần 25: Path Finding — Base Case — "Maze Solver, 4 Base Cases, Seen Matrix!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Path Finding Base Case — "Maze solver, wall/off-map/end/seen = 4 base cases, 2D seen array, walk function setup!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Implementation — maze solver base cases, the problem that helped Prime understand recursion!

---

## Mục Lục

| #   | Phần                                                           |
| --- | -------------------------------------------------------------- |
| 1   | Maze Solver — "The Problem That Made Me Understand Recursion!" |
| 2   | The Maze — "Walls, Start, End!"                                |
| 3   | At Any Square — "4 Directions (CSS Ordering!)" 😂              |
| 4   | Base Case 1 — "It's a Wall!"                                   |
| 5   | Base Case 2 — "Off the Map!"                                   |
| 6   | Base Case 3 — "It's the End!"                                  |
| 7   | Base Case 4 — "Already Seen!"                                  |
| 8   | The walk() Function — "Setup!"                                 |
| 9   | Tự Implement: Base Cases                                       |

---

## §1. Maze Solver — "The Problem That Made Me Understand Recursion!"

> Prime: _"We're gonna walk through the problem that truly helped me understand recursion. It's a pathfinding algorithm on a graph."_

---

## §2. The Maze — "Walls, Start, End!"

```
THE MAZE:
═══════════════════════════════════════════════════════════════

  # # # # # # # # # #
  #     #         # E    ← E = End!
  # S #     # # #   #    ← S = Start!
  #   # # #     #   #
  #           #     #
  # # # # # # # # # #

  #  = Wall (can't go through!)
     = Path (can walk here!)
  S  = Start
  E  = End
```

Prime: _"We're humans, we look at it and go 'dude, you just go like that.' But you can't do that to a computer."_

---

## §3. At Any Square — "4 Directions (CSS Ordering!)" 😂

> Prime: _"At any one square, we can go up, right, down, left. I start with up because I did too much CSS when I was a youngster."_

_"CSS ordering — margin is top, right, bottom, left."_ 😂

```
4 DIRECTIONS:
═══════════════════════════════════════════════════════════════

        UP (0, -1)
          ↑
  LEFT ←  ■  → RIGHT
  (-1,0)  ↓   (1, 0)
       DOWN (0, 1)
```

---

## §4. Base Case 1 — "It's a Wall!"

> Prime: _"If the point we're at in recursion, we are on a WALL — we cannot be here."_

```typescript
// Base case 1: Wall!
if (maze[curr.y][curr.x] === wall) {
  return false;
}
```

---

## §5. Base Case 2 — "Off the Map!"

> Prime: _"If somehow you're in a spot that's NOT on the map, you have to return."_

```typescript
// Base case 2: Off the map!
if (
  curr.x < 0 ||
  curr.x >= maze[0].length ||
  curr.y < 0 ||
  curr.y >= maze.length
) {
  return false;
}
```

Prime: _"We check off-the-map FIRST because if we're off the map and try to access maze[y][x], it would throw an error."_

---

## §6. Base Case 3 — "It's the End!"

> Prime: _"If we make it to the end, we are DONE recursing. That is our actual goal."_

```typescript
// Base case 3: Found the end!
if (curr.x === end.x && curr.y === end.y) {
  return true; // 🎯
}
```

---

## §7. Base Case 4 — "Already Seen!"

> Prime: _"Have you seen this tile before? If you have, you also don't want to be here. You'd get into an infinite loop — blow your stack."_

```typescript
// Base case 4: Already visited!
if (seen[curr.y][curr.x]) {
  return false;
}
```

### 2D Boolean array!

```
SEEN MATRIX:
═══════════════════════════════════════════════════════════════

  false false false false false
  false false false false false
  false false false false false

  As we visit squares, set to true!
  If already true → don't visit again!

  "That's what a stack overflow IS — not the website
   where you ask a question and someone berates you." — Prime
```

---

## §8. The walk() Function — "Setup!"

```typescript
function walk(
  maze: string[],
  wall: string,
  curr: Point,
  end: Point,
  seen: boolean[][],
  path: Point[],
): boolean {
  // Base case 1: off the map!
  if (
    curr.x < 0 ||
    curr.x >= maze[0].length ||
    curr.y < 0 ||
    curr.y >= maze.length
  ) {
    return false;
  }

  // Base case 2: wall!
  if (maze[curr.y][curr.x] === wall) {
    return false;
  }

  // Base case 3: found the end!
  if (curr.x === end.x && curr.y === end.y) {
    return true;
  }

  // Base case 4: already seen!
  if (seen[curr.y][curr.x]) {
    return false;
  }

  // ... recursive step next!
}
```

---

## §9. Tự Implement: Base Cases

```javascript
// ═══ Maze Solver — Base Cases Only ═══

function walk(maze, wall, curr, end, seen, path) {
  // Base case 1: off the map!
  if (
    curr.x < 0 ||
    curr.x >= maze[0].length ||
    curr.y < 0 ||
    curr.y >= maze.length
  ) {
    return false;
  }

  // Base case 2: it's a wall!
  if (maze[curr.y][curr.x] === wall) {
    return false;
  }

  // Base case 3: found the end!
  if (curr.x === end.x && curr.y === end.y) {
    path.push(curr); // don't forget to add the end!
    return true;
  }

  // Base case 4: already seen!
  if (seen[curr.y][curr.x]) {
    return false;
  }

  // Recursive step will go here...
  // (next part!)
}

// Demo — test base cases
const maze = ["######", "#    E", "#S####", "######"];

console.log("═══ BASE CASES ═══\n");

const seen = maze.map((row) => new Array(row.length).fill(false));
const path = [];

// Test off map
console.log(
  "Off map:",
  walk(maze, "#", { x: -1, y: 0 }, { x: 5, y: 1 }, seen, path),
); // false
// Test wall
console.log(
  "Wall:",
  walk(maze, "#", { x: 0, y: 0 }, { x: 5, y: 1 }, seen, path),
); // false
// Test end
console.log(
  "End:",
  walk(maze, "#", { x: 5, y: 1 }, { x: 5, y: 1 }, seen, path),
); // true!

console.log("\n✅ 4 base cases protect us from infinite recursion!");
```

---

## Checklist

```
[ ] Maze solver: walls, start, end, find path!
[ ] 4 directions: up, right, down, left (CSS ordering!)
[ ] Base case 1: off the map → return false!
[ ] Base case 2: it's a wall → return false!
[ ] Base case 3: found the end → return true!
[ ] Base case 4: already seen → return false!
[ ] Check off-map BEFORE accessing maze[y][x]!
[ ] 2D boolean seen array prevents infinite loops!
[ ] "Move everything into the base case — complexity goes down!" — Prime
TIẾP THEO → Phần 26: Path Finding — Recursive Case!
```
