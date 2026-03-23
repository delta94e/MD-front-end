// ============================================================
// Stable Internships — Gale-Shapley Algorithm (AlgoExpert)
// ============================================================

function stableInternships(interns, teams) {
  const n = interns.length;

  // 1. Tạo rank lookup cho mỗi team → O(n²)
  const teamMaps = teams.map((team) => {
    const rank = {};
    team.forEach((intern, i) => (rank[intern] = i));
    return rank;
  });

  // 2. Data structures
  const chosenInterns = {}; // team → intern
  const freeInterns = Array.from({ length: n }, (_, i) => i); // stack
  const currentChoice = new Array(n).fill(0); // intern → choice index

  // 3. Main loop: while có intern chưa ghép
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
        freeInterns.push(prevIntern);
      } else {
        // Team thích intern cũ hơn → từ chối!
        freeInterns.push(internNum);
      }
    }
  }

  // 4. Convert to [[intern, team], ...]
  return Object.entries(chosenInterns).map(([team, intern]) => [
    intern,
    Number(team),
  ]);
}

// ============================================================
// TESTS
// ============================================================
console.log("=== Stable Internships — Gale-Shapley ===\n");

function test(name, interns, teams) {
  const result = stableInternships(interns, teams);
  // Sort by intern number for consistent display
  result.sort((a, b) => a[0] - b[0]);
  console.log(`${name}:`);
  console.log(`  Result: ${JSON.stringify(result)}`);

  // Verify stability
  let stable = true;
  const internTeam = {};
  const teamIntern = {};
  for (const [intern, team] of result) {
    internTeam[intern] = team;
    teamIntern[team] = intern;
  }

  for (let i = 0; i < interns.length; i++) {
    for (let t = 0; t < teams.length; t++) {
      if (internTeam[i] === t) continue;
      const internPrefersT =
        interns[i].indexOf(t) < interns[i].indexOf(internTeam[i]);
      const teamPrefersI =
        teams[t].indexOf(i) < teams[t].indexOf(teamIntern[t]);
      if (internPrefersT && teamPrefersI) {
        stable = false;
        console.log(`  ❌ Unstable: intern ${i} & team ${t}`);
      }
    }
  }
  console.log(`  ${stable ? "✅ Stable!" : "❌ NOT Stable!"}\n`);
}

test(
  "Test 1 — AlgoExpert example",
  [
    [0, 1, 2],
    [0, 2, 1],
    [1, 2, 0],
  ],
  [
    [2, 1, 0],
    [0, 1, 2],
    [0, 1, 2],
  ]
);

test(
  "Test 2 — perfect match",
  [
    [0, 1],
    [1, 0],
  ],
  [
    [0, 1],
    [1, 0],
  ]
);

test(
  "Test 3 — all prefer same",
  [
    [0, 1],
    [0, 1],
  ],
  [
    [0, 1],
    [0, 1],
  ]
);
