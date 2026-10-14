export type BallEvent = {
  over: string;
  runs: number;
  wicket: boolean;
  batter: string;
  bowler: string;
  commentary: string;
};

// Full chase slice: 10.2 → 20.0 (58 balls). Score starts 85/2, target 155.
export const TIMELINE: BallEvent[] = [
  { over: "10.3", runs: 1, wicket: false, batter: "Head", bowler: "Chahal", commentary: "Worked to long-on, quick single" },
  { over: "10.4", runs: 1, wicket: false, batter: "Maxwell", bowler: "Chahal", commentary: "Pushed to cover, sharp run" },
  { over: "10.5", runs: 4, wicket: false, batter: "Head", bowler: "Chahal", commentary: "Swept hard, beats deep square!" },
  { over: "10.6", runs: 1, wicket: false, batter: "Head", bowler: "Chahal", commentary: "Flat, tucked to midwicket" },
  { over: "11.1", runs: 2, wicket: false, batter: "Maxwell", bowler: "Axar", commentary: "Driven wide of long-off, two" },
  { over: "11.2", runs: 0, wicket: false, batter: "Maxwell", bowler: "Axar", commentary: "Beaten! Arm ball slides past" },
  { over: "11.3", runs: 0, wicket: true, batter: "Maxwell", bowler: "Axar", commentary: "WICKET! Skids on, timber!" },
  { over: "11.4", runs: 1, wicket: false, batter: "Stoinis", bowler: "Axar", commentary: "New batter off the mark" },
  { over: "11.5", runs: 4, wicket: false, batter: "Head", bowler: "Axar", commentary: "Lofted over mid-off, one bounce four" },
  { over: "11.6", runs: 1, wicket: false, batter: "Head", bowler: "Axar", commentary: "Fired in, nudged to deep" },
  { over: "12.1", runs: 6, wicket: false, batter: "Head", bowler: "Bumrah", commentary: "SIX! Picked the slower ball early!" },
  { over: "12.2", runs: 1, wicket: false, batter: "Head", bowler: "Bumrah", commentary: "Yorker dug out to cover" },
  { over: "12.3", runs: 0, wicket: true, batter: "Stoinis", bowler: "Bumrah", commentary: "WICKET! Head holes out going big!" },
  { over: "12.4", runs: 0, wicket: false, batter: "Wade", bowler: "Bumrah", commentary: "Beaten for pace, dot" },
  { over: "12.5", runs: 2, wicket: false, batter: "Wade", bowler: "Bumrah", commentary: " Flicked fine, sprinted two" },
  { over: "12.6", runs: 1, wicket: false, batter: "Head", bowler: "Bumrah", commentary: "Wait — Head gone; new batter Carey rotates" },
  { over: "13.1", runs: 1, wicket: false, batter: "Carey", bowler: "Chahal", commentary: "Googly read late, single" },
  { over: "13.2", runs: 4, wicket: false, batter: "Wade", bowler: "Chahal", commentary: "Reverse-swept, no one there!" },
  { over: "13.3", runs: 1, wicket: false, batter: "Wade", bowler: "Chahal", commentary: "Dragged down, pulled to deep" },
  { over: "13.4", runs: 1, wicket: false, batter: "Carey", bowler: "Chahal", commentary: "Chipped to long-on" },
  { over: "13.5", runs: 6, wicket: false, batter: "Wade", bowler: "Chahal", commentary: "SIX! Launched over midwicket!" },
  { over: "13.6", runs: 0, wicket: false, batter: "Wade", bowler: "Chahal", commentary: "Dot — brave wide line" },
  { over: "14.1", runs: 0, wicket: true, batter: "Carey", bowler: "Siraj", commentary: "WICKET! Slower ball, sliced to point!" },
  { over: "14.2", runs: 1, wicket: false, batter: "Cummins", bowler: "Siraj", commentary: "Off the mark with a push" },
  { over: "14.3", runs: 2, wicket: false, batter: "Wade", bowler: "Siraj", commentary: "Edged short of third, two" },
  { over: "14.4", runs: 4, wicket: false, batter: "Wade", bowler: "Siraj", commentary: "FOUR! Crashed through covers" },
  { over: "14.5", runs: 1, wicket: false, batter: "Wade", bowler: "Siraj", commentary: "Slower, checked to long-on" },
  { over: "14.6", runs: 1, wicket: false, batter: "Cummins", bowler: "Siraj", commentary: "Yorker jammed out" },
  { over: "15.1", runs: 1, wicket: false, batter: "Cummins", bowler: "Bumrah", commentary: "Nipping back, inside edge for one" },
  { over: "15.2", runs: 4, wicket: false, batter: "Wade", bowler: "Bumrah", commentary: "FOUR! Thick edge races fine!" },
  { over: "15.3", runs: 1, wicket: false, batter: "Wade", bowler: "Bumrah", commentary: "Spearing yorker, dug out" },
  { over: "15.4", runs: 1, wicket: false, batter: "Cummins", bowler: "Bumrah", commentary: "Slower bumper, pulled to deep" },
  { over: "15.5", runs: 2, wicket: false, batter: "Wade", bowler: "Bumrah", commentary: "Lofted to long-on, two more" },
  { over: "15.6", runs: 0, wicket: false, batter: "Wade", bowler: "Bumrah", commentary: "Perfect yorker, no run" },
];

export type BatterStat = { name: string; runs: number; balls: number; sr: string };
export type BowlerStat = { name: string; overs: string; runs: number; wkts: number };

export function deriveStats(fromIdx = 0, toIdx = TIMELINE.length): {
  runs: number;
  wkts: number;
  batters: BatterStat[];
  bowlers: BowlerStat[];
} {
  // base at 10.2: 85/2 — Head 34(24), Maxwell 12(8); Chahal 2-0-18-0, Axar 2-0-14-1
  const bat = new Map<string, { runs: number; balls: number }>([
    ["Head", { runs: 34, balls: 24 }],
    ["Maxwell", { runs: 12, balls: 8 }],
  ]);
  const bowl = new Map<string, { balls: number; runs: number; wkts: number }>([
    ["Chahal", { balls: 12, runs: 18, wkts: 0 }],
    ["Axar", { balls: 12, runs: 14, wkts: 1 }],
    ["Bumrah", { balls: 0, runs: 0, wkts: 0 }],
    ["Siraj", { balls: 0, runs: 0, wkts: 0 }],
  ]);
  let runs = 85;
  let wkts = 2;
  TIMELINE.slice(fromIdx, toIdx).forEach((b) => {
    runs += b.runs;
    if (b.wicket) wkts += 1;
    const cur = bat.get(b.batter) ?? { runs: 0, balls: 0 };
    cur.runs += b.runs;
    cur.balls += 1;
    bat.set(b.batter, cur);
    const bw = bowl.get(b.bowler) ?? { balls: 0, runs: 0, wkts: 0 };
    bw.balls += 1;
    bw.runs += b.runs;
    if (b.wicket) bw.wkts += 1;
    bowl.set(b.bowler, bw);
  });
  const batters: BatterStat[] = Array.from(bat.entries())
    .sort((a, b) => b[1].runs - a[1].runs)
    .slice(0, 3)
    .map(([name, s]) => ({ name, runs: s.runs, balls: s.balls, sr: ((s.runs / Math.max(1, s.balls)) * 100).toFixed(1) }));
  const bowlers: BowlerStat[] = Array.from(bowl.entries()).map(([name, s]) => ({
    name,
    overs: `${Math.floor(s.balls / 6)}.${s.balls % 6}`,
    runs: s.runs,
    wkts: s.wkts,
  }));
  return { runs, wkts, batters, bowlers };
}

export function overOf(idx: number): string {
  return TIMELINE[Math.min(idx, TIMELINE.length - 1)]?.over ?? "10.2";
}
