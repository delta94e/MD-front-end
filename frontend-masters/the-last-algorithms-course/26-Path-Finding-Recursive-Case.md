# The Last Algorithms Course You'll Need — Phần 26: Path Finding — Recursive Case — "Pre/Post, Direction Array, Push/Pop Path, First Try!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Path Finding Recursive Case — "Pre = push path + mark seen, recurse 4 dirs with direction array, post = pop, first try!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Implementation — complete maze solver, pre/post in action, building path during recursion!

---

## Mục Lục

| #   | Phần                                                          |
| --- | ------------------------------------------------------------- |
| 1   | Pre/Post in Pathing — "Push on Enter, Pop on Leave!"          |
| 2   | Direction Array — "Leetcode Tip from Scooby-Doo!"             |
| 3   | The Recursive Step — "Walk 4 Directions!"                     |
| 4   | The Bug — "End Tile Not Pushed!"                              |
| 5   | The solve() Function — "Setup Seen + Path!"                   |
| 6   | Complete Code — "First Try! (Compiler Errors Don't Count)" 😂 |
| 7   | When to Use Recursion — "Branching Factor!"                   |
| 8   | Tự Implement: Complete Maze Solver                            |

---

## §1. Pre/Post in Pathing — "Push on Enter, Pop on Leave!"

> Prime: _"Pre and post become super important because we're PATHING. We need to go a direction and keep track of our path."_

### Building the path!

```
PRE/POST IN ACTION:
═══════════════════════════════════════════════════════════════

  Visit x0:
    PRE:  path.push(x0), seen[x0] = true
    RECURSE: try all 4 directions
      Visit x1:
        PRE:  path.push(x1), seen[x1] = true
        RECURSE: try all 4 directions
          All fail → dead end!
        POST: path.pop(x1) ← remove from path!
      Return false
    POST: path.pop(x0) ← remove from path!

  "We push as we walk, pop as we back out.
   The path maintains shape!" — Prime
```

---

## §2. Direction Array — "Leetcode Tip from Scooby-Doo!"

> Prime: _"A sweet leetcode tip from a friend — you can put all four directions in an array."_

```typescript
const dir = [
  [-1, 0], // left
  [1, 0], // right
  [0, -1], // up
  [0, 1], // down
];
```

Prime: _"A lot of times you'll see people hand-put all the calculations. This makes it a LOT easier — you only specify directions ONCE."_

---

## §3. The Recursive Step — "Walk 4 Directions!"

```typescript
// Pre: mark as visited, add to path!
seen[curr.y][curr.x] = true;
path.push(curr);

// Recurse: try all 4 directions!
for (let i = 0; i < dir.length; i++) {
  const [x, y] = dir[i];
  if (
    walk(
      maze,
      wall,
      { x: curr.x + x, y: curr.y + y }, // new position!
      end,
      seen,
      path,
    )
  ) {
    return true; // found the end! stop recursing!
  }
}

// Post: dead end, remove from path!
path.pop();
return false;
```

---

## §4. The Bug — "End Tile Not Pushed!"

> Prime: _"There's ONE bug — our ending tile does not get pushed! When we reach the end, we return true immediately from the base case, so the PRE step never runs for the end tile."_

Fix in base case 3:

```typescript
if (curr.x === end.x && curr.y === end.y) {
  path.push(curr); // ← don't forget the end!
  return true;
}
```

---

## §5. The solve() Function — "Setup Seen + Path!"

```typescript
function solve(
  maze: string[],
  wall: string,
  start: Point,
  end: Point,
): Point[] {
  // Create seen matrix (all false!)
  const seen: boolean[][] = [];
  for (let i = 0; i < maze.length; i++) {
    seen.push(new Array(maze[0].length).fill(false));
  }

  // Create path array
  const path: Point[] = [];

  // Walk!
  walk(maze, wall, start, end, seen, path);

  return path;
}
```

---

## §6. Complete Code — "First Try!" 😂

> Prime after fixing TypeScript errors: _"First try! We got it very first try! I'd still consider that a compiler error, not a logic error."_ 😂

### Complete walk function!

```typescript
function walk(
  maze: string[],
  wall: string,
  curr: Point,
  end: Point,
  seen: boolean[][],
  path: Point[],
): boolean {
  // Base cases
  if (
    curr.x < 0 ||
    curr.x >= maze[0].length ||
    curr.y < 0 ||
    curr.y >= maze.length
  )
    return false;
  if (maze[curr.y][curr.x] === wall) return false;
  if (curr.x === end.x && curr.y === end.y) {
    path.push(curr);
    return true;
  }
  if (seen[curr.y][curr.x]) return false;

  // Pre
  seen[curr.y][curr.x] = true;
  path.push(curr);

  // Recurse (4 directions)
  const dir = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (let i = 0; i < dir.length; i++) {
    const [x, y] = dir[i];
    if (walk(maze, wall, { x: curr.x + x, y: curr.y + y }, end, seen, path)) {
      return true;
    }
  }

  // Post
  path.pop();
  return false;
}
```

---

## §7. When to Use Recursion — "Branching Factor!"

> Prime: _"My general rule: when I can't concretely use a for loop — especially if there's a BRANCHING FACTOR."_

| Situation                   | Use        |
| --------------------------- | ---------- |
| Clear end, simple iteration | For loop!  |
| Branching (maze = 4 dirs)   | Recursion! |
| Tree traversal              | Recursion! |
| Graph traversal             | Recursion! |

---

## §8. Tự Implement: Complete Maze Solver

```javascript
// ═══ Maze Solver — Complete ═══

function walk(maze, wall, curr, end, seen, path) {
  // Base case 1: off map!
  if (
    curr.x < 0 ||
    curr.x >= maze[0].length ||
    curr.y < 0 ||
    curr.y >= maze.length
  )
    return false;
  // Base case 2: wall!
  if (maze[curr.y][curr.x] === wall) return false;
  // Base case 3: found end!
  if (curr.x === end.x && curr.y === end.y) {
    path.push(curr);
    return true;
  }
  // Base case 4: already seen!
  if (seen[curr.y][curr.x]) return false;

  // PRE: mark visited, add to path!
  seen[curr.y][curr.x] = true;
  path.push(curr);

  // RECURSE: try all 4 directions!
  const dir = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dx, dy] of dir) {
    if (walk(maze, wall, { x: curr.x + dx, y: curr.y + dy }, end, seen, path)) {
      return true;
    }
  }

  // POST: dead end, remove from path!
  path.pop();
  return false;
}

function solve(maze, wall, start, end) {
  const seen = maze.map((row) => new Array(row.length).fill(false));
  const path = [];
  walk(maze, wall, start, end, seen, path);
  return path;
}

// Demo
const maze = [
  "##########",
  "#        #",
  "# ## ### #",
  "#  #   # #",
  "# ## # # #",
  "#    #   #",
  "##########",
];

console.log("═══ MAZE SOLVER ═══\n");
console.log("Maze:");
maze.forEach((row) => console.log("  " + row));

const start = { x: 1, y: 1 };
const end = { x: 8, y: 5 };
const path = solve(maze, "#", start, end);

console.log(`\nPath from (${start.x},${start.y}) to (${end.x},${end.y}):`);
path.forEach((p, i) => console.log(`  Step ${i}: (${p.x}, ${p.y})`));

// Visualize path on maze
const visual = maze.map((row) => row.split(""));
path.forEach((p) => {
  if (visual[p.y][p.x] === " ") visual[p.y][p.x] = "·";
});
visual[start.y][start.x] = "S";
visual[end.y][end.x] = "E";
console.log("\nSolved:");
visual.forEach((row) => console.log("  " + row.join("")));

console.log("\n✅ Recursion + base cases = maze solved!");
```

---

## Checklist

```
[ ] Pre: seen[y][x] = true, path.push(curr)!
[ ] Recurse: loop through 4 directions!
[ ] Post: path.pop() — undo on dead end!
[ ] Direction array: [[-1,0],[1,0],[0,-1],[0,1]]!
[ ] If walk returns true → stop recursing, propagate up!
[ ] Bug: don't forget to push end tile in base case 3!
[ ] solve(): create seen matrix + path array, call walk!
[ ] Pre/Post maintains path shape during recursion!
TIẾP THEO → Phần 27: Recursion Q&A!
```
