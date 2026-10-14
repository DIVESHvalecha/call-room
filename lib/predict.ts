import type { FlatBall } from "./cricsheet";

export function ballsInOver(balls: FlatBall[], overNo: number): FlatBall[] {
  return balls.filter((b) => b.over === overNo);
}

export function overRuns(balls: FlatBall[], overNo: number): number {
  return ballsInOver(balls, overNo).reduce((a, b) => a + b.runs, 0);
}

export function rangeRuns(balls: FlatBall[], from: number, n: number): number {
  return balls.slice(from, from + n).reduce((a, b) => a + b.runs, 0);
}

export function rangeWickets(balls: FlatBall[], from: number, n: number): number {
  return balls.slice(from, from + n).filter((b) => b.wicket).length;
}

export function rangeBoundaries(balls: FlatBall[], from: number, n: number): number {
  return balls.slice(from, from + n).filter((b) => b.batterRuns >= 4).length;
}

export function batterRunsInRange(balls: FlatBall[], name: string, from: number, n: number): number {
  return balls.slice(from, from + n).filter((b) => b.batter === name).reduce((a, b) => a + b.batterRuns, 0);
}

/** first bowler name appearing after cursor (the actual next over's bowler) */
export function nextBowlerAfter(balls: FlatBall[], cursor: number): string {
  const cur = balls[Math.max(0, cursor - 1)];
  for (let i = cursor; i < balls.length; i++) {
    if (!cur || balls[i].over > cur.over) return balls[i].bowler;
  }
  return balls[balls.length - 1]?.bowler ?? "";
}

export function otherBowlers(balls: FlatBall[], exclude: string, n = 3): string[] {
  const seen: string[] = [];
  for (const b of balls) {
    if (b.bowler !== exclude && !seen.includes(b.bowler)) seen.push(b.bowler);
    if (seen.length >= n) break;
  }
  while (seen.length < n) seen.push(["Prasidh", "Nabi", "Brar", "Dhir"][seen.length % 4]);
  return seen.slice(0, n);
}

/** bucket index for run-range options like ["0-5","6-10","11-15","16+"] / ["0-2","3-6","7-11","12+"] */
export function bucketIdx(runs: number, edges: number[]): number {
  for (let i = 0; i < edges.length; i++) {
    if (runs < edges[i]) return i;
  }
  return edges.length;
}

export function bucketEdgesFor(options: string[]): number[] {
  // parse upper bounds from labels like "0-5" -> 6, "16+" -> Infinity cutoff
  const edges: number[] = [];
  for (const o of options) {
    const m = o.match(/(\d+)\s*-\s*(\d+)/);
    if (m) {
      edges.push(Number(m[2]) + 1);
      continue;
    }
    const plus = o.match(/(\d+)\s*\+/);
    if (plus) {
      edges.push(Number(plus[1]));
      continue;
    }
  }
  return edges.slice(0, 3);
}

export function eventOptionsFor(last: FlatBall | undefined): { options: [string, string, string, string]; answerIdx: 0 | 1 | 2 | 3 } {
  const actual = !last
    ? "Dot ball"
    : last.wicket
      ? "Wicket fell"
      : last.batterRuns === 6
        ? "Six hit"
        : last.batterRuns === 4
          ? "Four hit"
          : last.extras > 0
            ? "Extras given"
            : last.runs === 0
              ? "Dot ball"
              : `${last.runs} run${last.runs > 1 ? "s" : ""} taken`;
  const distractors = ["Dot ball", "Four hit", "Six hit", "Wicket fell", "Extras given", "2 runs taken"].filter((d) => d !== actual);
  const opts = [actual, distractors[0] ?? "Dot ball", distractors[1] ?? "Four hit", distractors[2] ?? "Six hit"] as [string, string, string, string];
  // shuffle with correct tracked: rotate so correct isn't always A
  const rot = (actual.length + 1) % 4;
  const rotated = [...opts.slice(rot), ...opts.slice(0, rot)] as [string, string, string, string];
  return { options: rotated, answerIdx: rotated.indexOf(actual) as 0 | 1 | 2 | 3 };
}

export function dismissalOption(kind: string): { options: [string, string, string, string]; answerIdx: 0 | 1 | 2 | 3 } {
  const k = kind.toLowerCase();
  const actual = k.includes("run out") ? "Run out" : k.includes("lbw") ? "LBW" : k.includes("bowled") ? "Bowled" : "Caught";
  const all = ["Caught", "Bowled", "LBW", "Run out"];
  const others = all.filter((a) => a !== actual);
  const opts = [actual, ...others] as [string, string, string, string];
  const rot = (actual.length + 2) % 4;
  const rotated = [...opts.slice(rot), ...opts.slice(0, rot)] as [string, string, string, string];
  return { options: rotated, answerIdx: rotated.indexOf(actual) as 0 | 1 | 2 | 3 };
}
