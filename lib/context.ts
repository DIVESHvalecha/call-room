import type { FlatBall } from "./cricsheet";

export type MatchContext = {
  innings: string;
  score: string;
  overs: string;
  crr: string;
  last12: { label: string; sym: string; batter: string; bowler: string }[];
  batters: { name: string; runs: number; balls: number }[];
  bowler: { name: string; figures: string };
  squadBowlers: string[];
  trigger: string;
  phase: string;
  target?: number;
  need?: number;
  rrr?: string;
  milestoneBatter?: { name: string; runs: number; milestone: number } | null;
  recentBoundaries: number;
};

export function symOf(b: FlatBall): string {
  if (b.wicket) return "W";
  if (b.batterRuns === 6) return "6";
  if (b.batterRuns === 4) return "4";
  if (b.extras > 0 && b.batterRuns === 0) return b.extraKind === "wides" ? "wd" : "ex";
  return String(b.runs);
}

export function buildMatchContext(
  balls: FlatBall[],
  cursor: number,
  team: string,
  batters: { name: string; runs: number; balls: number }[],
  bowlers: { name: string; balls: number; runs: number; wkts: number }[],
  trigger: string,
  target?: number
): MatchContext {
  const slice = balls.slice(0, Math.min(cursor, balls.length));
  const last = slice[slice.length - 1];
  const last12 = balls.slice(Math.max(0, cursor - 12), cursor).map((b) => ({
    label: b.actual,
    sym: symOf(b),
    batter: b.batter,
    bowler: b.bowler,
  }));
  const done = cursor / 6;
  const runs = last ? last.teamRuns : 0;
  const cur = bowlers[bowlers.length - 1];
  const overNo = last ? last.over : 0;
  const phase = overNo < 10 ? "powerplay" : overNo < 38 ? "middle" : "death";

  let need: number | undefined;
  let rrr: string | undefined;
  if (typeof target === "number" && target > 0) {
    need = Math.max(0, target - runs);
    const ballsRemaining = Math.max(1, 300 - cursor);
    rrr = ((need / ballsRemaining) * 6).toFixed(2);
  }

  // Detect if any active batter is close to 50 or 100
  let milestoneBatter: { name: string; runs: number; milestone: number } | null = null;
  for (const b of batters) {
    if (b.runs >= 40 && b.runs < 50) {
      milestoneBatter = { name: b.name, runs: b.runs, milestone: 50 };
      break;
    } else if (b.runs >= 88 && b.runs < 100) {
      milestoneBatter = { name: b.name, runs: b.runs, milestone: 100 };
      break;
    }
  }

  const recentBoundaries = last12.filter((x) => x.sym === "4" || x.sym === "6").length;

  return {
    innings: team,
    score: last ? `${last.teamRuns}/${last.teamWkts}` : "0/0",
    overs: last ? last.actual : "0.0",
    crr: done > 0 ? (runs / done).toFixed(2) : "0.00",
    last12,
    batters: batters.filter((b) => b.balls > 0).slice(0, 4),
    bowler: cur ? { name: cur.name, figures: `${cur.wkts}-${cur.runs}` } : { name: "", figures: "" },
    squadBowlers: bowlers.map((b) => b.name),
    trigger,
    phase,
    target,
    need,
    rrr,
    milestoneBatter,
    recentBoundaries,
  };
}
